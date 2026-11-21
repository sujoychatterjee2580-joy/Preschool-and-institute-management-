import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AIService } from "@/lib/ai-service";
import { WhatsAppService } from "@/lib/whatsapp";

// GET: Recent diary entries
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");

    const tenant = await prisma.tenant.findFirst();
    if (!tenant) return NextResponse.json({ error: "Center not found" }, { status: 404 });

    const where: any = { tenantId: tenant.id };
    if (studentId) where.studentId = studentId;

    const diaries = await prisma.dailyKidDiary.findMany({
      where,
      include: {
        student: {
          include: {
            classBatch: true,
            parents: { include: { parent: true } },
          },
        },
      },
      orderBy: { date: "desc" },
      take: 30,
    });

    const students = await prisma.student.findMany({
      where: { tenantId: tenant.id, status: "ACTIVE" },
      include: { classBatch: true },
    });

    return NextResponse.json({ diaries, students, tenant });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Generate AI Note & Save / Send Daily Kid Diary to WhatsApp
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { studentId, mood, mealIntake, napMinutes, pottyCount, activities, sendWhatsApp } = body;

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        tenant: true,
        parents: { include: { parent: true } },
      },
    });

    if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

    const dateStr = new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    // 1. Generate heartfelt AI summary
    const aiNote = AIService.generateDailyDiaryNote({
      studentName: student.firstName,
      mood: mood || "PLAYFUL",
      mealIntake: mealIntake || "FINISHED_ALL",
      napMinutes: Number(napMinutes) || 45,
      activities: activities || "Circle time, Rhyme storytelling, Coloring",
      dateStr,
    });

    // 2. Save in database
    const diary = await prisma.dailyKidDiary.create({
      data: {
        tenantId: student.tenantId,
        studentId: student.id,
        date: new Date(),
        mood: mood || "PLAYFUL",
        mealIntake: mealIntake || "FINISHED_ALL",
        napMinutes: Number(napMinutes) || 45,
        pottyCount: Number(pottyCount) || 2,
        activities: activities || "Circle time, Rhyme storytelling, Coloring",
        aiGeneratedNote: aiNote,
        sentViaWhatsApp: Boolean(sendWhatsApp),
        sentAt: sendWhatsApp ? new Date() : null,
      },
    });

    // 3. Send via WhatsApp to primary parent
    let waLog = null;
    const primaryParent = student.parents[0]?.parent;

    if (sendWhatsApp && primaryParent?.phone) {
      waLog = await WhatsAppService.sendMessage({
        tenantId: student.tenantId,
        recipientPhone: primaryParent.phone,
        recipientName: `${primaryParent.name} (${student.firstName})`,
        messageType: "DIARY_UPDATE",
        text: aiNote,
      });
    }

    return NextResponse.json({
      success: true,
      diary,
      aiNote,
      waLog,
    });
  } catch (err: any) {
    console.error("Diary post error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
