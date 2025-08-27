import { Router } from "express"
import express from "express"
import Stripe from "stripe"

const router = Router()

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_API_KEY!, {
  apiVersion: "2023-10-16",
})

// Test payment intent creation
router.post("/create-payment-intent", async (req, res) => {
  try {
    const { amount, currency = "usd", metadata = {} } = req.body

    if (!amount || amount < 50) {
      return res.status(400).json({ error: "Amount must be at least 50 cents" })
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // Ensure it's an integer
      currency,
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    })

    res.json({
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    })
  } catch (error) {
    console.error("Stripe payment intent creation error:", error)
    res.status(500).json({ error: "Failed to create payment intent" })
  }
})

// Test payment verification
router.post("/verify-payment", async (req, res) => {
  try {
    const { payment_intent_id } = req.body

    if (!payment_intent_id) {
      return res.status(400).json({ error: "Payment intent ID is required" })
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id)

    res.json({
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      created: paymentIntent.created,
      metadata: paymentIntent.metadata,
    })
  } catch (error) {
    console.error("Stripe payment verification error:", error)
    res.status(500).json({ error: "Failed to verify payment" })
  }
})

// Stripe webhook endpoint
router.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  try {
    const sig = req.headers["stripe-signature"]
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

    if (!webhookSecret) {
      console.warn("Stripe webhook secret not configured")
      return res.status(200).json({ received: true })
    }

    let event
    try {
      event = stripe.webhooks.constructEvent(req.body, sig!, webhookSecret)
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message)
      return res.status(400).send(`Webhook Error: ${err.message}`)
    }

    // Handle the event
    switch (event.type) {
      case "payment_intent.succeeded":
        console.log("Payment succeeded:", event.data.object.id)
        break
      case "payment_intent.payment_failed":
        console.log("Payment failed:", event.data.object.id)
        break
      default:
        console.log(`Unhandled event type ${event.type}`)
    }

    res.status(200).json({ received: true })
  } catch (error) {
    console.error("Stripe webhook error:", error)
    res.status(500).json({ error: "Webhook processing failed" })
  }
})

export default router
