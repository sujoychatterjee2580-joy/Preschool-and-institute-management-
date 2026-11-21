import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) {
      return NextResponse.json({ error: "No center found" }, { status: 404 });
    }

    const totalStudents = await prisma.student.count({ where: { tenantId: tenant.id } });
    const activeStudents = await prisma.student.count({ where: { tenantId: tenant.id, status: "ACTIVE" } });

    // Fees calculation
    const allInvoices = await prisma.feeInvoice.findMany({ where: { tenantId: tenant.id } });
    const totalCollected = allInvoices
      .filter((inv) => inv.status === "PAID")
      .reduce((sum, inv) => sum + inv.netAmount, 0);

    const totalPendingFees = allInvoices
      .filter((inv) => inv.status === "PENDING" || inv.status === "OVERDUE")
      .reduce((sum, inv) => sum + inv.netAmount, 0);

    const monthlyRevenue = totalCollected + totalPendingFees;

    // Today's attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayAttendance = await prisma.attendance.findMany({
      where: { tenantId: tenant.id, date: today },
    });

    const presentCount = todayAttendance.filter((a) => a.status === "PRESENT").length;
    const absentCount = todayAttendance.filter((a) => a.status === "ABSENT").length;
    const todayAttendanceRate = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

    // Churn risk students (score > 60)
    const highRiskStudentsCount = await prisma.student.count({
      where: { tenantId: tenant.id, churnScore: { gte: 50 } },
    });

    // Inquiries
    const newInquiriesThisWeek = await prisma.admissionInquiry.count({
      where: { tenantId: tenant.id },
    });

    return NextResponse.json({
      tenant,
      metrics: {
        totalStudents,
        activeStudents,
        monthlyRevenue,
        totalCollected,
        totalPendingFees,
        todayAttendanceRate,
        presentCount,
        absentCount,
        highRiskStudentsCount,
        newInquiriesThisWeek,
      },
    });
  } catch (err: any) {
    console.error("Dashboard stats error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
