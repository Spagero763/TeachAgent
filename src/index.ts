import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import path from "path"

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())
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

export default app