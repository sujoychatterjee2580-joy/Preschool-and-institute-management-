import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const tenant = await prisma.tenant.findFirst();
    return NextResponse.json({ tenant });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, phone, email, address, currency, upiId, metaWaPhoneId, metaWaAccessToken, plan } = body;

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
