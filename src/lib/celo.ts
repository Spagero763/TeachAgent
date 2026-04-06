import { ethers } from "ethers"
import dotenv from "dotenv"
dotenv.config()

export const provider = new ethers.providers.JsonRpcProvider(
  process.env.CELO_RPC || "https://forno.celo.org"
)

// Only create wallet if private key exists
const privateKey = process.env.AGENT_PRIVATE_KEY

export const agentWallet = privateKey
  ? new ethers.Wallet(privateKey, provider)
  : ethers.Wallet.createRandom().connect(provider)

export const AGENT_CONFIGURED = !!privateKey

// ERC-8004 Identity Registry ABI (minimal)
export const IDENTITY_REGISTRY_ABI = [
  "function register(string memory agentURI) external returns (uint256 agentId)",
  "function setAgentURI(uint256 agentId, string memory agentURI) external",
  "function getAgentWallet(uint256 agentId) external view returns (address)",
  "function tokenURI(uint256 agentId) external view returns (string memory)",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
]

// ERC-8004 Reputation Registry ABI (minimal)
export const REPUTATION_REGISTRY_ABI = [
  "function giveFeedback(uint256 agentId, int8 score, string memory tag, string memory feedbackURI) external",
  "function getSummary(uint256 agentId) external view returns (int256 totalScore, uint256 feedbackCount)",
]

export const identityRegistry = new ethers.Contract(
  process.env.ERC8004_IDENTITY_REGISTRY || "",
  IDENTITY_REGISTRY_ABI,
  agentWallet
)

export const reputationRegistry = new ethers.Contract(
  process.env.ERC8004_REPUTATION_REGISTRY || "",
  REPUTATION_REGISTRY_ABI,
  agentWallet
)

// EduPay contract ABI (minimal - reads only)
export const EDUPAY_ABI = [
  "function courses(uint256) external view returns (address tutor, string memory title, string memory description, bool isActive, uint256 chapterCount, uint256 totalEarned)",
  "function tutorEarnings(address) external view returns (uint256)",
  "function courseCount() external view returns (uint256)",
  "function getTutorCourses(address _tutor) external view returns (uint256[])",
]

export const eduPayContract = new ethers.Contract(
  process.env.EDUPAY_CONTRACT || "",
  EDUPAY_ABI,
  provider
)