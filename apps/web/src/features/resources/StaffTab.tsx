"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { formatDateTime, formatTime } from "@/lib/format";
import { useApi } from "@/lib/useApi";
import { ResourceCrud } from "./ResourceCrud";
import { ASSIGNMENT_STATUS_LABELS, type AssignmentStatus, type StaffAssignment, type StaffMember } from "./types";

function shift(a: StaffAssignment) {
  if (!a.startsAt) return <span className="muted">Chưa xếp ca</span>;
  if (!a.endsAt) return formatDateTime(a.startsAt);
  const sameDay = new Date(a.startsAt).toDateString() === new Date(a.endsAt).toDateString();
  return sameDay ? `${formatDateTime(a.startsAt)}–${formatTime(a.endsAt)}` : `${formatDateTime(a.startsAt)} → ${formatDateTime(a.endsAt)}`;
}

/** Phân ca nhân sự cho sự kiện + danh bạ nhân sự dùng chung. */
export function StaffTab({ eventId }: { eventId: string }) {
  const staff = useApi((signal) => api.get<StaffMember[]>("/resources/staff", { signal }));
  // Xoá / sửa nhân sự trong danh bạ thì bảng phân ca cũng cần tải lại.
  const [version, setVersion] = useState(0);
  const staffOptions = (staff.data ?? []).map((s) => ({ value: s.id, label: s.position ? `${s.fullName} – ${s.position}` : s.fullName }));

  return (
    <div className="tab-stack">
      <ResourceCrud<StaffAssignment>
        title="Phân ca"
        description="Ai làm gì, lúc nào trong sự kiện này."
        endpoint="/resources/staff-assignments"
        listQuery={{ eventId }}
        createExtra={{ eventId }}
        reloadKey={version}
        addLabel="+ Phân ca"
        emptyText="Chưa phân ca cho ai."
        fields={[
          {
            name: "staffId",
            label: "Nhân sự",
            type: "select",
            required: true,
            options: [{ value: "", label: staffOptions.length ? "— Chọn nhân sự —" : "— Thêm nhân sự ở danh bạ bên dưới —" }, ...staffOptions],
          },
          { name: "role", label: "Vai trò", required: true, maxLength: 100, placeholder: "Ví dụ: Check-in cổng A" },
          { name: "startsAt", label: "Bắt đầu ca", type: "datetime" },
          { name: "endsAt", label: "Kết thúc ca", type: "datetime" },
          {
            name: "status",
            label: "Trạng thái",
            type: "select",
            defaultValue: "ASSIGNED",
            options: (Object.keys(ASSIGNMENT_STATUS_LABELS) as AssignmentStatus[]).map((s) => ({ value: s, label: ASSIGNMENT_STATUS_LABELS[s] })),
          },
          { name: "task", label: "Nhiệm vụ", type: "textarea" },
        ]}
        toForm={(a) => ({ staffId: a.staffId, role: a.role, startsAt: a.startsAt ?? "", endsAt: a.endsAt ?? "", status: a.status, task: a.task ?? "" })}
        columns={[
          {
            header: "Nhân sự",
            render: (a) => (
              <>
                <strong>{a.staff.fullName}</strong>
                {a.staff.phone && <div className="muted small">{a.staff.phone}</div>}
              </>
            ),
          },
          { header: "Vai trò", render: (a) => a.role },
          { header: "Ca", render: shift },
          { header: "Trạng thái", render: (a) => <span className={`pill pill-assign-${a.status.toLowerCase()}`}>{ASSIGNMENT_STATUS_LABELS[a.status]}</span> },
          { header: "Nhiệm vụ", render: (a) => a.task ?? <span className="muted">—</span> },
        ]}
        confirmDelete={(a) => `Bỏ phân ca "${a.role}" của ${a.staff.fullName}?`}
      />

      <ResourceCrud<StaffMember>
        title="Danh bạ nhân sự"
        description="Dùng chung cho mọi sự kiện. Xoá một người sẽ xoá luôn các ca đã phân cho người đó."
        endpoint="/resources/staff"
        addLabel="+ Thêm nhân sự"
        emptyText="Danh bạ trống."
        onChanged={() => {
          staff.reload();
          setVersion((v) => v + 1);
        }}
        fields={[
          { name: "fullName", label: "Họ tên", required: true, maxLength: 191 },
          { name: "position", label: "Chức danh", maxLength: 100, placeholder: "Tình nguyện viên, Hậu cần…" },
          { name: "phone", label: "Điện thoại", type: "tel", maxLength: 30 },
          { name: "email", label: "Email", type: "email" },
          { name: "skills", label: "Kỹ năng", type: "textarea" },
          { name: "note", label: "Ghi chú", type: "textarea" },
        ]}
        toForm={(s) => ({ fullName: s.fullName, position: s.position ?? "", phone: s.phone ?? "", email: s.email ?? "", skills: s.skills ?? "", note: s.note ?? "" })}
        columns={[
          { header: "Họ tên", render: (s) => <strong>{s.fullName}</strong> },
          { header: "Chức danh", render: (s) => s.position ?? <span className="muted">—</span> },
          { header: "Điện thoại", render: (s) => s.phone ?? <span className="muted">—</span> },
          { header: "Email", render: (s) => s.email ?? <span className="muted">—</span> },
        ]}
        confirmDelete={(s) => `Xoá ${s.fullName} khỏi danh bạ? Các ca đã phân cho người này cũng bị xoá.`}
      />
    </div>
  );
}
