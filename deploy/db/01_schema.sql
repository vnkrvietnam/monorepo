-- =============================================================================
-- VNKR TECH HOLDING — Master Database Schema
-- PostgreSQL 16
-- =============================================================================
-- Schemas:
--   public        — shared infra (extensions, audit)
--   identity      — KYC / user identity / VNeID
--   payments      — P2P orders, fiat receipts, merchant orders
--   treasury      — reserve snapshots, swap events, TVL
--   otc           — OTC quotes, institutional counterparties
--   sandbox       — SupTech tier data, circuit breaker log, alerts
--   swift         — SWIFT MT/MX messages, bridge relay log
--   notifications — email, push, webhook delivery log
-- =============================================================================

-- ── Extensions ────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";      -- full-text search on addresses

-- ── Schemas ───────────────────────────────────────────────────────────────────
CREATE SCHEMA IF NOT EXISTS identity;
CREATE SCHEMA IF NOT EXISTS payments;
CREATE SCHEMA IF NOT EXISTS treasury;
CREATE SCHEMA IF NOT EXISTS otc;
CREATE SCHEMA IF NOT EXISTS sandbox;
CREATE SCHEMA IF NOT EXISTS swift;
CREATE SCHEMA IF NOT EXISTS notifications;

-- =============================================================================
-- SCHEMA: identity
-- =============================================================================

-- Users master table
CREATE TABLE identity.users (
    id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    email               TEXT        UNIQUE,
    phone               TEXT        UNIQUE,
    password_hash       TEXT,                    -- bcrypt, nullable for wallet-only
    full_name           TEXT,
    date_of_birth       DATE,
    nationality         CHAR(2),                 -- ISO 3166-1 alpha-2
    -- Wallet addresses
    solana_wallet       TEXT        UNIQUE,
    evm_wallet          TEXT        UNIQUE,
    tron_wallet         TEXT        UNIQUE,
    -- Status
    is_active           BOOLEAN     NOT NULL DEFAULT TRUE,
    is_suspended        BOOLEAN     NOT NULL DEFAULT FALSE,
    suspension_reason   TEXT,
    -- Timestamps
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_login_at       TIMESTAMPTZ
);

CREATE INDEX idx_users_email      ON identity.users (email);
CREATE INDEX idx_users_evm_wallet ON identity.users USING gin (evm_wallet gin_trgm_ops);
CREATE INDEX idx_users_sol_wallet ON identity.users USING gin (solana_wallet gin_trgm_ops);

