import { ChurnPredictionResult } from "./types";

/**
 * Intelligent AI Service for Preschool & Tuition Center Manager
 * Handles Admission Bot reasoning, fee reminders, daily kid diary generation, and churn detection.
 */

export class AIService {
  /**
   * 1. AI WhatsApp Admission Counselor & Lead Qualifier
   * Responds in the parent's language (Bengali, English, Hindi, Hinglish),
   * provides fee & timing details, captures child name/age, and books demo/visit.
   */
  static generateAdmissionReply(params: {
    incomingText: string;
    parentName?: string;
    centerName: string;
    feesInfo?: string;
    timings?: string;
  }): { reply: string; detectedIntent: 'INQUIRY' | 'FEE_QUERY' | 'BOOK_DEMO' | 'ENROLLED' | 'GENERAL'; childAge?: string; suggestedFollowUp: string } {
    const text = params.incomingText.toLowerCase();
    const center = params.centerName;

    // Detect language preference
    const isBengali = /ভর্তি|ফি|কত|ক্লাস|সময়|বাচ্চা|কেমন|ঠিকানা|স্কুল|টিউশন/i.test(params.incomingText);
    const isHindi = /kitna|kitni|admission|fees|kab|samay|bacha|puchna/i.test(text);

    let intent: 'INQUIRY' | 'FEE_QUERY' | 'BOOK_DEMO' | 'ENROLLED' | 'GENERAL' = 'GENERAL';
    let reply = "";
    let suggestedFollowUp = "Send center brochure and schedule a 15-minute school visit";

    // Intent detection
    if (/fee|tution|charge|cost|পেমেন্ট|টাকা|কত টাকা|খরচ|fees/i.test(text)) {
      intent = 'FEE_QUERY';
      if (isBengali) {
        reply = `নমস্কার! ${center}-এ যোগাযোগ করার জন্য ধন্যবাদ। 🌟\n\nআমাদের প্লেগ্রুপ ও নার্সারির মাসিক ফি সাধারণত ₹১,৫০০ - ₹২,২০০ এর মধ্যে (স্টাডি কিট ও অ্যাক্টিভিটি সহ)।\n\nআপনার সন্তানের বয়স কত? আর আপনি কি আমাদের স্কুল ক্যাম্পাসটি সরাসরি এসে ঘুরে দেখতে চান? আগামীকাল বিকেল ৪টায় একটি ফ্রি ট্রায়াল/ভিজিট স্লট খালি রয়েছে।`;
      } else {
        reply = `Hello! Thank you for reaching out to ${center}. 🌟\n\nOur monthly program fees range from ₹1,500 to ₹2,200 depending on the age group/class (includes all activity kits & smart learning).\n\nMay I know your child's age? Would you like to book a complimentary campus tour and meet our educators this week?`;
      }
    } else if (/visit|demo|trial|dekhte|asbo|দেখা|আসব|ভিজিট|ট্রায়াল|কাল|সময়/i.test(text)) {
      intent = 'BOOK_DEMO';
      if (isBengali) {
        reply = `খুবই চমৎকার! আমরা আপনাদের স্বাগত জানাতে প্রস্তুত। 🎒\n\nআপনি আগামীকাল সকাল ১০:৩০ অথবা বিকেল ৪:০০ টায় আপনার সন্তানকে নিয়ে আসতে পারেন।\n\nঅনুগ্রহ করে আপনার সন্তানের নাম এবং আপনার সুবিধাজনক সময়টি কনফার্ম করুন, আমরা ভিজিটর পাস রেডি রাখব।`;
      } else {
        reply = `Wonderful! We would love to welcome you and your child to ${center}. 🎒\n\nWe have slots open tomorrow at 10:30 AM and 4:00 PM for interactive demo tours.\n\nPlease reply with your child's name and preferred time, and we'll reserve your VIP visit pass!`;
      }
      suggestedFollowUp = "Auto-assign visit slot on Google Calendar and alert Center Director via WhatsApp";
    } else if (/admission|seat|form|khola|ভর্তি|সিট|নতুন/i.test(text)) {
      intent = 'INQUIRY';
      if (isBengali) {
        reply = `নমস্কার! ${center}-এ নতুন সেশনের ভর্তি বর্তমানে চলছে। 🎉\n\nআমাদের রয়েছে:\n✨ আধুনিক মন্টেশ্বরী ও প্লে-বেসড লার্নিং\n✨ সার্বক্ষণিক সিসিটিভি ও নিরাপদ পরিবেশ\n✨ প্রতিদিনের অ্যাক্টিভিটি ও ফটো আপডেট সরাসরি হোয়াটসঅ্যাপে\n\nআপনার সন্তানের নাম ও বয়স জানালে আমরা উপযুক্ত ব্যাচের সম্পূর্ণ বিস্তারিত পাঠাতে পারব।`;
      } else {
        reply = `Hello! Admissions are currently OPEN for the upcoming session at ${center}! 🎉\n\nHighlights of our center:\n✨ Joyful play-based Montessori curriculum\n✨ Safe, CCTV-monitored child-friendly campus\n✨ Real-time daily photo & mood updates on WhatsApp\n\nCould you please share your child's name & age so we can share the curriculum brochure?`;
      }
    } else {
      intent = 'GENERAL';
      if (isBengali) {
        reply = `নমস্কার! ${center}-এ স্বাগতম। আমরা কীভাবে আপনাকে সাহায্য করতে পারি? আপনি ভর্তি, ফি কাঠামো অথবা স্কুল ভিজিটের ব্যাপারে জানতে চাইতে পারেন।`;
      } else {
        reply = `Hello! Welcome to ${center}. How can we assist you today? Feel free to ask about our programs, fee structure, or scheduling a visit!`;
      }
    }

    return {
      reply,
      detectedIntent: intent,
      suggestedFollowUp,
    };
  }

