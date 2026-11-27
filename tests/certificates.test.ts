import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";
import { ForbiddenError } from "@/lib/rbac";

const e = vi.hoisted(() => ({
  requireActor: vi.fn(),
  writeAudit: vi.fn(),
  eventFindUnique: vi.fn(),
  certFindUnique: vi.fn(),
  certFindMany: vi.fn(),
  certCreate: vi.fn(),
  certUpdate: vi.fn(),
  render: vi.fn(),
  savePdf: vi.fn(),
  removeAsset: vi.fn(),
  transaction: vi.fn(),
  generateCertId: vi.fn(),
}));
vi.mock("@/lib/validators", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/validators")>();
  return { ...actual, generateCertId: e.generateCertId };
});
vi.mock("@/lib/admin-guard", () => ({ requireActor: e.requireActor }));
vi.mock("@/lib/audit", () => ({ writeAudit: e.writeAudit }));
vi.mock("@/lib/certs", () => ({ renderCertificatePdf: e.render }));
vi.mock("@/lib/storage", () => ({ saveGeneratedPdf: e.savePdf, removeUploadedAsset: e.removeAsset }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), updateTag: vi.fn() }));
vi.mock("@/lib/db", () => ({
  db: {
    event: { findUnique: e.eventFindUnique },
    certificate: {
      findUnique: e.certFindUnique,
      findMany: e.certFindMany,
      create: e.certCreate,
      update: e.certUpdate,
    },
    $transaction: (fn: (tx: unknown) => Promise<unknown>) => e.transaction(fn),
  },
}));

const tx = {
  event: { findUnique: e.eventFindUnique },
  certificate: { findUnique: e.certFindUnique, findMany: e.certFindMany, create: e.certCreate, update: e.certUpdate },
};
e.transaction.mockImplementation((fn: (tx: unknown) => Promise<unknown>) => fn(tx));

import {
  certificateRecipientSchema,
  certIssueSchema,
  certRevokeSchema,
  parseCertificateRecipients,
} from "@/lib/validators";
import { issueCertificatesAction, revokeCertificateAction } from "@/server/actions/certificates";

const EVENT = "cmwypjwbz0009sbfj0tu78g24";
const fd = (entries: [string, string][]) => {
  const data = new FormData();
  for (const [key, value] of entries) data.set(key, value);
  return data;
};
const issueForm = fd([
  ["eventId", EVENT],
  ["type", "PARTICIPANT"],
  ["recipients", "Jane Doe, jane@diu.edu.bd\nJohn Roe, john@diu.edu.bd"],
]);

describe("certificate validators", () => {
  it("accepts and parses one recipient per line", () => {
    const input = certIssueSchema.parse(Object.fromEntries(issueForm));
    expect(parseCertificateRecipients(input.recipients)).toEqual([
      { name: "Jane Doe", email: "jane@diu.edu.bd" },
      { name: "John Roe", email: "john@diu.edu.bd" },
    ]);
  });

  it("rejects a malformed recipient line", () => {
    expect(() => parseCertificateRecipients("Jane Doe\nnot-an-email")).toThrow(/recipient/i);
  });

  it("rejects recipient names the PDF font cannot encode", () => {
    expect(certificateRecipientSchema.safeParse({ name: "আব্দুল করিম", email: "a@diu.edu.bd" }).success).toBe(false);
  });

  it("caps a batch at 50 recipients", () => {
    const recipients = Array.from({ length: 51 }, (_, i) => `Person ${i}, p${i}@diu.edu.bd`).join("\n");
    expect(certIssueSchema.safeParse({ type: "PARTICIPANT", recipients }).success).toBe(false);
  });

  it("uppercases a certificate ID for lookup", () => {
    expect(certRevokeSchema.parse({ certId: "diu-sec-cert-a1b2c3" }).certId).toBe("DIU-SEC-CERT-A1B2C3");
  });
});