-- KYC profiles — maps 1:1 to @vnkr/types KYCProfile
CREATE TABLE identity.kyc_profiles (
    id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID        NOT NULL REFERENCES identity.users(id) ON DELETE CASCADE,
    wallet_address      TEXT        NOT NULL,
    status              TEXT        NOT NULL DEFAULT 'PENDING'
                                    CHECK (status IN ('PENDING','VERIFIED','REJECTED','SUSPENDED')),
    tier                SMALLINT    NOT NULL DEFAULT 1
                                    CHECK (tier IN (1, 2, 3)),
    -- VNeID integration
    vneid_national_id   TEXT        UNIQUE,      -- masked on read
    vneid_level         SMALLINT    CHECK (vneid_level IN (1, 2)),
    vneid_verified_at   TIMESTAMPTZ,
    -- ZKP attestation
    zkp_proof_hash      TEXT,                    -- keccak256 of ZKP proof
    zkp_attestation_at  TIMESTAMPTZ,
    -- Review
    reviewed_by         UUID        REFERENCES identity.users(id),
    reviewed_at         TIMESTAMPTZ,
    rejection_reason    TEXT,
    -- Timestamps
    verified_at         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_kyc_user_id ON identity.kyc_profiles (user_id);
CREATE INDEX idx_kyc_status        ON identity.kyc_profiles (status);
CREATE INDEX idx_kyc_wallet        ON identity.kyc_profiles USING gin (wallet_address gin_trgm_ops);

-- API keys — for merchant and developer access
CREATE TABLE identity.api_keys (
    id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID        NOT NULL REFERENCES identity.users(id) ON DELETE CASCADE,
    name                TEXT        NOT NULL,
    key_hash            TEXT        NOT NULL UNIQUE,  -- SHA-256 of raw key
    key_prefix          TEXT        NOT NULL,          -- first 12 chars for display
    permissions         TEXT[]      NOT NULL DEFAULT '{}',  -- ['read','write','webhook']
    is_active           BOOLEAN     NOT NULL DEFAULT TRUE,
    last_used_at        TIMESTAMPTZ,
    expires_at          TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    revoked_at          TIMESTAMPTZ,
    revoked_reason      TEXT
);

CREATE INDEX idx_api_keys_user   ON identity.api_keys (user_id);
CREATE INDEX idx_api_keys_active ON identity.api_keys (user_id, is_active);

-- Sessions
CREATE TABLE identity.sessions (
    id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID        NOT NULL REFERENCES identity.users(id) ON DELETE CASCADE,
    token_hash          TEXT        NOT NULL UNIQUE,
    device_info         JSONB,
    ip_address          INET,
    user_agent          TEXT,
    is_valid            BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at          TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '30 days',
    invalidated_at      TIMESTAMPTZ
);

CREATE INDEX idx_sessions_user ON identity.sessions (user_id, is_valid);

-- =============================================================================
-- SCHEMA: payments
-- =============================================================================

-- P2P Escrow Orders — maps to @vnkr/types P2POrder
CREATE TABLE payments.p2p_orders (
    order_id            TEXT        PRIMARY KEY,   -- "ORD-{nanoid}"
    side                TEXT        NOT NULL CHECK (side IN ('BUY','SELL')),
    status              TEXT        NOT NULL DEFAULT 'OPEN'
                                    CHECK (status IN (
                                        'OPEN','MATCHED','FIAT_CONFIRMED',
                                        'TOKEN_RELEASED','CANCELLED','DISPUTED'
                                    )),
    token_mint          TEXT        NOT NULL,      -- Solana SPL mint address
    token_amount        NUMERIC(36,0) NOT NULL,    -- in lamports/smallest unit
    fiat_amount         NUMERIC(18,2) NOT NULL,
    fiat_currency       TEXT        NOT NULL DEFAULT 'VND'
                                    CHECK (fiat_currency IN ('VND','SGD','USD','AED')),
    seller_wallet       TEXT        NOT NULL,
    buyer_wallet        TEXT,
    escrow_pda          TEXT,                      -- Solana PDA address
    -- Payment method
    payment_method      TEXT,                      -- 'Vietcombank', 'MB Bank', etc.
    payment_ref         TEXT,                      -- bank transaction ref
    -- Dispute
    dispute_reason      TEXT,
    dispute_resolved_at TIMESTAMPTZ,
    -- Timestamps
    matched_at          TIMESTAMPTZ,
    fiat_confirmed_at   TIMESTAMPTZ,
    token_released_at   TIMESTAMPTZ,
    cancelled_at        TIMESTAMPTZ,
    cancel_reason       TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_p2p_status         ON payments.p2p_orders (status);
CREATE INDEX idx_p2p_seller         ON payments.p2p_orders (seller_wallet);
CREATE INDEX idx_p2p_buyer          ON payments.p2p_orders (buyer_wallet);
CREATE INDEX idx_p2p_created        ON payments.p2p_orders (created_at DESC);
CREATE INDEX idx_p2p_token          ON payments.p2p_orders (token_mint, status);

-- Fiat Receipts — maps to @vnkr/types FiatReceipt
CREATE TABLE payments.fiat_receipts (
    receipt_id          TEXT        PRIMARY KEY,   -- bank-provided
    order_id            TEXT        NOT NULL REFERENCES payments.p2p_orders(order_id),
    bank_transaction_ref TEXT       NOT NULL UNIQUE,
    amount              NUMERIC(18,2) NOT NULL,
    currency            TEXT        NOT NULL DEFAULT 'VND',
    bank_code           TEXT,                      -- 'VCB', 'TCB', 'MB', etc.
    sender_account      TEXT,
    sender_name         TEXT,
    -- HMAC verification
    hmac_signature      TEXT,
    hmac_verified       BOOLEAN     NOT NULL DEFAULT FALSE,
    -- Processing
    processed_at        TIMESTAMPTZ,
    processing_error    TEXT,
    confirmed_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_fiat_receipt_order ON payments.fiat_receipts (order_id);
CREATE INDEX idx_fiat_receipt_ref   ON payments.fiat_receipts (bank_transaction_ref);

-- Merchant registry
CREATE TABLE payments.merchants (
    id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID        NOT NULL REFERENCES identity.users(id),
    business_name       TEXT        NOT NULL,
    business_type       TEXT,                      -- 'ECOMMERCE','F&B','SERVICE',etc.
    website_url         TEXT,
    callback_url        TEXT,
    webhook_url         TEXT,
    webhook_secret_hash TEXT,
    tier                TEXT        NOT NULL DEFAULT 'STARTER'
                                    CHECK (tier IN ('STARTER','GROWTH','PRO','ENTERPRISE')),
    monthly_volume_vnd  NUMERIC(18,2) DEFAULT 0,
    is_verified         BOOLEAN     NOT NULL DEFAULT FALSE,
    is_active           BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_merchant_user ON payments.merchants (user_id);

-- Merchant payment orders — maps to @vnkr/types MerchantOrderResponse
CREATE TABLE payments.merchant_orders (
    order_id            TEXT        PRIMARY KEY,   -- "PAY-{nanoid}"
    merchant_id         UUID        NOT NULL REFERENCES payments.merchants(id),
    amount              NUMERIC(18,2) NOT NULL,
    currency            TEXT        NOT NULL DEFAULT 'VND',
    description         TEXT,
    metadata            JSONB,
    status              TEXT        NOT NULL DEFAULT 'PENDING'
                                    CHECK (status IN ('PENDING','PAID','EXPIRED','FAILED','REFUNDED')),
    payment_url         TEXT        NOT NULL,
    -- Payment details
    payment_method      TEXT,
    payment_reference   TEXT,
    paid_at             TIMESTAMPTZ,
    -- Callbacks
    callback_url        TEXT,
    callback_sent_at    TIMESTAMPTZ,
    callback_status     SMALLINT,   -- HTTP status code of callback
    -- Expiry
    expires_at          TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '30 minutes',
    failed_reason       TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_merchant_orders_merchant ON payments.merchant_orders (merchant_id, status);
CREATE INDEX idx_merchant_orders_status   ON payments.merchant_orders (status, expires_at);
CREATE INDEX idx_merchant_orders_created  ON payments.merchant_orders (created_at DESC);

-- Cashback rules & ledger
CREATE TABLE payments.cashback_rules (
    id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id         UUID        REFERENCES payments.merchants(id),
    category            TEXT,                      -- 'F&B','SHOPPING','TRANSPORT'
    rate_bps            SMALLINT    NOT NULL DEFAULT 100,  -- 100 = 1%
    max_amount_vnd      NUMERIC(18,2),
    valid_from          TIMESTAMPTZ NOT NULL DEFAULT now(),
    valid_until         TIMESTAMPTZ,
    is_active           BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE payments.cashback_ledger (
    id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID        NOT NULL REFERENCES identity.users(id),
    order_id            TEXT,
    merchant_id         UUID        REFERENCES payments.merchants(id),
    amount_vnd          NUMERIC(18,2) NOT NULL,
    rate_bps            SMALLINT,
    status              TEXT        NOT NULL DEFAULT 'PENDING'
                                    CHECK (status IN ('PENDING','CREDITED','REVERSED')),
    credited_at         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_cashback_user    ON payments.cashback_ledger (user_id, status);
CREATE INDEX idx_cashback_created ON payments.cashback_ledger (created_at DESC);

-- =============================================================================
-- SCHEMA: treasury
-- =============================================================================

-- Reserve snapshots — maps to @vnkr/types ReserveSnapshot
CREATE TABLE treasury.reserve_snapshots (
    id                       BIGSERIAL   PRIMARY KEY,
    block_number             BIGINT,
    tx_hash                  TEXT,
    total_reserve_usd        NUMERIC(24,6) NOT NULL,
    axvn_circulating_supply  NUMERIC(36,0) NOT NULL,
    backing_ratio            NUMERIC(10,6) NOT NULL,  -- e.g. 1.05 = 105%
    source                   TEXT        NOT NULL DEFAULT 'on-chain'
                                         CHECK (source IN ('on-chain','manual','snapshot')),
    snapshot_ts              TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reserve_ts ON treasury.reserve_snapshots (snapshot_ts DESC);

-- Swap events — maps to @vnkr/types SubgraphSwapEvent
CREATE TABLE treasury.swap_events (
    id                  BIGSERIAL   PRIMARY KEY,
    tx_hash             TEXT        NOT NULL UNIQUE,
    block_number        BIGINT      NOT NULL,
    log_index           INT,
    token_in            TEXT        NOT NULL,
    token_out           TEXT        NOT NULL,
    amount_in           NUMERIC(36,0) NOT NULL,
    amount_out          NUMERIC(36,0) NOT NULL,
    trader              TEXT        NOT NULL,
    pool_address        TEXT,
    price_impact_bps    INT,
    fee_bps             INT,
    chain               TEXT        NOT NULL DEFAULT 'solana'
                                    CHECK (chain IN ('solana','evm','tron')),
    block_timestamp     TIMESTAMPTZ,
    indexed_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_swap_tx        ON treasury.swap_events (tx_hash);
CREATE INDEX idx_swap_trader    ON treasury.swap_events USING gin (trader gin_trgm_ops);
CREATE INDEX idx_swap_block     ON treasury.swap_events (block_number DESC);
CREATE INDEX idx_swap_tokens    ON treasury.swap_events (token_in, token_out);
CREATE INDEX idx_swap_indexed   ON treasury.swap_events (indexed_at DESC);

-- TVL history (daily aggregated)
CREATE TABLE treasury.tvl_snapshots (
    id                  BIGSERIAL   PRIMARY KEY,
    date                DATE        NOT NULL UNIQUE,
    tvl_vnd             NUMERIC(24,2) NOT NULL,
    tvl_usd             NUMERIC(24,6) NOT NULL,
    active_users        INT,
    tx_count            INT,
    volume_vnd          NUMERIC(24,2),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tvl_date ON treasury.tvl_snapshots (date DESC);

-- =============================================================================
-- SCHEMA: otc
-- =============================================================================

-- Institutional counterparties (VARA-licensed LPs)
CREATE TABLE otc.counterparties (
    id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                TEXT        NOT NULL,
    bic_code            TEXT,                      -- SWIFT BIC
    jurisdiction        TEXT,                      -- 'UAE','SG','VN','HK'
    license_number      TEXT,
    license_type        TEXT,                      -- 'VARA','MAS','SFC'
    api_endpoint        TEXT,
    api_key_hash        TEXT,
    is_active           BOOLEAN     NOT NULL DEFAULT TRUE,
    max_quote_size_usd  NUMERIC(18,2),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- OTC Quotes
CREATE TABLE otc.quotes (
    id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_id            TEXT        NOT NULL UNIQUE,  -- "OTC-{timestamp}"
    counterparty_id     UUID        REFERENCES otc.counterparties(id),
    token_in            TEXT        NOT NULL,
    token_out           TEXT        NOT NULL,
    amount_in           NUMERIC(36,0) NOT NULL,
    amount_out          NUMERIC(36,0),
    price               NUMERIC(18,8),
    fee_bps             INT         DEFAULT 30,
    status              TEXT        NOT NULL DEFAULT 'PENDING'
                                    CHECK (status IN ('PENDING','ACCEPTED','REJECTED','EXPIRED','SETTLED')),
    requester_wallet    TEXT,
    settlement_tx_hash  TEXT,
    expires_at          TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '30 seconds',
    accepted_at         TIMESTAMPTZ,
    settled_at          TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_otc_quote_id  ON otc.quotes (quote_id);
CREATE INDEX idx_otc_status    ON otc.quotes (status, expires_at);
CREATE INDEX idx_otc_created   ON otc.quotes (created_at DESC);

-- =============================================================================
-- SCHEMA: sandbox
-- =============================================================================

-- Sandbox participants
CREATE TABLE sandbox.participants (
    id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name        TEXT        NOT NULL,
    sandbox_id          TEXT        UNIQUE NOT NULL,  -- "SBX-{6chars}"
    contact_email       TEXT        NOT NULL,
    current_tier        SMALLINT    NOT NULL DEFAULT 1 CHECK (current_tier BETWEEN 1 AND 4),
    status              TEXT        NOT NULL DEFAULT 'ALPHA'
                                    CHECK (status IN ('ALPHA','ACTIVE','SUSPENDED','GRADUATED','REVOKED')),
    -- KYC compliance
    kyc_compliance_rate NUMERIC(5,2) DEFAULT 100.00,
    dispute_rate        NUMERIC(8,5) DEFAULT 0.00000,
    uptime_pct          NUMERIC(7,4) DEFAULT 100.0000,
    -- TVL tracking
    tvl_current_vnd     NUMERIC(24,2) DEFAULT 0,
    tvl_cap_vnd         NUMERIC(24,2) NOT NULL DEFAULT 1000000000,  -- 1B VND Tier 1
    -- Audit
    audit_notes         TEXT,
    approved_by         TEXT,
    approved_at         TIMESTAMPTZ,
    graduated_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sandbox_status ON sandbox.participants (status, current_tier);

-- Circuit breaker event log
CREATE TABLE sandbox.circuit_breaker_events (
    id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_id      UUID        REFERENCES sandbox.participants(id),
    action              TEXT        NOT NULL CHECK (action IN ('PAUSE','UNPAUSE')),
    triggered_by        TEXT        NOT NULL,  -- regulator user id or 'SYSTEM_AUTO'
    trigger_role        TEXT        NOT NULL DEFAULT 'REGULATOR',
    reason              TEXT        NOT NULL,
    tx_hash             TEXT,                  -- on-chain emergencyRegulatorPause() tx
    -- Duration (filled when unpaused)
    paused_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    unpaused_at         TIMESTAMPTZ,
    duration_seconds    INT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_cb_events_part    ON sandbox.circuit_breaker_events (participant_id, created_at DESC);
CREATE INDEX idx_cb_events_created ON sandbox.circuit_breaker_events (created_at DESC);

-- SupTech alerts
CREATE TABLE sandbox.alerts (
    id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_id      UUID        REFERENCES sandbox.participants(id),
    alert_type          TEXT        NOT NULL,  -- 'VOLUME_SPIKE','BLACKLIST','FAILED_TX','RESERVE_DROP'
    severity            TEXT        NOT NULL CHECK (severity IN ('CRITICAL','WARNING','INFO')),
    description         TEXT        NOT NULL,
    wallet_address      TEXT,
    metric_value        NUMERIC,
    metric_threshold    NUMERIC,
    status              TEXT        NOT NULL DEFAULT 'OPEN'
                                    CHECK (status IN ('OPEN','INVESTIGATING','RESOLVED')),
    resolved_by         TEXT,
    resolved_at         TIMESTAMPTZ,
    resolution_note     TEXT,
    auto_generated      BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_alerts_severity   ON sandbox.alerts (severity, status);
CREATE INDEX idx_alerts_created    ON sandbox.alerts (created_at DESC);
CREATE INDEX idx_alerts_part       ON sandbox.alerts (participant_id, status);

-- SupTech telemetry log (real-time metrics)
CREATE TABLE sandbox.telemetry (
    id                  BIGSERIAL   PRIMARY KEY,
    participant_id      UUID        NOT NULL REFERENCES sandbox.participants(id),
    metric              TEXT        NOT NULL,   -- 'tx_count','volume_vnd','failed_rate','tvl_vnd'
    value               NUMERIC     NOT NULL,
    window_minutes      INT         NOT NULL DEFAULT 60,
    recorded_at         TIMESTAMPTZ NOT NULL DEFAULT now()
) PARTITION BY RANGE (recorded_at);

-- Monthly partitions for telemetry
CREATE TABLE sandbox.telemetry_2025_06 PARTITION OF sandbox.telemetry
    FOR VALUES FROM ('2025-06-01') TO ('2025-07-01');
CREATE TABLE sandbox.telemetry_2025_07 PARTITION OF sandbox.telemetry
    FOR VALUES FROM ('2025-07-01') TO ('2025-08-01');
CREATE TABLE sandbox.telemetry_2025_08 PARTITION OF sandbox.telemetry
    FOR VALUES FROM ('2025-08-01') TO ('2025-09-01');
CREATE TABLE sandbox.telemetry_2025_09 PARTITION OF sandbox.telemetry
    FOR VALUES FROM ('2025-09-01') TO ('2025-10-01');
CREATE TABLE sandbox.telemetry_2025_10 PARTITION OF sandbox.telemetry
    FOR VALUES FROM ('2025-10-01') TO ('2025-11-01');
CREATE TABLE sandbox.telemetry_2025_11 PARTITION OF sandbox.telemetry
    FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');
CREATE TABLE sandbox.telemetry_2025_12 PARTITION OF sandbox.telemetry
    FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');
CREATE TABLE sandbox.telemetry_2026_01 PARTITION OF sandbox.telemetry
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

CREATE INDEX idx_telemetry_part_metric ON sandbox.telemetry (participant_id, metric, recorded_at DESC);

-- =============================================================================
-- SCHEMA: swift
-- =============================================================================

-- SWIFT message log (MT/MX)
CREATE TABLE swift.messages (
    id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    uetr                TEXT        UNIQUE,            -- ISO 20022 UETR
    message_type        TEXT        NOT NULL,          -- 'MT103','MT202','pacs.008'
    direction           TEXT        NOT NULL CHECK (direction IN ('INBOUND','OUTBOUND')),
    sender_bic          TEXT        NOT NULL,
    receiver_bic        TEXT        NOT NULL,
    -- Amount
    currency            TEXT,
    amount              NUMERIC(18,2),
    value_date          DATE,
    -- Content
    raw_payload         TEXT,                          -- encrypted at rest
    parsed_fields       JSONB,
    -- Status
    status              TEXT        NOT NULL DEFAULT 'RECEIVED'
                                    CHECK (status IN (
                                        'RECEIVED','VALIDATED','PROCESSING',
                                        'SETTLED','FAILED','RETURNED'
                                    )),
    failure_reason      TEXT,
    -- Correlation
    related_order_id    TEXT,
    on_chain_tx_hash    TEXT,
    settlement_block    BIGINT,
    -- Timestamps
    sent_at             TIMESTAMPTZ,
    received_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    settled_at          TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_swift_uetr      ON swift.messages (uetr);
CREATE INDEX idx_swift_status    ON swift.messages (status, direction);
CREATE INDEX idx_swift_bic       ON swift.messages (sender_bic, receiver_bic);
CREATE INDEX idx_swift_received  ON swift.messages (received_at DESC);

-- Bridge relay log (SWIFT ↔ on-chain)
CREATE TABLE swift.bridge_relay_log (
    id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    swift_message_id    UUID        REFERENCES swift.messages(id),
    direction           TEXT        NOT NULL CHECK (direction IN ('SWIFT_TO_CHAIN','CHAIN_TO_SWIFT')),
    -- On-chain details
    chain               TEXT        NOT NULL DEFAULT 'evm' CHECK (chain IN ('evm','solana')),
    contract_address    TEXT,
    tx_hash             TEXT,
    block_number        BIGINT,
    gas_used            BIGINT,
    -- FX oracle
    fx_rate_vnd         NUMERIC(18,6),                -- 1 USD = X VND
    fx_source           TEXT,                          -- 'SBV','VCB','MANUAL'
    fee_bps             INT         DEFAULT 10,
    fee_vnkr            NUMERIC(36,0),
    -- Status
    status              TEXT        NOT NULL DEFAULT 'PENDING'
                                    CHECK (status IN ('PENDING','SUBMITTED','CONFIRMED','FAILED','REVERTED')),
    error_message       TEXT,
    retry_count         INT         NOT NULL DEFAULT 0,
    -- Timestamps
    submitted_at        TIMESTAMPTZ,
    confirmed_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bridge_tx     ON swift.bridge_relay_log (tx_hash);
CREATE INDEX idx_bridge_status ON swift.bridge_relay_log (status, created_at DESC);

-- =============================================================================
-- SCHEMA: notifications
-- =============================================================================

CREATE TABLE notifications.delivery_log (
    id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID        REFERENCES identity.users(id),
    channel             TEXT        NOT NULL CHECK (channel IN ('email','push','sms','webhook','telegram')),
    event_type          TEXT        NOT NULL,   -- 'p2p_matched','kyc_verified','payment_received'
    recipient           TEXT        NOT NULL,   -- email/phone/webhook_url
    subject             TEXT,
    body_preview        TEXT,
    status              TEXT        NOT NULL DEFAULT 'PENDING'
                                    CHECK (status IN ('PENDING','SENT','FAILED','BOUNCED')),
    http_status         INT,
    error_message       TEXT,
    retry_count         INT         NOT NULL DEFAULT 0,
    sent_at             TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notif_user    ON notifications.delivery_log (user_id, created_at DESC);
CREATE INDEX idx_notif_status  ON notifications.delivery_log (status, channel);
CREATE INDEX idx_notif_event   ON notifications.delivery_log (event_type, created_at DESC);

-- =============================================================================
-- AUDIT LOG (shared across schemas)
-- =============================================================================

CREATE TABLE public.audit_log (
    id                  BIGSERIAL   PRIMARY KEY,
    schema_name         TEXT        NOT NULL,
    table_name          TEXT        NOT NULL,
    record_id           TEXT        NOT NULL,
    action              TEXT        NOT NULL CHECK (action IN ('INSERT','UPDATE','DELETE')),
    actor_id            UUID,
    actor_role          TEXT,
    old_data            JSONB,
    new_data            JSONB,
    changed_fields      TEXT[],
    ip_address          INET,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
) PARTITION BY RANGE (created_at);

CREATE TABLE public.audit_log_2025_h2 PARTITION OF public.audit_log
    FOR VALUES FROM ('2025-07-01') TO ('2026-01-01');
CREATE TABLE public.audit_log_2026_h1 PARTITION OF public.audit_log
    FOR VALUES FROM ('2026-01-01') TO ('2026-07-01');

CREATE INDEX idx_audit_table  ON public.audit_log (schema_name, table_name, created_at DESC);
CREATE INDEX idx_audit_actor  ON public.audit_log (actor_id, created_at DESC);
CREATE INDEX idx_audit_record ON public.audit_log (record_id, created_at DESC);

-- =============================================================================
-- AUDIT TRIGGER FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION public.fn_audit_trigger()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_old   JSONB;
    v_new   JSONB;
    v_id    TEXT;
    v_changed TEXT[];
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_old := to_jsonb(OLD);
        v_id  := OLD.id::TEXT;
        v_new := NULL;
    ELSIF TG_OP = 'INSERT' THEN
        v_new := to_jsonb(NEW);
        v_id  := NEW.id::TEXT;
        v_old := NULL;
    ELSE
        v_old := to_jsonb(OLD);
        v_new := to_jsonb(NEW);
        v_id  := NEW.id::TEXT;
        SELECT array_agg(key) INTO v_changed
        FROM jsonb_each(v_new)
        WHERE v_new->key IS DISTINCT FROM v_old->key;
    END IF;

    INSERT INTO public.audit_log (
        schema_name, table_name, record_id, action,
        old_data, new_data, changed_fields
    ) VALUES (
        TG_TABLE_SCHEMA, TG_TABLE_NAME, v_id, TG_OP,
        v_old, v_new, v_changed
    );

    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Apply audit triggers to key tables
CREATE TRIGGER trg_audit_kyc
    AFTER INSERT OR UPDATE OR DELETE ON identity.kyc_profiles
    FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

CREATE TRIGGER trg_audit_p2p
    AFTER INSERT OR UPDATE OR DELETE ON payments.p2p_orders
    FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

CREATE TRIGGER trg_audit_merchant_orders
    AFTER INSERT OR UPDATE OR DELETE ON payments.merchant_orders
    FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

CREATE TRIGGER trg_audit_swift
    AFTER INSERT OR UPDATE OR DELETE ON swift.messages
    FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

CREATE TRIGGER trg_audit_circuit_breaker
    AFTER INSERT OR UPDATE OR DELETE ON sandbox.circuit_breaker_events
    FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

-- =============================================================================
-- updated_at TRIGGER
-- =============================================================================

CREATE OR REPLACE FUNCTION public.fn_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_updated_users             BEFORE UPDATE ON identity.users             FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
CREATE TRIGGER trg_updated_kyc               BEFORE UPDATE ON identity.kyc_profiles      FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
CREATE TRIGGER trg_updated_p2p               BEFORE UPDATE ON payments.p2p_orders        FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
CREATE TRIGGER trg_updated_merchant          BEFORE UPDATE ON payments.merchants          FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
CREATE TRIGGER trg_updated_merchant_orders   BEFORE UPDATE ON payments.merchant_orders    FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
CREATE TRIGGER trg_updated_sandbox           BEFORE UPDATE ON sandbox.participants        FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
