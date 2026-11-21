import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AIService } from "@/lib/ai-service";
import { WhatsAppService } from "@/lib/whatsapp";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const tenant = await prisma.tenant.findFirst();
    if (!tenant) return NextResponse.json({ error: "Center not found" }, { status: 404 });

    const whereClause: any = { tenantId: tenant.id };
    if (status && status !== "ALL") {
      whereClause.status = status;
    }

    const invoices = await prisma.feeInvoice.findMany({
      where: whereClause,
      include: {
        student: {
          include: {
            classBatch: true,
            parents: {
              include: { parent: true },
            },
          },
        },
      },
      orderBy: { dueDate: "asc" },
    });

    return NextResponse.json({ invoices, tenant });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Send 1-Click WhatsApp Fee Reminder or Bulk Reminder
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { invoiceId, bulk } = body;

    const tenant = await prisma.tenant.findFirst();
    if (!tenant) return NextResponse.json({ error: "Center not found" }, { status: 404 });

    if (bulk) {
      // Send reminders to all pending/overdue invoices
      const pendingInvoices = await prisma.feeInvoice.findMany({
        where: {
          tenantId: tenant.id,
          status: { in: ["PENDING", "OVERDUE"] },
        },
        include: {
          student: {
            include: { parents: { include: { parent: true } } },
          },
        },
      });

      let sentCount = 0;
      for (const inv of pendingInvoices) {
        const primaryParent = inv.student.parents[0]?.parent;
        if (!primaryParent?.phone) continue;

        const reminderLevel: 1 | 2 | 3 = inv.status === "OVERDUE" ? 3 : inv.reminderCount > 0 ? 2 : 1;
        const studentName = `${inv.student.firstName} ${inv.student.lastName}`;
        const dueDateStr = new Date(inv.dueDate).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });

        const paymentLink = inv.paymentLink || `https://pay.example.com/${inv.id}`;

        const msgText = AIService.generateFeeReminderMessage({
          studentName,
          parentName: primaryParent.name,
          month: inv.month,
          amount: inv.netAmount,
          currency: tenant.currency,
          dueDate: dueDateStr,
          paymentLink,
          reminderLevel,
          centerName: tenant.name,
          upiId: tenant.upiId || undefined,
        });

        await WhatsAppService.sendMessage({
          tenantId: tenant.id,
          recipientPhone: primaryParent.phone,
          recipientName: `${primaryParent.name} (${studentName})`,
          messageType: "FEE_REMINDER",
          text: msgText,
        });

        await prisma.feeInvoice.update({
          where: { id: inv.id },
          data: {
            reminderCount: { increment: 1 },
            lastReminderSentAt: new Date(),
          },
        });

        sentCount++;
      }

      return NextResponse.json({ success: true, count: sentCount, message: `Dispatched ${sentCount} WhatsApp fee reminders.` });
    }

    // Single invoice reminder
    const invoice = await prisma.feeInvoice.findUnique({
      where: { id: invoiceId },
      include: {
        student: {
          include: { parents: { include: { parent: true } } },
        },
      },
    });

    if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

    const primaryParent = invoice.student.parents[0]?.parent;
    if (!primaryParent?.phone) {
      return NextResponse.json({ error: "No parent phone number found for this student" }, { status: 400 });
    }

    const reminderLevel: 1 | 2 | 3 = invoice.status === "OVERDUE" ? 3 : invoice.reminderCount > 0 ? 2 : 1;
    const studentName = `${invoice.student.firstName} ${invoice.student.lastName}`;
    const dueDateStr = new Date(invoice.dueDate).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    const paymentLink = invoice.paymentLink || `https://pay.example.com/${invoice.id}`;

    const messageText = AIService.generateFeeReminderMessage({
      studentName,
      parentName: primaryParent.name,
      month: invoice.month,
      amount: invoice.netAmount,
      currency: tenant.currency,
      dueDate: dueDateStr,
      paymentLink,
      reminderLevel,
      centerName: tenant.name,
      upiId: tenant.upiId || undefined,
    });

    const log = await WhatsAppService.sendMessage({
      tenantId: tenant.id,
      recipientPhone: primaryParent.phone,
      recipientName: `${primaryParent.name} (${studentName})`,
      messageType: "FEE_REMINDER",
      text: messageText,
    });

    const updated = await prisma.feeInvoice.update({
      where: { id: invoice.id },
      data: {
        reminderCount: { increment: 1 },
        lastReminderSentAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, invoice: updated, log, messageText });
  } catch (err: any) {
    console.error("Fee reminder error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT: Mark as paid or update status
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { invoiceId, status, paymentMethod, transactionRef } = body;

    const invoice = await prisma.feeInvoice.update({
      where: { id: invoiceId },
      data: {
        status,
        paidDate: status === "PAID" ? new Date() : null,
        paymentMethod: paymentMethod || "UPI",
        transactionRef: transactionRef || `TXN-${Date.now().toString().slice(-6)}`,
      },
      include: {
        student: {
          include: { parents: { include: { parent: true } } },
        },
      },
    });

    // If marked as paid, send instant digital confirmation receipt to parent via WhatsApp
    if (status === "PAID") {
      const primaryParent = invoice.student.parents[0]?.parent;
      if (primaryParent?.phone) {
        const studentName = `${invoice.student.firstName} ${invoice.student.lastName}`;
        const receiptMsg = `✅ *Payment Received with Thanks!*\n\nDear ${primaryParent.name},\nWe have successfully received the fee payment of *₹${invoice.netAmount.toLocaleString()}* for ${studentName} (${invoice.month}).\n\n🧾 *Receipt No:* ${invoice.invoiceNumber}\n💳 *Mode:* ${invoice.paymentMethod}\n\nThank you for supporting your child's education journey with us!`;

        await WhatsAppService.sendMessage({
          tenantId: invoice.tenantId,
          recipientPhone: primaryParent.phone,
          recipientName: `${primaryParent.name} (${studentName})`,
          messageType: "FEE_REMINDER",
          text: receiptMsg,
        });
      }
    }

    return NextResponse.json({ success: true, invoice });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
