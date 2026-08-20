-- =============================================================================
-- VNKR — Seed Data (Dev / Staging)
-- =============================================================================
-- Chạy sau 01_schema.sql
-- Dữ liệu mẫu để dev và test local. KHÔNG chạy trên production.
-- =============================================================================

-- ── Demo users ────────────────────────────────────────────────────────────────
INSERT INTO identity.users (
    id, email, phone, full_name, date_of_birth, nationality,
    solana_wallet, evm_wallet
) VALUES
(
    '00000000-0000-0000-0000-000000000001',
    'admin@vnkr.vn', '+84901234567',
    'VNKR Admin', '1990-01-01', 'VN',
    'AdminSoLWaLLet111111111111111111111111111',
    '0xAdm1n000000000000000000000000000000001'
),
(
    '00000000-0000-0000-0000-000000000002',
    'trader1@test.vn', '+84912345678',
    'Nguyễn Văn A', '1995-06-15', 'VN',
    'TraDerSoL111111111111111111111111111111A',
    '0x1111111111111111111111111111111111111111'
),
(
    '00000000-0000-0000-0000-000000000003',
    'trader2@test.vn', '+84923456789',
    'Trần Thị B', '1998-03-22', 'VN',
    'TraDerSoL222222222222222222222222222222B',
    '0x2222222222222222222222222222222222222222'
),
(
    '00000000-0000-0000-0000-000000000004',
    'merchant@demo.vn', '+84934567890',
    'Demo Merchant JSC', '1985-09-10', 'VN',
    'MerchantSoL333333333333333333333333333333',
    '0x3333333333333333333333333333333333333333'
),
(
    '00000000-0000-0000-0000-000000000005',
    'regulator@nhnn.gov.vn', '+84945678901',
    'Ngân hàng Nhà nước', '1980-01-01', 'VN',
    NULL, NULL
)
ON CONFLICT (id) DO NOTHING;

-- ── KYC Profiles ─────────────────────────────────────────────────────────────
INSERT INTO identity.kyc_profiles (
    user_id, wallet_address, status, tier,
    vneid_level, vneid_verified_at, verified_at
) VALUES
(
    '00000000-0000-0000-0000-000000000001',
    '0xAdm1n000000000000000000000000000000001',
    'VERIFIED', 3, 2, now(), now()
),
(
    '00000000-0000-0000-0000-000000000002',
    '0x1111111111111111111111111111111111111111',
    'VERIFIED', 2, 2, now() - INTERVAL '7 days', now() - INTERVAL '7 days'
),
(
    '00000000-0000-0000-0000-000000000003',
    '0x2222222222222222222222222222222222222222',
    'PENDING', 1, NULL, NULL, NULL
),
(
    '00000000-0000-0000-0000-000000000004',
    '0x3333333333333333333333333333333333333333',
    'VERIFIED', 2, 2, now() - INTERVAL '30 days', now() - INTERVAL '30 days'
)
ON CONFLICT (user_id) DO NOTHING;

-- ── Merchant ──────────────────────────────────────────────────────────────────
INSERT INTO payments.merchants (
    id, user_id, business_name, business_type,
    website_url, callback_url, tier, is_verified, is_active
) VALUES (
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000004',
    'Demo Merchant JSC', 'ECOMMERCE',
    'https://demo-merchant.vn',
    'https://demo-merchant.vn/callback/vnkr',
    'PRO', TRUE, TRUE
)
ON CONFLICT (user_id) DO NOTHING;

