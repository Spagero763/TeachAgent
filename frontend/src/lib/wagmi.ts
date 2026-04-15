import { cookieStorage, createStorage } from "wagmi"
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi"
import { celo } from "@reown/appkit/networks"
import type { AppKitNetwork } from "@reown/appkit/networks"

export const projectId = "c83c3089a5e014ec6ca41fc68ff639ea"
export const networks: [AppKitNetwork, ...AppKitNetwork[]] = [celo]

export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({ storage: cookieStorage }),
  ssr: true,
  projectId,
  networks,
})