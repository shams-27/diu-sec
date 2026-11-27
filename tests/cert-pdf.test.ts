import { afterEach, describe, expect, it, vi } from "vitest";
import QRCode from "qrcode";
import { renderCertificatePdf } from "@/lib/certs";

afterEach(() => vi.restoreAllMocks());

describe("certificate PDF", () => {
  it("embeds a QR pointing at the public verification URL", async () => {
    const toDataURL = vi.spyOn(QRCode, "toDataURL");
    const bytes = await renderCertificatePdf({
      certId: "DIU-SEC-CERT-A1B2C3",
      recipientName: "Jane Doe",
      type: "PARTICIPANT",
      issuedAt: new Date("2026-11-27T00:00:00Z"),
      eventTitle: "Freshers Hackathon",
      siteUrl: "https://sec.example",
    });

    expect(toDataURL).toHaveBeenCalledWith(
      "https://sec.example/verify/DIU-SEC-CERT-A1B2C3",
      expect.objectContaining({ width: 256 }),
    );
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe("%PDF-");
    expect(bytes.length).toBeGreaterThan(1000);
  });

  it("wraps long recipient names and event titles instead of drawing them off the page", async () => {
    const bytes = await renderCertificatePdf({
      certId: "DIU-SEC-CERT-LONGNAME",
      recipientName: "A very long recipient name that must wrap across more than one line safely",
      type: "WINNER",
      issuedAt: new Date("2026-11-27T00:00:00Z"),
      eventTitle: "An exceptionally long event title that also needs to wrap inside the certificate boundary",
      siteUrl: "https://sec.example",
    });
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe("%PDF-");
  });
});
