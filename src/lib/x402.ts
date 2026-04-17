import { ethers } from "ethers"

export const CUSD_ADDRESS = "0x765DE816845861e75A25fCA122bb6898B8B1282a"
export const SESSION_PRICE = ethers.utils.parseEther("0.0001") // 0.0001 cUSD

export function getPaymentRequirements(agentAddress: string) {
  return {
    payTo: agentAddress,
    amount: "0.0001",
    token: "cUSD",
    tokenAddress: CUSD_ADDRESS,
    network: "Celo Mainnet",
    chainId: 42220,
    miniPayCompatible: true,
    description: "0.0001 cUSD per tutoring session",
  }
}

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

    // Check cUSD Transfer event
    const transferTopic = ethers.utils.id("Transfer(address,address,uint256)")
    const iface = new ethers.utils.Interface([
      "event Transfer(address indexed from, address indexed to, uint256 value)",
    ])

    for (const log of receipt.logs) {
      if (
        log.address.toLowerCase() === CUSD_ADDRESS.toLowerCase() &&
        log.topics[0] === transferTopic
      ) {
        try {
          const parsed = iface.parseLog(log)
          if (
            parsed.args.to.toLowerCase() === expectedRecipient.toLowerCase() &&
            parsed.args.value.gte(SESSION_PRICE)
          ) {
            return { valid: true, payer: parsed.args.from }
          }
        } catch {}
      }
    }

    return { valid: false, payer: null, error: "No valid cUSD payment found in transaction" }
  } catch (err: any) {
    return { valid: false, payer: null, error: err.message }
  }
}