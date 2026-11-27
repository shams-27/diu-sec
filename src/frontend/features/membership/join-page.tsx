import { getWingOptions } from "@/backend/features/membership/queries";
import { connection } from "next/server";
import { MembershipForm } from "@/frontend/features/membership/membership-form";



export async function JoinPage() {
  await connection();
  const wings = await getWingOptions();

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">Membership</p>
        <h1 className="mt-2 font-heading text-4xl tracking-wide sm:text-5xl">Join the club</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Apply with your DIU SWE student ID and institutional email. Your digital member ID card is ready
          straight away and becomes active after approval.
        </p>
      </div>

      {wings.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Wing preferences are not available yet — you can still apply without one.
        </p>
      ) : null}

      <MembershipForm wings={wings} />
    </div>
  );
}
