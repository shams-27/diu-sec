# Decisions Log

Append one entry per assumption or deviation. Newest at the bottom.

| # | Date | Decision | Reason |
|---|------|----------|--------|
| 1 | 2026-11-27 | Student ID regex is `^\d{3}-35-\d{3,4}$` | Spec only says `XXX-35-XXX`; `35` = SWE code. Single constant in `validators.ts`. |
| 2 | 2026-11-27 | Auth.js uses JWT sessions, no Account/Session DB tables | Only Google @diu.edu.bd login; role is looked up from `User` by email at sign-in. Avoids name clash with club `ExecSession`. |
| 3 | 2026-11-27 | Club sessions modeled as `ExecSession` | Avoid clash with auth "Session". |
| 4 | 2026-11-27 | RBAC matrix defined in `src/lib/rbac.ts` | PDFs list roles but not per-module permissions. |
| 5 | 2026-11-27 | Cert ID = `DIU-SEC-CERT-` + 6 random chars (A-Z, 2-9, no ambiguous) | Spec says `XXXX`; random avoids guessable sequences. Validator accepts 4+. |
