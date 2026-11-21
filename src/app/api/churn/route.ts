import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AIService } from "@/lib/ai-service";
import { WhatsAppService } from "@/lib/whatsapp";

// GET: All students with AI churn risk prediction & retention analysis
export async function GET() {
  try {
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) return NextResponse.json({ error: "Center not found" }, { status: 404 });

    const students = await prisma.student.findMany({
      where: { tenantId: tenant.id },
      include: {
        classBatch: true,
        parents: { include: { parent: true } },
        invoices: {
          orderBy: { dueDate: "desc" },
          take: 3,
        },
        attendance: {
          orderBy: { date: "desc" },
          take: 10,
        },
      },
      orderBy: { churnScore: "desc" },
    });

    return NextResponse.json({ students, tenant });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Run AI Churn Evaluation Model on all students
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { action, studentId } = body;

    const tenant = await prisma.tenant.findFirst();
    if (!tenant) return NextResponse.json({ error: "Center not found" }, { status: 404 });

    // If triggering retention action on single student
    if (action === "SEND_RETENTION_MESSAGE" && studentId) {
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: { parents: { include: { parent: true } } },
      });

      if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });
      const parent = student.parents[0]?.parent;

      if (!parent?.phone) {
        return NextResponse.json({ error: "Parent phone missing" }, { status: 400 });
      }

      const retentionMsg = `Dear ${parent.name},\n\nWe hope you are having a wonderful week! 🌸\n\nOur teachers and friends at ${tenant.name} were missing ${student.firstName} so much in class recently. We are planning a special fun science & storytelling activity tomorrow that ${student.firstName} would truly love!\n\nPlease let us know if everything is well or if we can support you in any way. Looking forward to welcoming ${student.firstName} back! ❤️`;

      await WhatsAppService.sendMessage({
        tenantId: tenant.id,
        recipientPhone: parent.phone,
        recipientName: `${parent.name} (${student.firstName})`,
        messageType: "ANNOUNCEMENT",
        text: retentionMsg,
      });

      return NextResponse.json({ success: true, message: `Retention message sent to ${parent.name}` });
    }

    // Run AI Churn Analysis across all students
    const students = await prisma.student.findMany({
      where: { tenantId: tenant.id, status: "ACTIVE" },
      include: {
        attendance: { orderBy: { date: "desc" }, take: 10 },
        invoices: { where: { status: { in: ["PENDING", "OVERDUE"] } } },
      },
    });

    let updatedCount = 0;

    for (const s of students) {
      const unpaidInvoices = s.invoices.length;
      const recentAttendance = s.attendance;
      const totalDays = recentAttendance.length || 1;
      const presentDays = recentAttendance.filter((a) => a.status === "PRESENT").length;
      const attendancePercent = Math.round((presentDays / totalDays) * 100);

      let consecutiveAbsences = 0;
      for (const a of recentAttendance) {
        if (a.status === "ABSENT") consecutiveAbsences++;
        else break;
      }

      const churnResult = AIService.evaluateChurnRisk({
        studentName: s.firstName,
        consecutiveAbsences,
        monthlyAttendancePercent: attendancePercent,
        unpaidInvoicesCount: unpaidInvoices,
        daysSinceLastParentContact: consecutiveAbsences > 0 ? consecutiveAbsences * 2 : 2,
      });

      await prisma.student.update({
        where: { id: s.id },
        data: {
          churnScore: churnResult.score,
          churnRiskFactors: JSON.stringify({
            level: churnResult.level,
            reasons: churnResult.reasons,
            suggestedAction: churnResult.suggestedAction,
          }),
        },
      });

      updatedCount++;
    }

    return NextResponse.json({
      success: true,
      updatedCount,
      message: `AI Churn risk evaluated for ${updatedCount} students.`,
    });
  } catch (err: any) {
    console.error("Churn evaluation error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
