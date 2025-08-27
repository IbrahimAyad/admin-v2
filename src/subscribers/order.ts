import { BaseService } from "medusa-interfaces"

class OrderSubscriber extends BaseService {
  private emailService: any
  private shippingService: any

  constructor(container) {
    super()
    
    // Get services from container
    this.emailService = container.emailService || container.resolve("emailService")
    this.shippingService = container.shippingService || container.resolve("shippingService")
    
    // Subscribe to order events
    const eventBusService = container.resolve("eventBusService")
    eventBusService.subscribe("order.placed", this.handleOrderPlaced.bind(this))
    eventBusService.subscribe("order.shipment_created", this.handleOrderShipped.bind(this))
    eventBusService.subscribe("customer.created", this.handleCustomerCreated.bind(this))
  }

  async handleOrderPlaced(data) {
    try {
      console.log("Order placed event received:", data.id)
      
      if (this.emailService) {
        await this.emailService.sendOrderConfirmation(data)
        console.log("Order confirmation email sent for order:", data.display_id)
      } else {
        console.warn("Email service not available - order confirmation not sent")
      }
    } catch (error) {
      console.error("Failed to handle order placed event:", error)
    }
  }

  async handleOrderShipped(data) {
    try {
      console.log("Order shipped event received:", data.id)
      
      if (this.emailService && data.tracking_code) {
        await this.emailService.sendShippingNotification(data.order, {
          tracking_code: data.tracking_code,
          carrier: data.carrier,
          tracking_url: data.tracking_url,
        })
        console.log("Shipping notification sent for order:", data.order.display_id)
      } else {
        console.warn("Email service not available or no tracking code - shipping notification not sent")
      }
    } catch (error) {
      console.error("Failed to handle order shipped event:", error)
    }
  }

  async handleCustomerCreated(data) {
    try {
      console.log("Customer created event received:", data.id)
      
      if (this.emailService) {
        await this.emailService.sendWelcomeEmail(data)
        console.log("Welcome email sent to:", data.email)
      } else {
        console.warn("Email service not available - welcome email not sent")
      }
    } catch (error) {
      console.error("Failed to handle customer created event:", error)
    }
  }
}

export default OrderSubscriber
