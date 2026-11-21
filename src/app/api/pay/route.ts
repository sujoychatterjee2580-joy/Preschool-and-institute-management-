import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Invoice ID required" }, { status: 400 });
    }

    const tenant = await prisma.tenant.findFirst();
    if (!tenant) return NextResponse.json({ error: "Center not found" }, { status: 404 });

    // Look up by invoice ID or invoiceNumber or studentId
    const invoice = await prisma.feeInvoice.findFirst({
      where: {
        OR: [{ id }, { invoiceNumber: id }, { studentId: id }],
      },
      include: {
        student: {
          include: {
            classBatch: true,
            parents: { include: { parent: true } },
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json({ invoice, tenant });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