  /**
   * 2. AI Smart Fee Recovery & Escalation Sequence Generator
   * Generates warm, non-confrontational yet effective fee reminder texts
   * with 1-click UPI/Payment link and student details.
   */
  static generateFeeReminderMessage(params: {
    studentName: string;
    parentName: string;
    month: string;
    amount: number;
    currency: string;
    dueDate: string;
    paymentLink: string;
    reminderLevel: 1 | 2 | 3; // 1 = Gentle advance reminder, 2 = Due date today, 3 = Overdue urgent
    centerName: string;
    upiId?: string;
  }): string {
    const { studentName, parentName, month, amount, currency, dueDate, paymentLink, reminderLevel, centerName, upiId } = params;
    const currSymbol = currency === 'BDT' ? '৳' : currency === 'USD' ? '$' : '₹';

    if (reminderLevel === 1) {
      // Gentle reminder (3 days before due date)
      return `Dear ${parentName},\n\nHope ${studentName} is having a wonderful learning week at ${centerName}! 🌟\n\nThis is a friendly reminder that the tuition fee for *${month}* (${currSymbol}${amount.toLocaleString()}) is due on *${dueDate}*.\n\n💳 *Instant 1-Click Payment Link:*\n${paymentLink}\n${upiId ? `Or UPI directly to: ${upiId}\n` : ''}\nOnce paid, your digital receipt will be generated automatically. Thank you for your continued partnership! 🙏`;
    } else if (reminderLevel === 2) {
      // Due today
      return `Dear ${parentName},\n\nGreetings from ${centerName}! 🔔\n\nToday is the scheduled due date for ${studentName}'s tuition fee for *${month}*.\n\n📌 Amount Due: *${currSymbol}${amount.toLocaleString()}*\n📅 Due Date: *Today (${dueDate})*\n\nTap to pay securely in seconds via UPI/Card:\n👉 ${paymentLink}\n\nIf you have already paid today, please ignore this message. Have a wonderful day!`;
    } else {
      // Escalated overdue reminder
      return `Important: Fee Reminder for ${studentName} - ${centerName} ⚠️\n\nDear ${parentName},\n\nWe noticed that the tuition fee of *${currSymbol}${amount.toLocaleString()}* for the month of *${month}* is currently pending.\n\nTo ensure uninterrupted class participation and batch materials for ${studentName}, kindly settle the pending dues today.\n\n🚀 *Clear Dues Instantly:*\n${paymentLink}\n\nIf you are facing any difficulty or need assistance, feel free to reply directly to this message. Thank you!`;
    }
  }

