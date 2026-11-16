import "dotenv/config";
import { DeviceType, EventStatus, PrismaClient, RegistrationStatus, SensorType, UserRole } from "@prisma/client";
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

  console.log(`Seeded: admin@example.com, ${organizer.email}, ${attendee.email} (mật khẩu: ${DEMO_PASSWORD})`);
  console.log(`Mã QR vé demo: ${qrCode}`);
}

main().finally(() => prisma.$disconnect());
