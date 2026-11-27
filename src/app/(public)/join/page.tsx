import type { Metadata } from "next";
import { connection } from "next/server";
import { MembershipForm } from "@/components/public/membership-form";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "Join DIU SEC",
  description: "Apply for DIU SEC membership with your DIU SWE student ID and get an instant digital ID card.",
};

export default async function JoinPage() {
  await connection();
  const wings = await db.wing.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } });

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
