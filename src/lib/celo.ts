import { ethers } from "ethers"
import dotenv from "dotenv"
dotenv.config()

export const provider = new ethers.providers.JsonRpcProvider(
  process.env.CELO_RPC || "https://forno.celo.org"
)

const privateKey = process.env.AGENT_PRIVATE_KEY
export const agentWallet = privateKey
  ? new ethers.Wallet(privateKey, provider)
  : ethers.Wallet.createRandom().connect(provider)

export const TEACH_AGENT_CONTRACT = process.env.TEACH_AGENT_CONTRACT || ""

export const TEACH_AGENT_ABI = [
  "event QuestionPaid(address indexed student, uint256 indexed questionId, uint256 amount)",
  "function payForQuestion() external payable returns (uint256 questionId)",
  "function pricePerQuestion() external view returns (uint256)",
  "function totalQuestions() external view returns (uint256)",
]