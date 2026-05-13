import express from "express"
import cors from "cors"
import helmet from "helmet"
import rateLimit from "express-rate-limit"
import dotenv from "dotenv"
import path from "path"

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Security headers
app.use(helmet())

// CORS — only allow the frontend
app.use(cors({
  origin: [
    "https://teach-agent.vercel.app",
    "http://localhost:3000",
  ],
  methods: ["GET", "POST"],
}))

// Limit request body size — prevent large payload attacks
app.use(express.json({ limit: "10kb" }))

// Rate limit — max 30 requests per minute per IP
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: "Too many requests. Please wait a moment and try again." },
  standardHeaders: true,
  legacyHeaders: false,
})
app.use("/agent", limiter)

// Stricter rate limit on /session — max 10 per minute per IP
const sessionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: "Too many questions. Please wait a moment and try again." },
  standardHeaders: true,
  legacyHeaders: false,
})
app.use("/agent/session", sessionLimiter)
app.use("/.well-known", express.static(path.join(__dirname, "../public/.well-known")))

app.get("/", (_req, res) => {
  res.json({
    agent: "TeachAgent",
    version: "2.0.0",
    status: "online",
    description: "Celo blockchain AI chatbot — 0.001 CELO per question",
    network: "Celo Mainnet",
  })
})

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() })
})

import { agentRouter } from "./routes/agent"
app.use("/agent", agentRouter)

app.listen(PORT, () => {
  console.log(`TeachAgent running on port ${PORT}`)
})

// Keep Render free tier awake — ping self every 14 minutes
const SELF_URL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`
setInterval(() => {
  fetch(`${SELF_URL}/health`).catch(() => {})
}, 14 * 60 * 1000)

export default app