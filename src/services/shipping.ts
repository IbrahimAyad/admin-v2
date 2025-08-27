import { BaseService } from "medusa-interfaces"
import EasyPost from "@easypost/api"

class ShippingService extends BaseService {
  private easypost: EasyPost

  constructor(container, options) {
    super()
    this.easypost = new EasyPost(options.api_key)
  }

  async calculateShippingRates(shipment) {
    try {
      const easypostShipment = await this.easypost.Shipment.create({
        to_address: {
          name: shipment.to_address.name,
          street1: shipment.to_address.address_1,
          street2: shipment.to_address.address_2 || undefined,
          city: shipment.to_address.city,
          state: shipment.to_address.province,
          zip: shipment.to_address.postal_code,
          country: shipment.to_address.country_code.toUpperCase(),
        },
        from_address: {
          name: "KCT Menswear",
          street1: "123 Main Street", // Update with actual address
          city: "New York",
          state: "NY",
          zip: "10001",
          country: "US",
        },
        parcel: {
          length: shipment.items.reduce((max, item) => Math.max(max, item.length || 0), 10),
          width: shipment.items.reduce((max, item) => Math.max(max, item.width || 0), 8),
          height: shipment.items.reduce((sum, item) => sum + (item.height || 1), 0),
          weight: shipment.items.reduce((sum, item) => sum + (item.weight || 0.5), 0),
        },
      })

      return easypostShipment.rates.map(rate => ({
        id: rate.id,
        name: `${rate.carrier} ${rate.service}`,
        price: Math.round(parseFloat(rate.rate) * 100), // Convert to cents
        data: {
          carrier: rate.carrier,
          service: rate.service,
          delivery_days: rate.delivery_days,
          delivery_date: rate.delivery_date,
          rate_id: rate.id,
        },
      }))
    } catch (error) {
      console.error('EasyPost shipping calculation error:', error)
      // Fallback to default shipping rates
      return [
        {
          id: 'standard',
          name: 'Standard Shipping',
          price: 500, // $5.00
          data: { carrier: 'USPS', service: 'Ground' },
        },
        {
          id: 'express',
          name: 'Express Shipping',
          price: 1500, // $15.00
          data: { carrier: 'USPS', service: 'Priority' },
        },
      ]
    }
  }

  async createShipment(shipment) {
    try {
      const easypostShipment = await this.easypost.Shipment.create({
        to_address: {
          name: shipment.to_address.name,
          street1: shipment.to_address.address_1,
          street2: shipment.to_address.address_2 || undefined,
          city: shipment.to_address.city,
          state: shipment.to_address.province,
          zip: shipment.to_address.postal_code,
          country: shipment.to_address.country_code.toUpperCase(),
        },
        from_address: {
          name: "KCT Menswear",
          street1: "123 Main Street",
          city: "New York",
          state: "NY",
          zip: "10001",
          country: "US",
        },
        parcel: {
          length: shipment.items.reduce((max, item) => Math.max(max, item.length || 0), 10),
          width: shipment.items.reduce((max, item) => Math.max(max, item.width || 0), 8),
          height: shipment.items.reduce((sum, item) => sum + (item.height || 1), 0),
          weight: shipment.items.reduce((sum, item) => sum + (item.weight || 0.5), 0),
        },
      })

      // Purchase the cheapest rate
      const cheapestRate = easypostShipment.rates
        .sort((a, b) => parseFloat(a.rate) - parseFloat(b.rate))[0]
      
      const purchasedShipment = await easypostShipment.buy(cheapestRate)

      return {
        id: purchasedShipment.id,
        tracking_code: purchasedShipment.tracking_code,
        tracking_url: purchasedShipment.tracker?.public_url,
        label_url: purchasedShipment.postage_label?.label_url,
        rate: {
          carrier: cheapestRate.carrier,
          service: cheapestRate.service,
          rate: cheapestRate.rate,
        },
      }
    } catch (error) {
      console.error('EasyPost shipment creation error:', error)
      throw new Error(`Failed to create shipment: ${error.message}`)
    }
  }

  async trackShipment(trackingCode) {
    try {
      const tracker = await this.easypost.Tracker.create({ tracking_code: trackingCode })
      return {
        tracking_code: tracker.tracking_code,
        status: tracker.status,
        status_detail: tracker.status_detail,
        public_url: tracker.public_url,
        tracking_details: tracker.tracking_details,
      }
    } catch (error) {
      console.error('EasyPost tracking error:', error)
      throw new Error(`Failed to track shipment: ${error.message}`)
    }
  }
}

export default ShippingService
