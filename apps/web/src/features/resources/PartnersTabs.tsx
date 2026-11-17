"use client";

import { formatMoney } from "@/lib/format";
import { ResourceCrud } from "./ResourceCrud";
import type { Sponsor, Vendor } from "./types";

const dash = <span className="muted">—</span>;

/** Nhà cung cấp: danh bạ dùng chung, gắn vào dự toán / thực chi ở tab Ngân sách. */
export function VendorsTab({ onChanged }: { onChanged?: () => void }) {
  return (
    <ResourceCrud<Vendor>
      title="Nhà cung cấp"
      description="Danh bạ dùng chung cho mọi sự kiện. Gắn nhà cung cấp vào dòng dự toán / khoản chi ở tab Dự toán – thực chi."
      endpoint="/resources/vendors"
      addLabel="+ Thêm nhà cung cấp"
      emptyText="Chưa có nhà cung cấp."
      onChanged={onChanged}
      fields={[
        { name: "name", label: "Tên nhà cung cấp", required: true, maxLength: 191 },
        { name: "serviceType", label: "Loại dịch vụ", required: true, maxLength: 100, placeholder: "Âm thanh – ánh sáng, Ăn uống…" },
        { name: "contactName", label: "Người liên hệ", maxLength: 191 },
        { name: "phone", label: "Điện thoại", type: "tel", maxLength: 30 },
        { name: "email", label: "Email", type: "email" },
        { name: "taxCode", label: "Mã số thuế", maxLength: 30 },
        { name: "address", label: "Địa chỉ", maxLength: 255, wide: true },
        { name: "note", label: "Ghi chú", type: "textarea" },
      ]}
      toForm={(v) => ({
        name: v.name,
        serviceType: v.serviceType,
        contactName: v.contactName ?? "",
        phone: v.phone ?? "",
        email: v.email ?? "",
        taxCode: v.taxCode ?? "",
        address: v.address ?? "",
        note: v.note ?? "",
      })}
      columns={[
        { header: "Nhà cung cấp", render: (v) => <strong>{v.name}</strong> },
        { header: "Dịch vụ", render: (v) => <span className="pill">{v.serviceType}</span> },
        {
          header: "Liên hệ",
          render: (v) =>
            v.contactName || v.phone || v.email ? (
              <>
                {v.contactName && <div>{v.contactName}</div>}
                <div className="muted small">{[v.phone, v.email].filter(Boolean).join(" · ")}</div>
              </>
            ) : (
              dash
            ),
        },
        { header: "MST", render: (v) => v.taxCode ?? dash },
      ]}
      confirmDelete={(v) => `Xoá nhà cung cấp "${v.name}"? Các dòng dự toán / khoản chi gắn với nhà cung cấp này sẽ được gỡ liên kết.`}
    />
  );
}

/** Nhà tài trợ của sự kiện, kèm hạng và giá trị tài trợ. */
export function SponsorsTab({ eventId, onChanged }: { eventId: string; onChanged?: () => void }) {
  return (
    <ResourceCrud<Sponsor>
      title="Nhà tài trợ"
      description="Tổng tài trợ được tính vào nguồn thu ở tab Dự toán – thực chi."
      endpoint="/resources/sponsors"
      listQuery={{ eventId }}
      createExtra={{ eventId }}
      addLabel="+ Thêm nhà tài trợ"
      emptyText="Sự kiện chưa có nhà tài trợ."
      onChanged={onChanged}
      fields={[
        { name: "name", label: "Tên nhà tài trợ", required: true, maxLength: 191 },
        { name: "tier", label: "Hạng", maxLength: 50, placeholder: "Kim cương, Vàng, Bạc…" },
        { name: "amount", label: "Giá trị tài trợ (VND)", type: "number", min: 0, step: "1000" },
        { name: "contactName", label: "Người liên hệ", maxLength: 191 },
        { name: "phone", label: "Điện thoại", type: "tel", maxLength: 30 },
        { name: "email", label: "Email", type: "email" },
        { name: "website", label: "Website", type: "url", placeholder: "https://…", wide: true },
        { name: "note", label: "Ghi chú", type: "textarea" },
      ]}
      // Giá trị tài trợ là cột bắt buộc (mặc định 0): xoá trống khi sửa → gửi 0 thay vì null.
      transformBody={(body, mode) => (mode === "edit" && body.amount === null ? { ...body, amount: 0 } : body)}
      toForm={(s) => ({
        name: s.name,
        tier: s.tier ?? "",
        amount: String(Number(s.amount)),
        contactName: s.contactName ?? "",
        phone: s.phone ?? "",
        email: s.email ?? "",
        website: s.website ?? "",
        note: s.note ?? "",
      })}
      columns={[
        {
          header: "Nhà tài trợ",
          render: (s) => (
            <>
              <strong>{s.name}</strong>
              {s.website && (
                <div className="small">
                  <a href={s.website} target="_blank" rel="noopener noreferrer">
                    {s.website.replace(/^https?:\/\//, "")}
                  </a>
                </div>
              )}
            </>
          ),
        },
        { header: "Hạng", render: (s) => (s.tier ? <span className="pill">{s.tier}</span> : dash) },
        { header: "Giá trị", align: "right", render: (s) => formatMoney(s.amount) },
        {
          header: "Liên hệ",
          render: (s) =>
            s.contactName || s.phone || s.email ? (
              <>
                {s.contactName && <div>{s.contactName}</div>}
                <div className="muted small">{[s.phone, s.email].filter(Boolean).join(" · ")}</div>
              </>
            ) : (
              dash
            ),
        },
      ]}
      footer={(rows) =>
        rows.length > 0 && (
          <p className="crud-total">
            Tổng tài trợ: <strong>{formatMoney(rows.reduce((sum, s) => sum + Number(s.amount), 0))}</strong>
          </p>
        )
      }
      confirmDelete={(s) => `Xoá nhà tài trợ "${s.name}"?`}
    />
  );
}
