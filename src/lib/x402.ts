import { ethers } from "ethers"
import dotenv from "dotenv"
dotenv.config()

// cUSD on Celo mainnet
export const CUSD_ADDRESS = "0x765DE816845861e75A25fCA122bb6898B8B1282a"
export const SESSION_PRICE = ethers.utils.parseEther("0.001") // 0.001 cUSD

export const CUSD_ABI = [
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function transferFrom(address from, address to, uint256 amount) external returns (bool)",
]

// Payment requirements returned in 402 response
export function getPaymentRequirements(agentAddress: string) {
  return {
    scheme: "exact",
    network: "celo",
    chainId: 42220,
    maxAmountRequired: SESSION_PRICE.toString(),
    resource: "https://teachagent.onrender.com/agent/session",
    description: "0.001 cUSD per tutoring session — TeachAgent on Celo",
    mimeType: "application/json",
    payTo: agentAddress,
    maxTimeoutSeconds: 300,
    asset: CUSD_ADDRESS,
    outputSchema: {
      type: "object",
      properties: {
        answer: { type: "string" },
      },
    },
    extra: {
      name: "TeachAgent Session",
      version: "1.0.0",
      miniPayCompatible: true,
    },
  }
}

// Verify that a payment tx hash is valid and paid the right amount
export async function verifyPayment(
  txHash: string,
  expectedRecipient: string,
  provider: ethers.providers.JsonRpcProvider
): Promise<{ valid: boolean; payer: string | null; error?: string }> {
  try {
    const receipt = await provider.getTransactionReceipt(txHash)
    if (!receipt || receipt.status !== 1) {
      return { valid: false, payer: null, error: "Transaction failed or not found" }
    }

    // Decode Transfer event from cUSD contract
    const transferTopic = ethers.utils.id("Transfer(address,address,uint256)")
    const cusdInterface = new ethers.utils.Interface([
      "event Transfer(address indexed from, address indexed to, uint256 value)",
    ])

    let payer: string | null = null
    let paid = false

    for (const log of receipt.logs) {
      if (
        log.address.toLowerCase() === CUSD_ADDRESS.toLowerCase() &&
        log.topics[0] === transferTopic
      ) {
        try {
          const parsed = cusdInterface.parseLog(log)
          const to = parsed.args.to.toLowerCase()
          const value: ethers.BigNumber = parsed.args.value

          if (
            to === expectedRecipient.toLowerCase() &&
            value.gte(SESSION_PRICE)
          ) {
            payer = parsed.args.from
            paid = true
            break
          }
        } catch {}
      }
    }

    if (!paid) {
      return { valid: false, payer: null, error: "Payment not found or insufficient amount" }
    }

    return { valid: true, payer }
  } catch (err: any) {
    return { valid: false, payer: null, error: err.message }
  }
}