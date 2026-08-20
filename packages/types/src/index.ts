// ─── Standard API Response Wrapper ──────────────────────────────────────────

export interface PaginationMeta {
  page:       number;
  limit:      number;
  total:      number;
  totalPages: number;
  hasNext:    boolean;
  hasPrev:    boolean;
}

export interface ApiResponse<T = unknown> {
  success:    boolean;
  message:    string;
  data:       T;
  errorCode?: string;
  meta?:      Record<string, unknown>;
}

export interface PaginatedResponse<T = unknown> {
  success:    boolean;
  message:    string;
  data:       T[];
  pagination: PaginationMeta;
}

// ─── JSON-RPC 2.0 (Blockchain Node) ─────────────────────────────────────────

export type JsonRpcVersion = "2.0";

export interface JsonRpcRequest {
  jsonrpc: JsonRpcVersion;
  id:      string | number | null;
  method:  string;
  params?: unknown[] | Record<string, unknown>;
}

export interface JsonRpcSuccessResponse<T = unknown> {
  jsonrpc: JsonRpcVersion;
  id:      string | number | null;
  result:  T;
}

export interface JsonRpcError {
  code:     number;
  message:  string;
  data?:    unknown;
}

export interface JsonRpcErrorResponse {
  jsonrpc: JsonRpcVersion;
  id:      string | number | null;
  error:   JsonRpcError;
}

export type JsonRpcResponse<T = unknown> = JsonRpcSuccessResponse<T> | JsonRpcErrorResponse;

/** Standard JSON-RPC error codes */
export const JSON_RPC_ERRORS = {
  PARSE_ERROR:      { code: -32700, message: "Parse error"            },
  INVALID_REQUEST:  { code: -32600, message: "Invalid Request"        },
  METHOD_NOT_FOUND: { code: -32601, message: "Method not found"       },
  INVALID_PARAMS:   { code: -32602, message: "Invalid params"         },
  INTERNAL_ERROR:   { code: -32603, message: "Internal error"         },
  // App-level server errors: -32000 to -32099
  UNAUTHORIZED:     { code: -32001, message: "Unauthorized"           },
  RATE_LIMITED:     { code: -32002, message: "Rate limit exceeded"    },
  CHAIN_ERROR:      { code: -32010, message: "Blockchain error"       },
} as const;

// ─── WebSocket Message Envelope ───────────────────────────────────────────────

export type WSMessageType =
  | "connected"
  | "ping"
  | "pong"
  | "subscribe"
  | "unsubscribe"
  | "subscribed"
  | "unsubscribed"
  | "error"
  | "ticker"
  | "orderbook"
  | "trade"
  | "notification";

/** Generic WS envelope — all messages over the wire conform to this shape */
export interface WSEnvelope<T = unknown> {
  type:     WSMessageType;
  channel?: string;          // e.g. "ticker@public", "orderbook@BTCUSDT", "user@trades"
  data?:    T;
  ts:       number;          // Unix ms
  id?:      string;          // optional client correlation id
}

/** Client → Server: subscribe request */
export interface WSSubscribeMessage {
  type:    "subscribe" | "unsubscribe";
  channel: string;           // e.g. "orderbook@BTCUSDT"
  token?:  string;           // user auth token for private channels
  id?:     string;
}

/** Server → Client: subscription ack */
export interface WSSubscribedMessage {
  type:    "subscribed" | "unsubscribed";
  channel: string;
  ts:      number;
}

/** Server → Client: error frame */
export interface WSErrorMessage {
  type:  "error";
  code:  number;
  message: string;
  ts:    number;
}

// ─── KYC / Identity ──────────────────────────────────────────────────────────

export type KYCStatus = "PENDING" | "VERIFIED" | "REJECTED" | "SUSPENDED";

export interface KYCProfile {
  userId:        string;
  walletAddress: string;
  status:        KYCStatus;
  tier:          1 | 2 | 3;
  verifiedAt?:   string;
}

// ─── AUTH DTOs ────────────────────────────────────────────────────────────────

