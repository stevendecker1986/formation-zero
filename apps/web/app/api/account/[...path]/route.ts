import { NextRequest } from "next/server";
const allowed = new Set([
  "auth/register",
  "auth/login",
  "auth/logout",
  "auth/request-password-reset",
  "auth/send-verification-email",
  "auth/reset-password",
  "auth/verify-email",
  "account",
  "account/profile",
]);
async function proxy(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const path = (await context.params).path.join("/");
  if (!allowed.has(path))
    return Response.json({ error: "NOT_FOUND" }, { status: 404 });
  const api = process.env.API_ORIGIN;
  const web = process.env.WEB_ORIGIN;
  if (!api || !web)
    return Response.json({ error: "SERVICE_UNAVAILABLE" }, { status: 503 });
  if (
    request.method !== "GET" &&
    (request.headers.get("origin") !== web ||
      !request.headers.get("content-type")?.startsWith("application/json"))
  )
    return Response.json({ error: "ORIGIN_DENIED" }, { status: 403 });
  let body: string | undefined;
  if (request.method !== "GET" && request.body) {
    const reader = request.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > 16384) {
        await reader.cancel();
        return Response.json({ error: "PAYLOAD_TOO_LARGE" }, { status: 413 });
      }
      chunks.push(chunk.value);
    }
    body = Buffer.concat(chunks).toString("utf8");
  }
  try {
    const upstream = await fetch(`${api}/api/v1/${path}`, {
      method: request.method,
      headers: {
        "Content-Type": "application/json",
        origin: web,
        cookie: request.headers.get("cookie") ?? "",
      },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
      redirect: "error",
    });
    const headers = new Headers({
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    });
    for (const cookie of upstream.headers.getSetCookie())
      headers.append("Set-Cookie", cookie);
    return new Response(await upstream.text(), {
      status: upstream.status,
      headers,
    });
  } catch {
    return Response.json({ error: "SERVICE_UNAVAILABLE" }, { status: 503 });
  }
}
export { proxy as GET, proxy as POST, proxy as PATCH };
