"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { toLocalInput } from "@/lib/format";
import { useApi } from "@/lib/useApi";

export type FieldDef = {
  name: string;
  label: string;
  /** checkboxes: chọn nhiều từ `options`; giá trị form là chuỗi id ngăn bởi dấu phẩy, gửi API dạng mảng. */
  type?: "text" | "email" | "tel" | "url" | "number" | "datetime" | "select" | "textarea" | "checkboxes";
  required?: boolean;
  /** Với select: giá trị "" = không chọn (gửi null khi sửa / bỏ qua khi thêm). */
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
  min?: number;
  step?: string;
  maxLength?: number;
  /** Chiếm cả hàng trong lưới form. */
  wide?: boolean;
  /** Giá trị mặc định khi thêm mới. */
  defaultValue?: string;
};

export type Column<T> = {
  header: string;
  render: (row: T) => React.ReactNode;
  align?: "right";
};

type FormValues = Record<string, string>;
type Mode<T> = { kind: "add" } | { kind: "edit"; row: T } | null;

type Props<T extends { id: string }> = {
  title: string;
  description?: React.ReactNode;
  /** vd "/resources/sponsors". Sửa/xoá gọi `${endpoint}/:id`. */
  endpoint: string;
  /** Tham số khi liệt kê, vd { eventId }. */
  listQuery?: Record<string, string>;
  /** Trường luôn gửi kèm khi thêm, vd { eventId }. */
  createExtra?: Record<string, unknown>;
  fields: FieldDef[];
  columns: Column<T>[];
  /** Bản ghi → giá trị form khi bấm Sửa (thời gian ISO tự đổi sang datetime-local). */
  toForm: (row: T) => FormValues;
  /** Chỉnh body trước khi gửi (vd đổi "true"/"false" → boolean). */
  transformBody?: (body: Record<string, unknown>, mode: "add" | "edit") => Record<string, unknown>;
  confirmDelete: (row: T) => string;
  addLabel?: string;
  emptyText?: string;
  /** Đổi giá trị này để buộc tải lại (vd sau khi tab khác thay đổi dữ liệu liên quan). */
  reloadKey?: unknown;
  /** Gọi sau mỗi lần thêm / sửa / xoá thành công. */
  onChanged?: () => void;
  /** Dòng tổng hoặc ghi chú dưới bảng. */
  footer?: (rows: T[]) => React.ReactNode;
};

/** Chuỗi trên form → giá trị gửi API. Ô trống: khi thêm bỏ qua, khi sửa gửi null để xoá. */
function toBody(fields: FieldDef[], values: FormValues, mode: "add" | "edit") {
  const body: Record<string, unknown> = {};
  for (const f of fields) {
    const raw = (values[f.name] ?? "").trim();
    if (f.type === "checkboxes") {
      const ids = raw ? raw.split(",") : [];
      // Khi sửa luôn gửi mảng (kể cả rỗng) để thay toàn bộ lựa chọn; khi thêm bỏ qua nếu không chọn gì.
      if (ids.length || mode === "edit") body[f.name] = ids;
      continue;
    }
    if (raw === "") {
      if (mode === "edit" && !f.required) body[f.name] = null;
      continue;
    }
    if (f.type === "number") body[f.name] = Number(raw);
    else if (f.type === "datetime") body[f.name] = new Date(raw).toISOString();
    else body[f.name] = raw;
  }
  return body;
}

function validate(fields: FieldDef[], values: FormValues) {
  const errors: Record<string, string> = {};
  for (const f of fields) {
    const raw = (values[f.name] ?? "").trim();
    if (f.required && !raw) errors[f.name] = `Cần nhập ${f.label.toLowerCase()}`;
    else if (raw && f.type === "number") {
      const n = Number(raw);
      if (!Number.isFinite(n)) errors[f.name] = `${f.label} phải là số`;
      else if (f.min !== undefined && n < f.min) errors[f.name] = `${f.label} tối thiểu ${f.min}`;
    } else if (raw && f.type === "datetime" && isNaN(new Date(raw).valueOf())) {
      errors[f.name] = `${f.label} không hợp lệ`;
    }
  }
  return errors;
}

