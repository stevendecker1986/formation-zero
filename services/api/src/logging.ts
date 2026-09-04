export type LogSink = (line: string) => void;
export interface SafeLog {
  level: "info" | "warn" | "error";
  event:
    | "request.completed"
    | "request.failed"
    | "auth.library"
    | "server.started"
    | "server.stopped"
    | "mail.failed";
  requestId?: string;
  userId?: string;
  status?: number;
}
export function createLogger(
  sink: LogSink = (line) => process.stdout.write(`${line}\n`),
) {
  return (entry: SafeLog): void => {
    // Explicit allowlist: never serialize request bodies, headers, paths, queries, or raw errors.
    sink(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        service: "formation-zero-api",
        level: entry.level,
        event: entry.event,
        requestId: entry.requestId,
        userId: entry.userId,
        metadata: { status: entry.status },
      }),
    );
  };
}