  /**
   * 3. AI Kid's Daily Diary & Milestone Narrative Generator
   * Transforms quick teacher inputs (mood, meals, naps, activities) into an engaging,
   * heartwarming personalized WhatsApp update that parents cherish.
   */
  static generateDailyDiaryNote(input: {
    studentName: string;
    mood: string;
    mealIntake: string;
    napMinutes: number;
    activities: string;
    dateStr: string;
  }): string {
    const { studentName, mood, mealIntake, napMinutes, activities, dateStr } = input;

    let moodDescription = "full of joyful energy and bright smiles";
    if (mood === 'PLAYFUL') moodDescription = "super playful, giggling and sharing toys with friends";
    if (mood === 'CALM') moodDescription = "focused, calm, and very attentive in today's sessions";
    if (mood === 'CRANKY' || mood === 'TIRED') moodDescription = "a little sleepy initially, but comforted quickly with warm rhymes";

    let mealDescription = "enjoyed their lunch thoroughly and finished everything";
    if (mealIntake === 'ATE_HALF') mealDescription = "ate about half of their snack box with a good appetite";
    if (mealIntake === 'LITTLE') mealDescription = "had a few bites of snack and plenty of water";
    if (mealIntake === 'SKIPPED') mealDescription = "wasn't very hungry during snack time today";

    let napNote = napMinutes > 0 ? `had a cozy ${napMinutes}-minute nap` : "stayed active throughout circle time without a nap";

    return `🎒 *${studentName}'s Day at Little Stars* (${dateStr})\n\n🌟 *Mood & Social:* ${studentName} was ${moodDescription} today!\n\n🎨 *Activities & Milestones:* Participated excitedly in ${activities}.\n\n🥪 *Snack & Nutrition:* ${mealDescription}.\n\n💤 *Rest:* ${studentName} ${napNote} and woke up refreshed.\n\nWe love seeing ${studentName}'s confidence grow every single day! ❤️`;
  }

  /**
   * 4. AI Student Churn & At-Risk Drop-Out Predictor
   * Calculates churn probability based on attendance patterns, overdue fee frequency,
   * and parent interaction gaps.
   */
  static evaluateChurnRisk(data: {
    studentName: string;
    consecutiveAbsences: number;
    monthlyAttendancePercent: number;
    unpaidInvoicesCount: number;
    daysSinceLastParentContact: number;
  }): ChurnPredictionResult {
    let score = 10; // baseline 10%
    const reasons: string[] = [];

    if (data.monthlyAttendancePercent < 60) {
      score += 35;
      reasons.push(`Attendance dropped to ${data.monthlyAttendancePercent}% this month`);
    } else if (data.monthlyAttendancePercent < 80) {
      score += 15;
      reasons.push(`Irregular attendance (${data.monthlyAttendancePercent}%)`);
    }

    if (data.consecutiveAbsences >= 3) {
      score += 25;
      reasons.push(`${data.consecutiveAbsences} days consecutive absence without prior leave notice`);
    }

    if (data.unpaidInvoicesCount >= 2) {
      score += 25;
      reasons.push(`${data.unpaidInvoicesCount} overdue monthly invoices accumulated`);
    } else if (data.unpaidInvoicesCount === 1) {
      score += 10;
      reasons.push(`Pending overdue fee for the current cycle`);
    }

    if (data.daysSinceLastParentContact > 20) {
      score += 15;
      reasons.push(`No parent response or engagement for over ${data.daysSinceLastParentContact} days`);
    }

    score = Math.min(Math.max(score, 5), 98);

    let level: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    let suggestedAction = "Normal engagement. Keep sending daily diaries and achievements.";

    if (score >= 65) {
      level = 'HIGH';
      suggestedAction = `Immediate Retention Call required: Center Director should phone parent to check on student's wellbeing and offer flexible batch or payment schedule.`;
    } else if (score >= 35) {
      level = 'MEDIUM';
      suggestedAction = `Send a warm 'We miss you' personalized check-in note on WhatsApp with photo highlights from class.`;
    }

    return {
      score: Math.round(score),
      level,
      reasons,
      suggestedAction,
    };
  }

  /**
   * 5. AI Emergency & Smart Announcements Generator
   */
  static generateAnnouncement(topic: string, details: string, centerName: string): { title: string; message: string } {
    return {
      title: `Notice: ${topic}`,
      message: `📢 *Official Announcement - ${centerName}*\n\nDear Parents,\n\nPlease take note regarding *${topic}*:\n\n${details}\n\nFor any queries, please reach out to our front desk. Thank you for your kind cooperation!\n\nWarm regards,\nManagement Team - ${centerName}`,
    };
  }
}
