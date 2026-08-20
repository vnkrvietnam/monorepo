import { ethers, type Contract, type Provider } from "ethers";

// ─── ABI thu gọn VNKRSwiftBridge (chỉ events + functions cần thiết) ─────────

export const BRIDGE_ABI = [
  // Events
  "event SwiftOutboundRequested(bytes32 indexed uetrHash, address indexed sender, string receiverBic, uint256 amount, uint256 tokenAmountBurned)",
  "event SwiftInboundSettled(bytes32 indexed uetrHash, address indexed beneficiary, uint256 amount, uint256 tokenAmount, string senderBic)",
  // Functions (Relayer calls)
  "function settleInboundSwift(string uetr, string senderBic, address beneficiary, uint256 amount) external",
  "function confirmOutboundSwift(string uetr, string transmissionId) external",
  "function refundOutboundSwift(string uetr) external",
  "function getRecord(string uetr) external view returns (tuple(bytes32 uetrHash, string senderBic, string receiverBic, uint256 amount, uint256 tokenAmount, address beneficiary, uint8 status, uint256 settledAt))",
];

export interface OutboundEventData {
  uetrHash:           string;   // bytes32 hex
  uetr:               string;   // original UUID (decoded nếu có)
  sender:             string;   // địa chỉ EVM người gửi
  receiverBic:        string;
  amount:             bigint;   // USD micro (1e6)
  tokenAmountBurned:  bigint;
  blockNumber:        number;
  txHash:             string;
}

/**
 * OnChainListener — lắng nghe event SwiftOutboundRequested từ VNKRSwiftBridge.sol
 * Chạy trên VNKR App-Chain EVM (Hyperledger Besu).
 */
export class OnChainListener {
  private readonly contract: Contract;
  private readonly provider: Provider;

  constructor(
    rpcUrl: string = process.env["VNKR_EVM_RPC"] ?? "http://localhost:8545",
    contractAddress: string = process.env["BRIDGE_CONTRACT_ADDRESS"] ?? ethers.ZeroAddress
  ) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.contract = new ethers.Contract(contractAddress, BRIDGE_ABI, this.provider);
  }

  /**
   * Bắt đầu lắng nghe event SwiftOutboundRequested.
   * Gọi `onEvent` cho mỗi event nhận được.
   * Gọi `onError` khi có lỗi.
   */
  startListening(
    onEvent: (data: OutboundEventData) => Promise<void>,
    onError: (err: unknown) => void,
    logger: { info: (msg: string) => void; error: (msg: string, ...a: unknown[]) => void }
  ): () => void {
    logger.info("[onchain] Subscribing to SwiftOutboundRequested events on VNKRSwiftBridge");

    const handler = async (
      uetrHash: string,
      sender: string,
      receiverBic: string,
      amount: bigint,
      tokenAmountBurned: bigint,
      event: ethers.EventLog
    ) => {
      const data: OutboundEventData = {
        uetrHash,
        uetr: uetrHash, // bytes32 → cần Relayer tra cứu nếu cần UUID gốc
        sender,
        receiverBic,
        amount,
        tokenAmountBurned,
        blockNumber: event.blockNumber,
        txHash:      event.transactionHash,
      };
      try {
        logger.info(`[onchain] ⚡ SwiftOutboundRequested  receiver=${receiverBic}  amount=${amount}  tx=${event.transactionHash}`);
        await onEvent(data);
      } catch (err) {
        onError(err);
      }
    };

    this.contract.on("SwiftOutboundRequested", handler);

    // Trả về hàm cleanup để unsubscribe
    return () => {
      this.contract.off("SwiftOutboundRequested", handler);
      logger.info("[onchain] Unsubscribed from SwiftOutboundRequested");
    };
  }

  /**
   * Backfill: lấy lại các events bị bỏ lỡ từ block fromBlock đến toBlock.
   */
  async fetchPastEvents(
    fromBlock: number,
    toBlock: number | "latest" = "latest"
  ): Promise<OutboundEventData[]> {
    const filter = this.contract.filters["SwiftOutboundRequested"]();
    const logs   = await this.contract.queryFilter(filter, fromBlock, toBlock);
    return logs
      .filter((l): l is ethers.EventLog => l instanceof ethers.EventLog)
      .map((log) => {
        const [uetrHash, sender, receiverBic, amount, tokenAmountBurned] = log.args as unknown as [string, string, string, bigint, bigint];
        return {
          uetrHash,
          uetr:       uetrHash,
          sender,
          receiverBic,
          amount,
          tokenAmountBurned,
          blockNumber: log.blockNumber,
          txHash:      log.transactionHash,
        };
      });
  }

  async getLatestBlock(): Promise<number> {
    return this.provider.getBlockNumber();
  }
}
