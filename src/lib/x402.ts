import { ethers } from "ethers"

export const TEACH_AGENT_CONTRACT = "0x6a818b6E70fe033d3b70b5D0bEfFd7e32FB221cA"
export const PRICE_CELO = ethers.utils.parseEther("0.001")

// cUSD on Celo Mainnet — used for MiniPay payments (MiniPay CIP-64 drops `value`)
const CUSD_ADDRESS = "0x765DE816845861e75A25fCA122bb6898B8B1282a"
const PRICE_CUSD = ethers.utils.parseEther("0.001")
const ERC20_TRANSFER_TOPIC = ethers.utils.id("Transfer(address,address,uint256)")
const ERC20_TRANSFER_IFACE = new ethers.utils.Interface([
  "event Transfer(address indexed from, address indexed to, uint256 value)",
])

export function getPaymentRequirements() {
  return {
    contract: TEACH_AGENT_CONTRACT,
    amount: "0.001",
    token: "CELO",
    network: "Celo Mainnet",
    chainId: 42220,
    miniPayCompatible: true,
    description: "0.001 CELO (or 0.001 cUSD via MiniPay) per question",
    method: "Call payForQuestion() with 0.001 CELO, or transfer 0.001 cUSD to contract (MiniPay)",
  }
}

export async function verifyPayment(
  txHash: string,
  studentAddress: string,
  provider: ethers.providers.JsonRpcProvider
): Promise<{ valid: boolean; payer: string | null; error?: string }> {
  try {
    const receipt = await provider.getTransactionReceipt(txHash)
    if (!receipt || receipt.status !== 1) {
      return { valid: false, payer: null, error: "Transaction failed or not found" }
    }

    // ── Path 1: native CELO via payForQuestion() ──────────────────────────
    if (receipt.to?.toLowerCase() === TEACH_AGENT_CONTRACT.toLowerCase()) {
      // Check QuestionPaid event
      const topic = ethers.utils.id("QuestionPaid(address,uint256,uint256)")
      const iface = new ethers.utils.Interface([
        "event QuestionPaid(address indexed student, uint256 indexed questionId, uint256 amount)",
      ])
      for (const log of receipt.logs) {
        if (
          log.address.toLowerCase() === TEACH_AGENT_CONTRACT.toLowerCase() &&
          log.topics[0] === topic
        ) {
          try {
            const parsed = iface.parseLog(log)
            // Require the payer in the event to match the claimer — prevents
            // someone from redeeming another wallet's payment txHash.
            const eventStudent = (parsed.args.student as string).toLowerCase()
            if (
              eventStudent === studentAddress.toLowerCase() &&
              (parsed.args.amount as ethers.BigNumber).gte(PRICE_CELO)
            ) {
              return { valid: true, payer: parsed.args.student }
            }
          } catch {}
        }
      }

      // Fallback: check raw tx value
      const tx = await provider.getTransaction(txHash)
      if (
        tx &&
        tx.to?.toLowerCase() === TEACH_AGENT_CONTRACT.toLowerCase() &&
        tx.value.gte(PRICE_CELO) &&
        tx.from.toLowerCase() === studentAddress.toLowerCase()
      ) {
        return { valid: true, payer: tx.from }
      }
    }

    // ── Path 2: cUSD ERC-20 transfer to contract (MiniPay) ────────────────
    // MiniPay's CIP-64 transaction type silently drops `value`; we accept a
    // direct cUSD transfer to the contract address as equivalent payment.
    for (const log of receipt.logs) {
      if (
        log.address.toLowerCase() === CUSD_ADDRESS.toLowerCase() &&
        log.topics[0] === ERC20_TRANSFER_TOPIC
      ) {
        try {
          const parsed = ERC20_TRANSFER_IFACE.parseLog(log)
          const pargs = parsed.args as unknown as { from: string; to: string; value: ethers.BigNumber }
          const { from, to, value } = pargs
          if (
            to.toLowerCase() === TEACH_AGENT_CONTRACT.toLowerCase() &&
            from.toLowerCase() === studentAddress.toLowerCase() &&
            value.gte(PRICE_CUSD)
          ) {
            return { valid: true, payer: from }
          }
        } catch {}
      }
    }

    return { valid: false, payer: null, error: "No valid payment found in transaction" }
  } catch (err: any) {
    return { valid: false, payer: null, error: err.message }
  }
}
