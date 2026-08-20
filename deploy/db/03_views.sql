-- =============================================================================
-- VNKR — Database Views & Materialized Views
-- =============================================================================

-- ── KYC Status summary ───────────────────────────────────────────────────────
CREATE OR REPLACE VIEW identity.v_kyc_summary AS
SELECT
    status,
    tier,
    count(*)                     AS total,
    count(*) FILTER (WHERE vneid_level = 2) AS vneid_l2_count,
    max(created_at)              AS latest_submission
FROM identity.kyc_profiles
GROUP BY status, tier;

-- ── P2P order book (open orders) ─────────────────────────────────────────────
CREATE OR REPLACE VIEW payments.v_p2p_orderbook AS
SELECT
    o.order_id,
    o.side,
    o.token_mint,
    o.token_amount,
    o.fiat_amount,
    o.fiat_currency,
    o.payment_method,
    o.seller_wallet,
    o.created_at,
    EXTRACT(EPOCH FROM (now() - o.created_at)) / 3600 AS age_hours
FROM payments.p2p_orders o
WHERE o.status = 'OPEN'
ORDER BY o.created_at DESC;

-- ── Merchant daily stats ─────────────────────────────────────────────────────
CREATE MATERIALIZED VIEW payments.mv_merchant_daily_stats AS
SELECT
    m.merchant_id,
    date_trunc('day', m.created_at)::DATE AS day,
    count(*)                              AS total_orders,
    count(*) FILTER (WHERE m.status = 'PAID')     AS paid_orders,
    count(*) FILTER (WHERE m.status = 'FAILED')   AS failed_orders,
    count(*) FILTER (WHERE m.status = 'EXPIRED')  AS expired_orders,
    sum(m.amount) FILTER (WHERE m.status = 'PAID')  AS revenue_vnd,
    avg(m.amount) FILTER (WHERE m.status = 'PAID')  AS avg_order_vnd,
    round(
        100.0 * count(*) FILTER (WHERE m.status = 'PAID')
        / NULLIF(count(*), 0), 2
    )                                             AS success_rate_pct
FROM payments.merchant_orders m
GROUP BY m.merchant_id, date_trunc('day', m.created_at)::DATE
WITH DATA;

CREATE UNIQUE INDEX idx_mv_merchant_daily ON payments.mv_merchant_daily_stats (merchant_id, day);

-- Refresh command: REFRESH MATERIALIZED VIEW CONCURRENTLY payments.mv_merchant_daily_stats;

-- ── Treasury backing health ───────────────────────────────────────────────────
CREATE OR REPLACE VIEW treasury.v_reserve_health AS
SELECT
    snapshot_ts,
    total_reserve_usd,
    axvn_circulating_supply,
    backing_ratio,
    CASE
        WHEN backing_ratio >= 1.10 THEN 'HEALTHY'
        WHEN backing_ratio >= 1.00 THEN 'ADEQUATE'
        WHEN backing_ratio >= 0.90 THEN 'WARNING'
        ELSE 'CRITICAL'
    END AS health_status,
    LAG(backing_ratio) OVER (ORDER BY snapshot_ts) AS prev_ratio,
    backing_ratio - LAG(backing_ratio) OVER (ORDER BY snapshot_ts) AS ratio_change
FROM treasury.reserve_snapshots
ORDER BY snapshot_ts DESC;

-- ── Sandbox compliance dashboard ─────────────────────────────────────────────
CREATE OR REPLACE VIEW sandbox.v_compliance_dashboard AS
SELECT
    p.sandbox_id,
    p.company_name,
    p.current_tier,
    p.status,
    p.kyc_compliance_rate,
    p.dispute_rate,
    p.uptime_pct,
    p.tvl_current_vnd,
    p.tvl_cap_vnd,
    round(100.0 * p.tvl_current_vnd / NULLIF(p.tvl_cap_vnd, 0), 2) AS tvl_utilization_pct,
    (SELECT count(*) FROM sandbox.alerts a
     WHERE a.participant_id = p.id AND a.status IN ('OPEN','INVESTIGATING')
       AND a.severity = 'CRITICAL')                                 AS open_critical_alerts,
    (SELECT count(*) FROM sandbox.circuit_breaker_events c
     WHERE c.participant_id = p.id
       AND c.created_at > now() - INTERVAL '30 days')              AS cb_events_30d,
    -- Pass/Fail graduation criteria
    p.kyc_compliance_rate = 100.0                                   AS criterion_kyc_ok,
    p.dispute_rate <= 0.05                                          AS criterion_dispute_ok,
    p.uptime_pct >= 99.9                                            AS criterion_uptime_ok
FROM sandbox.participants p;

-- ── SWIFT bridge status ───────────────────────────────────────────────────────
CREATE OR REPLACE VIEW swift.v_bridge_status AS
SELECT
    date_trunc('hour', b.created_at) AS hour,
    b.direction,
    b.status,
    count(*)                          AS count,
    sum(b.fee_bps)                    AS total_fee_bps,
    avg(
        EXTRACT(EPOCH FROM (b.confirmed_at - b.submitted_at))
    )                                 AS avg_confirmation_secs
FROM swift.bridge_relay_log b
WHERE b.created_at > now() - INTERVAL '7 days'
GROUP BY date_trunc('hour', b.created_at), b.direction, b.status
ORDER BY 1 DESC;
