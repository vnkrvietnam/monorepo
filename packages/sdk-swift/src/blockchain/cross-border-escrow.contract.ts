import { Contract, ContractRunner, Interface } from 'ethers';
import { EvmProviderService } from './evm-provider.service';

/**
 * Minimal ABI for the CrossBorderEscrow smart contract.
 * Only the functions used by this wrapper are included; extend as needed.
 */
const CROSS_BORDER_ESCROW_ABI = [
  'function deposit(bytes32 uetr, address recipient) external payable',
  'function release(bytes32 uetr) external',
  'function refund(bytes32 uetr) external',
];

/**
 * Encodes a UETR string as a `bytes32` value (left-padded UTF-8 bytes).
 * UETR is a UUID v4 string (36 chars); it fits comfortably in 32 bytes.
 */
function encodeUetrAsBytes32(uetr: string): string {
  const hex = Buffer.from(uetr, 'utf8').toString('hex').padEnd(64, '0');
  return `0x${hex}`;
}

/**
 * TypeScript interop wrapper for the CrossBorderEscrow Solidity smart contract.
 *
 * Provides deposit / release / refund operations tied to SWIFT UETR identifiers,
 * enabling on-chain escrowed settlement for cross-border payments.
 */
export class CrossBorderEscrowContract {
  private readonly contract: Contract;

  /**
   * @param contractAddress Deployed address of the CrossBorderEscrow contract (0x-prefixed).
   * @param provider        `EvmProviderService` instance connected to the target chain.
   */
  constructor(contractAddress: string, provider: EvmProviderService) {
    // ethers v6 Contract requires a ContractRunner (provider or signer).
    this.contract = new Contract(
      contractAddress,
      new Interface(CROSS_BORDER_ESCROW_ABI),
      provider.provider as unknown as ContractRunner
    );
  }

  /**
   * Deposits funds into the escrow contract, locking them against a UETR.
   * The caller must attach the native currency `amount` as `msg.value`.
   *
   * @param uetr      UUID v4 UETR string that uniquely identifies this escrow.
   * @param amount    Amount in wei (as a decimal string) to lock in escrow.
   * @param recipient Checksummed EVM address of the intended payment recipient.
   * @returns         Transaction hash of the deposit transaction.
   */
  async deposit(uetr: string, amount: string, recipient: string): Promise<string> {
    const uetrBytes32 = encodeUetrAsBytes32(uetr);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- ethers dynamic call
    const tx = await this.contract['deposit'](uetrBytes32, recipient, { value: amount });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- ethers tx object
    return (tx as { hash: string }).hash;
  }

  /**
   * Releases escrowed funds to the recipient once the SWIFT payment is confirmed.
   *
   * @param uetr UUID v4 UETR string of the escrow to release.
   * @returns    Transaction hash of the release transaction.
   */
  async release(uetr: string): Promise<string> {
    const uetrBytes32 = encodeUetrAsBytes32(uetr);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- ethers dynamic call
    const tx = await this.contract['release'](uetrBytes32);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- ethers tx object
    return (tx as { hash: string }).hash;
  }

  /**
   * Refunds escrowed funds to the sender if the payment fails or is rejected.
   *
   * @param uetr UUID v4 UETR string of the escrow to refund.
   * @returns    Transaction hash of the refund transaction.
   */
  async refund(uetr: string): Promise<string> {
    const uetrBytes32 = encodeUetrAsBytes32(uetr);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- ethers dynamic call
    const tx = await this.contract['refund'](uetrBytes32);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- ethers tx object
    return (tx as { hash: string }).hash;
  }
}
