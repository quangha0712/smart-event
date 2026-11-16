import { DeviceType, EventStatus, FundingSourceType, PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const organizer = await prisma.user.upsert({
    where: { email: "organizer@example.com" },
    update: {},
    create: {
      email: "organizer@example.com",
      fullName: "Demo Organizer",
      passwordHash: "DEMO_ONLY_REPLACE_WITH_BCRYPT_HASH",
      role: UserRole.ORGANIZER,
    },
  });

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
  const sponsor = await prisma.sponsor.upsert({
    where: { id: "demo-sponsor" },
    update: {},
    create: { id: "demo-sponsor", name: "Nhà tài trợ Demo" },
  });
  await prisma.funding.upsert({
    where: { id: "demo-funding-gold" },
    update: {},
    create: { id: "demo-funding-gold", eventId, sponsorId: sponsor.id, sourceType: FundingSourceType.SPONSOR, tier: "Vàng", amount: 20_000_000 },
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

  console.log(`Seeded demo organizer ${organizer.email}`);
}

main().finally(() => prisma.$disconnect());
