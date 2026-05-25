export type MantleNetwork = "mainnet" | "testnet"

export function getExplorerBaseUrl(network?: MantleNetwork | string | null): string {
  return network === "testnet"
    ? "https://explorer.sepolia.mantle.xyz"
    : "https://explorer.mantle.xyz"
}

export function getExplorerAddressUrl(
  address: string,
  network?: MantleNetwork | string | null
): string {
  return `${getExplorerBaseUrl(network)}/address/${address}#code`
}

export function getNetworkLabel(network?: MantleNetwork | string | null): string {
  return network === "testnet" ? "Testnet" : "Mainnet"
}
