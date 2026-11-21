import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { WhatsAppService } from "@/lib/whatsapp";

// GET: Attendance list for a specific date or today
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date");

    const targetDate = dateParam ? new Date(dateParam) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    const tenant = await prisma.tenant.findFirst();
    if (!tenant) return NextResponse.json({ error: "Center not found" }, { status: 404 });

    const classes = await prisma.classBatch.findMany({
      where: { tenantId: tenant.id },
      include: {
        students: {
          include: {
            parents: { include: { parent: true } },
            attendance: {
              where: { date: targetDate },
            },
          },
        },
      },
    });

    return NextResponse.json({ classes, targetDate, tenant });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Mark / Toggle student attendance and trigger instant WhatsApp safety alert
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { studentId, status, date, qrCodeId, sendAlert } = body;

    const tenant = await prisma.tenant.findFirst();
    if (!tenant) return NextResponse.json({ error: "Center not found" }, { status: 404 });

    let student = null;
    if (qrCodeId) {
      student = await prisma.student.findUnique({
        where: { qrCodeId },
        include: {
          classBatch: true,
          parents: { include: { parent: true } },
        },
      });
    } else if (studentId) {
      student = await prisma.student.findUnique({
        where: { id: studentId },
        include: {
          classBatch: true,
          parents: { include: { parent: true } },
        },
      });
    }

    if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    const checkInTime =
      status === "PRESENT"
        ? new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
        : null;

    const attendanceRecord = await prisma.attendance.upsert({
      where: {
        studentId_date: {
          studentId: student.id,
          date: targetDate,
        },
      },
      update: {
        status: status || "PRESENT",
        checkInTime: checkInTime || undefined,
        notifiedParent: sendAlert !== false,
      },
      create: {
        tenantId: tenant.id,
        studentId: student.id,
        classBatchId: student.classBatchId,
        date: targetDate,
        status: status || "PRESENT",
        checkInTime,
        notifiedParent: sendAlert !== false,
      },
    });

    // Send WhatsApp Safety Alert to Parent
    const primaryParent = student.parents[0]?.parent;
    let waLog = null;

    if (sendAlert !== false && primaryParent?.phone) {
      const studentName = `${student.firstName} ${student.lastName}`;
      let alertMsg = "";

      if (status === "PRESENT") {
        alertMsg = `🌟 *Safe Arrival Update - ${tenant.name}*\n\nDear ${primaryParent.name},\n${studentName} has arrived safely at school and checked in at *${checkInTime || "on time"}*.\n\nWishing ${student.firstName} an exciting day of learning! 🎈`;
      } else if (status === "ABSENT") {
        alertMsg = `🔔 *Attendance Alert - ${tenant.name}*\n\nDear ${primaryParent.name},\nWe noticed that ${studentName} has not checked in today. If ${student.firstName} is unwell or taking leave, please reply to let us know. Take care! ❤️`;
      }

      if (alertMsg) {
        waLog = await WhatsAppService.sendMessage({
          tenantId: tenant.id,
          recipientPhone: primaryParent.phone,
          recipientName: `${primaryParent.name} (${studentName})`,
          messageType: "ATTENDANCE_ALERT",
          text: alertMsg,
        });
      }
    }

    return NextResponse.json({
      success: true,
      student,
      attendance: attendanceRecord,
      notified: Boolean(waLog),
    });
  } catch (err: any) {
    console.error("Attendance mark error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