/** Danh sách + form thêm/sửa + xoá cho một loại tài nguyên, cấu hình bằng `fields` và `columns`. */
export function ResourceCrud<T extends { id: string }>(props: Props<T>) {
  const { title, description, endpoint, listQuery, createExtra, fields, columns, toForm, transformBody, confirmDelete } = props;
  const queryKey = JSON.stringify(listQuery ?? {});
  const list = useApi((signal) => api.get<T[]>(endpoint, { query: listQuery, signal }), [endpoint, queryKey]);
  const { reload } = list;

  // Tải lại khi reloadKey đổi (bỏ qua lần đầu vì useApi đã tải khi mở).
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.reloadKey]);

  const [mode, setMode] = useState<Mode<T>>(null);
  const [values, setValues] = useState<FormValues>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  function openAdd() {
    setMode({ kind: "add" });
    setValues(Object.fromEntries(fields.map((f) => [f.name, f.defaultValue ?? ""])));
    setErrors({});
    setMessage(null);
  }

  function openEdit(row: T) {
    const raw = toForm(row);
    const converted: FormValues = {};
    for (const f of fields) {
      const v = raw[f.name] ?? "";
      converted[f.name] = f.type === "datetime" ? toLocalInput(v) : v;
    }
    setMode({ kind: "edit", row });
    setValues(converted);
    setErrors({});
    setMessage(null);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!mode) return;
    const found = validate(fields, values);
    setErrors(found);
    if (Object.keys(found).length) return;

    const kind = mode.kind;
    let body = toBody(fields, values, kind);
    if (kind === "add") body = { ...createExtra, ...body };
    if (transformBody) body = transformBody(body, kind);

    setBusy("form");
    setMessage(null);
    try {
      if (kind === "add") await api.post(endpoint, body);
      else await api.patch(`${endpoint}/${encodeURIComponent(mode.row.id)}`, body);
      setMessage({ ok: true, text: kind === "add" ? "Đã thêm." : "Đã lưu thay đổi." });
      setMode(null);
      reload();
      props.onChanged?.();
    } catch (err) {
      setMessage({ ok: false, text: err instanceof ApiError ? err.message : "Không lưu được, vui lòng thử lại." });
    } finally {
      setBusy(null);
    }
  }

  async function handleDelete(row: T) {
    if (!window.confirm(confirmDelete(row))) return;
    setBusy(row.id);
    setMessage(null);
    try {
      await api.delete(`${endpoint}/${encodeURIComponent(row.id)}`);
      setMessage({ ok: true, text: "Đã xoá." });
      if (mode?.kind === "edit" && mode.row.id === row.id) setMode(null);
      reload();
      props.onChanged?.();
    } catch (err) {
      setMessage({ ok: false, text: err instanceof ApiError ? err.message : "Không xoá được." });
    } finally {
      setBusy(null);
    }
  }

  const rows = list.data ?? [];
  const idBase = endpoint.replace(/\W+/g, "-");

  return (
    <section className="crud">
      <div className="crud-head">
        <div>
          <h2>{title}</h2>
          {description && <p className="muted small">{description}</p>}
        </div>
        {mode?.kind !== "add" && (
          <button type="button" className="button" onClick={openAdd}>
            {props.addLabel ?? "+ Thêm"}
          </button>
        )}
      </div>

      {message && (
        <p className={message.ok ? "notice-ok" : "form-error"} role="status">
          {message.text}
        </p>
      )}

      {mode && (
        <form className="crud-form" onSubmit={handleSubmit} noValidate>
          <h3>{mode.kind === "add" ? "Thêm mới" : "Sửa"}</h3>
          <div className="crud-grid">
            {fields.map((f) => {
              const id = `${idBase}-${f.name}`;
              const common = {
                id,
                value: values[f.name] ?? "",
                "aria-invalid": Boolean(errors[f.name]),
                onChange: (e: { target: { value: string } }) => setValues((v) => ({ ...v, [f.name]: e.target.value })),
              };
              if (f.type === "checkboxes") {
                const chosen = new Set((values[f.name] ?? "").split(",").filter(Boolean));
                const toggle = (value: string) => {
                  const next = new Set(chosen);
                  if (next.has(value)) next.delete(value);
                  else next.add(value);
                  setValues((v) => ({ ...v, [f.name]: [...next].join(",") }));
                };
                return (
                  <fieldset key={f.name} className="field crud-wide crud-checkboxes">
                    <legend>{f.label}</legend>
                    {f.options?.length ? (
                      f.options.map((o) => (
                        <label key={o.value} className="checkbox">
                          <input type="checkbox" checked={chosen.has(o.value)} onChange={() => toggle(o.value)} />
                          <span>{o.label}</span>
                        </label>
                      ))
                    ) : (
                      <span className="muted small">{f.placeholder ?? "Chưa có lựa chọn nào."}</span>
                    )}
                  </fieldset>
                );
              }
              return (
                <label key={f.name} className={f.wide || f.type === "textarea" ? "field crud-wide" : "field"} htmlFor={id}>
                  <span>
                    {f.label} {f.required && <span className="required" aria-hidden="true">*</span>}
                  </span>
                  {f.type === "select" ? (
                    <select {...common}>
                      {f.options?.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  ) : f.type === "textarea" ? (
                    <textarea {...common} rows={3} placeholder={f.placeholder} />
                  ) : (
                    <input
                      {...common}
                      type={f.type === "datetime" ? "datetime-local" : f.type ?? "text"}
                      inputMode={f.type === "number" ? "decimal" : undefined}
                      min={f.min}
                      step={f.step}
                      maxLength={f.maxLength}
                      placeholder={f.placeholder}
                    />
                  )}
                  {errors[f.name] && <span className="field-error">{errors[f.name]}</span>}
                </label>
              );
            })}
          </div>
          <div className="form-actions">
            <button type="button" className="button button-ghost" onClick={() => setMode(null)}>
              Huỷ
            </button>
            <button type="submit" className="button" disabled={busy === "form"}>
              {busy === "form" ? "Đang lưu…" : mode.kind === "add" ? "Thêm" : "Lưu"}
            </button>
          </div>
        </form>
      )}

      {list.error && (
        <p className="form-error" role="alert">
          {list.error}
        </p>
      )}
      {list.loading && !list.data && <div className="skeleton-list" aria-busy="true" />}

      {list.data && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                {columns.map((c) => (
                  <th key={c.header} className={c.align === "right" ? "num" : undefined}>
                    {c.header}
                  </th>
                ))}
                <th aria-label="Thao tác" />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={columns.length + 1} className="muted">
                    {props.emptyText ?? "Chưa có dữ liệu."}
                  </td>
                </tr>
              )}
              {rows.map((row) => (
                <tr key={row.id} className={mode?.kind === "edit" && mode.row.id === row.id ? "row-editing" : undefined}>
                  {columns.map((c) => (
                    <td key={c.header} className={c.align === "right" ? "num" : undefined}>
                      {c.render(row)}
                    </td>
                  ))}
                  <td className="row-actions">
                    <button type="button" className="link-button" onClick={() => openEdit(row)}>
                      Sửa
                    </button>
                    <button type="button" className="link-button danger" disabled={busy === row.id} onClick={() => handleDelete(row)}>
                      Xoá
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {list.data && props.footer?.(rows)}
    </section>
  );
}
