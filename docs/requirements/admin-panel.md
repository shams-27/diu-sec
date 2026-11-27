# DIU SEC — Admin Panel Requirements

Source of truth for the admin panel. Original PDF archived in `docs/archive/`.

## 1. Core Administrative Modules

| ID | Module | Administrative Capabilities & Controls |
|----|--------|-----------------------------------------|
| A-01 | Dashboard & Analytics | Overview of total active members, pending applications, event registrations, issued certificates, and wing-wise member distribution charts. |
| A-02 | Membership & Application Manager | Review incoming student applications, verify DIU SWE (Software Engineering) IDs (XXX-35-XXX), approve/reject memberships, revoke or reissue Digital Member ID (Identification) Cards, and export member lists to CSV (Comma-Separated Values). |
| A-03 | Committee & Session Manager | Create executive sessions (e.g., 2026, 2025), add/edit/reorder Executive Committee members, assign titles, upload portraits, and archive past panels. |
| A-04 | Wings & Roster Control | Manage engineering wings — Competitive Programming, Web & Mobile Development, AI/ML, Cyber Security & DevOps, and UI/UX — assign Wing Leads, and update core member rosters and syllabi. |
| A-05 | Events, Courses & Attendance | Create and publish hackathons, workshops, and multi-week courses; set seat capacities; monitor live registrations; check in attendees via QR (Quick Response) code scan; and mark attendance. |
| A-06 | Certification & Credential Engine | Generate unique certificate IDs (DIU-SEC-CERT-XXXX), bulk-issue PDF certificates with embedded QR verification links for event participants/winners/executives, and revoke invalid credentials. |
| A-07 | Magazine & Publication CMS | Upload digital magazine issues (PDF), approve or edit student-submitted technical articles, manage issue numbers, and feature flagship editions. |
| A-08 | Project Showcase Moderation | Review student-submitted open-source projects, verify GitHub repository links, assign category tags, and toggle featured status on the public portal. |
| A-09 | Hall of Fame Curator | Add and verify milestone entries for ICPC / NCPC finalists, hackathon winners, GSoC contributors, and alumni spotlights. |

## 2. Content, Operations & Security Modules

| ID | Module | Administrative Capabilities & Controls |
|----|--------|-----------------------------------------|
| A-10 | Notice Board & Alerts | Publish, pin, schedule, and expire official club notices, recruitment announcements, and urgent campus updates. |
| A-11 | Resources, Sponsors & Media | Manage CP sheets and fresher roadmaps, update partner/sponsor logos and faculty advisor profiles, and upload categorized photo gallery albums. |
| A-12 | RBAC & Audit Logs | Enforce permission tiers (Super Admin / President, General Secretary, Wing Lead, Publication Editor) with SSO (Single Sign-On) via @diu.edu.bd and immutable activity logs for every create/edit/delete action. |
