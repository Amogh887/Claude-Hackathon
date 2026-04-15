import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireSession } from "@/lib/auth-server";
import { parseResumeFromPdf } from "@/lib/claude";

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const { resumeUrl } = await req.json();
    if (!resumeUrl) {
      return NextResponse.json({ error: "Missing resumeUrl" }, { status: 400 });
    }

    const pdfRes = await fetch(resumeUrl);
    if (!pdfRes.ok) {
      return NextResponse.json(
        { error: "Could not download resume PDF" },
        { status: 400 }
      );
    }
    const arrayBuffer = await pdfRes.arrayBuffer();
    const pdfBytes = Buffer.from(arrayBuffer);

    if (pdfBytes.length > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "PDF too large" }, { status: 400 });
    }

    const extracted = await parseResumeFromPdf(pdfBytes);

    await getAdminDb().collection("users").doc(session.uid).update({
      resumeUrl,
      extractedResume: extracted,
      updatedAt: Date.now(),
    });

    return NextResponse.json({ success: true, extracted });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Resume parse failed:", err);
    return NextResponse.json(
      { error: "Failed to parse resume" },
      { status: 500 }
    );
  }
}
