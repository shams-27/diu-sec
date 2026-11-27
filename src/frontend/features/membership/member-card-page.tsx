import { getMemberCard } from "@/backend/features/membership/queries";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { MemberIdCard } from "@/frontend/features/membership/member-id-card";



export async function MemberCardPage({ params }: { params: Promise<{ memberId: string }> }) {
  await connection();
  const { memberId } = await params;
  const member = await getMemberCard(memberId);
  if (!member) notFound();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">Digital member ID</p>
        <h1 className="mt-2 font-heading text-4xl tracking-wide sm:text-5xl">Your club card</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Save this page or download your card. The status always reflects the latest review decision.
        </p>
      </div>

      <MemberIdCard
        member={{
          name: member.name,
          studentId: member.studentId,
          email: member.email,
          batch: member.batch,
          memberCardNo: member.memberCardNo,
          status: member.status,
          wingName: member.wingPref?.name,
        }}
      />

      <Link
        href="/join"
        className="inline-block rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Back to application
      </Link>
    </div>
  );
}
