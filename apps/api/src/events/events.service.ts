import { BadRequestException, Injectable } from "@nestjs/common";
import { EventStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.module";

export type NewEventInput = {
  name?: string;
  description?: string;
  location?: string;
  startsAt?: string;
  endsAt?: string;
  capacity?: number;
};

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.event.findMany({
      orderBy: { startsAt: "asc" },
      include: { _count: { select: { registrations: true } } },
    });
  }

  getById(id: string) {
    return this.prisma.event.findUnique({
      where: { id },
      include: { schedules: true, _count: { select: { registrations: true } } },
    });
  }

  create(input: NewEventInput) {
    const startsAt = input.startsAt ? new Date(input.startsAt) : undefined;
    const endsAt = input.endsAt ? new Date(input.endsAt) : undefined;
    if (!input.name?.trim() || !startsAt || !endsAt || isNaN(startsAt.valueOf()) || isNaN(endsAt.valueOf())) {
      throw new BadRequestException("Cần cung cấp tên sự kiện và thời gian bắt đầu/kết thúc hợp lệ");
    }
    if (endsAt <= startsAt) throw new BadRequestException("Thời gian kết thúc phải sau thời gian bắt đầu");
    if (input.capacity !== undefined && (!Number.isInteger(input.capacity) || input.capacity < 1)) {
      throw new BadRequestException("Sức chứa phải là số nguyên dương");
    }

    return this.prisma.event.create({
      data: {
        name: input.name.trim(),
        description: input.description,
        location: input.location,
        startsAt,
        endsAt,
        capacity: input.capacity,
        status: EventStatus.DRAFT,
      },
    });
  }
}
