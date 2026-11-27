"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MemberStatus } from "@prisma/client";
import { PDFDocument } from "pdf-lib";
import { Button } from "@/components/ui/button";

export interface CardMember {
  name: string;
  studentId: string;
  email: string;
  batch?: string | null;
  memberCardNo?: string | null;
  status: MemberStatus;
  wingName?: string | null;
}

const WIDTH = 1000;
const HEIGHT = 600;

export function MemberIdCard({ member }: { member: CardMember }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [busy, setBusy] = useState(false);
  const watermark = member.status === "APPROVED" ? "ACTIVE" : member.status === "PENDING" ? "PENDING APPROVAL" : "INVALID";

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const styles = getComputedStyle(document.documentElement);
    const token = (name: string, fallback: string) => styles.getPropertyValue(name).trim() || fallback;
    const primary = token("--primary", "#b91c1c");
    const foreground = token("--foreground", "#7f1d1d");
    const muted = token("--muted-foreground", "#475569");
    const card = token("--card", "#ffffff");
    const border = token("--border", "#fecaca");
    const headingFont = token("--font-bebas", '"Bebas Neue", sans-serif');
    const bodyFont = token("--font-source-sans", '"Source Sans 3", sans-serif');

    const scale = window.devicePixelRatio || 1;
    canvas.width = WIDTH * scale;
    canvas.height = HEIGHT * scale;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.fillStyle = card;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = primary;
    ctx.fillRect(0, 0, WIDTH, 130);
    ctx.strokeStyle = border;
    ctx.lineWidth = 4;
    ctx.strokeRect(4, 4, WIDTH - 8, HEIGHT - 8);

    ctx.fillStyle = "#ffffff";
    ctx.font = `64px ${headingFont}`;
    ctx.fillText("DIU SEC", 56, 88);
    ctx.font = `26px ${bodyFont}`;
    ctx.fillText("DIGITAL MEMBER ID", 300, 84);

    ctx.fillStyle = foreground;
    ctx.font = `bold 52px ${bodyFont}`;
    ctx.fillText(member.name, 56, 220);
    ctx.fillStyle = muted;
    ctx.font = `32px ${bodyFont}`;
    ctx.fillText(member.studentId, 56, 276);
    ctx.fillText(member.email, 56, 322);
    ctx.font = `26px ${bodyFont}`;
    ctx.fillText([member.batch && `Batch ${member.batch}`, member.wingName].filter(Boolean).join("  ·  "), 56, 368);

    ctx.fillStyle = primary;
    ctx.fillRect(56, 420, 888, 2);
    ctx.fillStyle = muted;
    ctx.font = `22px ${bodyFont}`;
    ctx.fillText("MEMBER ID", 56, 470);
    ctx.fillStyle = foreground;
    ctx.font = `bold 40px ${bodyFont}`;
    ctx.fillText(member.memberCardNo ?? "PENDING", 56, 520);
    ctx.fillStyle = muted;
    ctx.font = `22px ${bodyFont}`;
    ctx.fillText("Software Engineering Club · Daffodil International University", 56, 566);

    ctx.save();
    ctx.translate(WIDTH / 2, HEIGHT / 2);
    ctx.rotate(-Math.PI / 7);
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = primary;
    ctx.font = `bold 110px ${headingFont}`;
    ctx.textAlign = "center";
    ctx.fillText(watermark, 0, 0);
    ctx.restore();
  }, [member, watermark]);

  useEffect(() => {
    draw();
    void document.fonts.ready.then(draw);
  }, [draw]);

  async function download(format: "png" | "pdf") {
    draw();
    const canvas = canvasRef.current;
    if (!canvas) return;
    setBusy(true);
    try {
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob((result) => (result ? resolve(result) : reject(new Error("PNG export failed"))), "image/png"),
      );
      if (format === "png") {
        saveBlob(blob, `diu-sec-id-${member.studentId}.png`);
        return;
      }
      const pdf = await PDFDocument.create();
      const image = await pdf.embedPng(new Uint8Array(await blob.arrayBuffer()));
      const page = pdf.addPage([WIDTH, HEIGHT]);
      page.drawImage(image, { x: 0, y: 0, width: WIDTH, height: HEIGHT });
      saveBlob(new Blob([new Uint8Array(await pdf.save())], { type: "application/pdf" }), `diu-sec-id-${member.studentId}.pdf`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={`${member.name}, ${member.studentId}, ${member.email}. Member ID ${member.memberCardNo ?? "pending"}. ${watermark}.`}
        className="h-auto w-full max-w-[600px] rounded-xl border border-border shadow-sm"
      />
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {member.status === "PENDING"
          ? "Pending approval — your card becomes active once an admin approves it."
          : member.status === "APPROVED"
            ? "Active member card."
            : "This card is no longer valid."}
      </p>
      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="outline" disabled={busy} onClick={() => void download("png")}>
          Download PNG
        </Button>
        <Button type="button" variant="outline" disabled={busy} onClick={() => void download("pdf")}>
          Download PDF
        </Button>
      </div>
    </div>
  );
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
