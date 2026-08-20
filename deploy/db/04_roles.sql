-- =============================================================================
-- VNKR — Database Users & Role-Based Access Control
-- =============================================================================
-- Chạy bằng superuser (postgres)
-- =============================================================================

-- ── Application roles ─────────────────────────────────────────────────────────

-- Service role cho fiat-connector-api (chỉ đọc/ghi payments + identity.kyc)
CREATE ROLE vnkr_fiat_connector LOGIN PASSWORD 'CHANGE_ME_fiat_connector_2026';
GRANT CONNECT ON DATABASE vnkr TO vnkr_fiat_connector;
GRANT USAGE ON SCHEMA identity, payments, notifications TO vnkr_fiat_connector;
GRANT SELECT ON identity.users, identity.kyc_profiles TO vnkr_fiat_connector;
GRANT SELECT, INSERT, UPDATE ON payments.fiat_receipts TO vnkr_fiat_connector;
GRANT SELECT, UPDATE ON payments.p2p_orders TO vnkr_fiat_connector;
GRANT INSERT ON notifications.delivery_log TO vnkr_fiat_connector;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA payments TO vnkr_fiat_connector;

-- Service role cho otc-liquidity-engine
CREATE ROLE vnkr_otc LOGIN PASSWORD 'CHANGE_ME_otc_2026';
GRANT CONNECT ON DATABASE vnkr TO vnkr_otc;
GRANT USAGE ON SCHEMA otc, identity, treasury TO vnkr_otc;
GRANT SELECT, INSERT, UPDATE ON otc.quotes TO vnkr_otc;
GRANT SELECT ON otc.counterparties TO vnkr_otc;
GRANT SELECT ON identity.kyc_profiles TO vnkr_otc;
GRANT SELECT ON treasury.reserve_snapshots TO vnkr_otc;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA otc TO vnkr_otc;

-- Service role cho indexer-subgraph (ghi treasury data)
CREATE ROLE vnkr_indexer LOGIN PASSWORD 'CHANGE_ME_indexer_2026';
GRANT CONNECT ON DATABASE vnkr TO vnkr_indexer;
GRANT USAGE ON SCHEMA treasury TO vnkr_indexer;
GRANT SELECT, INSERT ON treasury.reserve_snapshots TO vnkr_indexer;
GRANT SELECT, INSERT ON treasury.swap_events TO vnkr_indexer;
GRANT SELECT, INSERT ON treasury.tvl_snapshots TO vnkr_indexer;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA treasury TO vnkr_indexer;

-- Service role cho swift-chain-bridge
CREATE ROLE vnkr_swift LOGIN PASSWORD 'CHANGE_ME_swift_2026';
GRANT CONNECT ON DATABASE vnkr TO vnkr_swift;
GRANT USAGE ON SCHEMA swift, payments, treasury TO vnkr_swift;
GRANT SELECT, INSERT, UPDATE ON swift.messages TO vnkr_swift;
GRANT SELECT, INSERT, UPDATE ON swift.bridge_relay_log TO vnkr_swift;
GRANT SELECT, UPDATE ON payments.p2p_orders TO vnkr_swift;
GRANT SELECT ON treasury.reserve_snapshots TO vnkr_swift;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA swift TO vnkr_swift;

-- Service role cho KYC portal / kyc-portal
CREATE ROLE vnkr_kyc_portal LOGIN PASSWORD 'CHANGE_ME_kyc_portal_2026';
GRANT CONNECT ON DATABASE vnkr TO vnkr_kyc_portal;
GRANT USAGE ON SCHEMA identity, notifications TO vnkr_kyc_portal;
GRANT SELECT, INSERT, UPDATE ON identity.users TO vnkr_kyc_portal;
GRANT SELECT, INSERT, UPDATE ON identity.kyc_profiles TO vnkr_kyc_portal;
GRANT SELECT, INSERT ON notifications.delivery_log TO vnkr_kyc_portal;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA identity TO vnkr_kyc_portal;

