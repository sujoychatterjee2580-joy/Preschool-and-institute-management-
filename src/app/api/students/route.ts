import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: List all students with class & parents
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.toLowerCase();

    const tenant = await prisma.tenant.findFirst();
    if (!tenant) return NextResponse.json({ error: "Center not found" }, { status: 404 });

    const students = await prisma.student.findMany({
      where: { tenantId: tenant.id },
      include: {
        classBatch: true,
        parents: { include: { parent: true } },
      },
      orderBy: { rollNumber: "asc" },
    });

    const filtered = search
      ? students.filter(
          (s) =>
            s.firstName.toLowerCase().includes(search) ||
            s.lastName.toLowerCase().includes(search) ||
            s.rollNumber.toLowerCase().includes(search)
        )
      : students;

    const batches = await prisma.classBatch.findMany({
      where: { tenantId: tenant.id },
    });

    return NextResponse.json({ students: filtered, batches, tenant });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Add new student + parent + initial monthly invoice
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { firstName, lastName, rollNumber, classBatchId, parentName, parentPhone } = body;

    const tenant = await prisma.tenant.findFirst();
    if (!tenant) return NextResponse.json({ error: "Center not found" }, { status: 404 });

    if (!firstName || !rollNumber || !classBatchId || !parentPhone) {
      return NextResponse.json({ error: "Required fields missing" }, { status: 400 });
    }

    const batch = await prisma.classBatch.findUnique({
      where: { id: classBatchId },
    });

    // 1. Create Student
    const student = await prisma.student.create({
      data: {
        tenantId: tenant.id,
        classBatchId,
        rollNumber,
        firstName,
        lastName: lastName || "",
        status: "ACTIVE",
      },
    });

    // 2. Create Parent
    const parent = await prisma.parent.create({
      data: {
        tenantId: tenant.id,
        name: parentName || "Parent",
        phone: parentPhone,
      },
    });

    await prisma.studentParent.create({
      data: {
        studentId: student.id,
        parentId: parent.id,
        isPrimary: true,
      },
    });

    // 3. Create Current Month Invoice
    const now = new Date();
    const currentMonth = now.toLocaleString("en-US", { month: "long", year: "numeric" });
    const feeAmount = batch?.monthlyFee || 1800;

    await prisma.feeInvoice.create({
      data: {
        tenantId: tenant.id,
        studentId: student.id,
        invoiceNumber: `INV-${rollNumber}-${Date.now().toString().slice(-4)}`,
        month: currentMonth,
        amount: feeAmount,
        netAmount: feeAmount,
        status: "PENDING",
        dueDate: new Date(now.getFullYear(), now.getMonth(), 10),
        paymentLink: `https://pay.example.com/${student.id}`,
      },
    });

    return NextResponse.json({ success: true, student });
  } catch (err: any) {
    console.error("Student create error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT: Edit student & parent details
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, firstName, lastName, rollNumber, classBatchId, parentName, parentPhone } = body;

    const student = await prisma.student.update({
      where: { id },
      data: {
        firstName,
        lastName,
        rollNumber,
        classBatchId,
      },
      include: {
        parents: { include: { parent: true } },
      },
    });

    const primaryParent = student.parents[0]?.parent;
    if (primaryParent && (parentName || parentPhone)) {
      await prisma.parent.update({
        where: { id: primaryParent.id },
        data: {
          name: parentName || primaryParent.name,
          phone: parentPhone || primaryParent.phone,
        },
      });
    }

    return NextResponse.json({ success: true, student });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE: Delete student and cascades
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "Student ID required" }, { status: 400 });

    await prisma.student.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Student deleted successfully" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
