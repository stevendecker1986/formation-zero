import type { ReactNode } from "react";
export function Shell({ children }: { children: ReactNode }) {
  return (
    <main style={{ maxWidth: 840, margin: "0 auto", padding: "64px 24px" }}>
      <header>
        <p style={{ color: "#c5d49c", letterSpacing: 3 }}>FORMATION ZERO</p>
        <h1>Readiness Starts Here.</h1>
      </header>
      {children}
      <footer style={{ marginTop: 64, fontSize: 14, color: "#bdc7d1" }}>
        <p>
          Independent fitness software. Not an official USMC or DoD product. No
          endorsement implied.
        </p>
        <p>Phase A — Foundation. Commercial launch is not authorized.</p>
      </footer>
    </main>
  );
}
