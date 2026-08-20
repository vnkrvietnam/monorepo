import { JsonRpcProvider, formatEther } from 'ethers';

/**
 * Provider service for EVM-compatible networks (Ethereum mainnet, BNB Chain,
 * Polygon, etc.). Wraps ethers v6 `JsonRpcProvider` with a simplified API
 * aligned with the SWIFT SDK's needs.
 */
export class EvmProviderService {
  /** ethers v6 JSON-RPC provider instance. */
  readonly provider: JsonRpcProvider;
  /** Chain ID of the target EVM network. */
  readonly chainId: number;

  /**
   * @param rpcUrl  HTTP/HTTPS JSON-RPC endpoint of the EVM node.
   * @param chainId EIP-155 chain ID (e.g. 1 for Ethereum, 56 for BNB Chain).
   */
  constructor(rpcUrl: string, chainId: number) {
    this.chainId = chainId;
    this.provider = new JsonRpcProvider(rpcUrl, chainId);
  }

  /**
   * Returns the native currency balance of `address` formatted as a decimal
   * string in ETH / BNB units (not wei).
   *
   * @param address Checksummed EVM address (0x-prefixed, 42 chars).
   * @returns       Balance as a decimal string (e.g. `"1.23456"`).
   * @throws        `Error` if the address is invalid or the RPC call fails.
   */
  async getBalance(address: string): Promise<string> {
    const balanceWei = await this.provider.getBalance(address);
    return formatEther(balanceWei);
  }

  /**
   * Broadcasts an already-signed raw transaction to the network and returns
   * the transaction hash.
   *
   * @param signedTx Hex-encoded signed transaction (0x-prefixed).
   * @returns        Transaction hash (0x-prefixed, 66 chars).
   * @throws         `Error` if the transaction is rejected by the node.
   */
  async sendRawTransaction(signedTx: string): Promise<string> {
    const txResponse = await this.provider.broadcastTransaction(signedTx);
    return txResponse.hash;
  }
}
