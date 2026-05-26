export const CONTROL_PLANE_LOGGER = Symbol("CONTROL_PLANE_LOGGER");

export type ControlPlaneLogLevel = "debug" | "info" | "warn" | "error";

export type LogMetadata = Readonly<Record<string, unknown>>;

export interface ControlPlaneLogger {
  child(context: string): ControlPlaneLogger;
  debug(message: string, metadata?: LogMetadata): void;
  error(message: string, metadata?: LogMetadata): void;
  info(message: string, metadata?: LogMetadata): void;
  warn(message: string, metadata?: LogMetadata): void;
}

export class ConsoleControlPlaneLogger implements ControlPlaneLogger {
  public constructor(private readonly context: string) {}

  public child(context: string): ControlPlaneLogger {
    return new ConsoleControlPlaneLogger(`${this.context}:${context}`);
  }

  public debug(message: string, metadata: LogMetadata = {}): void {
    this.write("debug", message, metadata);
  }

  public error(message: string, metadata: LogMetadata = {}): void {
    this.write("error", message, metadata);
  }

  public info(message: string, metadata: LogMetadata = {}): void {
    this.write("info", message, metadata);
  }

  public warn(message: string, metadata: LogMetadata = {}): void {
    this.write("warn", message, metadata);
  }

  private write(
    level: ControlPlaneLogLevel,
    message: string,
    metadata: LogMetadata,
  ): void {
    const entry = {
      context: this.context,
      level,
      message,
      metadata: redactMetadata(metadata),
      timestamp: new Date().toISOString(),
    };
    const serialized = JSON.stringify(entry);
    if (level === "error") {
      console.error(serialized);
      return;
    }
    if (level === "warn") {
      console.warn(serialized);
      return;
    }
    console.log(serialized);
  }
}

function redactMetadata(metadata: LogMetadata): LogMetadata {
  return redactObject(metadata, new WeakSet());
}

function redactObject(
  metadata: Readonly<Record<string, unknown>>,
  seen: WeakSet<object>,
): LogMetadata {
  if (seen.has(metadata)) {
    return { circular: "[REDACTED]" };
  }
  seen.add(metadata);

  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => [key, redactValue(key, value, seen)]),
  );
}

function redactValue(key: string, value: unknown, seen: WeakSet<object>): unknown {
  if (isSensitiveKey(key)) {
    return "[REDACTED]";
  }
  if (Array.isArray(value)) {
    return value.map((item) => redactValue("", item, seen));
  }
  if (isRecord(value)) {
    return redactObject(value, seen);
  }
  return value;
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null;
}

function isSensitiveKey(key: string): boolean {
  return /secret|token|password|private|key|authorization/i.test(key);
}