-- ── Sample P2P orders ─────────────────────────────────────────────────────────
INSERT INTO payments.p2p_orders (
    order_id, side, status, token_mint, token_amount,
    fiat_amount, fiat_currency, seller_wallet, buyer_wallet,
    payment_method, created_at
) VALUES
(
    'ORD-DEMO-001', 'SELL', 'OPEN',
    'AXVNmint111111111111111111111111111111111',
    500000000000,   -- 500 AXVN (9 decimals)
    8400000, 'VND',
    '0x1111111111111111111111111111111111111111',
    NULL,
    'Vietcombank',
    now() - INTERVAL '2 hours'
),
(
    'ORD-DEMO-002', 'BUY', 'MATCHED',
    'AXVNmint111111111111111111111111111111111',
    200000000000,
    3440000, 'VND',
    '0x2222222222222222222222222222222222222222',
    '0x1111111111111111111111111111111111111111',
    'MB Bank',
    now() - INTERVAL '5 hours'
),
(
    'ORD-DEMO-003', 'SELL', 'TOKEN_RELEASED',
    'USDTmint111111111111111111111111111111111',
    100000000,      -- 100 USDT (6 decimals)
    2540000, 'VND',
    '0x3333333333333333333333333333333333333333',
    '0x2222222222222222222222222222222222222222',
    'Techcombank',
    now() - INTERVAL '1 day'
)
ON CONFLICT (order_id) DO NOTHING;

-- ── Merchant payment orders ───────────────────────────────────────────────────
INSERT INTO payments.merchant_orders (
    order_id, merchant_id, amount, currency, description,
    status, payment_url, expires_at, paid_at
) VALUES
(
    'PAY-DEMO-001',
    '10000000-0000-0000-0000-000000000001',
    320000, 'VND', 'Đơn hàng #1234',
    'PAID', 'https://pay.vnkr.vn/PAY-DEMO-001',
    now() + INTERVAL '28 minutes', now() - INTERVAL '1 minute'
),
(
    'PAY-DEMO-002',
    '10000000-0000-0000-0000-000000000001',
    85000, 'VND', 'Đặt đồ ăn',
    'PENDING', 'https://pay.vnkr.vn/PAY-DEMO-002',
    now() + INTERVAL '25 minutes', NULL
),
(
    'PAY-DEMO-003',
    '10000000-0000-0000-0000-000000000001',
    1500000, 'VND', 'Mua sắm online',
    'EXPIRED', 'https://pay.vnkr.vn/PAY-DEMO-003',
    now() - INTERVAL '2 hours', NULL
)
ON CONFLICT (order_id) DO NOTHING;

-- ── Reserve snapshots ─────────────────────────────────────────────────────────
INSERT INTO treasury.reserve_snapshots (
    total_reserve_usd, axvn_circulating_supply, backing_ratio, source, snapshot_ts
)
SELECT
    8000000 + (random() * 2000000)::INT,
    (500000000 + i * 10000)::BIGINT * 1000000000,
    1.05 + (random() * 0.15),
    'on-chain',
    now() - ((30 - i) * INTERVAL '1 day')
FROM generate_series(1, 30) AS i;

-- ── TVL Snapshots ─────────────────────────────────────────────────────────────
INSERT INTO treasury.tvl_snapshots (
    date, tvl_vnd, tvl_usd, active_users, tx_count, volume_vnd
)
SELECT
    CURRENT_DATE - ((30 - i) * INTERVAL '1 day')::INT,
    180000000000 + (random() * 20000000000)::BIGINT,
    (7200000 + (random() * 800000))::NUMERIC(24,6),
    40000 + (random() * 10000)::INT,
    10000 + (random() * 5000)::INT,
    50000000000 + (random() * 15000000000)::BIGINT
FROM generate_series(1, 30) AS i
ON CONFLICT (date) DO NOTHING;

-- ── Sandbox participant (VNKR itself in Tier 2) ───────────────────────────────
INSERT INTO sandbox.participants (
    id, company_name, sandbox_id, contact_email,
    current_tier, status, tvl_current_vnd, tvl_cap_vnd
) VALUES (
    '20000000-0000-0000-0000-000000000001',
    'VNKR FinTech Services JSC',
    'SBX-VNKR01',
    'sandbox@vnkr.vn',
    2, 'ACTIVE',
    200000000000,   -- 200B VND
    10000000000000  -- 10T VND cap Tier 2
)
ON CONFLICT (sandbox_id) DO NOTHING;

