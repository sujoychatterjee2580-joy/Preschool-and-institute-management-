import { prisma } from "./prisma";

export interface SendWhatsAppParams {
  tenantId: string;
  recipientPhone: string;
  recipientName?: string;
  messageType: 'FEE_REMINDER' | 'ATTENDANCE_ALERT' | 'DIARY_UPDATE' | 'ADMISSION_BOT' | 'ANNOUNCEMENT';
  text: string;
}

export class WhatsAppService {
  /**
   * Dispatches WhatsApp message via Meta Cloud API if credentials exist,
   * or safely logs it to the local audit trail simulator.
   */
  static async sendMessage(params: SendWhatsAppParams) {
    const { tenantId, recipientPhone, recipientName, messageType, text } = params;

    // Check tenant's Meta Cloud API credentials
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { metaWaPhoneId: true, metaWaAccessToken: true, name: true },
    });

    let status = 'SENT';
    let metaMessageId = `sim_msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    if (tenant?.metaWaPhoneId && tenant?.metaWaAccessToken) {
      try {
        const cleanPhone = recipientPhone.replace(/[^0-9]/g, '');
        const metaUrl = `https://graph.facebook.com/v20.0/${tenant.metaWaPhoneId}/messages`;

        const response = await fetch(metaUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${tenant.metaWaAccessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: cleanPhone,
            type: 'text',
            text: { preview_url: true, body: text },
          }),
        });

        const data = await response.json();
        if (response.ok && data.messages?.[0]?.id) {
          metaMessageId = data.messages[0].id;
          status = 'DELIVERED';
        } else {
          console.error("Meta API error, falling back to local dispatch:", data);
        }
      } catch (err) {
        console.error("Failed to connect to Meta WhatsApp Cloud API:", err);
      }
    }

    // Record in WhatsApp Message Audit Log
    const log = await prisma.whatsAppMessageLog.create({
      data: {
        tenantId,
        recipientPhone,
        recipientName: recipientName || 'Parent',
        type: messageType,
        messageBody: text,
        status,
        metaMessageId,
      },
    });

    return log;
  }
}
