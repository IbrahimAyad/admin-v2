export const GET = (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "2.0.0",
    service: "kct-menswear-backend"
  })
}
