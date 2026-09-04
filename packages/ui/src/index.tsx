import type { ReactNode } from "react";
import { brand } from "./tokens";
export { themeStyle } from "./theme";
export function BrandName() {
  // Text identification only; never an approximation of the canonical symbol.
  return (
    <p className="fz-brand">
      FORMATION <span>ZERO</span>
    </p>
  );
}
export function Surface({ children }: { children: ReactNode }) {
  return <section className="fz-surface">{children}</section>;
}
export function Badge({ children }: { children: ReactNode }) {
  return <span className="fz-badge">{children}</span>;
}
export function Shell({
  children,
  administration = false,
}: {
  children: ReactNode;
  administration?: boolean;
}) {
  return (
    <div className="fz-shell">
      <a className="fz-skip" href="#content">
        Skip to content
      </a>
      <header className="fz-header">
        <BrandName />
        <p className="fz-eyebrow">
          {administration
            ? "Administration"
            : "Build capability. Improve every day."}
        </p>
      </header>
      <main id="content" tabIndex={-1}>
        <div className="fz-intro">
          <p className="fz-eyebrow">
            {administration
              ? "Accuracy. Accountability. Trust."
              : "For every athlete. Every body. Every goal."}
          </p>
          <h1>{brand.tagline}</h1>
        </div>
        {children}
      </main>
      <footer className="fz-footer">
        <p>
          Independent fitness and human-performance software. Not an official
          USMC or DoD product. No endorsement implied.
        </p>
        <p>Phase A — Foundation. Commercial launch is not authorized.</p>
      </footer>
    </div>
  );
}
