// ─── Custom Error Classes ────────────────────────────────────────────────────

/** Base error for all @vnkrvietnam/sdk-internal errors */
export class SWIFTAdapterError extends Error {
  readonly code: string;
  readonly details?: Record<string, unknown>;

  constructor(message: string, code: string, details?: Record<string, unknown>) {
    super(message);
    this.name = "SWIFTAdapterError";
    this.code = code;
    this.details = details;
    // Restore prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Thrown when a payload or field fails Zod/SWIFT validation */
export class ValidationError extends SWIFTAdapterError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, "VALIDATION_ERROR", details);
    this.name = "ValidationError";
  }
}

/** Thrown when LAU HMAC signing fails */
export class SigningError extends SWIFTAdapterError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, "SIGNING_ERROR", details);
    this.name = "SigningError";
  }
}

/** Thrown when SWIFT SDK config is missing or invalid */
export class ConfigError extends SWIFTAdapterError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, "CONFIG_ERROR", details);
    this.name = "ConfigError";
  }
}

/** Thrown when a Java bridge operation (JAR spawn) fails */
export class JavaBridgeError extends SWIFTAdapterError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, "JAVA_BRIDGE_ERROR", details);
    this.name = "JavaBridgeError";
  }
}

/** Thrown when SWIFT event bus (Redis) publish/subscribe fails */
export class EventBusError extends SWIFTAdapterError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, "EVENT_BUS_ERROR", details);
    this.name = "EventBusError";
  }
}
