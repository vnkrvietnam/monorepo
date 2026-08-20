import axios from 'axios';

/** Response shape returned by the TronGrid broadcast endpoint. */
interface TronBroadcastResponse {
  result: boolean;
  txid?: string;
  code?: string;
  message?: string;
}

/** Response shape returned by the TronGrid TRC20 balance call. */
interface TronTrc20BalanceResponse {
  data?: Array<{ balance?: string }>;
}

/**
 * Provider service for the TRON network (TRC-20 tokens).
 *
 * Uses the TronGrid HTTP API for all interactions, meaning no additional
 * native SDKs are required beyond `axios`.
 *
 * @see https://developers.tron.network/reference/full-node-api-overview
 */
export class TronProviderService {
  private readonly nodeUrl: string;

  /**
   * @param nodeUrl Base URL of a TronGrid or full-node HTTP endpoint
   *                (e.g. `https://api.trongrid.io` for mainnet).
   */
  constructor(nodeUrl: string) {
    this.nodeUrl = nodeUrl.replace(/\/$/, '');
  }

  /**
   * Retrieves the TRC-20 token balance for a wallet address.
   *
   * @param contractAddress Base58check address of the TRC-20 token contract.
   * @param walletAddress   Base58check address of the wallet to query.
   * @returns               Token balance as a decimal string (in the token's smallest unit).
   * @throws                `Error` if the API call fails or returns an unexpected shape.
   */
  async getTrc20Balance(contractAddress: string, walletAddress: string): Promise<string> {
    const url = `${this.nodeUrl}/v1/accounts/${walletAddress}/tokens?token=${contractAddress}&limit=1`;
    const response = await axios.get<TronTrc20BalanceResponse>(url);
    const balance = response.data?.data?.[0]?.balance ?? '0';
    return balance;
  }

  /**
   * Broadcasts a pre-signed TRON transaction to the network.
   *
   * @param signedTx JSON-encoded signed transaction object (as returned by
   *                 TronWeb's `trx.sign()` or equivalent).
   * @returns        Transaction ID (hex string) on success.
   * @throws         `Error` if the broadcast is rejected by the node.
   */
  async broadcastTransaction(signedTx: string): Promise<string> {
    const url = `${this.nodeUrl}/wallet/broadcasttransaction`;
    // signedTx is expected to be a JSON string from the TRON signing library.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- raw JSON from caller
    const body: unknown = JSON.parse(signedTx);

    const response = await axios.post<TronBroadcastResponse>(url, body, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.data.result || !response.data.txid) {
      throw new Error(
        `TronProviderService: broadcast failed — code=${response.data.code ?? 'UNKNOWN'} message=${response.data.message ?? ''}`
      );
    }

    return response.data.txid;
  }
}
