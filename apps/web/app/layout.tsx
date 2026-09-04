import type { ReactNode } from "react";
import { Shell } from "@formation-zero/ui";
export const metadata = {
  title: "Formation Zero",
  description: "Readiness Starts Here. Independent fitness software.",
};
export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          background: "#101923",
          color: "#f1f4f6",
          fontFamily: "system-ui",
        }}
      >
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
