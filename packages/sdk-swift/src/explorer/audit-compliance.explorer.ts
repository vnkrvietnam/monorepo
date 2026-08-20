/**
 * Represents a single audit event captured by the compliance explorer.
 *
 * Conforms to the Vietnamese Ministry of Finance audit trail requirements
 * under Nghị quyết 05 (NQ-05) and Nghị định 284 (NĐ-284).
 */
export interface AuditEvent {
  /**
   * Unique identifier for this audit event.
   * Formatted as a UUID v4 string (e.g. `"550e8400-e29b-41d4-a716-446655440000"`).
   */
  id: string;
  /** ISO 8601 datetime when the event occurred (e.g. `"2024-07-01T12:00:00.000Z"`). */
  timestamp: string;
  /**
   * Categorises the audited action.
   * Examples: "PAYMENT_INITIATED", "PAYMENT_COMPLETED", "PAYMENT_REJECTED",
   * "ACCOUNT_VALIDATED", "CERTIFICATE_LOADED".
   */
  eventType: string;
  /** Identifier of the user or system actor that triggered the event. */
  userId: string;
  /** Transaction amount involved in the event. */
  amount: number;
  /** ISO 4217 currency code (e.g. "USD", "VND"). */
  currency: string;
  /** SWIFT UETR associated with this event (if applicable). */
  uetr?: string;
  /** Arbitrary key-value metadata for additional regulatory context. */
  metadata?: Record<string, unknown>;
}

/**
 * Optional filters for querying the audit trail.
 * All fields are optional; unspecified fields are not filtered on.
 */
export interface AuditFilter {
  /** Filter by event type (exact match). */
  eventType?: string;
  /** Filter by user or system actor ID (exact match). */
  userId?: string;
  /** Include only events on or after this ISO 8601 datetime string. */
  fromDate?: string;
  /** Include only events on or before this ISO 8601 datetime string. */
  toDate?: string;
}

/**
 * Audit log explorer providing compliant event recording and filtered
 * retrieval for Vietnamese regulatory requirements (NQ-05 / NĐ-284).
 *
 * The audit trail is stored in-memory; for production systems, persist
 * events to an immutable append-only storage such as a blockchain ledger
 * or a compliant WORM database.
 */
export class AuditComplianceExplorer {
  private readonly trail: AuditEvent[] = [];

  /**
   * Appends an `AuditEvent` to the in-memory audit trail.
   * Emits a structured log line to stdout for integration with external
   * SIEM / log-aggregation pipelines.
   *
   * @param event Fully populated `AuditEvent` object.
   */
  log(event: AuditEvent): void {
    this.trail.push(event);
    // Emit as structured JSON for log-shipping agents.
    console.log(JSON.stringify({ level: 'AUDIT', ...event }));
  }

  /**
   * Returns a snapshot of the audit trail, optionally filtered by the
   * provided criteria. All filter conditions are AND-ed together.
   *
   * @param filters Optional `AuditFilter` object; pass nothing to retrieve all events.
   * @returns       Array of matching `AuditEvent` objects in insertion order.
   */
  getAuditTrail(filters?: AuditFilter): AuditEvent[] {
    if (!filters) {
      return [...this.trail];
    }

    return this.trail.filter((event) => {
      if (filters.eventType !== undefined && event.eventType !== filters.eventType) {
        return false;
      }
      if (filters.userId !== undefined && event.userId !== filters.userId) {
        return false;
      }
      if (filters.fromDate !== undefined && event.timestamp < filters.fromDate) {
        return false;
      }
      if (filters.toDate !== undefined && event.timestamp > filters.toDate) {
        return false;
      }
      return true;
    });
  }
}