-- ── Sample circuit breaker history ───────────────────────────────────────────
INSERT INTO sandbox.circuit_breaker_events (
    participant_id, action, triggered_by, trigger_role,
    reason, paused_at, unpaused_at, duration_seconds
) VALUES
(
    '20000000-0000-0000-0000-000000000001',
    'PAUSE',
    'regulator@nhnn.gov.vn',
    'REGULATOR',
    'Volume spike >400% — suspicious pattern detection',
    now() - INTERVAL '15 days',
    now() - INTERVAL '15 days' + INTERVAL '22 minutes',
    1320
),
(
    '20000000-0000-0000-0000-000000000001',
    'PAUSE',
    'regulator@nhnn.gov.vn',
    'REGULATOR',
    'Blacklist address interaction detected (OFAC list)',
    now() - INTERVAL '30 days',
    now() - INTERVAL '30 days' + INTERVAL '8 minutes',
    480
)
ON CONFLICT DO NOTHING;

-- ── Sample SupTech alerts ─────────────────────────────────────────────────────
INSERT INTO sandbox.alerts (
    participant_id, alert_type, severity, description,
    wallet_address, metric_value, metric_threshold, status
) VALUES
(
    '20000000-0000-0000-0000-000000000001',
    'VOLUME_SPIKE', 'CRITICAL',
    'Transaction volume >320% hourly average',
    NULL, 320, 200, 'INVESTIGATING'
),
(
    '20000000-0000-0000-0000-000000000001',
    'BLACKLIST_ADDRESS', 'CRITICAL',
    'Interaction with OFAC blacklisted wallet detected',
    '0xDEAD000000000000000000000000000000BEEF',
    NULL, NULL, 'OPEN'
),
(
    '20000000-0000-0000-0000-000000000001',
    'FAILED_TX_RATE', 'WARNING',
    'Failed tx rate reached 4.8% (threshold: 5%)',
    NULL, 4.8, 5.0, 'OPEN'
),
(
    '20000000-0000-0000-0000-000000000001',
    'RESERVE_RATIO', 'WARNING',
    'Backing ratio dropped to 9.2% (min: 10%)',
    NULL, 9.2, 10.0, 'INVESTIGATING'
)
ON CONFLICT DO NOTHING;

-- ── OTC Counterparty ──────────────────────────────────────────────────────────
INSERT INTO otc.counterparties (
    id, name, bic_code, jurisdiction, license_type,
    max_quote_size_usd, is_active
) VALUES
(
    '30000000-0000-0000-0000-000000000001',
    'MENA Capital LP', 'MENALP22XXX',
    'UAE', 'VARA', 50000000, TRUE
),
(
    '30000000-0000-0000-0000-000000000002',
    'SG Digital Assets Ltd', 'SGDAL33XXX',
    'SG', 'MAS', 10000000, TRUE
)
ON CONFLICT DO NOTHING;

-- ── Cashback rules ────────────────────────────────────────────────────────────
INSERT INTO payments.cashback_rules (
    merchant_id, category, rate_bps, valid_from
) VALUES
(
    '10000000-0000-0000-0000-000000000001',
    'ECOMMERCE', 150,   -- 1.5%
    now()
)
ON CONFLICT DO NOTHING;

-- ── Summary ───────────────────────────────────────────────────────────────────
DO $$
BEGIN
    RAISE NOTICE '=== VNKR Database Seed Complete ===';
    RAISE NOTICE 'Users:               %', (SELECT count(*) FROM identity.users);
    RAISE NOTICE 'KYC Profiles:        %', (SELECT count(*) FROM identity.kyc_profiles);
    RAISE NOTICE 'P2P Orders:          %', (SELECT count(*) FROM payments.p2p_orders);
    RAISE NOTICE 'Merchant Orders:     %', (SELECT count(*) FROM payments.merchant_orders);
    RAISE NOTICE 'Reserve Snapshots:   %', (SELECT count(*) FROM treasury.reserve_snapshots);
    RAISE NOTICE 'TVL Snapshots:       %', (SELECT count(*) FROM treasury.tvl_snapshots);
    RAISE NOTICE 'Sandbox Participants:%', (SELECT count(*) FROM sandbox.participants);
    RAISE NOTICE 'CB Events:           %', (SELECT count(*) FROM sandbox.circuit_breaker_events);
    RAISE NOTICE 'Alerts:              %', (SELECT count(*) FROM sandbox.alerts);
END;
$$;
