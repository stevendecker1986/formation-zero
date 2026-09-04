import { cookies } from "next/headers";
import KnowledgeCMS from "./workspace";
export const dynamic = "force-dynamic";
export default async function KnowledgePage() {
  try {
    const api = process.env.API_ORIGIN;
    if (!api) return <p>Knowledge service unavailable.</p>;
    const response = await fetch(`${api}/api/v1/knowledge/access`, {
      headers: { cookie: (await cookies()).toString() },
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok)
      return (
        <section className="fz-surface">
          <h2>Access denied</h2>
          <p>
            Sign in through the account page with an authorized editorial
            account.
          </p>
        </section>
      );
    return <KnowledgeCMS />;
  } catch {
    return <p>Knowledge service unavailable.</p>;
  }
}
