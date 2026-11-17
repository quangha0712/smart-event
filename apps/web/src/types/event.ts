export type EventStatus = "DRAFT" | "PUBLISHED" | "CANCELLED" | "COMPLETED";

export type EventSummary = {
  id: string;
  name: string;
  description?: string | null;
  location: string | null;
  startsAt: string;
  endsAt: string;
  status: EventStatus;
  capacity: number | null;
  _count: { registrations: number };
};

export type MyRegistration = {
  id: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  createdAt: string;
  event: { id: string; name: string; startsAt: string; endsAt: string; location: string | null; status: EventStatus };
  ticket: { id: string; qrPayload: string | null; checkedInAt: string | null } | null;
};

export type CheckInStats = {
  eventId: string;
  totalAttempts: number;
  accepted: number;
  repeatedScans: number;
  invalidCodes: number;
  notEligible: number;
  windowMinutes: number;
};

export type Speaker = {
  id: string;
  fullName: string;
  title: string | null;
  organization: string | null;
  bio: string | null;
  avatarUrl: string | null;
};

export type ScheduleItem = {
  id: string;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string;
  room: string | null;
  speakers: Speaker[];
};

/** GET /events/:id – bản nháp chỉ trả cho ban tổ chức của sự kiện và ADMIN. */
export type EventDetail = EventSummary & {
  schedules: ScheduleItem[];
  speakers: Speaker[];
};