describe("certificate actions", () => {
  let idIndex = 0;
  beforeEach(() => {
    vi.clearAllMocks();
    idIndex = 0;
    e.generateCertId.mockImplementation(() => `DIU-SEC-CERT-${String.fromCharCode(65 + idIndex++).repeat(6)}`);
    e.transaction.mockImplementation((fn: (tx: unknown) => Promise<unknown>) => fn(tx));
    e.requireActor.mockResolvedValue({ id: "u1", role: "SUPER_ADMIN" });
    e.eventFindUnique.mockResolvedValue({ id: EVENT, wingId: null, title: "Hackathon" });
    e.certFindUnique.mockResolvedValue(null);
    e.certFindMany.mockResolvedValue([]);
    e.certCreate.mockImplementation(async ({ data }) => ({ id: "created", certId: data.certId }));
    e.render.mockResolvedValue(new Uint8Array([1, 2, 3]));
    e.savePdf.mockResolvedValue("/uploads/cert.pdf");
    e.removeAsset.mockResolvedValue(undefined);
  });

  it("issues one unique certificate per recipient and audits each one", async () => {
    await issueCertificatesAction(issueForm);
    expect(e.certCreate).toHaveBeenCalledTimes(2);
    const ids = e.certCreate.mock.calls.map(([call]) => call.data.certId);
    expect(new Set(ids).size).toBe(2);
    expect(ids.every((id: string) => id.startsWith("DIU-SEC-CERT-"))).toBe(true);
    expect(e.savePdf).toHaveBeenCalledTimes(2);
    expect(e.writeAudit).toHaveBeenCalledTimes(2);
    expect(e.writeAudit).toHaveBeenCalledWith(expect.objectContaining({ action: "CREATE", entity: "Certificate" }), tx);
  });

  it("retries when a generated certificate ID is already taken", async () => {
    e.generateCertId
      .mockReturnValueOnce("DIU-SEC-CERT-AAAAAA")
      .mockReturnValueOnce("DIU-SEC-CERT-BBBBBB");
    e.certFindUnique.mockResolvedValueOnce({ id: "taken" }).mockResolvedValueOnce(null);
    await issueCertificatesAction(
      fd([
        ["eventId", EVENT],
        ["type", "PARTICIPANT"],
        ["recipients", "Jane Doe, jane@diu.edu.bd"],
      ]),
    );
    expect(e.certCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ certId: "DIU-SEC-CERT-BBBBBB" }) }),
    );
  });

  it("removes generated PDFs when issuance conflicts in the database", async () => {
    e.transaction.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError("duplicate", { code: "P2002", clientVersion: "6.19.3" }),
    );
    await expect(issueCertificatesAction(issueForm)).rejects.toThrow(/conflicted/i);
    expect(e.removeAsset).toHaveBeenCalledTimes(2);
  });

  it("lets a super admin issue without an event", async () => {
    await issueCertificatesAction(
      fd([
        ["type", "EXECUTIVE"],
        ["recipients", "Jane Doe, jane@diu.edu.bd"],
      ]),
    );
    expect(e.certCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ eventId: null }) }),
    );
  });

  it("refuses duplicate recipients in one batch before writing PDFs", async () => {
    await expect(
      issueCertificatesAction(
        fd([
          ["eventId", EVENT],
          ["type", "PARTICIPANT"],
          ["recipients", "Jane Doe, jane@diu.edu.bd\nJane Again, JANE@diu.edu.bd"],
        ]),
      ),
    ).rejects.toThrow(/duplicate/i);
    expect(e.render).not.toHaveBeenCalled();
  });

  it("refuses to reissue an existing certificate for the same event and type", async () => {
    e.certFindMany.mockResolvedValue([{ recipientEmail: "jane@diu.edu.bd" }]);
    await expect(
      issueCertificatesAction(
        fd([
          ["eventId", EVENT],
          ["type", "PARTICIPANT"],
          ["recipients", "Jane Doe, jane@diu.edu.bd"],
        ]),
      ),
    ).rejects.toThrow(/already issued/i);
    expect(e.render).not.toHaveBeenCalled();
  });

  it("denies a wing lead issuing for another wing's event", async () => {
    e.requireActor.mockResolvedValue({ id: "u1", role: "WING_LEAD", wingId: "w1" });
    e.eventFindUnique.mockResolvedValue({ id: EVENT, wingId: "w2", title: "Hackathon" });
    await expect(issueCertificatesAction(issueForm)).rejects.toThrow(ForbiddenError);
    expect(e.certCreate).not.toHaveBeenCalled();
  });

  it("revokes a certificate once and audits it", async () => {
    e.certFindUnique.mockResolvedValue({
      id: "cert1",
      certId: "DIU-SEC-CERT-A1B2C3",
      status: "VALID",
      event: { wingId: null },
    });
    await revokeCertificateAction(
      fd([
        ["certId", "DIU-SEC-CERT-A1B2C3"],
        ["reason", "Duplicate entry"],
      ]),
    );
    expect(e.certUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "cert1" },
        data: expect.objectContaining({ status: "REVOKED", revokeReason: "Duplicate entry" }),
      }),
    );
    expect(e.writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "REVOKE",
        entity: "Certificate",
        after: expect.objectContaining({ certId: "DIU-SEC-CERT-A1B2C3" }),
      }),
      tx,
    );
  });

  it("does not re-audit an already revoked certificate", async () => {
    e.certFindUnique.mockResolvedValue({
      id: "cert1",
      certId: "DIU-SEC-CERT-A1B2C3",
      status: "REVOKED",
      event: { wingId: null },
    });
    await revokeCertificateAction(fd([["certId", "DIU-SEC-CERT-A1B2C3"]]));
    expect(e.certUpdate).not.toHaveBeenCalled();
    expect(e.writeAudit).not.toHaveBeenCalled();
  });

  it("denies a wing lead revoking another wing's certificate", async () => {
    e.requireActor.mockResolvedValue({ id: "u1", role: "WING_LEAD", wingId: "w1" });
    e.certFindUnique.mockResolvedValue({
      id: "cert1",
      certId: "DIU-SEC-CERT-A1B2C3",
      status: "VALID",
      event: { wingId: "w2" },
    });
    await expect(
      revokeCertificateAction(fd([["certId", "DIU-SEC-CERT-A1B2C3"]])),
    ).rejects.toThrow(ForbiddenError);
    expect(e.certUpdate).not.toHaveBeenCalled();
  });
});
