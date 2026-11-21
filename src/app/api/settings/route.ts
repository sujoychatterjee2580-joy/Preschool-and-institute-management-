import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const tenant = await prisma.tenant.findFirst();
    const sampleInvoice = await prisma.feeInvoice.findFirst();
    return NextResponse.json({ tenant, sampleInvoiceId: sampleInvoice?.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name,
      phone,
      email,
      address,
      currency,
      upiId,
      bankName,
      bankAccount,
      bankIfsc,
      portalNotice,
      portalShowAttendance,
      portalShowDiary,
      receiptNote,
      metaWaPhoneId,
      metaWaAccessToken,
      plan,
    } = body;

    const tenant = await prisma.tenant.findFirst();
    if (!tenant) return NextResponse.json({ error: "Center not found" }, { status: 404 });

    const updated = await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        name: name || undefined,
        phone: phone || undefined,
        email: email || undefined,
        address: address || undefined,
        currency: currency || undefined,
        upiId: upiId !== undefined ? upiId : undefined,
        bankName: bankName !== undefined ? bankName : undefined,
        bankAccount: bankAccount !== undefined ? bankAccount : undefined,
        bankIfsc: bankIfsc !== undefined ? bankIfsc : undefined,
        portalNotice: portalNotice !== undefined ? portalNotice : undefined,
        portalShowAttendance: portalShowAttendance !== undefined ? Boolean(portalShowAttendance) : undefined,
        portalShowDiary: portalShowDiary !== undefined ? Boolean(portalShowDiary) : undefined,
        receiptNote: receiptNote !== undefined ? receiptNote : undefined,
        metaWaPhoneId: metaWaPhoneId !== undefined ? metaWaPhoneId : undefined,
        metaWaAccessToken: metaWaAccessToken !== undefined ? metaWaAccessToken : undefined,
        plan: plan || undefined,
      },
    });

    return NextResponse.json({ success: true, tenant: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
