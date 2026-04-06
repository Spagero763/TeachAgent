import express from "express"
import cors from "cors"
import dotenv from "dotenv"

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

// Health check
app.get("/", (req, res) => {
  res.json({
    agent: "TeachAgent",
    version: "1.0.0",
    status: "online",
    description: "AI agent for educator reputation on Celo",
    endpoints: [
      "GET  /health",
      "POST /agent/score",
      "POST /agent/session",
      "GET  /agent/identity",
      "GET  /agent/reputation",
    ],
  })
})

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() })
})

// Routes
import { agentRouter } from "./routes/agent"
app.use("/agent", agentRouter)

app.listen(PORT, () => {
  console.log(`TeachAgent running on port ${PORT}`)
})

import path from "path"
app.use("/.well-known", express.static(path.join(__dirname, "../public/.well-known")))

export default app