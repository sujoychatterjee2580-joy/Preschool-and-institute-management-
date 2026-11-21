const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial data...');

  // 1. Create Default Preschool/Tuition Center Tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'little-stars-academy' },
    update: {},
    create: {
      name: 'Little Stars Preschool & Tuition Academy',
      slug: 'little-stars-academy',
      code: 'LSA-01',
      address: 'Plot 42, Green Park Avenue, Near Metro Station',
      phone: '+91 98765 43210',
      email: 'director@littlestarsacademy.com',
      currency: 'INR',
      plan: 'ENTERPRISE',
      subscriptionStatus: 'ACTIVE',
      upiId: 'littlestars@okhdfcbank',
      metaWaPhoneId: '',
      metaWaAccessToken: '',
    },
  });

  // 2. Create Owner User
  await prisma.user.upsert({
    where: { email: 'director@littlestarsacademy.com' },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Priya Mukherjee',
      email: 'director@littlestarsacademy.com',
      role: 'OWNER',
      phone: '+91 98765 43210',
    },
  });

  // 3. Create Classes/Batches
  const playgroup = await prisma.classBatch.create({
    data: {
      tenantId: tenant.id,
      name: 'Toddlers Playgroup (2-3 Yrs)',
      room: 'Room A (Joyland)',
      monthlyFee: 1800,
      defaultStartTime: '09:00 AM',
      defaultEndTime: '11:30 AM',
    },
  });

  const nursery = await prisma.classBatch.create({
    data: {
      tenantId: tenant.id,
      name: 'Nursery Blossoms (3-4 Yrs)',
      room: 'Room B (Rainbow)',
      monthlyFee: 2200,
      defaultStartTime: '09:30 AM',
      defaultEndTime: '12:30 PM',
    },
  });

  const tuitionClass = await prisma.classBatch.create({
    data: {
      tenantId: tenant.id,
      name: 'Junior Tuition (Class 1-3 Maths & English)',
      room: 'Room C (Scholars)',
      monthlyFee: 1500,
      defaultStartTime: '04:00 PM',
      defaultEndTime: '06:00 PM',
    },
  });

  // 4. Create Students & Parents
  const studentData = [
    {
      first: 'Kabir',
      last: 'Sen',
      dob: new Date('2023-04-12'),
      gender: 'BOY',
      classId: playgroup.id,
      roll: 'PG-01',
      parentName: 'Sunita Sen',
      phone: '+91 98311 22334',
      rel: 'MOTHER',
      churnScore: 8.5,
      churnRiskFactors: JSON.stringify({ reason: 'Regular attendee, high parent involvement', level: 'LOW' }),
      feeStatus: 'PAID',
    },
    {
      first: 'Aarav',
      last: 'Chakraborty',
      dob: new Date('2022-11-20'),
      gender: 'BOY',
      classId: nursery.id,
      roll: 'NUR-04',
      parentName: 'Debabrata Chakraborty',
      phone: '+91 98302 99887',
      rel: 'FATHER',
      churnScore: 78.0,
      churnRiskFactors: JSON.stringify({
        reason: 'Absent for 4 consecutive days, fee overdue for 14 days, no reply to recent diary update',
        level: 'HIGH',
      }),
      feeStatus: 'OVERDUE',
    },
    {
      first: 'Ananya',
      last: 'Ghosh',
      dob: new Date('2023-01-15'),
      gender: 'GIRL',
      classId: playgroup.id,
      roll: 'PG-02',
      parentName: 'Poulomi Ghosh',
      phone: '+91 97483 11223',
      rel: 'MOTHER',
      churnScore: 12.0,
      churnRiskFactors: JSON.stringify({ reason: 'Prompt fee payer, happy feedback on WhatsApp', level: 'LOW' }),
      feeStatus: 'PAID',
    },
    {
      first: 'Reyansh',
      last: 'Das',
      dob: new Date('2022-08-05'),
      gender: 'BOY',
      classId: nursery.id,
      roll: 'NUR-05',
      parentName: 'Subir Das',
      phone: '+91 94331 44556',
      rel: 'FATHER',
      churnScore: 45.0,
      churnRiskFactors: JSON.stringify({
        reason: 'Fee pending for November, irregular attendance on Mondays',
        level: 'MEDIUM',
      }),
      feeStatus: 'PENDING',
    },
    {
      first: 'Ishani',
      last: 'Roy',
      dob: new Date('2020-06-18'),
      gender: 'GIRL',
      classId: tuitionClass.id,
      roll: 'TUI-01',
      parentName: 'Tanushree Roy',
      phone: '+91 98365 77889',
      rel: 'MOTHER',
      churnScore: 15.0,
      churnRiskFactors: JSON.stringify({ reason: 'Excellent test scores, regular homework submission', level: 'LOW' }),
      feeStatus: 'PENDING',
    },
  ];

  const now = new Date();
  const currentMonth = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  for (const s of studentData) {
    const student = await prisma.student.create({
      data: {
        tenantId: tenant.id,
        classBatchId: s.classId,
        rollNumber: s.roll,
        firstName: s.first,
        lastName: s.last,
        dateOfBirth: s.dob,
        gender: s.gender,
        churnScore: s.churnScore,
        churnRiskFactors: s.churnRiskFactors,
      },
    });

    const parent = await prisma.parent.create({
      data: {
        tenantId: tenant.id,
        name: s.parentName,
        phone: s.phone,
        relationship: s.rel,
      },
    });

    await prisma.studentParent.create({
      data: {
        studentId: student.id,
        parentId: parent.id,
        isPrimary: true,
      },
    });

    // Create Invoice
    const feeAmount = s.classId === nursery.id ? 2200 : s.classId === playgroup.id ? 1800 : 1500;
    const isPaid = s.feeStatus === 'PAID';
    const isOverdue = s.feeStatus === 'OVERDUE';

    await prisma.feeInvoice.create({
      data: {
        tenantId: tenant.id,
        studentId: student.id,
        invoiceNumber: `INV-${s.roll}-${Date.now().toString().slice(-4)}`,
        month: currentMonth,
        amount: feeAmount,
        netAmount: feeAmount,
        status: s.feeStatus,
        dueDate: new Date(now.getFullYear(), now.getMonth(), 10),
        paidDate: isPaid ? new Date(now.getFullYear(), now.getMonth(), 5) : null,
        paymentMethod: isPaid ? 'UPI' : null,
        paymentLink: `https://pay.littlestars.com/pay/${student.id}`,
        reminderCount: isOverdue ? 3 : isPaid ? 0 : 1,
        lastReminderSentAt: isOverdue ? new Date(Date.now() - 86400000) : null,
      },
    });

    // Create Attendance for today
    const isPresent = s.roll !== 'NUR-04'; // Aarav is absent
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.attendance.create({
      data: {
        tenantId: tenant.id,
        studentId: student.id,
        classBatchId: s.classId,
        date: today,
        status: isPresent ? 'PRESENT' : 'ABSENT',
        checkInTime: isPresent ? '08:58 AM' : null,
        notifiedParent: true,
        remarks: isPresent ? 'Arrived happily on time' : 'Absent without notification',
      },
    });

    // Create Sample Daily Kid Diary for Kabir
    if (s.roll === 'PG-01') {
      await prisma.dailyKidDiary.create({
        data: {
          tenantId: tenant.id,
          studentId: student.id,
          date: new Date(),
          mood: 'PLAYFUL',
          mealIntake: 'FINISHED_ALL',
          napMinutes: 45,
          pottyCount: 2,
          activities: 'Finger painting butterflies, Nursery rhyme singing, Foam building blocks',
          aiGeneratedNote: `🎒 *Kabir's Day at Little Stars* (Today)\n\n🌟 *Mood & Social:* Kabir was super playful, giggling and sharing toys with friends today!\n\n🎨 *Activities & Milestones:* Participated excitedly in finger painting butterflies and foam block building.\n\n🥪 *Snack & Nutrition:* Enjoyed their lunch thoroughly and finished everything.\n\n💤 *Rest:* Kabir had a cozy 45-minute nap and woke up refreshed.\n\nWe love seeing Kabir's confidence grow every single day! ❤️`,
          sentViaWhatsApp: true,
          sentAt: new Date(),
        },
      });
    }
  }

  // 5. Seed Real Admission Inquiries (Lead funnel)
  const inquiries = [
    {
      tenantId: tenant.id,
      parentName: 'Megha Banerjee',
      childName: 'Aria Banerjee',
      childAge: '2.5 Years',
      phone: '+91 98319 88776',
      source: 'WHATSAPP_BOT',
      status: 'DEMO_BOOKED',
      interestLevel: 'HIGH',
      preferredClass: 'Toddlers Playgroup',
      demoDate: new Date(Date.now() + 86400000 * 2),
      notes: 'AI bot answered fee query and automatically booked demo visit for Saturday 11 AM.',
    },
    {
      tenantId: tenant.id,
      parentName: 'Rohit Sharma',
      childName: 'Yuvan Sharma',
      childAge: '3.8 Years',
      phone: '+91 98300 11234',
      source: 'WHATSAPP_BOT',
      status: 'NEW',
      interestLevel: 'HIGH',
      preferredClass: 'Nursery Blossoms',
      notes: 'Inquired about CCTV access and transport facility on WhatsApp.',
    },
    {
      tenantId: tenant.id,
      parentName: 'Sneha Roy',
      childName: 'Aishi Roy',
      childAge: '7 Years',
      phone: '+91 97480 33445',
      source: 'WEBSITE',
      status: 'CONTACTED',
      interestLevel: 'MEDIUM',
      preferredClass: 'Junior Tuition (Class 1-3)',
      notes: 'Wants Maths focus batch.',
    },
  ];

  for (const inq of inquiries) {
    await prisma.admissionInquiry.create({ data: inq });
  }

  // 6. Seed sample WhatsApp audit logs
  const logs = [
    {
      tenantId: tenant.id,
      recipientPhone: '+91 98311 22334',
      recipientName: 'Sunita Sen (Kabir)',
      type: 'ATTENDANCE_ALERT',
      messageBody: '🌟 Kabir has arrived safely at Little Stars Academy at 08:58 AM. Have a wonderful day!',
      status: 'DELIVERED',
    },
    {
      tenantId: tenant.id,
      recipientPhone: '+91 98302 99887',
      recipientName: 'Debabrata Chakraborty (Aarav)',
      type: 'FEE_REMINDER',
      messageBody: 'Important: Fee Reminder for Aarav Chakraborty. Tuition fee of ₹2,200 is overdue. Pay via 1-click link: https://pay.littlestars.com/pay/xyz',
      status: 'DELIVERED',
    },
  ];

  for (const l of logs) {
    await prisma.whatsAppMessageLog.create({ data: l });
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
