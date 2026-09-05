import Link from "next/link";
import { TIERS } from "@formation-zero/domain";
import { Surface, Badge } from "@formation-zero/ui";
export default function Home() {
  return (
    <Surface>
      <p className="fz-eyebrow">The foundation</p>
      <h2>Capability starts with you.</h2>
      <p>
        Formation Zero is a universal fitness, human-performance, recovery,
        readiness, and group-training platform.
      </p>
      <p>
        Your secure account is the first step. Training features are planned for
        later phases.
      </p>
      <div className="fz-tiers" aria-label="Account tiers">
        {TIERS.map((tier) => (
          <Badge key={tier}>{tier}</Badge>
        ))}
      </div>
      <Link href="/account" className="fz-button fz-button-primary">
        Manage your account
      </Link>
      <Link href="/training" className="fz-button">
        Individual training
      </Link>
    </Surface>
  );
}