-- Service role cho merchant portal / pay-portal
CREATE ROLE vnkr_merchant LOGIN PASSWORD 'CHANGE_ME_merchant_2026';
GRANT CONNECT ON DATABASE vnkr TO vnkr_merchant;
GRANT USAGE ON SCHEMA payments, identity TO vnkr_merchant;
GRANT SELECT, INSERT, UPDATE ON payments.merchants TO vnkr_merchant;
GRANT SELECT, INSERT, UPDATE ON payments.merchant_orders TO vnkr_merchant;
GRANT SELECT ON payments.cashback_rules TO vnkr_merchant;
GRANT SELECT, INSERT ON payments.cashback_ledger TO vnkr_merchant;
GRANT SELECT ON identity.kyc_profiles TO vnkr_merchant;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA payments TO vnkr_merchant;

-- Service role cho sandbox dashboard (read-heavy + alerts write)
CREATE ROLE vnkr_sandbox LOGIN PASSWORD 'CHANGE_ME_sandbox_2026';
GRANT CONNECT ON DATABASE vnkr TO vnkr_sandbox;
GRANT USAGE ON SCHEMA sandbox, treasury, payments, identity TO vnkr_sandbox;
GRANT SELECT, UPDATE ON sandbox.participants TO vnkr_sandbox;
GRANT SELECT, INSERT ON sandbox.circuit_breaker_events TO vnkr_sandbox;
GRANT SELECT, INSERT, UPDATE ON sandbox.alerts TO vnkr_sandbox;
GRANT SELECT, INSERT ON sandbox.telemetry TO vnkr_sandbox;
GRANT SELECT ON treasury.tvl_snapshots TO vnkr_sandbox;
GRANT SELECT ON treasury.reserve_snapshots TO vnkr_sandbox;
GRANT SELECT ON payments.p2p_orders TO vnkr_sandbox;

-- Read-only role cho analytics / reporting
CREATE ROLE vnkr_readonly LOGIN PASSWORD 'CHANGE_ME_readonly_2026';
GRANT CONNECT ON DATABASE vnkr TO vnkr_readonly;
GRANT USAGE ON SCHEMA identity, payments, treasury, otc, sandbox, swift, notifications TO vnkr_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA identity      TO vnkr_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA payments      TO vnkr_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA treasury      TO vnkr_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA otc           TO vnkr_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA sandbox       TO vnkr_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA swift         TO vnkr_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA notifications TO vnkr_readonly;

-- Admin role (full access — only for DBA / migrations)
CREATE ROLE vnkr_admin LOGIN PASSWORD 'CHANGE_ME_admin_2026' CREATEROLE;
GRANT ALL ON DATABASE vnkr TO vnkr_admin;
GRANT ALL ON ALL TABLES IN SCHEMA identity      TO vnkr_admin;
GRANT ALL ON ALL TABLES IN SCHEMA payments      TO vnkr_admin;
GRANT ALL ON ALL TABLES IN SCHEMA treasury      TO vnkr_admin;
GRANT ALL ON ALL TABLES IN SCHEMA otc           TO vnkr_admin;
GRANT ALL ON ALL TABLES IN SCHEMA sandbox       TO vnkr_admin;
GRANT ALL ON ALL TABLES IN SCHEMA swift         TO vnkr_admin;
GRANT ALL ON ALL TABLES IN SCHEMA notifications TO vnkr_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA identity      TO vnkr_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA payments      TO vnkr_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA treasury      TO vnkr_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA otc           TO vnkr_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA sandbox       TO vnkr_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA swift         TO vnkr_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA notifications TO vnkr_admin;

-- ── Row-Level Security: sandbox.alerts (regulators see all, participants see own) ─
ALTER TABLE sandbox.alerts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE sandbox.participants ENABLE ROW LEVEL SECURITY;

-- Bypass for admin
CREATE POLICY rls_admin_sandbox_alerts ON sandbox.alerts
    USING (current_user IN ('vnkr_admin', 'postgres'));

CREATE POLICY rls_admin_sandbox_parts ON sandbox.participants
    USING (current_user IN ('vnkr_admin', 'postgres', 'vnkr_sandbox', 'vnkr_readonly'));

-- ── Revoke default public access ─────────────────────────────────────────────
REVOKE ALL ON SCHEMA identity      FROM PUBLIC;
REVOKE ALL ON SCHEMA payments      FROM PUBLIC;
REVOKE ALL ON SCHEMA treasury      FROM PUBLIC;
REVOKE ALL ON SCHEMA otc           FROM PUBLIC;
REVOKE ALL ON SCHEMA sandbox       FROM PUBLIC;
REVOKE ALL ON SCHEMA swift         FROM PUBLIC;
REVOKE ALL ON SCHEMA notifications FROM PUBLIC;
