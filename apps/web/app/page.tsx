import Link from "next/link";
import { TIERS } from "@formation-zero/domain";
export default function Home() {
  return (
    <section>
      <h2>Foundation</h2>
      <p>A secure account foundation for Formation Zero.</p>
      <p>Training and formation features are planned for later phases.</p>
      <p>Account model: {TIERS.join(" / ")}.</p>
      <Link href="/account" style={{ color: "#c5d49c" }}>
        Manage your account
      </Link>
    </section>
  );
}
