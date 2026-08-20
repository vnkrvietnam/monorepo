/**
 * security.ts — SWIFT Security SDK types
 *
 * Converted from Java classes in swift-security-sdk-2.17.5-6:
 *   OAuthToken.java     — OAuth2 token structure
 *   OAuthSession.java   — Session lifecycle
 *   CertificateHolder.java — X.509 / PKCS#12 cert management
 *   SignHolder.java     — Digital signature helper
 *   OAuthConstants.java — Constants
 *
 * Also covers SWIFT LAU (Local Authentication Algorithm) structures
 * and gpi Tracker session types.
 */

// ─── OAuth2 / Session Types ────────────────────────────────────────────────────

/**
 * SWIFT OAuth2 access token.
 *
 * Source: OAuthToken.java (swift-security-sdk-2.17.5-6)
 */
export interface SWIFTOAuthToken {
  /** JWT access token (opaque string for SWIFT APIs) */
  access_token: string;
  /** Token type — always "Bearer" for SWIFT APIs */
  token_type: "Bearer";
  /** Seconds until expiry */
  expires_in: number;
  /** Refresh token (if issued) */
  refresh_token?: string;
  /** Space-separated scope list */
  scope?: string;
  /** ISO 8601 UTC datetime the token was issued */
  issued_at?: string;
  /** Computed expiry: issued_at + expires_in seconds */
  expires_at?: string;
}

/**
 * OAuth2 token request parameters.
 *
 * Source: OAuthSession.java — getToken(), refreshToken() methods
 */
export interface OAuthTokenRequest {
  grant_type: "client_credentials" | "refresh_token";
  client_id: string;
  client_secret?: string;
  refresh_token?: string;
  /** Space-separated scopes: "swift.preval swift.gpi.tracker" etc. */
  scope?: string;
}

/**
 * SWIFT API Gateway OAuth2 configuration.
 *
 * Source: CloudSessionImpl.java, SessionImpl.java
 */
export interface SWIFTSessionConfig {
  /** SWIFT OAuth2 token endpoint URL */
  tokenEndpointUrl: string;
  /** Client ID (application ID in SWIFT Developer Portal) */
  clientId: string;
  /** Client secret */
  clientSecret?: string;
  /** Requested OAuth scopes */
  scopes?: string[];
  /** Path to PKCS#12 certificate file (.p12 / .pfx) for mTLS */
  certFilePath?: string;
  /** Certificate passphrase */
  certPassphrase?: string;
  /** SWIFT Microgateway base URL (e.g. http://localhost:9003) */
  gatewayUrl?: string;
}

/**
 * Active SWIFT session state (post-authentication).
 */
export interface SWIFTSession {
  token: SWIFTOAuthToken;
  config: SWIFTSessionConfig;
  /** ISO 8601 datetime when the session was established */
  createdAt: string;
  /** True if the session token is still valid (not expired) */
  isValid(): boolean;
  /** Refresh the token using the refresh_token or re-authenticate */
  refresh(): Promise<SWIFTOAuthToken>;
}

// ─── Certificate & PKI Types ───────────────────────────────────────────────────

/**
 * X.509 certificate holder.
 *
 * Source: CertificateHolder.java (swift-security-sdk-2.17.5-6)
 */
export interface CertificateHolder {
  /** PEM-encoded certificate */
  certificate: string;
  /** PEM-encoded private key (if available) */
  privateKey?: string;
  /** Certificate serial number */
  serialNumber?: string;
  /** Certificate subject Distinguished Name */
  subjectDN?: string;
  /** Certificate issuer Distinguished Name */
  issuerDN?: string;
  /** ISO 8601 datetime */
  notBefore?: string;
  /** ISO 8601 datetime */
  notAfter?: string;
  /** SHA-256 fingerprint (hex) */
  fingerprint?: string;
}

/**
 * PKCS#12 keystore configuration for SWIFT mTLS and signing.
 */
export interface PKCSKeystoreConfig {
  /** Path to .p12 or .pfx file */
  keystorePath: string;
  /** Keystore password */
  keystorePassword: string;
  /** Key alias within the keystore (defaults to first entry) */
  keyAlias?: string;
  /** Key password (if different from keystore password) */
  keyPassword?: string;
}

