import { db } from "../src/lib/db";
import { Prisma, type Wing } from "@prisma/client";

const WINGS = [
  {
    slug: "competitive-programming",
    name: "Competitive Programming",
    description: "Problem solving, contests and the DIU SEC CP track.",
    responsibilities: ["Weekly problem sessions", "ICPC/NCPC preparation", "Intra-university contests"],
  },
  {
    slug: "web-mobile-dev",
    name: "Web & Mobile Development",
    description: "Modern web and mobile product building.",
    responsibilities: ["Web workshops", "Mobile app projects", "Code reviews"],
  },
  {
    slug: "ai-ml",
    name: "AI/ML",
    description: "Applied machine learning and data projects.",
    responsibilities: ["ML study group", "Project mentoring", "Research talks"],
  },
  {
    slug: "cyber-security-devops",
    name: "Cyber Security & DevOps",
    description: "Security fundamentals and reliable infrastructure.",
    responsibilities: ["CTF practices", "CI/CD workshops", "Cloud labs"],
  },
  {
    slug: "ui-ux",
    name: "UI/UX",
    description: "Human-centred design for club products.",
    responsibilities: ["Design critiques", "Prototyping sessions", "Usability testing"],
  },
] as const;

async function main() {
  const adminEmail = (process.env.SUPER_ADMIN_EMAIL || "president@diu.edu.bd").toLowerCase();
  await db.user.upsert({
    where: { email: adminEmail },
    create: { email: adminEmail, name: "DIU SEC President", role: "SUPER_ADMIN" },
    update: { role: "SUPER_ADMIN" },
  });

  const wings: Record<string, Wing> = {};
  for (const wing of WINGS) {
    const row = await db.wing.upsert({
      where: { slug: wing.slug },
      create: { ...wing, responsibilities: [...wing.responsibilities] },
      update: { name: wing.name, description: wing.description, responsibilities: [...wing.responsibilities] },
    });
    wings[wing.slug] = row;
  }

  const current = await db.execSession.upsert({
    where: { year: 2026 },
    create: { year: 2026, label: "2026 Executive Committee", isCurrent: true },
    update: { isCurrent: true, archived: false },
  });
  const previous = await db.execSession.upsert({
    where: { year: 2025 },
    create: { year: 2025, label: "2025 Executive Committee", archived: true },
    update: { archived: true, isCurrent: false },
  });

  for (const [i, title] of ["President", "General Secretary"].entries()) {
    await db.committeeMember.upsert({
      where: { id: `seed-committee-${current.year}-${i}` },
      create: {
        id: `seed-committee-${current.year}-${i}`,
        sessionId: current.id,
        name: title === "President" ? "DIU SEC President" : "DIU SEC General Secretary",
        title,
        batch: "2022",
        order: i,
        socialLinks: { linkedin: "https://www.linkedin.com/" } as Prisma.InputJsonValue,
      },
      update: { title },
    });
  }
  for (const [i, entry] of [
    { name: "Demo Vice President", title: "Vice President", batch: "2023" },
    { name: "Demo Technical Lead", title: "Technical Lead", batch: "2023" },
  ].entries()) {
    await db.committeeMember.upsert({
      where: { id: `seed-committee-extra-${i}` },
      create: { id: `seed-committee-extra-${i}`, sessionId: current.id, ...entry, order: i + 2 },
      update: { title: entry.title },
    });
  }

  await db.committeeMember.upsert({
    where: { id: "seed-committee-previous" },
    create: {
      id: "seed-committee-previous",
      sessionId: previous.id,
      name: "Former President",
      title: "President",
      batch: "2021",
      order: 0,
    },
    update: {},
  });

  const memberEmail = "demo.member@diu.edu.bd";
  const member = await db.member.upsert({
    where: { email: memberEmail },
    create: {
      studentId: "221-35-100",
      name: "Demo Member",
      email: memberEmail,
      batch: "2022",
      wingPrefId: wings["competitive-programming"].id,
      status: "APPROVED",
      memberCardNo: "SEC-2026-0001",
      cardIssuedAt: new Date("2026-01-15T00:00:00Z"),
    },
    update: { status: "APPROVED" },
  });
  await db.wingMember.upsert({
    where: { wingId_memberId: { wingId: wings["competitive-programming"].id, memberId: member.id } },
    create: { wingId: wings["competitive-programming"].id, memberId: member.id, role: "CORE" },
    update: {},
  });

  // Approved leads make public wing rosters and wing-scoped admin pages demoable.
  for (const [i, entry] of [
    { slug: "web-mobile-dev", email: "lead.web@diu.edu.bd", name: "Web Wing Lead", studentId: "222-35-201", role: "LEAD" as const },
    { slug: "ai-ml", email: "core.ai@diu.edu.bd", name: "AI Core Member", studentId: "222-35-202", role: "CORE" as const },
  ].entries()) {
    const lead = await db.member.upsert({
      where: { email: entry.email },
      create: {
        studentId: entry.studentId,
        name: entry.name,
        email: entry.email,
        batch: "2023",
        wingPrefId: wings[entry.slug].id,
        status: "APPROVED",
        memberCardNo: `SEC-2026-000${i + 2}`,
        cardIssuedAt: new Date("2026-01-15T00:00:00Z"),
      },
      update: { status: "APPROVED", wingPrefId: wings[entry.slug].id },
    });
    await db.wingMember.upsert({
      where: { wingId_memberId: { wingId: wings[entry.slug].id, memberId: lead.id } },
      create: { wingId: wings[entry.slug].id, memberId: lead.id, role: entry.role },
      update: { role: entry.role },
    });
  }
  await db.user.upsert({
    where: { email: "lead.web@diu.edu.bd" },
    create: { email: "lead.web@diu.edu.bd", name: "Web Wing Lead", role: "WING_LEAD", wingId: wings["web-mobile-dev"].id },
    update: { role: "WING_LEAD", wingId: wings["web-mobile-dev"].id },
  });

  // Pending applicants let A-02 review and wing-scoped reads be demoed without applying first.
  for (const applicant of [
    { studentId: "223-35-201", name: "Pending Applicant (Web)", email: "pending.web@diu.edu.bd", slug: "web-mobile-dev" },
    { studentId: "223-35-202", name: "Pending Applicant (AI)", email: "pending.ai@diu.edu.bd", slug: "ai-ml" },
  ]) {
    await db.member.upsert({
      where: { email: applicant.email },
      create: {
        studentId: applicant.studentId,
        name: applicant.name,
        email: applicant.email,
        status: "PENDING",
        wingPrefId: wings[applicant.slug].id,
      },
      update: { studentId: applicant.studentId, name: applicant.name, wingPrefId: wings[applicant.slug].id },
    });
  }

  const event = await db.event.upsert({
    where: { slug: "freshers-hackathon-2026" },
    create: {
      type: "HACKATHON",
      slug: "freshers-hackathon-2026",
      title: "DIU SEC Freshers Hackathon 2026",
      description: "A 24-hour beginner-friendly hackathon for new SWE students.",
      syllabus: { schedule: ["Day 1: kickoff", "Day 2: demo"] } as Prisma.InputJsonValue,
      startsAt: new Date("2026-12-15T09:00:00Z"),
      endsAt: new Date("2026-12-16T09:00:00Z"),
      capacity: 50,
      seatsTaken: 1,
      status: "PUBLISHED",
      wingId: wings["web-mobile-dev"].id,
    },
    update: { status: "PUBLISHED" },
  });
  await db.registration.upsert({
    where: { eventId_email: { eventId: event.id, email: memberEmail } },
    create: {
      eventId: event.id,
      memberId: member.id,
      name: member.name,
      email: memberEmail,
      qrToken: "seed-qr-token-0001",
    },
    update: {},
  });
  await db.certificate.upsert({
    where: { certId: "DIU-SEC-CERT-A1B2C3" },
    create: {
      certId: "DIU-SEC-CERT-A1B2C3",
      recipientName: member.name,
      recipientEmail: memberEmail,
      type: "PARTICIPANT",
      eventId: event.id,
    },
    update: {},
  });

  await db.notice.upsert({
    where: { id: "seed-notice-recruitment" },
    create: {
      id: "seed-notice-recruitment",
      title: "DIU SEC recruitment is open",
      body: "Applications for the 2026 batch are now open at /join.",
      category: "RECRUITMENT",
      pinned: true,
      publishAt: new Date("2026-11-01T00:00:00Z"),
    },
    update: { pinned: true },
  });

  await db.resource.upsert({
    where: { id: "seed-resource-cp-sheet" },
    create: {
      id: "seed-resource-cp-sheet",
      type: "CP_SHEET",
      title: "DIU SEC CP problem sheet",
      url: "https://github.com/",
      tags: ["cp", "beginner"],
    },
    update: {},
  });

  for (const [i, question] of [
    "Who can apply for DIU SEC membership?",
    "Where are the club labs located?",
  ].entries()) {
    await db.faq.upsert({
      where: { id: `seed-faq-${i}` },
      create: {
        id: `seed-faq-${i}`,
        question,
        answer: i === 0 ? "Any DIU SWE student with a valid XXX-35-XXX ID." : "The SWE labs in the DIU campus.",
        order: i,
      },
      update: {},
    });
  }
}

main()
  .then(() => console.log("Seed complete"))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
