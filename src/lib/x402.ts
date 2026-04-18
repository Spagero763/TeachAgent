import { ethers } from "ethers"

// TeachAgentPayment contract on Celo mainnet
export const TEACH_AGENT_CONTRACT = "0x6a818b6E70fe033d3b70b5D0bEfFd7e32FB221cA"
export const PRICE_CELO = ethers.utils.parseEther("0.001")

export function getPaymentRequirements() {
  return {
    contract: TEACH_AGENT_CONTRACT,
    amount: "0.001",
    token: "CELO",
    network: "Celo Mainnet",
    chainId: 42220,
    miniPayCompatible: true,
    description: "0.001 CELO per question — paid to TeachAgentPayment contract",
    method: "Call payForQuestion() on contract with 0.001 CELO value",
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

    // Verify the tx went TO the TeachAgent contract
    if (receipt.to?.toLowerCase() !== TEACH_AGENT_CONTRACT.toLowerCase()) {
      return { valid: false, payer: null, error: "Transaction did not interact with TeachAgent contract" }
    }

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
          const paidAmount: ethers.BigNumber = parsed.args.amount
          if (paidAmount.gte(PRICE_CELO)) {
            return { valid: true, payer: parsed.args.student }
          }
        } catch {}
      }
    }

    // Fallback: check if tx sent value to contract and came from student
    const tx = await provider.getTransaction(txHash)
    if (
      tx &&
      tx.to?.toLowerCase() === TEACH_AGENT_CONTRACT.toLowerCase() &&
      tx.value.gte(PRICE_CELO) &&
      tx.from.toLowerCase() === studentAddress.toLowerCase()
    ) {
      return { valid: true, payer: tx.from }
    }

    return { valid: false, payer: null, error: "No valid payment found in transaction" }
  } catch (err: any) {
    return { valid: false, payer: null, error: err.message }
  }
}