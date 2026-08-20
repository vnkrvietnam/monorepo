/**
 * @vnkrvietnam/sdk-swift — Public API
 *
 * Re-exports all public classes, interfaces, and types from every SDK module.
 * Import from this barrel to avoid deep import paths:
 *
 * @example
 * ```ts
 * import { LauHeaderSigner, GpiTrackerClient, Iso20022Parser } from '@vnkrvietnam/sdk-swift';
 * ```
 */

// ─── Core ────────────────────────────────────────────────────────────────────
export { JavaBridgeAdapter } from './core/java-bridge.adapter';
export { FileEncryptorAdapter } from './core/file-encryptor.adapter';

// ─── Security ─────────────────────────────────────────────────────────────────
export { LauHeaderSigner } from './security/lau-header.signer';
export type { LauHeader } from './security/lau-header.signer';

export { PkiCertificateService } from './security/pki-certificate.service';
export type { CertificateBundle } from './security/pki-certificate.service';

// ─── ISO 20022 Generators ─────────────────────────────────────────────────────
export type {
  Pacs008Message,
  CreditTransferTransaction,
  PartyIdentification,
  ActiveCurrencyAndAmount,
  RemittanceInformation,
} from './generators/pacs-008.dto';

export type {
  Camt053Message,
  Statement,
  Balance,
  StatementEntry,
  AccountIdentification,
  StatementAmount,
} from './generators/camt-053.dto';

export { Iso20022Parser } from './generators/iso-20022.parser';

// ─── Clients ─────────────────────────────────────────────────────────────────
export { GpiTrackerClient } from './clients/gpi-tracker.client';
export type { GpiPaymentStatus, GpiAgentStatus } from './clients/gpi-tracker.client';

export { AccountValidationClient } from './clients/account-validation.client';
export type { AccountValidationResult } from './clients/account-validation.client';

export { BicDirectoryClient } from './clients/bic-directory.client';
export type { BicRecord } from './clients/bic-directory.client';

// ─── Blockchain ───────────────────────────────────────────────────────────────
export { EvmProviderService } from './blockchain/evm-provider.service';
export { TronProviderService } from './blockchain/tron-provider.service';
export { CrossBorderEscrowContract } from './blockchain/cross-border-escrow.contract';

// ─── Explorer ─────────────────────────────────────────────────────────────────
export { UetrTxTrackerService } from './explorer/uetr-tx-tracker.service';

export { AuditComplianceExplorer } from './explorer/audit-compliance.explorer';
export type { AuditEvent, AuditFilter } from './explorer/audit-compliance.explorer';
