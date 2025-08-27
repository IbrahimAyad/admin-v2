import { BaseService } from "medusa-interfaces"
import { Resend } from "resend"

class EmailService extends BaseService {
  private resend: Resend
  private from: string

  constructor(container, options) {
    super()
    this.resend = new Resend(options.api_key)
    this.from = options.from || "noreply@kctmenswear.com"
  }

  async sendOrderConfirmation(order) {
    try {
      const { data, error } = await this.resend.emails.send({
        from: this.from,
        to: [order.email],
        subject: `Order Confirmation - ${order.display_id}`,
        html: this.generateOrderConfirmationHtml(order),
      })

      if (error) {
        console.error('Resend order confirmation error:', error)
        throw new Error(`Failed to send order confirmation: ${error.message}`)
      }

      console.log('Order confirmation sent:', data)
      return { success: true, id: data.id }
    } catch (error) {
      console.error('Email service error:', error)
      throw error
    }
  }

  async sendShippingNotification(order, tracking) {
    try {
      const { data, error } = await this.resend.emails.send({
        from: this.from,
        to: [order.email],
        subject: `Your Order Has Shipped - ${order.display_id}`,
        html: this.generateShippingNotificationHtml(order, tracking),
      })

      if (error) {
        console.error('Resend shipping notification error:', error)
        throw new Error(`Failed to send shipping notification: ${error.message}`)
      }

      console.log('Shipping notification sent:', data)
      return { success: true, id: data.id }
    } catch (error) {
      console.error('Email service error:', error)
      throw error
    }
  }

  async sendPasswordReset(user, resetToken) {
    try {
      const resetUrl = `${process.env.STORE_CORS?.split(',')[0]}/reset-password?token=${resetToken}`
      
      const { data, error } = await this.resend.emails.send({
        from: this.from,
        to: [user.email],
        subject: "Reset Your Password - KCT Menswear",
        html: this.generatePasswordResetHtml(user, resetUrl),
      })

      if (error) {
        console.error('Resend password reset error:', error)
        throw new Error(`Failed to send password reset: ${error.message}`)
      }

      console.log('Password reset email sent:', data)
      return { success: true, id: data.id }
    } catch (error) {
      console.error('Email service error:', error)
      throw error
    }
  }

  async sendWelcomeEmail(customer) {
    try {
      const { data, error } = await this.resend.emails.send({
        from: this.from,
        to: [customer.email],
        subject: "Welcome to KCT Menswear!",
        html: this.generateWelcomeEmailHtml(customer),
      })

      if (error) {
        console.error('Resend welcome email error:', error)
        throw new Error(`Failed to send welcome email: ${error.message}`)
      }

      console.log('Welcome email sent:', data)
      return { success: true, id: data.id }
    } catch (error) {
      console.error('Email service error:', error)
      throw error
    }
  }

  private generateOrderConfirmationHtml(order) {
    const total = (order.total / 100).toFixed(2)
    const itemsHtml = order.items.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">
          <strong>${item.title}</strong>
          ${item.variant?.title ? `<br><small>Size: ${item.variant.title}</small>` : ''}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${(item.unit_price / 100).toFixed(2)}</td>
      </tr>
    `).join('')

    return `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; }
            .header { background: #1a1a1a; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th { background: #f5f5f5; padding: 10px; text-align: left; }
            .total { font-weight: bold; font-size: 18px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>KCT Menswear</h1>
            <h2>Order Confirmation</h2>
          </div>
          <div class="content">
            <p>Thank you for your order!</p>
            <p><strong>Order Number:</strong> ${order.display_id}</p>
            <p><strong>Order Date:</strong> ${new Date(order.created_at).toLocaleDateString()}</p>
            
            <h3>Items Ordered:</h3>
            <table>
              <tr>
                <th>Item</th>
                <th style="text-align: center;">Quantity</th>
                <th style="text-align: right;">Price</th>
              </tr>
              ${itemsHtml}
              <tr class="total">
                <td colspan="2" style="padding: 20px 10px 10px; text-align: right;">Total:</td>
                <td style="padding: 20px 10px 10px; text-align: right;">$${total}</td>
              </tr>
            </table>
            
            <h3>Shipping Address:</h3>
            <p>
              ${order.shipping_address.first_name} ${order.shipping_address.last_name}<br>
              ${order.shipping_address.address_1}<br>
              ${order.shipping_address.address_2 ? order.shipping_address.address_2 + '<br>' : ''}
              ${order.shipping_address.city}, ${order.shipping_address.province} ${order.shipping_address.postal_code}<br>
              ${order.shipping_address.country_code.toUpperCase()}
            </p>
            
            <p>We'll send you another email when your order ships!</p>
            <p>Thank you for choosing KCT Menswear.</p>
          </div>
        </body>
      </html>
    `
  }

  private generateShippingNotificationHtml(order, tracking) {
    return `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; }
            .header { background: #1a1a1a; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .tracking-info { background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>KCT Menswear</h1>
            <h2>Your Order Has Shipped!</h2>
          </div>
          <div class="content">
            <p>Great news! Your order has shipped and is on its way to you.</p>
            <p><strong>Order Number:</strong> ${order.display_id}</p>
            
            <div class="tracking-info">
              <h3>Tracking Information:</h3>
              <p><strong>Tracking Number:</strong> ${tracking.tracking_code}</p>
              <p><strong>Carrier:</strong> ${tracking.carrier || 'USPS'}</p>
              ${tracking.tracking_url ? `<p><a href="${tracking.tracking_url}" target="_blank">Track Your Package</a></p>` : ''}
            </div>
            
            <p>You can expect your order to arrive within 3-7 business days.</p>
            <p>Thank you for your business!</p>
          </div>
        </body>
      </html>
    `
  }

  private generatePasswordResetHtml(user, resetUrl) {
    return `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; }
            .header { background: #1a1a1a; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .button { background: #1a1a1a; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>KCT Menswear</h1>
            <h2>Password Reset Request</h2>
          </div>
          <div class="content">
            <p>Hello ${user.first_name || 'Customer'},</p>
            <p>You recently requested to reset your password. Click the button below to reset it:</p>
            <p><a href="${resetUrl}" class="button">Reset Password</a></p>
            <p>If you didn't request this, please ignore this email. This link will expire in 24 hours.</p>
            <p>Best regards,<br>The KCT Menswear Team</p>
          </div>
        </body>
      </html>
    `
  }

  private generateWelcomeEmailHtml(customer) {
    return `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; }
            .header { background: #1a1a1a; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .button { background: #1a1a1a; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Welcome to KCT Menswear!</h1>
          </div>
          <div class="content">
            <p>Hello ${customer.first_name || 'Customer'},</p>
            <p>Welcome to KCT Menswear! We're thrilled to have you as part of our community.</p>
            <p>At KCT Menswear, we're committed to providing you with high-quality menswear that combines style, comfort, and durability.</p>
            <p><a href="${process.env.STORE_CORS?.split(',')[0] || 'https://kctmenswear.com'}" class="button">Start Shopping</a></p>
            <p>If you have any questions, feel free to reach out to our customer service team.</p>
            <p>Best regards,<br>The KCT Menswear Team</p>
          </div>
        </body>
      </html>
    `
  }
}

export default EmailService