/**
 * Digital signature result.
 *
 * Source: SignHolder.java
 */
export interface DigitalSignatureResult {
  /** Base64-encoded signature */
  signature: string;
  /** Signing algorithm: "SHA256withRSA", "SHA384withRSA", "SHA256withECDSA" etc. */
  algorithm: string;
  /** ISO 8601 datetime of signing */
  signedAt: string;
  /** Signer certificate fingerprint */
  certificateFingerprint?: string;
}

// ─── LAU (Local Authentication Algorithm) Types ───────────────────────────────

/**
 * LAU header structure added to SWIFT HTTP requests.
 *
 * Per SWIFT Alliance Access 7.x LAU v2 specification:
 * The LAU is calculated as HMAC-SHA256 over the concatenation of
 * the HTTP request body + a timestamp.
 */
export interface LAUHeader {
  /** LAU signature in uppercase hex */
  "LAUSignature": string;
  /** ISO 8601 UTC timestamp used in the LAU calculation */
  "LAUTimestamp": string;
  /** LAU version — "V2" for HMAC-SHA256 */
  "LAUVersion": "V2";
  /** HMAC algorithm — always "HMAC_SHA256" */
  "LAUAlgorithm": "HMAC_SHA256";
}

/**
 * Input for constructing a LAU-signed SWIFT HTTP request.
 */
export interface LAURequestInput {
  /** HTTP method */
  method: "POST" | "GET" | "PUT" | "PATCH" | "DELETE";
  /** Request URI path (e.g. "/v1/payments") */
  path: string;
  /** Request body string (empty string for GET) */
  body: string;
  /** LAU signing key in hex */
  lauKeyHex: string;
  /** Optional override timestamp (ISO 8601) — defaults to now */
  timestamp?: string;
}

// ─── SWIFT Constants ──────────────────────────────────────────────────────────

/**
 * SWIFT OAuth2 scope identifiers.
 *
 * Source: OAuthConstants.java
 */
export const SWIFT_OAUTH_SCOPES = {
  /** Pre-validation API */
  PRE_VALIDATION: "swift.preval",
  /** gpi Tracker — Pay and Trace */
  GPI_PAY_AND_TRACE: "swift.gpi.tracker",
  /** gpi Tracker — Inbound tracking */
  GPI_INBOUND: "swift.gpi.tracker.inquire",
  /** gpi for Corporates (g4C) */
  G4C: "swift.g4c",
  /** Transaction Screening */
  TX_SCREENING: "swift.compliance.screening",
  /** Reference Data / BIC lookup */
  REF_DATA: "swift.swift.order",
} as const;

export type SWIFTOAuthScope = typeof SWIFT_OAUTH_SCOPES[keyof typeof SWIFT_OAUTH_SCOPES];

/**
 * SWIFT Microgateway default endpoint addresses.
 */
export const SWIFT_GATEWAY_ENDPOINTS = {
  /** Local SWIFT Microgateway (dev/test) */
  LOCAL_MGW: "http://localhost:9003",
  /** SWIFT Sandbox API Gateway */
  SANDBOX: "https://sandbox.swift.com/swift-preval-pilot/v1",
  /** SWIFT Production API Gateway */
  PRODUCTION: "https://api.swiftnet.sipn.swift.com",
} as const;

// ─── RMA Types ────────────────────────────────────────────────────────────────

/**
 * Extended RMA authorization record with bilateral BIC pair.
 */
export interface RMAAuthorization {
  /** Institution BIC that granted the RMA */
  grantorBIC: string;
  /** Institution BIC authorized to send */
  granteeBIC: string;
  /** Authorized SWIFT message categories */
  authorizedCategories: string[];
  /** ISO 8601 expiry datetime */
  expiresAt: string;
  /** Whether the authorization is currently active */
  active: boolean;
  /** ISO 8601 datetime when granted */
  grantedAt?: string;
  /** Correspondence type: "MT" | "MX" */
  correspondenceType?: "MT" | "MX" | "BOTH";
}
