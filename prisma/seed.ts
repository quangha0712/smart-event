import { PrismaClient, UserRole, EventStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const organizer = await prisma.user.upsert({
    where: { email: "organizer@example.com" },
    update: {},
    create: {
      id: "demo-organizer",
      email: "organizer@example.com",
      fullName: "Demo Organizer",
      passwordHash: "DEMO_ONLY_REPLACE_WITH_BCRYPT_HASH",
      role: UserRole.ORGANIZER,
    },
  });

  const event = await prisma.event.upsert({
    where: { id: "demo-smart-event" },
    update: { status: EventStatus.PUBLISHED },
    create: {
      id: "demo-smart-event",
      name: "Ngày hội Công nghệ PTIT",
      description: "Sự kiện mẫu để phát triển và demo hệ thống.",
      location: "Hà Nội",
      startsAt: new Date("2027-05-20T08:00:00+07:00"),
      endsAt: new Date("2027-05-20T17:00:00+07:00"),
      capacity: 300,
      status: EventStatus.PUBLISHED,
    },
  });

  const attendee = await prisma.user.upsert({
    where: { email: "attendee@example.com" },
    update: {},
    create: {
      id: "demo-attendee",
      email: "attendee@example.com",
      fullName: "Demo Attendee",
      passwordHash: "DEMO_ONLY_REPLACE_WITH_BCRYPT_HASH",
      role: UserRole.ATTENDEE,
    },
  });
  const basicRegistration = await prisma.registration.upsert({
    where: { userId_eventId: { userId: attendee.id, eventId: event.id } },
    update: { status: "CONFIRMED" },
    create: { userId: attendee.id, eventId: event.id, status: "CONFIRMED" },
  });
  await prisma.ticket.upsert({
    where: { registrationId: basicRegistration.id },
    update: { qrCode: "DEMO-QR-DO-NOT-USE-IN-PRODUCTION", checkedInAt: null },
    create: { registrationId: basicRegistration.id, qrCode: "DEMO-QR-DO-NOT-USE-IN-PRODUCTION" },
  });

  const scenarios = [
    {
      email: "demo-rapid@example.com",
      name: "Demo Rapid Multi-Device Repeat",
      qrCode: "DEMO-QR-RAPID-REPEAT",
      acceptedMinutesAgo: 12,
      acceptedDeviceId: "scanner-north",
      additionalAcceptedDeviceIds: [],
      repeats: [
        { minutesAgo: 11, deviceId: "scanner-east" },
        { minutesAgo: 10.5, deviceId: "scanner-south" },
        { minutesAgo: 10, deviceId: "scanner-west" },
        { minutesAgo: 9.5, deviceId: "scanner-east" },
        { minutesAgo: 9, deviceId: "scanner-south" },
      ],
    },
    {
      email: "demo-persistent@example.com",
      name: "Demo Persistent Repeat",
      qrCode: "DEMO-QR-PERSISTENT-REPEAT",
      acceptedMinutesAgo: 35,
      acceptedDeviceId: "scanner-west",
      additionalAcceptedDeviceIds: [],
      repeats: [
        { minutesAgo: 30, deviceId: "scanner-west" },
        { minutesAgo: 25, deviceId: "scanner-south" },
        { minutesAgo: 20, deviceId: "scanner-west" },
        { minutesAgo: 15, deviceId: "scanner-south" },
        { minutesAgo: 12, deviceId: "scanner-west" },
      ],
    },
    {
      email: "demo-bursts@example.com",
      name: "Demo Separate Repeat Bursts",
      qrCode: "DEMO-QR-SEPARATE-BURSTS",
      acceptedMinutesAgo: 55,
      acceptedDeviceId: "scanner-west",
      additionalAcceptedDeviceIds: [],
      repeats: [
        { minutesAgo: 50, deviceId: "scanner-north" },
        { minutesAgo: 49, deviceId: "scanner-east" },
        { minutesAgo: 8, deviceId: "scanner-north" },
        { minutesAgo: 7, deviceId: "scanner-east" },
      ],
    },
    {
      email: "demo-same-device-retry@example.com",
      name: "Demo Same Device Retry Control",
      qrCode: "DEMO-QR-SAME-DEVICE-CONTROL",
      acceptedMinutesAgo: 18,
      acceptedDeviceId: "scanner-west",
      additionalAcceptedDeviceIds: [],
      repeats: [
        { minutesAgo: 17, deviceId: "scanner-west" },
        { minutesAgo: 16.5, deviceId: "scanner-west" },
        { minutesAgo: 16, deviceId: "scanner-west" },
      ],
    },
    {
      email: "demo-few-repeats@example.com",
      name: "Demo Two Repeat Control",
      qrCode: "DEMO-QR-TWO-REPEATS-CONTROL",
      acceptedMinutesAgo: 5,
      acceptedDeviceId: "scanner-north",
      additionalAcceptedDeviceIds: [],
      repeats: [
        { minutesAgo: 4, deviceId: "scanner-north" },
        { minutesAgo: 3, deviceId: "scanner-east" },
      ],
    },
    {
      email: "demo-normal-checkin@example.com",
      name: "Demo Normal Check-in Control",
      qrCode: "DEMO-QR-NORMAL-CONTROL",
      acceptedMinutesAgo: 2,
      acceptedDeviceId: "scanner-south",
      additionalAcceptedDeviceIds: [],
      repeats: [],
    },
    {
      email: "demo-multiple-accepted@example.com",
      name: "Demo Near-Simultaneous Accepted on Multiple Devices",
      qrCode: "DEMO-QR-MULTIPLE-ACCEPTED",
      acceptedMinutesAgo: 1,
      acceptedDeviceId: "scanner-north",
      additionalAcceptedDeviceIds: ["scanner-east"],
      repeats: [],
    },
  ];

  const seededTicketIds: string[] = [];
  const now = Date.now();
  for (const scenario of scenarios) {
    const user = await prisma.user.upsert({
      where: { email: scenario.email },
      update: { fullName: scenario.name },
      create: {
        email: scenario.email,
        fullName: scenario.name,
        passwordHash: "DEMO_ONLY_REPLACE_WITH_BCRYPT_HASH",
        role: UserRole.ATTENDEE,
      },
    });
    const registration = await prisma.registration.upsert({
      where: { userId_eventId: { userId: user.id, eventId: event.id } },
      update: { status: "CONFIRMED" },
      create: { userId: user.id, eventId: event.id, status: "CONFIRMED" },
    });
    const acceptedAt = new Date(now - scenario.acceptedMinutesAgo * 60_000);
    const ticket = await prisma.ticket.upsert({
      where: { registrationId: registration.id },
      update: { qrCode: scenario.qrCode, checkedInAt: acceptedAt },
      create: { registrationId: registration.id, qrCode: scenario.qrCode, checkedInAt: acceptedAt },
    });
    seededTicketIds.push(ticket.id);

    // Re-running the seed resets only the controlled demo scenarios below.
    await prisma.checkInAttempt.deleteMany({ where: { ticketId: ticket.id } });
    await prisma.checkInAttempt.createMany({
      data: [
        {
          eventId: event.id,
          ticketId: ticket.id,
          deviceId: scenario.acceptedDeviceId,
          status: "ACCEPTED",
          scannedAt: acceptedAt,
        },
        ...scenario.additionalAcceptedDeviceIds.map((deviceId) => ({
          eventId: event.id,
          ticketId: ticket.id,
          deviceId,
          status: "ACCEPTED" as const,
          scannedAt: acceptedAt,
        })),
        ...scenario.repeats.map((repeat) => ({
          eventId: event.id,
          ticketId: ticket.id,
          deviceId: repeat.deviceId,
          status: "ALREADY_USED" as const,
          scannedAt: new Date(now - repeat.minutesAgo * 60_000),
        })),
      ],
    });
  }

  const confirmedCount = await prisma.registration.count({
    where: { eventId: event.id, status: "CONFIRMED" },
  });
  await prisma.event.update({ where: { id: event.id }, data: { registeredCount: confirmedCount } });

  console.log(`Seeded organizer ${organizer.email}; event ${event.id}; ${seededTicketIds.length} AI check-in scenarios.`);
  console.log("Positive repeat-rule cases: DEMO-QR-RAPID-REPEAT, DEMO-QR-PERSISTENT-REPEAT, DEMO-QR-SEPARATE-BURSTS");
  console.log("Control cases: DEMO-QR-SAME-DEVICE-CONTROL, DEMO-QR-TWO-REPEATS-CONTROL, DEMO-QR-NORMAL-CONTROL");
  console.log("Multiple accepted case: DEMO-QR-MULTIPLE-ACCEPTED (two ACCEPTED attempts on different devices at the same timestamp)");
  console.log(`Seed analysis range: from=${new Date(now - 60 * 60_000).toISOString()} to=${new Date(now + 5 * 60_000).toISOString()}`);
}

main().finally(() => prisma.$disconnect());
