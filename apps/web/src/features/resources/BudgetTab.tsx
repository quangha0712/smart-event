"use client";

import { useState } from "react";
import { StatCard } from "@/features/home/parts";
import { api } from "@/lib/api";
import { formatDateTime, formatMoney, toLocalInput } from "@/lib/format";
import { useApi } from "@/lib/useApi";
import { ResourceCrud } from "./ResourceCrud";
import type { BudgetItem, BudgetSummary, Expense, Vendor } from "./types";

const dash = <span className="muted">—</span>;

/** Chênh lệch thực chi – dự toán: dương = vượt (đỏ), âm = tiết kiệm (xanh). */
function Variance({ value }: { value: string | number }) {
  const n = Number(value);
  if (!n) return <span className="muted">0 ₫</span>;
  return <span className={n > 0 ? "variance-over" : "variance-under"}>{n > 0 ? "+" : "−"}{formatMoney(Math.abs(n))}</span>;
}

/** Dự toán – thực chi của một sự kiện: tổng hợp, dòng dự toán, khoản chi. */
export function BudgetTab({ eventId }: { eventId: string }) {
  const summary = useApi((signal) => api.get<BudgetSummary>(`/resources/budget-summary/${encodeURIComponent(eventId)}`, { signal }), [eventId]);
  const vendors = useApi((signal) => api.get<Vendor[]>("/resources/vendors", { signal }));
  const items = useApi((signal) => api.get<BudgetItem[]>("/resources/budget-items", { query: { eventId }, signal }), [eventId]);
  // Thêm / sửa / xoá ở bảng này thì bảng kia và phần tổng hợp phải tải lại.
  const [itemsVersion, setItemsVersion] = useState(0);
  const [expensesVersion, setExpensesVersion] = useState(0);

  const vendorOptions = [{ value: "", label: "— Không gắn nhà cung cấp —" }, ...(vendors.data ?? []).map((v) => ({ value: v.id, label: v.name }))];
  const itemOptions = [
    { value: "", label: "— Ngoài dự toán —" },
    ...(items.data ?? []).filter((i) => !i.isIncome).map((i) => ({ value: i.id, label: `${i.category} · ${i.name}` })),
  ];
  const actualById = new Map((summary.data?.lines ?? []).map((l) => [l.id, l]));
  const t = summary.data?.totals;
  const variance = Number(t?.expenseVariance ?? 0);

  return (
    <div className="tab-stack">
      {summary.error && <p className="form-error" role="alert">{summary.error}</p>}
      <div className="stats-grid">
        <StatCard label="Dự toán chi" value={t ? formatMoney(t.plannedExpense) : "…"} />
        <StatCard
          label="Thực chi"
          value={t ? formatMoney(t.actualExpense) : "…"}
          hint={t && Number(t.unplannedExpense) ? `Gồm ${formatMoney(t.unplannedExpense)} ngoài dự toán` : undefined}
        />
        <StatCard
          label="Chênh lệch"
          value={t ? <Variance value={t.expenseVariance} /> : "…"}
          hint={t ? (variance > 0 ? "Vượt dự toán" : variance < 0 ? "Còn trong dự toán" : "Đúng dự toán") : undefined}
        />
        <StatCard
          label="Số dư"
          value={t ? formatMoney(t.balance) : "…"}
          hint={t ? `Thu dự kiến ${formatMoney(t.plannedIncome)} + tài trợ ${formatMoney(t.sponsorTotal)} − thực chi` : undefined}
        />
      </div>

      <ResourceCrud<BudgetItem>
        title="Dự toán"
        description="Thành tiền = số lượng × đơn giá (server tự tính). Dòng “Thu” là khoản thu dự kiến, ví dụ bán vé."
        endpoint="/resources/budget-items"
        listQuery={{ eventId }}
        createExtra={{ eventId }}
        reloadKey={itemsVersion}
        addLabel="+ Thêm dòng dự toán"
        emptyText="Chưa có dòng dự toán."
        onChanged={() => {
          summary.reload();
          items.reload();
          setExpensesVersion((v) => v + 1);
        }}
        fields={[
          { name: "category", label: "Nhóm", required: true, maxLength: 100, placeholder: "Thiết bị, Ăn uống, Truyền thông…" },
          { name: "name", label: "Khoản mục", required: true, maxLength: 191 },
          {
            name: "isIncome",
            label: "Loại",
            type: "select",
            defaultValue: "false",
            options: [
              { value: "false", label: "Chi" },
              { value: "true", label: "Thu" },
            ],
          },
          { name: "vendorId", label: "Nhà cung cấp", type: "select", options: vendorOptions },
          { name: "quantity", label: "Số lượng", type: "number", min: 0, step: "any", defaultValue: "1" },
          { name: "unit", label: "Đơn vị", maxLength: 30, placeholder: "gói, suất, ngày…" },
          { name: "unitPrice", label: "Đơn giá (VND)", type: "number", required: true, min: 0, step: "1000" },
          { name: "note", label: "Ghi chú", type: "textarea" },
        ]}
        transformBody={(body, mode) => ({
          ...body,
          isIncome: body.isIncome === "true",
          // Số lượng là cột bắt buộc: xoá trống khi sửa → về 1.
          ...(mode === "edit" && body.quantity === null ? { quantity: 1 } : {}),
        })}
        toForm={(i) => ({
          category: i.category,
          name: i.name,
          isIncome: String(i.isIncome),
          vendorId: i.vendorId ?? "",
          quantity: String(Number(i.quantity)),
          unit: i.unit ?? "",
          unitPrice: String(Number(i.unitPrice)),
          note: i.note ?? "",
        })}
        columns={[
          { header: "Nhóm", render: (i) => i.category },
          {
            header: "Khoản mục",
            render: (i) => (
              <>
                <strong>{i.name}</strong> {i.isIncome && <span className="pill pill-published">Thu</span>}
                {i.vendor && <div className="muted small">{i.vendor.name}</div>}
              </>
            ),
          },
          {
            header: "SL × Đơn giá",
            align: "right",
            render: (i) => (
              <span className="small">
                {Number(i.quantity).toLocaleString("vi-VN")} {i.unit ?? ""} × {formatMoney(i.unitPrice)}
              </span>
            ),
          },
          { header: "Dự toán", align: "right", render: (i) => <strong>{formatMoney(i.plannedAmount)}</strong> },
          { header: "Thực chi", align: "right", render: (i) => (i.isIncome ? dash : formatMoney(actualById.get(i.id)?.actualAmount ?? 0)) },
          { header: "Chênh lệch", align: "right", render: (i) => (i.isIncome ? dash : <Variance value={actualById.get(i.id)?.variance ?? 0} />) },
        ]}
        confirmDelete={(i) => `Xoá dòng dự toán "${i.name}"? Các khoản chi đã gắn sẽ chuyển thành chi ngoài dự toán.`}
      />

      <ResourceCrud<Expense>
        title="Thực chi"
        description="Khoản đã chi thực tế. Không gắn dòng dự toán = chi phát sinh ngoài dự toán."
        endpoint="/resources/expenses"
        listQuery={{ eventId }}
        createExtra={{ eventId }}
        reloadKey={expensesVersion}
        addLabel="+ Ghi khoản chi"
        emptyText="Chưa có khoản chi nào."
        onChanged={() => {
          summary.reload();
          setItemsVersion((v) => v + 1);
        }}
        fields={[
          { name: "description", label: "Nội dung chi", required: true, maxLength: 255, wide: true },
          { name: "amount", label: "Số tiền (VND)", type: "number", required: true, min: 0, step: "1000" },
          { name: "paidAt", label: "Ngày chi", type: "datetime", required: true, defaultValue: toLocalInput(new Date().toISOString()) },
          { name: "budgetItemId", label: "Thuộc dòng dự toán", type: "select", options: itemOptions },
          { name: "vendorId", label: "Nhà cung cấp", type: "select", options: vendorOptions },
          { name: "invoiceNumber", label: "Số hoá đơn", maxLength: 100 },
          { name: "note", label: "Ghi chú", type: "textarea" },
        ]}
        toForm={(e) => ({
          description: e.description,
          amount: String(Number(e.amount)),
          paidAt: e.paidAt,
          budgetItemId: e.budgetItemId ?? "",
          vendorId: e.vendorId ?? "",
          invoiceNumber: e.invoiceNumber ?? "",
          note: e.note ?? "",
        })}
        columns={[
          { header: "Ngày chi", render: (e) => <span className="small">{formatDateTime(e.paidAt)}</span> },
          {
            header: "Nội dung",
            render: (e) => (
              <>
                <strong>{e.description}</strong>
                <div className="muted small">{e.budgetItem ? e.budgetItem.name : <span className="pill pill-draft">Ngoài dự toán</span>}</div>
              </>
            ),
          },
          { header: "Nhà cung cấp", render: (e) => e.vendor?.name ?? dash },
          { header: "Số tiền", align: "right", render: (e) => <strong>{formatMoney(e.amount)}</strong> },
          { header: "Số HĐ", render: (e) => e.invoiceNumber ?? dash },
        ]}
        confirmDelete={(e) => `Xoá khoản chi "${e.description}"?`}
      />
    </div>
  );
}
