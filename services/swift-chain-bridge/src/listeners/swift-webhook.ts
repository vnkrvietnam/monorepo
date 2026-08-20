import type { FastifyInstance } from "fastify";

// ─── SWIFT Inbound Webhook Listener ──────────────────────────────────────────
//
// swift-gateway POST tới endpoint này khi nhận điện inbound từ SWIFT
// (MT103/pacs.008 đến từ ngân hàng nước ngoài — luồng INBOUND fiat).
//
// Hai endpoints cùng chức năng:
//   POST /api/v1/bridge/inbound-webhook  → public-facing (x-internal-secret header)
//   POST /internal/swift/inbound-credit  → internal service-to-service

export interface SwiftInboundCreditPayload {
  /** UETR của điện SWIFT (UUID v4) */
  uetr: string;
  /** BIC ngân hàng gửi */
  senderBic: string;
  /** Số tiền (USD) */
  amount: number;
  /** Địa chỉ EVM ví nhận token — phải được map từ KYC hoặc metadata của điện */
  beneficiaryAddress: string;
  /** Chữ ký LAU đã xác thực bởi swift-gateway */
  lauSignature?: string;
  /** Loại điện: MT103, pacs.008, … */
  messageType?: string;
  /** Reference / MsgId */
  reference?: string;
  /** ISO timestamp */
  timestamp?: string;
  /** Currency (default USD) */
  currency?: string;
  /** Value date YYMMDD */
  valueDate?: string;
}

/** Body format cho /api/v1/bridge/inbound-webhook (từ external / test runners) */
interface InboundWebhookBody {
  uetr: string;
  currency?: string;
  amount: number;
  beneficiaryAddress: string;
  senderBic?: string;
  valueDate?: string;
}

/** UETR idempotency store (in-memory, sufficient for single-process) */
const processedUETRs = new Set<string>();

/**
 * Đăng ký webhook route vào Fastify instance của swift-chain-bridge.
 * Gọi `onInboundCredit` với payload đã parse khi có request đến.
 */
export function registerSwiftWebhookRoutes(
  fastify: FastifyInstance,
  onInboundCredit: (payload: SwiftInboundCreditPayload) => Promise<void>,
  webhookSecret: string
): void {

  /**
   * POST /api/v1/bridge/inbound-webhook
   *
   * Public-facing endpoint cho phép các hệ thống bên ngoài (test suites,
   * fiat gateways) gửi SWIFT inbound settlement request.
   * Header: x-internal-secret
   */
  fastify.post<{ Body: InboundWebhookBody }>(
    "/api/v1/bridge/inbound-webhook",
    async (req, reply) => {
      const secret = req.headers["x-internal-secret"] as string | undefined;
      if (!secret || secret !== webhookSecret) {
        fastify.log.warn({ ip: req.ip }, "[bridge-webhook] Unauthorized");
        return reply.code(401).send({ error: "Unauthorized" });
      }

      const { uetr, currency = "USD", amount, beneficiaryAddress, senderBic = "UNKNOWN", valueDate } = req.body;

      // UETR idempotency check
      if (processedUETRs.has(uetr)) {
        return reply.code(409).send({ error: "UETR already processed", uetr });
      }

      fastify.log.info({ uetr, amount, currency }, "[bridge-webhook] Inbound settlement request");

      // Marcar como procesando antes de la llamada async
      processedUETRs.add(uetr);

      const payload: SwiftInboundCreditPayload = {
        uetr,
        senderBic,
        amount,
        beneficiaryAddress,
        currency,
        valueDate,
        messageType: "MT103",
        reference: uetr,
        timestamp: new Date().toISOString(),
      };

      try {
        await onInboundCredit(payload);
        return reply.send({
          success: true,
          uetr,
          status: "SETTLEMENT_INITIATED",
        });
      } catch (err) {
        // Si falla, quitar el UETR del set para permitir reintento
        processedUETRs.delete(uetr);
        fastify.log.error({ err, uetr }, "[bridge-webhook] Settlement failed");
        return reply.code(500).send({ error: "Settlement failed", detail: String(err) });
      }
    }
  );

  /**
   * POST /internal/swift/inbound-credit
   *
   * Được gọi bởi swift-gateway sau khi xác thực LAU và xác nhận inbound SWIFT payment.
   * Header bắt buộc: X-VNKR-Webhook-Secret (để xác thực nội bộ giữa 2 services).
   */
  fastify.post<{ Body: SwiftInboundCreditPayload }>(
    "/internal/swift/inbound-credit",
    async (req, reply) => {
      const secret = req.headers["x-vnkr-webhook-secret"] as string | undefined;
      if (!secret || secret !== webhookSecret) {
        fastify.log.warn({ ip: req.ip }, "[webhook] Unauthorized inbound credit attempt");
        return reply.code(401).send({ error: "Unauthorized" });
      }

      const payload = req.body;

      // UETR idempotency check
      if (processedUETRs.has(payload.uetr)) {
        return reply.code(409).send({ error: "UETR already processed", uetr: payload.uetr });
      }
      processedUETRs.add(payload.uetr);

      fastify.log.info(
        { uetr: payload.uetr, amount: payload.amount, senderBic: payload.senderBic },
        "[webhook] SWIFT inbound credit received"
      );

      try {
        await onInboundCredit(payload);
        return reply.send({ ok: true, uetr: payload.uetr });
      } catch (err) {
        processedUETRs.delete(payload.uetr);
        fastify.log.error({ err, uetr: payload.uetr }, "[webhook] Failed to settle inbound");
        return reply.code(500).send({ error: "Settlement failed", detail: String(err) });
      }
    }
  );

  /**
   * POST /internal/swift/outbound-ack
   *
   * Gọi từ swift-gateway khi nhận ACK từ MGW daemon (điện đã gửi thành công).
   * Bridge dùng để gọi confirmOutboundSwift() on-chain.
   */
  fastify.post<{ Body: { uetr: string; transmissionId: string; status: string } }>(
    "/internal/swift/outbound-ack",
    async (req, reply) => {
      const secret = req.headers["x-vnkr-webhook-secret"] as string | undefined;
      if (!secret || secret !== webhookSecret) {
        return reply.code(401).send({ error: "Unauthorized" });
      }
      fastify.log.info(req.body, "[webhook] SWIFT outbound ACK received");
      return reply.send({ ok: true });
    }
  );
}
