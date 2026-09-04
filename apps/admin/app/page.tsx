import { cookies } from "next/headers";
export const dynamic = "force-dynamic";
export default async function Admin() {
  const api = process.env.API_ORIGIN;
  if (!api) return <p>Administration service is unavailable.</p>;
  try {
    const response = await fetch(`${api}/api/v1/admin`, {
      headers: { cookie: (await cookies()).toString() },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
      redirect: "error",
    });
    if (!response.ok)
      return (
        <section className="fz-surface">
          <h2>Access denied</h2>
          <p>A signed-in PLATFORM_ADMIN account is required.</p>
        </section>
      );
    return (
      <section className="fz-surface">
        <h2>Administration foundation</h2>
        <p>Server authorization verified.</p>
        <p>
          Content management and product administration features are planned for
          later phases.
        </p>
      </section>
    );
  } catch {
    return <p>Administration service is unavailable.</p>;
  }
}
