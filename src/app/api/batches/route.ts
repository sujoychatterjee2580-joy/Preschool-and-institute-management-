import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: List all batches with student count
export async function GET() {
  try {
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) return NextResponse.json({ error: "Center not found" }, { status: 404 });

    const batches = await prisma.classBatch.findMany({
      where: { tenantId: tenant.id },
      include: {
        _count: { select: { students: true } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ batches });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Add new class batch
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, room, monthlyFee, defaultStartTime, defaultEndTime } = body;

    const tenant = await prisma.tenant.findFirst();
    if (!tenant) return NextResponse.json({ error: "Center not found" }, { status: 404 });

    if (!name || !monthlyFee) {
      return NextResponse.json({ error: "Batch name and monthly fee required" }, { status: 400 });
    }

    const batch = await prisma.classBatch.create({
      data: {
        tenantId: tenant.id,
        name,
        room: room || "Room A",
        monthlyFee: parseFloat(monthlyFee),
        defaultStartTime: defaultStartTime || "09:00 AM",
        defaultEndTime: defaultEndTime || "12:30 PM",
      },
    });

    return NextResponse.json({ success: true, batch });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE: Delete batch
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "Batch ID required" }, { status: 400 });

    await prisma.classBatch.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Batch deleted" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
