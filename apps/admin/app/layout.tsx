import type { ReactNode } from "react";
import { Shell, themeStyle } from "@formation-zero/ui";
import "@formation-zero/ui/theme.css";
export const metadata = {
  title: "Formation Zero — Administration",
  description:
    "Readiness Starts Here. Universal fitness and human-performance software.",
};
export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={themeStyle}>
        <Shell administration>{children}</Shell>
      </body>
    </html>
  );
}
