import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AIService } from "@/lib/ai-service";
import { WhatsAppService } from "@/lib/whatsapp";

// GET: Meta WhatsApp Webhook verification handshake
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = process.env.META_WA_VERIFY_TOKEN || "preschool_secret_token";

  if (mode === "subscribe" && token === verifyToken) {
    console.log("Meta WhatsApp webhook verified successfully!");
    return new Response(challenge, { status: 200 });
  }

  return new Response("Forbidden", { status: 403 });
}

// POST: Handle live incoming messages from Meta WhatsApp Cloud API
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const message = value?.messages?.[0];

    if (!message || message.type !== "text") {
      return NextResponse.json({ status: "ignored" });
    }

    const fromPhone = message.from; // e.g. "919876543210"
    const incomingText = message.text?.body || "";
    const senderName = value?.contacts?.[0]?.profile?.name || "Parent";

    const tenant = await prisma.tenant.findFirst();
    if (!tenant) return NextResponse.json({ error: "No tenant" }, { status: 404 });

    // 1. Process via AI Counselor
    const aiResult = AIService.generateAdmissionReply({
      incomingText,
      parentName: senderName,
      centerName: tenant.name,
    });

    // 2. Dispatch Reply
    await WhatsAppService.sendMessage({
      tenantId: tenant.id,
      recipientPhone: fromPhone,
      recipientName: senderName,
      messageType: "ADMISSION_BOT",
      text: aiResult.reply,
    });

    return NextResponse.json({ status: "processed", reply: aiResult.reply });
  } catch (err: any) {
    console.error("Meta Webhook error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
