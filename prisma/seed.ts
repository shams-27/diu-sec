import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { db } from "../src/backend/shared/db";
import { renderCertificatePdf } from "../src/backend/features/certificates/certs";
import { saveGeneratedPdf } from "../src/backend/shared/storage";
import { Prisma, type Wing } from "@prisma/client";
import { PDFDocument, StandardFonts } from "pdf-lib";

/** Local SVG placeholders keep seeded logos/photos demoable without external hosts. */
async function seedImage(name: string, label: string): Promise<string> {
  const dir = path.join(process.cwd(), "public", "uploads");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" role="img" aria-label="${label}"><rect width="800" height="600" fill="#0f172a"/><text x="400" y="310" fill="#e2e8f0" font-family="sans-serif" font-size="40" text-anchor="middle">${label}</text></svg>`;
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), svg, { flag: "wx" }).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== "EEXIST") throw error;
  });
  return `/uploads/${name}`;
}

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
  const bootstrap = process.env.BOOTSTRAP_ONLY === "true";
  const adminEmail = (process.env.SUPER_ADMIN_EMAIL || "president@diu.edu.bd").toLowerCase();
  await db.user.upsert({
    where: { email: adminEmail },
    create: { email: adminEmail, name: "DIU SEC President", role: "SUPER_ADMIN" },
    update: bootstrap ? {} : { role: "SUPER_ADMIN" },
  });

  const wings: Record<string, Wing> = {};
  for (const wing of WINGS) {
    const row = await db.wing.upsert({
      where: { slug: wing.slug },
      create: { ...wing, responsibilities: [...wing.responsibilities] },
      update: bootstrap
        ? {}
        : { name: wing.name, description: wing.description, responsibilities: [...wing.responsibilities] },
    });
    wings[wing.slug] = row;
  }

  // Production bootstrap: real admin account plus wing structure, no demo content.
  if (bootstrap) return;

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
  const pastEvent = await db.event.upsert({
    where: { slug: "web-workshop-2026" },
    create: {
      type: "WORKSHOP",
      slug: "web-workshop-2026",
      title: "Modern Web Workshop 2026",
      description: "A hands-on introduction to shipping accessible React applications.",
      syllabus: { schedule: ["Morning: components", "Afternoon: project"] } as Prisma.InputJsonValue,
      startsAt: new Date("2026-10-10T09:00:00Z"),
      endsAt: new Date("2026-10-10T16:00:00Z"),
      capacity: 20,
      seatsTaken: 2,
      status: "PUBLISHED",
      wingId: wings["web-mobile-dev"].id,
    },
    update: { status: "PUBLISHED", startsAt: new Date("2026-10-10T09:00:00Z") },
  });
  for (const [i, registration] of [
    { email: "lead.web@diu.edu.bd", name: "Web Wing Lead" },
    { email: "core.ai@diu.edu.bd", name: "AI Core Member" },
  ].entries()) {
    await db.registration.upsert({
      where: { eventId_email: { eventId: pastEvent.id, email: registration.email } },
      create: {
        eventId: pastEvent.id,
        name: registration.name,
        email: registration.email,
        qrToken: `seed-qr-past-${i + 1}`,
      },
      update: {},
    });
  }

  const seededCertId = "DIU-SEC-CERT-A1B2C3";
  const existingCert = await db.certificate.findUnique({ where: { certId: seededCertId } });
  if (!existingCert?.pdfUrl) {
    const pdf = await renderCertificatePdf({
      certId: seededCertId,
      recipientName: member.name,
      type: "PARTICIPANT",
      issuedAt: new Date("2026-11-20T00:00:00Z"),
      eventTitle: event.title,
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
    });
    const pdfUrl = await saveGeneratedPdf(pdf);
    await db.certificate.upsert({
      where: { certId: seededCertId },
      create: {
        certId: seededCertId,
        recipientName: member.name,
        recipientEmail: memberEmail,
        type: "PARTICIPANT",
        eventId: event.id,
        pdfUrl,
        issuedAt: new Date("2026-11-20T00:00:00Z"),
      },
      update: { pdfUrl },
    });
  }

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

  for (const resource of [
    {
      id: "seed-resource-cp-sheet",
      type: "CP_SHEET" as const,
      title: "DIU SEC CP problem sheet",
      url: "https://github.com/diu-sec/cp-sheet",
      tags: ["cp", "beginner"],
    },
    {
      id: "seed-resource-roadmap",
      type: "ROADMAP" as const,
      title: "Freshers' software engineering roadmap",
      url: "https://github.com/diu-sec/roadmap",
      tags: ["freshers", "roadmap"],
    },
    {
      id: "seed-resource-github",
      type: "GITHUB_REPO" as const,
      title: "Club open-source repositories",
      url: "https://github.com/diu-sec",
      tags: ["open-source", "projects"],
    },
    {
      id: "seed-resource-interview",
      type: "INTERVIEW_GUIDE" as const,
      title: "Technical interview guide",
      url: "https://github.com/diu-sec/interview-guide",
      tags: ["interview", "career"],
    },
  ]) {
    await db.resource.upsert({ where: { id: resource.id }, create: resource, update: resource });
  }

  for (const sponsor of [
    {
      id: "seed-sponsor-partner",
      kind: "PARTNER" as const,
      name: "Daffodil Software",
      websiteUrl: "https://www.daffodilsoft.com/",
      tier: "Gold",
      bio: "Industry partner supporting club workshops and project mentoring.",
      order: 0,
    },
    {
      id: "seed-sponsor-sponsor",
      kind: "SPONSOR" as const,
      name: "DevTools Bangladesh",
      websiteUrl: "https://example.com/devtools",
      tier: "Silver",
      bio: "Sponsors contest prizes and community meetups.",
      order: 1,
    },
    {
      id: "seed-sponsor-advisor",
      kind: "FACULTY_ADVISOR" as const,
      name: "Dr. SWE Advisor",
      websiteUrl: "https://swe.diu.edu.bd/",
      tier: "Advisor",
      bio: "Faculty advisor from the Department of Software Engineering (code 35).",
      order: 2,
    },
  ]) {
    const logoUrl = await seedImage(`${sponsor.id}.svg`, sponsor.name);
    await db.sponsor.upsert({ where: { id: sponsor.id }, create: { ...sponsor, logoUrl }, update: { ...sponsor, logoUrl } });
  }

  for (const album of [
    {
      id: "seed-album-orientation",
      title: "Orientation 2026",
      category: "ORIENTATION" as const,
      photos: ["Welcome session", "Lab walkthrough"],
    },
    {
      id: "seed-album-contest",
      title: "Intra-university CP contest",
      category: "CONTEST" as const,
      photos: ["Opening round", "Awards ceremony"],
    },
    {
      id: "seed-album-techfest",
      title: "Tech fest builds",
      category: "TECH_FEST" as const,
      photos: ["Project demo", "Mentoring desk"],
    },
  ]) {
    const coverUrl = await seedImage(`${album.id}-cover.svg`, album.title);
    await db.galleryAlbum.upsert({
      where: { id: album.id },
      create: { id: album.id, title: album.title, category: album.category, coverUrl },
      update: { title: album.title, category: album.category, coverUrl },
    });
    for (const [index, caption] of album.photos.entries()) {
      const id = `${album.id}-photo-${index}`;
      const url = await seedImage(`${id}.svg`, caption);
      await db.galleryPhoto.upsert({
        where: { id },
        create: { id, albumId: album.id, url, caption, order: index },
        update: { url, caption, order: index },
      });
    }
  }

  for (const [i, question] of [
    "Who can apply for DIU SEC membership?",
    "Where are the club labs located?",
  ].entries()) {
    await db.faq.upsert({
      where: { id: `seed-faq-${i}` },
      create: {
        id: `seed-faq-${i}`,
        question,
        answer:
          i === 0
            ? "Any DIU SWE student with a valid XXX-35-XXX ID and an institutional email."
            : "The SWE labs are on the DIU campus; check the latest notice for the room number.",
        order: i,
      },
      update: {},
    });
  }

  const magazineIssueId = "seed-magazine-issue-1";
  const existingIssue = await db.magazineIssue.findUnique({ where: { id: magazineIssueId } });
  let magazinePdfUrl = existingIssue?.pdfUrl;
  if (!magazinePdfUrl) {
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([595, 842]);
    const font = await pdf.embedFont(StandardFonts.HelveticaBold);
    page.drawText("DIU SEC Tech Review - Issue 1", { x: 48, y: 760, size: 24, font });
    page.drawText("Stories from the Software Engineering Club.", { x: 48, y: 720, size: 12, font });
    magazinePdfUrl = await saveGeneratedPdf(await pdf.save());
  }
  await db.magazineIssue.upsert({
    where: { id: magazineIssueId },
    create: {
      id: magazineIssueId,
      number: 1,
      title: "DIU SEC Tech Review 2026",
      pdfUrl: magazinePdfUrl,
      featured: true,
      publishedAt: new Date("2026-10-15T00:00:00Z"),
    },
    update: { pdfUrl: magazinePdfUrl, featured: true },
  });
  await db.article.upsert({
    where: { id: "seed-article-1" },
    create: {
      id: "seed-article-1",
      title: "How our CP track prepares for ICPC",
      body: "Weekly contests, problem reviews and peer mentoring make the CP track a reliable path into competitive programming.\n\nMembers start with fundamentals, then move to regional-level problem sets.",
      authorName: "Jane Doe",
      authorEmail: "jane@diu.edu.bd",
      status: "APPROVED",
      issueId: magazineIssueId,
    },
    update: { status: "APPROVED", issueId: magazineIssueId },
  });
  await db.article.upsert({
    where: { id: "seed-article-2" },
    create: {
      id: "seed-article-2",
      title: "Designing accessible club tools",
      body: "A short field guide to focus rings, semantic markup and readable contrast for student projects.",
      authorName: "John Roe",
      status: "SUBMITTED",
    },
    update: { status: "SUBMITTED", issueId: null },
  });

  for (const project of [
    {
      id: "seed-project-cp-tracker",
      title: "CP Tracker",
      description: "Track solved problems, contests and weekly progress for the competitive programming track.",
      githubUrl: "https://github.com/diu-sec/cp-tracker",
      demoUrl: "https://sec.example/cp-tracker",
      techStack: ["Next.js", "TypeScript"],
      contributors: ["Jane Doe", "John Roe"],
      tags: ["cp", "dashboard"],
      featured: true,
    },
    {
      id: "seed-project-campus-map",
      title: "DIU Campus Map",
      description: "An interactive guide to labs, halls and common spaces for new Software Engineering students.",
      githubUrl: "https://github.com/diu-sec/campus-map",
      techStack: ["React", "Tailwind"],
      contributors: ["John Roe"],
      tags: ["web", "freshers"],
      featured: false,
    },
  ]) {
    await db.project.upsert({
      where: { id: project.id },
      create: { ...project, status: "APPROVED" },
      update: { ...project, status: "APPROVED" },
    });
  }

  for (const entry of [
    {
      id: "seed-hof-icpc",
      category: "ICPC" as const,
      title: "ICPC regional finalists",
      personName: "Jane Doe",
      year: 2026,
      description: "Qualified for the ICPC regional finals from DIU.",
      verified: true,
    },
    {
      id: "seed-hof-gsoc",
      category: "GSOC" as const,
      title: "Google Summer of Code contributor",
      personName: "John Roe",
      year: 2025,
      description: "Contributed to an open-source mentoring organisation.",
      verified: true,
    },
    {
      id: "seed-hof-alumni",
      category: "ALUMNI" as const,
      title: "Distinguished alumni spotlight",
      personName: "Ayesha Rahman",
      year: 2024,
      description: "Awaiting verification from the executive panel.",
      verified: false,
    },
  ]) {
    await db.hallOfFameEntry.upsert({ where: { id: entry.id }, create: entry, update: entry });
  }

  for (const notice of [
    {
      id: "seed-notice-contest",
      title: "Weekly CP contest opens",
      body: "Registration for this week's contest is open until Thursday evening.",
      category: "CONTEST" as const,
      pinned: false,
      publishAt: new Date("2026-11-25T00:00:00Z"),
    },
    {
      id: "seed-notice-expired",
      title: "Old committee meeting",
      body: "This notice is kept to demonstrate the expired-notice filter.",
      category: "COMMITTEE" as const,
      pinned: false,
      publishAt: new Date("2026-10-01T00:00:00Z"),
      expireAt: new Date("2026-11-01T00:00:00Z"),
    },
    {
      id: "seed-notice-scheduled",
      title: "Winter workshop schedule",
      body: "The winter workshop schedule will be published next month.",
      category: "CAMPUS" as const,
      pinned: false,
      publishAt: new Date("2026-12-01T00:00:00Z"),
    },
  ]) {
    await db.notice.upsert({ where: { id: notice.id }, create: notice, update: notice });
  }
}

main()
  .then(() => console.log(process.env.BOOTSTRAP_ONLY === "true" ? "Bootstrap complete" : "Seed complete"))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
