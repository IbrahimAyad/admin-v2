import { Router } from "express"
import jwt from "jsonwebtoken"
import { OAuth2Client } from "google-auth-library"

const router = Router()

// Google OAuth configuration
const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.STORE_CORS?.split(',')[0]}/auth/google/callback`
)

// Google OAuth login endpoint
router.post("/google", async (req, res) => {
  try {
    const { token } = req.body

    if (!token) {
      return res.status(400).json({ error: "Google token is required" })
    }

    // Verify the Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    })

    const payload = ticket.getPayload()
    if (!payload) {
      return res.status(400).json({ error: "Invalid Google token" })
    }

    const { email, name, given_name, family_name, picture } = payload

    // Get customer service from container
    const customerService = req.scope.resolve("customerService")
    
    let customer
    try {
      // Try to find existing customer
      customer = await customerService.retrieveByEmail(email)
    } catch (error) {
      // Customer doesn't exist, create new one
      customer = await customerService.create({
        email,
        first_name: given_name || name?.split(' ')[0] || '',
        last_name: family_name || name?.split(' ').slice(1).join(' ') || '',
        metadata: {
          google_id: payload.sub,
          avatar: picture,
        },
      })
    }

    // Generate JWT token for the customer
    const jwtToken = jwt.sign(
      {
        customer_id: customer.id,
        email: customer.email,
      },
      process.env.JWT_SECRET!,
      { expiresIn: "30d" }
    )

    res.json({
      customer,
      token: jwtToken,
    })
  } catch (error) {
    console.error("Google OAuth error:", error)
    res.status(500).json({ error: "Authentication failed" })
  }
})

// Facebook OAuth login endpoint
router.post("/facebook", async (req, res) => {
  try {
    const { accessToken } = req.body

    if (!accessToken) {
      return res.status(400).json({ error: "Facebook access token is required" })
    }

    // Verify Facebook token and get user info
    const fbResponse = await fetch(
      `https://graph.facebook.com/me?fields=id,name,email,first_name,last_name,picture&access_token=${accessToken}`
    )

    if (!fbResponse.ok) {
      return res.status(400).json({ error: "Invalid Facebook token" })
    }

    const fbUser = await fbResponse.json()

    if (!fbUser.email) {
      return res.status(400).json({ error: "Email permission required" })
    }

    // Get customer service from container
    const customerService = req.scope.resolve("customerService")
    
    let customer
    try {
      // Try to find existing customer
      customer = await customerService.retrieveByEmail(fbUser.email)
    } catch (error) {
      // Customer doesn't exist, create new one
      customer = await customerService.create({
        email: fbUser.email,
        first_name: fbUser.first_name || '',
        last_name: fbUser.last_name || '',
        metadata: {
          facebook_id: fbUser.id,
          avatar: fbUser.picture?.data?.url,
        },
      })
    }

    // Generate JWT token for the customer
    const jwtToken = jwt.sign(
      {
        customer_id: customer.id,
        email: customer.email,
      },
      process.env.JWT_SECRET!,
      { expiresIn: "30d" }
    )

    res.json({
      customer,
      token: jwtToken,
    })
  } catch (error) {
    console.error("Facebook OAuth error:", error)
    res.status(500).json({ error: "Authentication failed" })
  }
})

export default router
