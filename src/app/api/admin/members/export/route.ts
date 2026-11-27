import { connection, type NextRequest } from "next/server";
import { requireActor } from "@/lib/admin-guard";
import { db } from "@/lib/db";
import { memberFilterSchema } from "@/lib/validators";

const COLUMNS = ["Name", "Student ID", "Email", "Batch", "Phone", "Preferred wing", "Status", "Card no.", "Applied at"];

export async function GET(request: NextRequest) {
  await connection();
  const actor = await requireActor("members", "read", "own");
  const parsed = memberFilterSchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  const filters = parsed.success ? parsed.data : {};
  const wingId = actor.role === "WING_LEAD" ? actor.wingId : filters.wingPrefId;

  const members = await db.member.findMany({
    where: { status: filters.status, wingPrefId: wingId },
    select: {
      name: true,
      studentId: true,
      email: true,
      batch: true,
      phone: true,
      status: true,
      memberCardNo: true,
      createdAt: true,
      wingPref: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const escape = (value: string | null | undefined) => {
    let text = String(value ?? "");
    if (/^[=+\-@]/.test(text)) text = `'${text}`; // Prevent spreadsheet formula execution on open.
    return `"${text.replaceAll('"', '""')}"`;
  };
  const lines = [
    COLUMNS.map(escape).join(","),
    ...members.map((member) =>
      [
        member.name,
        member.studentId,
        member.email,
        member.batch,
        member.phone,
        member.wingPref?.name,
        member.status,
        member.memberCardNo,
        member.createdAt.toISOString(),
      ]
        .map(escape)
        .join(","),
    ),
  ];

  return new Response(lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="diu-sec-members.csv"',
    },
  });
}
