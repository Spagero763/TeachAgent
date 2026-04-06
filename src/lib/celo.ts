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

export const AGENT_CONFIGURED = !!privateKey

export const AGENT_REGISTRY_ABI = [
  "function register(string memory _agentURI) external returns (uint256 agentId)",
  "function giveFeedback(uint256 _agentId, int8 _score, string memory _tag) external",
  "function getReputation(uint256 _agentId) external view returns (int256 total, uint256 count, int256 average)",
  "function getOwnerAgents(address _owner) external view returns (uint256[] memory)",
  "function agents(uint256) external view returns (address owner, string memory agentURI, uint256 registeredAt, bool active)",
  "function agentCount() external view returns (uint256)",
  "event AgentRegistered(uint256 indexed agentId, address indexed owner, string agentURI)",
  "event FeedbackGiven(uint256 indexed agentId, address indexed from, int8 score, string tag)",
]

export const EDUPAY_ABI = [
  "function courses(uint256) external view returns (address tutor, string memory title, string memory description, bool isActive, uint256 chapterCount, uint256 totalEarned)",
  "function tutorEarnings(address) external view returns (uint256)",
  "function courseCount() external view returns (uint256)",
  "function getTutorCourses(address _tutor) external view returns (uint256[])",
]

export const AGENT_REGISTRY_ADDRESS = "0xBe9Ddf20E2a0191232a5bf57003ea7A512851391"

export const agentRegistry = new ethers.Contract(
  AGENT_REGISTRY_ADDRESS,
  AGENT_REGISTRY_ABI,
  agentWallet
)

export const eduPayContract = new ethers.Contract(
  process.env.EDUPAY_CONTRACT || "",
  EDUPAY_ABI,
  provider
)