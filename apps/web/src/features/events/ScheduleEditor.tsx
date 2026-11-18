"use client";

import Link from "next/link";
import { useState } from "react";
import { BackToEvent } from "@/components/BackToEvent";
import { ResourceCrud } from "@/features/resources/ResourceCrud";
import { api } from "@/lib/api";
import { formatDate, formatTime, timeRange, toLocalInput } from "@/lib/format";
import { useApi } from "@/lib/useApi";
import type { EventDetail, ScheduleItem, Speaker } from "@/types/event";

/** Diễn giả theo góc nhìn ban tổ chức: có email và các phiên đang tham gia. */
type SpeakerRow = Speaker & { email: string | null; sessions: Array<{ id: string; title: string }> };

const dash = <span className="muted">—</span>;

/**
 * Chỉnh sửa lịch trình & diễn giả của sự kiện (Chủ sự kiện / Đồng tổ chức).
 * API: /events/:eventId/schedules và /events/:eventId/speakers. Phiên phải nằm trong thời gian sự kiện.
 */
export function ScheduleEditor({ eventId }: { eventId: string }) {
  const id = encodeURIComponent(eventId);
  const event = useApi((signal) => api.get<EventDetail>(`/events/${id}`, { signal }), [eventId]);
  const speakers = useApi((signal) => api.get<SpeakerRow[]>(`/events/${id}/speakers`, { signal }), [eventId]);
  // Sửa / xoá diễn giả thì bảng lịch trình (cột diễn giả) cũng phải tải lại.
  const [scheduleVersion, setScheduleVersion] = useState(0);

  if (event.loading && !event.data) return <div className="skeleton-hero" aria-busy="true" />;
  if (event.error || !event.data) {
    return (
      <section className="state state-error" role="alert">
        <h1>Không tìm thấy sự kiện</h1>
        <p>{event.error}</p>
      </section>
    );
  }

  const ev = event.data;
  const locked = ev.status === "CANCELLED" || ev.status === "COMPLETED";
  const speakerOptions = (speakers.data ?? []).map((s) => ({
    value: s.id,
    label: [s.fullName, s.title, s.organization].filter(Boolean).join(" · "),
  }));

  return (
    <section className="page-section">
      <BackToEvent eventId={ev.id} name={ev.name} />
      <h1 className="page-title">Lịch trình & diễn giả</h1>
      <p className="muted">
        {ev.name} · {timeRange(ev.startsAt, ev.endsAt)}. Mỗi phiên phải nằm trong khoảng thời gian này.
      </p>

      {locked ? (
        <p className="notice-warn" role="status">
          Sự kiện đã {ev.status === "CANCELLED" ? "bị huỷ" : "kết thúc"}, không sửa được lịch trình.{" "}
          <Link href={`/events/${id}`}>Về trang sự kiện</Link>
        </p>
      ) : (
        <div className="tab-stack">
          <ResourceCrud<ScheduleItem>
            title="Lịch trình"
            description="Người tham dự thấy lịch trình ở trang sự kiện, sắp theo giờ bắt đầu."
            endpoint={`/events/${id}/schedules`}
            reloadKey={scheduleVersion}
            addLabel="+ Thêm phiên"
            emptyText="Chưa có phiên nào."
            fields={[
              { name: "title", label: "Tên phiên", required: true, maxLength: 191, wide: true },
              { name: "startsAt", label: "Bắt đầu", type: "datetime", required: true, defaultValue: toLocalInput(ev.startsAt) },
              { name: "endsAt", label: "Kết thúc", type: "datetime", required: true, defaultValue: toLocalInput(ev.startsAt) },
              { name: "room", label: "Phòng / sân khấu", maxLength: 100, placeholder: "Hội trường A" },
              {
                name: "speakerIds",
                label: "Diễn giả",
                type: "checkboxes",
                options: speakerOptions,
                placeholder: "Chưa có diễn giả – thêm ở bảng Diễn giả bên dưới.",
              },
              { name: "description", label: "Mô tả", type: "textarea" },
            ]}
            toForm={(s) => ({
              title: s.title,
              startsAt: s.startsAt,
              endsAt: s.endsAt,
              room: s.room ?? "",
              speakerIds: s.speakers.map((sp) => sp.id).join(","),
              description: s.description ?? "",
            })}
            columns={[
              {
                header: "Thời gian",
                render: (s) => (
                  <span className="small">
                    {formatDate(s.startsAt)}
                    <br />
                    <strong>
                      {formatTime(s.startsAt)}–{formatTime(s.endsAt)}
                    </strong>
                  </span>
                ),
              },
              {
                header: "Phiên",
                render: (s) => (
                  <>
                    <strong>{s.title}</strong>
                    {s.room && <div className="muted small">{s.room}</div>}
                  </>
                ),
              },
              { header: "Diễn giả", render: (s) => (s.speakers.length ? s.speakers.map((sp) => sp.fullName).join(", ") : dash) },
              { header: "Mô tả", render: (s) => (s.description ? <span className="small clamp-2">{s.description}</span> : dash) },
            ]}
            confirmDelete={(s) => `Xoá phiên "${s.title}" khỏi lịch trình?`}
          />

          <ResourceCrud<SpeakerRow>
            title="Diễn giả"
            description="Email chỉ ban tổ chức thấy, không hiện ở trang công khai."
            endpoint={`/events/${id}/speakers`}
            addLabel="+ Thêm diễn giả"
            emptyText="Chưa có diễn giả."
            onChanged={() => {
              speakers.reload();
              setScheduleVersion((v) => v + 1);
            }}
            fields={[
              { name: "fullName", label: "Họ tên", required: true, maxLength: 191 },
              { name: "title", label: "Chức danh", maxLength: 191, placeholder: "TS., Giám đốc kỹ thuật…" },
              { name: "organization", label: "Đơn vị", maxLength: 191 },
              { name: "email", label: "Email", type: "email" },
              { name: "avatarUrl", label: "Link ảnh đại diện", type: "url", placeholder: "https://…", wide: true },
              { name: "bio", label: "Giới thiệu", type: "textarea" },
            ]}
            toForm={(s) => ({
              fullName: s.fullName,
              title: s.title ?? "",
              organization: s.organization ?? "",
              email: s.email ?? "",
              avatarUrl: s.avatarUrl ?? "",
              bio: s.bio ?? "",
            })}
            columns={[
              {
                header: "Diễn giả",
                render: (s) => (
                  <>
                    <strong>{s.fullName}</strong>
                    {(s.title || s.organization) && (
                      <div className="muted small">{[s.title, s.organization].filter(Boolean).join(" · ")}</div>
                    )}
                  </>
                ),
              },
              { header: "Email", render: (s) => s.email ?? dash },
              {
                header: "Phiên tham gia",
                render: (s) => (s.sessions.length ? <span className="small">{s.sessions.map((x) => x.title).join(", ")}</span> : dash),
              },
            ]}
            confirmDelete={(s) =>
              s.sessions.length
                ? `Xoá diễn giả ${s.fullName}? Diễn giả sẽ bị gỡ khỏi ${s.sessions.length} phiên (các phiên vẫn giữ nguyên).`
                : `Xoá diễn giả ${s.fullName}?`
            }
          />
        </div>
      )}
    </section>
  );
}
