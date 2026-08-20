import { ethers } from "ethers";

export interface ChainListenerConfig {
  rpcUrl: string;
  contractAddress: string;
  abi: ethers.InterfaceAbi;
}

export class ChainListener {
  private provider: ethers.WebSocketProvider | ethers.JsonRpcProvider;
  private contract: ethers.Contract;

  constructor(config: ChainListenerConfig) {
    this.provider = config.rpcUrl.startsWith("ws")
      ? new ethers.WebSocketProvider(config.rpcUrl)
      : new ethers.JsonRpcProvider(config.rpcUrl);
    this.contract = new ethers.Contract(config.contractAddress, config.abi, this.provider);
  }

  /**
   * Subscribe to a specific contract event.
   */
  on(eventName: string, handler: (...args: unknown[]) => void): void {
    this.contract.on(eventName, handler);
  }

  /**
   * Remove all listeners and close connection.
   */
  async destroy(): Promise<void> {
    this.contract.removeAllListeners();
    await this.provider.destroy();
  }
}
