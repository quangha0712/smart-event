import { Injectable, NotFoundException } from "@nestjs/common";
import { CheckInResult, Prisma, RegistrationStatus, SensorType } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.module";

/** Giờ Việt Nam (UTC+7, không đổi giờ mùa hè) – dùng để gom số liệu theo ngày địa phương. */
const VN_OFFSET_MS = 7 * 60 * 60 * 1000;
const MINUTE = 60 * 1000;

function vnDay(d: Date) {
  return new Date(d.getTime() + VN_OFFSET_MS).toISOString().slice(0, 10);
}

/** Độ rộng khung check-in theo độ dài khoảng có dữ liệu: ngắn thì 15 phút, dài thì 1 giờ / 1 ngày. */
function bucketSizeMs(spanMs: number) {
  if (spanMs <= 6 * 60 * MINUTE) return 15 * MINUTE;
  if (spanMs <= 48 * 60 * MINUTE) return 60 * MINUTE;
  return 24 * 60 * MINUTE;
}

const toNumber = (d: Prisma.Decimal | null | undefined) => (d ? Number(d) : 0);

/**
 * Số liệu tổng hợp cho trang Dashboard của một sự kiện (Chủ sự kiện / Đồng tổ chức).
 * Gom sẵn ở server để trang chỉ cần một lần gọi API.
 */
@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async forEvent(eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, name: true, startsAt: true, endsAt: true, capacity: true, status: true },
    });
    if (!event) throw new NotFoundException("Không tìm thấy sự kiện");

    const [registrations, checkedIn, attempts, readings, budgetItems, expenses, sponsors] = await Promise.all([
      this.prisma.registration.findMany({ where: { eventId }, select: { status: true, createdAt: true } }),
      this.prisma.ticket.count({ where: { checkedInAt: { not: null }, registration: { eventId } } }),
      this.prisma.checkInAttempt.findMany({ where: { eventId }, select: { result: true, createdAt: true }, orderBy: { createdAt: "asc" } }),
      this.prisma.sensorReading.findMany({
        where: { eventId, sensorType: SensorType.PEOPLE_COUNT },
        select: { zone: true, value: true, unit: true, recordedAt: true, device: { select: { name: true, location: true } } },
        orderBy: { recordedAt: "desc" },
      }),
      this.prisma.budgetItem.findMany({ where: { eventId }, select: { id: true, category: true, plannedAmount: true, isIncome: true } }),
      this.prisma.expense.findMany({ where: { eventId }, select: { amount: true, budgetItemId: true } }),
      this.prisma.sponsor.aggregate({ where: { eventId }, _sum: { amount: true } }),
    ]);

    return {
      event,
      registrations: this.registrationStats(registrations, checkedIn),
      checkIn: this.checkInStats(attempts),
      zones: this.latestPerZone(readings),
      budget: this.budgetStats(budgetItems, expenses, toNumber(sponsors._sum.amount)),
      generatedAt: new Date(),
    };
  }

  private registrationStats(rows: Array<{ status: RegistrationStatus; createdAt: Date }>, checkedIn: number) {
    const count = (s: RegistrationStatus) => rows.filter((r) => r.status === s).length;
    // Lượt đăng ký mới theo ngày (giờ VN), tính cả đăng ký sau này bị huỷ – phản ánh nhu cầu theo thời gian.
    const byDay = new Map<string, number>();
    for (const r of rows) byDay.set(vnDay(r.createdAt), (byDay.get(vnDay(r.createdAt)) ?? 0) + 1);
    return {
      confirmed: count(RegistrationStatus.CONFIRMED),
      pending: count(RegistrationStatus.PENDING),
      cancelled: count(RegistrationStatus.CANCELLED),
      checkedIn,
      byDay: [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, total]) => ({ date, count: total })),
    };
  }

  private checkInStats(rows: Array<{ result: CheckInResult; createdAt: Date }>) {
    const byResult = Object.fromEntries(Object.values(CheckInResult).map((r) => [r, 0])) as Record<CheckInResult, number>;
    for (const r of rows) byResult[r.result] += 1;

    let buckets: Array<{ start: string; accepted: number; rejected: number }> = [];
    let bucketMinutes = 15;
    if (rows.length) {
      const first = rows[0].createdAt.getTime();
      const last = rows[rows.length - 1].createdAt.getTime();
      const size = bucketSizeMs(last - first);
      bucketMinutes = size / MINUTE;
      // Mốc khung tính theo giờ VN để khung ngày bắt đầu lúc 00:00 giờ địa phương.
      const align = (t: number) => Math.floor((t + VN_OFFSET_MS) / size) * size - VN_OFFSET_MS;
      const start = align(first);
      const count = Math.floor((align(last) - start) / size) + 1;
      buckets = Array.from({ length: count }, (_, i) => ({ start: new Date(start + i * size).toISOString(), accepted: 0, rejected: 0 }));
      for (const r of rows) {
        const b = buckets[Math.floor((r.createdAt.getTime() - start) / size)];
        if (r.result === CheckInResult.ACCEPTED) b.accepted += 1;
        else b.rejected += 1;
      }
    }
    return { totalAttempts: rows.length, byResult, bucketMinutes, buckets };
  }

  /** Số người mới nhất của từng khu vực (khu vực trống thì lấy vị trí / tên thiết bị). */
  private latestPerZone(
    rows: Array<{ zone: string | null; value: Prisma.Decimal; unit: string; recordedAt: Date; device: { name: string; location: string | null } }>,
  ) {
    const latest = new Map<string, { zone: string; value: number; unit: string; recordedAt: Date }>();
    for (const r of rows) {
      const zone = r.zone ?? r.device.location ?? r.device.name;
      if (!latest.has(zone)) latest.set(zone, { zone, value: Number(r.value), unit: r.unit, recordedAt: r.recordedAt });
    }
    return [...latest.values()].sort((a, b) => b.value - a.value);
  }

  private budgetStats(
    items: Array<{ id: string; category: string; plannedAmount: Prisma.Decimal; isIncome: boolean }>,
    expenses: Array<{ amount: Prisma.Decimal; budgetItemId: string | null }>,
    sponsorTotal: number,
  ) {
    const categoryOf = new Map(items.map((i) => [i.id, i]));
    const byCategory = new Map<string, { category: string; planned: number; actual: number }>();
    const row = (category: string) => {
      if (!byCategory.has(category)) byCategory.set(category, { category, planned: 0, actual: 0 });
      return byCategory.get(category)!;
    };
    let plannedIncome = 0;
    for (const i of items) {
      if (i.isIncome) plannedIncome += toNumber(i.plannedAmount);
      else row(i.category).planned += toNumber(i.plannedAmount);
    }
    for (const e of expenses) {
      const item = e.budgetItemId ? categoryOf.get(e.budgetItemId) : undefined;
      // Khoản chi không gắn dự toán (hoặc gắn dòng "thu") gom vào nhóm riêng.
      row(item && !item.isIncome ? item.category : "Ngoài dự toán").actual += toNumber(e.amount);
    }
    const categories = [...byCategory.values()].sort((a, b) => Math.max(b.planned, b.actual) - Math.max(a.planned, a.actual));
    const plannedExpense = categories.reduce((s, c) => s + c.planned, 0);
    const actualExpense = categories.reduce((s, c) => s + c.actual, 0);
    return {
      plannedExpense,
      actualExpense,
      plannedIncome,
      sponsorTotal,
      balance: plannedIncome + sponsorTotal - actualExpense,
      byCategory: categories,
    };
  }
}
