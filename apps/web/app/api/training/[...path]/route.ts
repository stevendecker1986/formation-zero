import { NextRequest } from "next/server";

const sessionPath =
  /^sessions(?:\/[0-9a-f-]{36}(?:\/(?:transitions|actuals|substitutions|safety-changes|position))?)?$/i;
async function proxy(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const path = (await context.params).path.join("/");
  if (!sessionPath.test(path))
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
    const bytes = await request.arrayBuffer();
    if (bytes.byteLength > 16384)
      return Response.json({ error: "PAYLOAD_TOO_LARGE" }, { status: 413 });
    body = Buffer.from(bytes).toString("utf8");
  }
  try {
    const upstream = await fetch(
      `${api}/api/v1/training/${path}${request.nextUrl.search}`,
      {
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
      },
    );
    return new Response(await upstream.text(), {
      status: upstream.status,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, private",
      },
    });
  } catch {
    return Response.json(
      { error: { code: "SERVICE_UNAVAILABLE" } },
      { status: 503 },
    );
  }
}
export { proxy as GET, proxy as POST, proxy as PATCH };
