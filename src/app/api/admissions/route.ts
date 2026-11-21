import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AIService } from "@/lib/ai-service";
import { WhatsAppService } from "@/lib/whatsapp";

// GET: Inquiries list
export async function GET(req: Request) {
  try {
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) return NextResponse.json({ error: "Center not found" }, { status: 404 });

    const inquiries = await prisma.admissionInquiry.findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: "desc" },
    });

    const waLogs = await prisma.whatsAppMessageLog.findMany({
      where: { tenantId: tenant.id, type: "ADMISSION_BOT" },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({ inquiries, waLogs, tenant });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Simulate or Process Incoming Parent Chat on WhatsApp
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { parentPhone, parentName, messageText, action, inquiryId, demoDate, status } = body;

    const tenant = await prisma.tenant.findFirst();
    if (!tenant) return NextResponse.json({ error: "Center not found" }, { status: 404 });

    // If updating inquiry directly (e.g. booked demo or enrolled)
    if (action === "UPDATE_STATUS" && inquiryId) {
      const updated = await prisma.admissionInquiry.update({
        where: { id: inquiryId },
        data: {
          status: status || undefined,
          demoDate: demoDate ? new Date(demoDate) : undefined,
        },
      });
      return NextResponse.json({ success: true, inquiry: updated });
    }

    if (!messageText || !parentPhone) {
      return NextResponse.json({ error: "Phone number and message text required" }, { status: 400 });
    }

    // 1. Run AI Admission Agent logic
    const aiResult = AIService.generateAdmissionReply({
      incomingText: messageText,
      parentName,
      centerName: tenant.name,
      feesInfo: "₹1,500 - ₹2,200/month",
    });

    // 2. Find or create inquiry
    let inquiry = await prisma.admissionInquiry.findFirst({
      where: { tenantId: tenant.id, phone: parentPhone },
    });

    const isDemoIntent = aiResult.detectedIntent === "BOOK_DEMO";
    const newStatus = isDemoIntent ? "DEMO_BOOKED" : inquiry ? inquiry.status : "NEW";

    if (!inquiry) {
      inquiry = await prisma.admissionInquiry.create({
        data: {
          tenantId: tenant.id,
          parentName: parentName || "Prospective Parent",
          childName: "Child",
          phone: parentPhone,
          source: "WHATSAPP_BOT",
          status: newStatus,
          interestLevel: "HIGH",
          notes: `Intent: ${aiResult.detectedIntent}. ${aiResult.suggestedFollowUp}`,
          demoDate: isDemoIntent ? new Date(Date.now() + 86400000 * 2) : null,
          conversationLog: JSON.stringify([
            { sender: "parent", text: messageText, timestamp: new Date() },
            { sender: "ai_bot", text: aiResult.reply, timestamp: new Date() },
          ]),
        },
      });
    } else {
      let existingLogs = [];
      try {
        existingLogs = inquiry.conversationLog ? JSON.parse(inquiry.conversationLog) : [];
      } catch (e) {
        existingLogs = [];
      }
      existingLogs.push({ sender: "parent", text: messageText, timestamp: new Date() });
      existingLogs.push({ sender: "ai_bot", text: aiResult.reply, timestamp: new Date() });

      inquiry = await prisma.admissionInquiry.update({
        where: { id: inquiry.id },
        data: {
          status: newStatus,
          demoDate: isDemoIntent ? new Date(Date.now() + 86400000 * 2) : inquiry.demoDate,
          conversationLog: JSON.stringify(existingLogs),
        },
      });
    }

    // 3. Dispatch WhatsApp response
    const waLog = await WhatsAppService.sendMessage({
      tenantId: tenant.id,
      recipientPhone: parentPhone,
      recipientName: parentName || "Prospective Parent",
      messageType: "ADMISSION_BOT",
      text: aiResult.reply,
    });

    return NextResponse.json({
      success: true,
      aiReply: aiResult.reply,
      detectedIntent: aiResult.detectedIntent,
      suggestedFollowUp: aiResult.suggestedFollowUp,
      inquiry,
      waLog,
    });
  } catch (err: any) {
    console.error("Admissions POST error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
