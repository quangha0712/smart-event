import "dotenv/config";
import { CheckInMethod, CheckInResult, DeviceType, EventStatus, PrismaClient, RegistrationStatus, SensorType, UserRole } from "@prisma/client";
import { hash } from "bcryptjs";
import { signTicketCode } from "../apps/api/src/tickets/ticket-code";

const prisma = new PrismaClient();

/** Mật khẩu chung của các tài khoản demo. CHỈ dùng cho môi trường dev. */
const DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD || "SmartEvent@2026";

async function main() {
  const passwordHash = await hash(DEMO_PASSWORD, 10);
  const demoUser = (email: string, fullName: string, role: UserRole) =>
    prisma.user.upsert({
      where: { email },
      // Ghi đè hash để thay chuỗi giả của các bản seed cũ.
      update: { passwordHash, role },
      create: { email, fullName, passwordHash, role },
    });

  await demoUser("admin@example.com", "Demo Admin", UserRole.ADMIN);
  const organizer = await demoUser("organizer@example.com", "Demo Organizer", UserRole.ORGANIZER);
  const attendee = await demoUser("attendee@example.com", "Demo Attendee", UserRole.ATTENDEE);

  await prisma.event.upsert({
    where: { id: "demo-smart-event" },
    update: {},
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
  const eventId = "demo-smart-event";

  await prisma.device.upsert({
    where: { code: "GATE-A-QR" },
    update: {},
    create: { code: "GATE-A-QR", name: "Máy quét cổng A", type: DeviceType.QR_SCANNER, location: "Cổng A", isSimulated: true, eventId },
  });
  await prisma.device.upsert({
    where: { code: "HALL-ENV-01" },
    update: {},
    create: { code: "HALL-ENV-01", name: "Cảm biến môi trường hội trường", type: DeviceType.SENSOR, location: "Hội trường", isSimulated: true, eventId },
  });

  const staff = await prisma.staffMember.upsert({
    where: { id: "demo-staff-checkin" },
    update: {},
    create: { id: "demo-staff-checkin", fullName: "Nguyễn Văn Tình Nguyện", phone: "0900000000", position: "Tình nguyện viên" },
  });
  await prisma.staffAssignment.upsert({
    where: { eventId_staffId_role: { eventId, staffId: staff.id, role: "Check-in cổng A" } },
    update: {},
    create: { eventId, staffId: staff.id, role: "Check-in cổng A" },
  });

  const vendor = await prisma.vendor.upsert({
    where: { id: "demo-vendor-av" },
    update: {},
    create: { id: "demo-vendor-av", name: "Công ty Âm thanh Ánh sáng Demo", serviceType: "Âm thanh - ánh sáng" },
  });
  await prisma.sponsor.upsert({
    where: { id: "demo-sponsor" },
    update: {},
    create: { id: "demo-sponsor", eventId, name: "Nhà tài trợ Demo", tier: "Vàng", amount: 20_000_000 },
  });

  const budgetItem = await prisma.budgetItem.upsert({
    where: { id: "demo-budget-av" },
    update: {},
    create: {
      id: "demo-budget-av",
      eventId,
      vendorId: vendor.id,
      name: "Thuê hệ thống âm thanh",
      category: "Thiết bị",
      quantity: 1,
      unit: "gói",
      unitPrice: 8_000_000,
      plannedAmount: 8_000_000,
    },
  });
  await prisma.expense.upsert({
    where: { id: "demo-expense-av" },
    update: {},
    create: {
      id: "demo-expense-av",
      eventId,
      budgetItemId: budgetItem.id,
      vendorId: vendor.id,
      recordedById: organizer.id,
      description: "Thanh toán thuê âm thanh",
      amount: 8_500_000,
      paidAt: new Date("2027-05-21T10:00:00+07:00"),
    },
  });

  // Đăng ký + vé có mã QR ký HMAC cho tài khoản attendee.
  const registration = await prisma.registration.upsert({
    where: { userId_eventId: { userId: attendee.id, eventId } },
    update: {},
    create: { userId: attendee.id, eventId, status: RegistrationStatus.CONFIRMED },
  });
  const ticketId = "demo-ticket-attendee";
  const qrCode = signTicketCode(ticketId);
  await prisma.ticket.upsert({
    where: { registrationId: registration.id },
    update: { qrCode },
    create: { id: ticketId, registrationId: registration.id, qrCode, nfcUid: "04A1B2C3D4E5F6" },
  });

  // Diễn giả và phiên trong lịch trình.
  const speaker = await prisma.speaker.upsert({
    where: { id: "demo-speaker" },
    update: {},
    create: { id: "demo-speaker", eventId, fullName: "TS. Trần Minh An", title: "Giảng viên", organization: "PTIT" },
  });
  await prisma.scheduleItem.upsert({
    where: { id: "demo-session-keynote" },
    update: {},
    create: {
      id: "demo-session-keynote",
      eventId,
      title: "Keynote: AI trong quản lý sự kiện",
      startsAt: new Date("2027-05-20T08:30:00+07:00"),
      endsAt: new Date("2027-05-20T09:30:00+07:00"),
      room: "Hội trường A",
      speakers: { connect: { id: speaker.id } },
    },
  });

  // Số người theo khu vực do cảm biến gửi về.
  const sensor = await prisma.device.findUniqueOrThrow({ where: { code: "HALL-ENV-01" } });
  if ((await prisma.sensorReading.count({ where: { deviceId: sensor.id } })) === 0) {
    await prisma.sensorReading.createMany({
      data: [
        { eventId, deviceId: sensor.id, sensorType: SensorType.PEOPLE_COUNT, zone: "Hội trường", value: 120, unit: "người", recordedAt: new Date("2027-05-20T08:45:00+07:00") },
        { eventId, deviceId: sensor.id, sensorType: SensorType.PEOPLE_COUNT, zone: "Hội trường", value: 245, unit: "người", recordedAt: new Date("2027-05-20T09:15:00+07:00") },
      ],
    });
  }

  const scannerCodes = ["scanner-north", "scanner-east", "scanner-south", "scanner-west"];
  const scannerIds = new Map<string, string>();
  for (const code of scannerCodes) {
    const scanner = await prisma.device.upsert({
      where: { code },
      update: { eventId, isActive: true },
      create: { code, name: `Máy quét ${code}`, type: DeviceType.QR_SCANNER, eventId, isSimulated: true },
      select: { id: true },
    });
    scannerIds.set(code, scanner.id);
  }

  const aiScenarios = [
    {
      suffix: "rapid",
      qrCode: "DEMO-QR-RAPID-REPEAT",
      acceptedMinutesAgo: 12,
      acceptedDevices: ["scanner-north"],
      repeats: [
        { minutesAgo: 11, deviceId: "scanner-east" },
        { minutesAgo: 10.5, deviceId: "scanner-south" },
        { minutesAgo: 10, deviceId: "scanner-west" },
        { minutesAgo: 9.5, deviceId: "scanner-east" },
        { minutesAgo: 9, deviceId: "scanner-south" },
      ],
    },
    {
      suffix: "persistent",
      qrCode: "DEMO-QR-PERSISTENT-REPEAT",
      acceptedMinutesAgo: 35,
      acceptedDevices: ["scanner-west"],
      repeats: [
        { minutesAgo: 30, deviceId: "scanner-west" },
        { minutesAgo: 25, deviceId: "scanner-south" },
        { minutesAgo: 20, deviceId: "scanner-west" },
        { minutesAgo: 15, deviceId: "scanner-south" },
        { minutesAgo: 12, deviceId: "scanner-west" },
      ],
    },
    {
      suffix: "bursts",
      qrCode: "DEMO-QR-SEPARATE-BURSTS",
      acceptedMinutesAgo: 55,
      acceptedDevices: ["scanner-west"],
      repeats: [
        { minutesAgo: 50, deviceId: "scanner-north" },
        { minutesAgo: 49, deviceId: "scanner-east" },
        { minutesAgo: 8, deviceId: "scanner-north" },
        { minutesAgo: 7, deviceId: "scanner-east" },
      ],
    },
    {
      suffix: "same-device-control",
      qrCode: "DEMO-QR-SAME-DEVICE-CONTROL",
      acceptedMinutesAgo: 18,
      acceptedDevices: ["scanner-west"],
      repeats: [
        { minutesAgo: 17, deviceId: "scanner-west" },
        { minutesAgo: 16.5, deviceId: "scanner-west" },
        { minutesAgo: 16, deviceId: "scanner-west" },
      ],
    },
    {
      suffix: "few-repeats-control",
      qrCode: "DEMO-QR-TWO-REPEATS-CONTROL",
      acceptedMinutesAgo: 5,
      acceptedDevices: ["scanner-north"],
      repeats: [
        { minutesAgo: 4, deviceId: "scanner-north" },
        { minutesAgo: 3, deviceId: "scanner-east" },
      ],
    },
    {
      suffix: "normal-control",
      qrCode: "DEMO-QR-NORMAL-CONTROL",
      acceptedMinutesAgo: 2,
      acceptedDevices: ["scanner-south"],
      repeats: [],
    },
    {
      suffix: "multiple-accepted",
      qrCode: "DEMO-QR-MULTIPLE-ACCEPTED",
      acceptedMinutesAgo: 1,
      acceptedDevices: ["scanner-north", "scanner-east"],
      repeats: [],
    },
  ];

  const seedNow = Date.now();
  for (const scenario of aiScenarios) {
    const user = await demoUser(
      `demo-${scenario.suffix}@example.com`,
      `Demo AI ${scenario.suffix}`,
      UserRole.ATTENDEE,
    );
    const scenarioRegistration = await prisma.registration.upsert({
      where: { userId_eventId: { userId: user.id, eventId } },
      update: { status: RegistrationStatus.CONFIRMED },
      create: { userId: user.id, eventId, status: RegistrationStatus.CONFIRMED },
    });
    const ticketId = `demo-ai-ticket-${scenario.suffix}`;
    const signedQr = signTicketCode(ticketId);
    const acceptedAt = new Date(seedNow - scenario.acceptedMinutesAgo * 60_000);
    const scenarioTicket = await prisma.ticket.upsert({
      where: { registrationId: scenarioRegistration.id },
      update: { qrCode: signedQr, checkedInAt: acceptedAt },
      create: { id: ticketId, registrationId: scenarioRegistration.id, qrCode: signedQr, checkedInAt: acceptedAt },
    });

    // Synthetic historical fixtures for AI rule analysis; normal check-in code only accepts a ticket once.
    await prisma.checkInAttempt.deleteMany({ where: { ticketId: scenarioTicket.id } });
    await prisma.checkInAttempt.createMany({
      data: [
        ...scenario.acceptedDevices.map((deviceCode) => ({
          eventId,
          ticketId: scenarioTicket.id,
          deviceId: scannerIds.get(deviceCode)!,
          scannedCode: signedQr.slice(0, 191),
          method: CheckInMethod.QR,
          result: CheckInResult.ACCEPTED,
          createdAt: acceptedAt,
        })),
        ...scenario.repeats.map((repeat) => ({
          eventId,
          ticketId: scenarioTicket.id,
          deviceId: scannerIds.get(repeat.deviceId)!,
          scannedCode: signedQr.slice(0, 191),
          method: CheckInMethod.QR,
          result: CheckInResult.DUPLICATE,
          createdAt: new Date(seedNow - repeat.minutesAgo * 60_000),
        })),
      ],
    });
  }

  console.log(`Seeded: admin@example.com, ${organizer.email}, ${attendee.email} (mật khẩu: ${DEMO_PASSWORD})`);
  console.log(`Mã QR vé demo: ${qrCode}`);
  console.log("AI check-in scenarios: RAPID-REPEAT, PERSISTENT-REPEAT, SEPARATE-BURSTS, SAME-DEVICE-CONTROL, TWO-REPEATS-CONTROL, NORMAL-CONTROL, MULTIPLE-ACCEPTED.");
  console.log(`AI analysis range: from=${new Date(seedNow - 60 * 60_000).toISOString()} to=${new Date(seedNow).toISOString()}`);
}

main().finally(() => prisma.$disconnect());
