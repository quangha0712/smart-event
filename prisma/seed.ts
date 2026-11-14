import { PrismaClient, UserRole, EventStatus } from "@prisma/client";

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
  console.log(`Seeded demo organizer ${organizer.email}`);
}

main().finally(() => prisma.$disconnect());
