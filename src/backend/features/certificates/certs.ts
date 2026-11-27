import type { CertType } from "@prisma/client";
import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import QRCode from "qrcode";

export interface CertificatePdfInput {
  certId: string;
  recipientName: string;
  type: CertType;
  issuedAt: Date;
  eventTitle?: string | null;
  siteUrl: string;
}

const WIN_ANSI_CHAR = /^[\x20-\x7E\u00A0-\u00FF]$/;

/** pdf-lib's standard fonts are WinAnsi-only; never let a character abort a batch. */
function pdfSafe(value: string): string {
  return Array.from(value, (char) => (WIN_ANSI_CHAR.test(char) ? char : "?")).join("");
}

/** Fits text inside the printable area, truncating the last line with "...". */
function fitLines(font: PDFFont, value: string, size: number, maxWidth: number, maxLines: number): string[] {
  const lines: string[] = [""];
  for (const char of pdfSafe(value)) {
    const index = lines.length - 1;
    const candidate = lines[index] + char;
    if (!lines[index] || font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      lines[index] = candidate;
      continue;
    }
    if (lines.length < maxLines) {
      lines.push(char);
      continue;
    }
    let last = lines[index];
    while (last.length > 1 && font.widthOfTextAtSize(`${last}...`, size) > maxWidth) last = last.slice(0, -1);
    lines[index] = `${last}...`;
    return lines;
  }
  return lines;
}

/** Landscape A4 certificate with a QR that lands on the public verify page. */
export async function renderCertificatePdf(input: CertificatePdfInput): Promise<Uint8Array> {
  const verifyUrl = `${input.siteUrl.replace(/\/+$/, "")}/verify/${input.certId}`;
  const dataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 256 });
  const qrPng = Buffer.from(dataUrl.split(",")[1] ?? "", "base64");

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([842, 595]);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const ink = rgb(0.09, 0.16, 0.29);
  const accent = rgb(0.13, 0.45, 0.79);

  page.drawRectangle({ x: 22, y: 22, width: 798, height: 551, borderColor: accent, borderWidth: 3 });
  page.drawText("DIU SOFTWARE ENGINEERING CLUB", { x: 60, y: 520, size: 12, font: bold, color: accent });
  page.drawText("CERTIFICATE OF ACHIEVEMENT", { x: 60, y: 460, size: 30, font: bold, color: ink });
  page.drawText("This is proudly presented to", { x: 60, y: 410, size: 13, font: regular, color: ink });

  const nameSize = input.recipientName.length > 34 ? 25 : 36;
  const nameLines = fitLines(bold, input.recipientName, nameSize, 700, 2);
  const nameSpacing = nameSize + 4;
  nameLines.forEach((line, index) => {
    page.drawText(line, { x: 60, y: 355 - index * nameSpacing, size: nameSize, font: bold, color: accent });
  });
  const ruleY = 355 - (nameLines.length - 1) * nameSpacing - 16;
  page.drawLine({ start: { x: 60, y: ruleY }, end: { x: 742, y: ruleY }, thickness: 1, color: accent });

  const label = pdfSafe(`for ${String(input.type).replace("_", " ").toLowerCase()} contribution`);
  const labelY = ruleY - 28;
  page.drawText(label, { x: 60, y: labelY, size: 16, font: regular, color: ink });
  if (input.eventTitle) {
    fitLines(bold, input.eventTitle, 14, 700, 2).forEach((line, index) => {
      page.drawText(line, { x: 60, y: labelY - 24 - index * 18, size: 14, font: bold, color: ink });
    });
  }

  const qr = await pdf.embedPng(qrPng);
  page.drawImage(qr, { x: 675, y: 70, width: 108, height: 108 });
  page.drawText("Scan to verify", { x: 665, y: 55, size: 9, font: regular, color: ink });

  page.drawText(pdfSafe(`Certificate ID: ${input.certId}`), { x: 60, y: 180, size: 12, font: bold, color: ink });
  page.drawText(
    pdfSafe(
      `Issued ${input.issuedAt.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}`,
    ),
    { x: 60, y: 158, size: 11, font: regular, color: ink },
  );
  page.drawText(pdfSafe(verifyUrl), { x: 60, y: 70, size: 9, font: regular, color: accent });

  return pdf.save();
}