export interface RegisterRequest {
  phone?:        string;
  email?:        string;
  password:      string;
  referralCode?: string;
}

export interface LoginRequest {
  identifier: string; // phone or email
  password:   string;
  totpCode?:  string;
}

export interface TokenPair {
  accessToken:  string;
  refreshToken: string;
  expiresIn:    number;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ForgotPasswordRequest {
  identifier: string; // phone or email
}

export interface ResetPasswordRequest {
  identifier:  string;
  otp:         string;
  newPassword: string;
}

export interface Setup2FAResponse {
  secret:      string;
  qrCodeUrl:   string;
  backupCodes: string[];
}

export interface Enable2FARequest {
  totpCode: string;
}

export interface Disable2FARequest {
  totpCode:    string;
  backupCode?: string;
}

export interface VerifyPinRequest {
  pin:    string;
  action: "transfer" | "withdraw" | "cvv" | "swap";
}

// ─── USER DTOs ───────────────────────────────────────────────────────────────

export interface UserProfile {
  userId:    string;
  fullName:  string;
  phone?:    string;
  email?:    string;
  avatar?:   string;
  bio?:      string;
  kycStatus: KYCStatus;
  kycTier:   1 | 2 | 3;
  createdAt: string;
}

export interface UpdateProfileRequest {
  fullName?: string;
  avatar?:   string;
  bio?:      string;
}

export interface KYCSubmitRequest {
  documentType:   "CCCD" | "PASSPORT" | "DRIVING_LICENSE";
  documentNumber: string;
  frontImageUrl:  string;
  backImageUrl?:  string;
  selfieImageUrl: string;
}

export interface KYCStatusResponse {
  status:           KYCStatus;
  tier:             number;
  submittedAt?:     string;
  reviewedAt?:      string;
  rejectionReason?: string;
}

export interface SessionEntry {
  sessionId:  string;
  deviceName: string;
  deviceOS:   string;
  ipAddress:  string;
  location:   string;
  lastSeen:   string;
  current:    boolean;
}

export interface RevokeSessionRequest {
  sessionId: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword:     string;
}

export interface NotificationItem {
  id:        string;
  type:      "TRANSACTION" | "SECURITY" | "SYSTEM" | "PROMO";
  title:     string;
  body:      string;
  isRead:    boolean;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface MarkNotificationsReadRequest {
  notificationIds: string[];
}

// ─── P2P Escrow Orders ───────────────────────────────────────────────────────

export type OrderStatus =
  | "OPEN"
  | "MATCHED"
  | "FIAT_CONFIRMED"
  | "TOKEN_RELEASED"
  | "CANCELLED"
  | "DISPUTED";

export type OrderSide = "BUY" | "SELL";

export interface P2POrder {
  orderId:      string;
  side:         OrderSide;
  status:       OrderStatus;
  tokenMint:    string;
  tokenAmount:  bigint;
  fiatAmount:   number;
  fiatCurrency: "VND" | "SGD" | "USD" | "AED";
  sellerWallet: string;
  buyerWallet?: string;
  escrowPda?:   string;
  createdAt:    string;
  updatedAt:    string;
}

// ─── EXCHANGE DTOs ────────────────────────────────────────────────────────────

export interface MarketInfo {
  symbol:      string;
  baseAsset:   string;
  quoteAsset:  string;
  lastPrice:   string;
  volume24h:   string;
  change24h:   string;
  high24h:     string;
  low24h:      string;
}

export interface TickerData {
  symbol:        string;
  price:         string;
  change:        string;
  changePercent: string;
  volume:        string;
  timestamp:     number;
}

export interface OrderBookLevel {
  price:  string;
  amount: string;
  total:  string;
}

export interface OrderBook {
  symbol:    string;
  bids:      OrderBookLevel[];
  asks:      OrderBookLevel[];
  timestamp: number;
}

export interface TradeRecord {
  tradeId:   string;
  symbol:    string;
  price:     string;
  amount:    string;
  side:      "buy" | "sell";
  timestamp: number;
}

export type OrderType = "LIMIT" | "MARKET" | "STOP_LIMIT";

export interface PlaceOrderRequest {
  symbol:     string;
  side:       OrderSide;
  type:       OrderType;
  amount:     string;
  price?:     string;
  stopPrice?: string;
}

export interface OrderRecord {
  orderId:       string;
  symbol:        string;
  side:          OrderSide;
  type:          OrderType;
  status:        "OPEN" | "FILLED" | "PARTIAL" | "CANCELLED";
  amount:        string;
  filledAmount:  string;
  price?:        string;
  avgFillPrice?: string;
  createdAt:     string;
  updatedAt:     string;
}

export interface SwapQuoteRequest {
  fromToken: string;
  toToken:   string;
  amount:    string;
}

export interface SwapQuoteResponse {
  quoteId:     string;
  fromToken:   string;
  toToken:     string;
  fromAmount:  string;
  toAmount:    string;
  rate:        string;
  priceImpact: string;
  fee:         string;
  expiresAt:   number;
}

export interface SwapExecuteRequest {
  quoteId:            string;
  pin:                string;
  slippageTolerance?: string;
}

// ─── FINANCE DTOs ─────────────────────────────────────────────────────────────

export type WalletNetwork = "TRC20" | "ERC20" | "BEP20" | "SOL" | "VND";

export interface WalletBalance {
  asset:         string;
  network:       WalletNetwork;
  available:     string;
  locked:        string;
  usdEquivalent: string;
}

export interface CryptoDepositAddressRequest {
  asset:   string;
  network: WalletNetwork;
}

export interface CryptoDepositAddressResponse {
  address: string;
  asset:   string;
  network: WalletNetwork;
  memo?:   string;
  qrCode?: string;
}

export interface FiatDepositRequest {
  amount:       number;
  bankCode?:    string;
  description?: string;
}

export interface FiatDepositResponse {
  orderId:        string;
  vietQrContent:  string;
  bankAccount:    string;
  bankName:       string;
  amount:         number;
  description:    string;
  expiresAt:      string;
}

export interface WithdrawCryptoRequest {
  asset:      string;
  network:    WalletNetwork;
  toAddress:  string;
  amount:     string;
  memo?:      string;
  pin:        string;
  totpCode?:  string;
}

export interface WithdrawFiatRequest {
  amount:        number;
  bankCode:      string;
  accountNumber: string;
  accountName:   string;
  description?:  string;
  pin:           string;
  totpCode?:     string;
}

export interface P2PTransferRequest {
  toIdentifier:   string; // phone or userId
  amount:         number;
  note?:          string;
  pin:            string;
  idempotencyKey: string;
}

export interface SwiftTransferRequest {
  beneficiaryName:    string;
  beneficiaryAccount: string;
  beneficiaryBank:    string;
  swiftCode:          string;
  countryCode:        string;
  currency:           string;
  amount:             number;
  purpose:            string;
  feeType:            "SHA" | "OUR" | "BEN";
  pin:                string;
  totpCode?:          string;
}

export type TransactionType   = "DEPOSIT" | "WITHDRAW" | "TRANSFER" | "SWAP" | "CASHBACK" | "STAKING";
export type TransactionStatus = "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED";

export interface TransactionRecord {
  txId:         string;
  type:         TransactionType;
  status:       TransactionStatus;
  asset:        string;
  amount:       string;
  fee:          string;
  description:  string;
  fromAddress?: string;
  toAddress?:   string;
  txHash?:      string;
  createdAt:    string;
  updatedAt:    string;
}

// ─── Fiat Receipts ────────────────────────────────────────────────────────────

export interface FiatReceipt {
  receiptId:          string;
  orderId:            string;
  bankTransactionRef: string;
  amount:             number;
  currency:           string;
  confirmedAt:        string;
}

// ─── ADMIN DTOs ───────────────────────────────────────────────────────────────

export type AccountStatus = "ACTIVE" | "LOCKED" | "SUSPENDED";

export interface AdminUserRecord {
  userId:        string;
  fullName:      string;
  phone?:        string;
  email?:        string;
  kycStatus:     KYCStatus;
  kycTier:       number;
  accountStatus: AccountStatus;
  createdAt:     string;
  lastLoginAt?:  string;
  totalVolume?:  string;
}

export interface UpdateUserStatusRequest {
  status:  AccountStatus;
  reason?: string;
}

export interface KYCReviewRequest {
  userId:       string;
  action:       "APPROVE" | "REJECT";
  reason?:      string;
  tierToGrant?: 1 | 2 | 3;
}

export interface PendingWithdrawal {
  withdrawId: string;
  userId:     string;
  userName:   string;
  asset:      string;
  amount:     string;
  network?:   WalletNetwork;
  bankCode?:  string;
  createdAt:  string;
  riskScore?: number;
}

export interface ApproveWithdrawalRequest {
  withdrawId: string;
  action:     "APPROVE" | "REJECT";
  reason?:    string;
}

export interface SystemMetrics {
  dailyVolume:        string;
  dailyTransactions:  number;
  totalUsers:         number;
  activeUsers24h:     number;
  pendingKYC:         number;
  pendingWithdrawals: number;
  revenue24h:         string;
}

// ─── EXTENSIONS DTOs ──────────────────────────────────────────────────────────

export interface BotTradingConfig {
  botId:     string;
  type:      "GRID" | "DCA";
  symbol:    string;
  status:    "RUNNING" | "PAUSED" | "STOPPED";
  profit:    string;
  createdAt: string;
}

export interface StartBotRequest {
  type:            "GRID" | "DCA";
  symbol:          string;
  upperPrice?:     string;
  lowerPrice?:     string;
  gridCount?:      number;
  dcaAmount?:      string;
  dcaInterval?:    "1h" | "4h" | "1d" | "1w";
  totalInvestment: string;
}

export interface StakingPool {
  poolId:          string;
  asset:           string;
  type:            "FLEXIBLE" | "FIXED";
  apr:             string;
  minStake:        string;
  maxStake?:       string;
  lockPeriodDays?: number;
  totalStaked:     string;
  status:          "ACTIVE" | "FULL" | "CLOSED";
}

export interface StakingSubscribeRequest {
  poolId: string;
  amount: string;
  pin:    string;
}

export interface AISignal {
  signalId:    string;
  symbol:      string;
  direction:   "LONG" | "SHORT" | "NEUTRAL";
  confidence:  number;
  entryPrice:  string;
  targetPrice: string;
  stopLoss:    string;
  timeframe:   string;
  reasoning:   string;
  createdAt:   string;
}

// ─── LEARN CMS DTOs ───────────────────────────────────────────────────────────

export interface Course {
  courseId:        string;
  title:           string;
  description:     string;
  level:           "BEGINNER" | "INTERMEDIATE" | "PRO";
  category:        string;
  lessonCount:     number;
  durationMinutes: number;
  thumbnailUrl?:   string;
  published:       boolean;
  createdAt:       string;
}

export interface Lesson {
  lessonId:        string;
  courseId:        string;
  title:           string;
  contentType:     "VIDEO" | "ARTICLE";
  videoUrl?:       string;
  contentHtml?:    string;
  durationMinutes?: number;
  order:           number;
}

export interface LessonProgressRequest {
  lessonId:        string;
  courseId:        string;
  completed:       boolean;
  watchedSeconds?: number;
}

export interface LessonProgressResponse {
  courseId:          string;
  completedLessons:  number;
  totalLessons:      number;
  percentComplete:   number;
  certificateUrl?:   string;
}

// ─── REFERRAL / MLM DTOs ─────────────────────────────────────────────────────

export interface ReferralInfo {
  referralCode:   string;
  referralLink:   string;
  tier:           "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";
  totalReferrals: number;
  totalEarned:    string;
}

export interface ReferralNode {
  userId:    string;
  name:      string;
  level:     1 | 2 | 3;
  joinedAt:  string;
  volume:    string;
  commission: string;
}

export interface CommissionRecord {
  commissionId: string;
  fromUserId:   string;
  fromUserName: string;
  level:        1 | 2 | 3;
  amount:       string;
  asset:        string;
  source:       "TRADE" | "SWAP" | "DEPOSIT";
  createdAt:    string;
}

export interface ClaimCommissionRequest {
  amount?: string; // leave empty to claim all
}

// ─── WEBHOOKS DTOs ────────────────────────────────────────────────────────────

export interface CryptoDepositWebhook {
  txHash:        string;
  blockNumber:   number;
  toAddress:     string;
  asset:         string;
  network:       WalletNetwork;
  amount:        string;
  confirmations: number;
  status:        "PENDING" | "CONFIRMED";
  timestamp:     number;
}

export interface VietQRWebhook {
  transactionId:   string;
  bankCode:        string;
  accountNumber:   string;
  amount:          number;
  description:     string;
  transactionDate: string;
  hmacSignature?:  string;
}

export interface P2PEscrowWebhook {
  orderId:   string;
  event:     "LOCKED" | "RELEASED" | "CANCELLED";
  escrowPda: string;
  txHash:    string;
  timestamp: number;
}

// ─── COMPLIANCE DTOs ─────────────────────────────────────────────────────────

export interface NQ05ReportRequest {
  startDate: string; // ISO 8601
  endDate:   string;
  format:    "JSON" | "CSV" | "XML";
}

export interface NQ05ReportResponse {
  reportId:          string;
  period:            string;
  totalTransactions: number;
  totalVolume:       string;
  fileUrl:           string;
  generatedAt:       string;
}

export interface AuditLogEntry {
  logId:     string;
  userId?:   string;
  action:    string;
  resource:  string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  changes?:  Record<string, unknown>;
}

export interface AMLVerifyRequest {
  transactionId:        string;
  userId:               string;
  amount:               string;
  asset:                string;
  direction:            "IN" | "OUT";
  counterpartyAddress?: string;
}

export interface AMLVerifyResponse {
  transactionId: string;
  riskScore:     number;
  riskLevel:     "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  flags:         string[];
  requiresReview: boolean;
}

// ─── Merchant / Payment Gateway ──────────────────────────────────────────────

export interface MerchantCreateOrderRequest {
  merchantId:  string;
  amount:      number;
  currency:    string;
  description: string;
  callbackUrl: string;
  metadata?:   Record<string, unknown>;
}

export interface MerchantOrderResponse {
  orderId:    string;
  status:     "PENDING" | "PAID" | "EXPIRED" | "FAILED";
  paymentUrl: string;
  expiresAt:  string;
}

// ─── Treasury / Subgraph ─────────────────────────────────────────────────────

export interface ReserveSnapshot {
  timestamp:             string;
  totalReserveUsd:       number;
  axvnCirculatingSupply: bigint;
  backingRatio:          number;
}

export interface SubgraphSwapEvent {
  txHash:      string;
  blockNumber: number;
  tokenIn:     string;
  tokenOut:    string;
  amountIn:    bigint;
  amountOut:   bigint;
  trader:      string;
}

// ─── WEBSOCKET Event Types ────────────────────────────────────────────────────

export interface WSTicker {
  channel:   "ticker@public";
  symbol:    string;
  price:     string;
  change:    string;
  volume:    string;
  timestamp: number;
}

export interface WSOrderBook {
  channel:   `orderbook@${string}`;
  symbol:    string;
  bids:      [string, string][]; // [price, amount]
  asks:      [string, string][];
  timestamp: number;
}

export interface WSUserTrade {
  channel:   "user@trades";
  userId:    string;
  tradeId:   string;
  symbol:    string;
  side:      OrderSide;
  amount:    string;
  price:     string;
  timestamp: number;
}

export interface WSNotification {
  channel:   "notifications@user";
  userId:    string;
  type:      NotificationItem["type"];
  title:     string;
  body:      string;
  metadata?: Record<string, unknown>;
}
