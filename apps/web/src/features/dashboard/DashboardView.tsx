"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { BackToEvent } from "@/components/BackToEvent";
import { useAuth } from "@/features/auth/AuthProvider";
import { EventAccessNotice, useEventAccess } from "@/features/events/EventAccessProvider";
import { api } from "@/lib/api";
import { formatDateTime, formatMoney, formatTime, timeRange } from "@/lib/format";
import { useApi } from "@/lib/useApi";
import type { EventSummary } from "@/types/event";
import { ColumnChart, DataTable, formatCount, LineChart, Meter, PairedBars, RankedBars } from "./charts";

type Dashboard = {
  event: { id: string; name: string; startsAt: string; endsAt: string; capacity: number | null; status: string };
  registrations: { confirmed: number; pending: number; cancelled: number; checkedIn: number; byDay: Array<{ date: string; count: number }> };
  checkIn: {
    totalAttempts: number;
    byResult: Record<"ACCEPTED" | "DUPLICATE" | "INVALID_CODE" | "WRONG_EVENT" | "NOT_ELIGIBLE" | "OUT_OF_HOURS", number>;
    bucketMinutes: number;
    buckets: Array<{ start: string; accepted: number; rejected: number }>;
  };
  zones: Array<{ zone: string; value: number; unit: string; recordedAt: string }>;
  budget: {
    plannedExpense: number;
    actualExpense: number;
    plannedIncome: number;
    sponsorTotal: number;
    balance: number;
    byCategory: Array<{ category: string; planned: number; actual: number }>;
  };
  generatedAt: string;
};

const RESULT_LABELS: Record<keyof Dashboard["checkIn"]["byResult"], string> = {
  ACCEPTED: "Hợp lệ",
  DUPLICATE: "Quét trùng",
  INVALID_CODE: "Mã sai",
  WRONG_EVENT: "Sai sự kiện",
  NOT_ELIGIBLE: "Chưa xác nhận / đã huỷ",
  OUT_OF_HOURS: "Ngoài giờ check-in",
};

/** "16/11" – ngày/tháng ngắn cho trục và bảng. */
const dayFmt = {
  format: (d: Date) => `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`,
};
const pct = (a: number, b: number) => (b > 0 ? `${Math.round((a / b) * 100)}%` : "—");

/** Đăng ký cộng dồn theo ngày, điền cả những ngày không có đăng ký mới (giá trị giữ nguyên). */
function cumulativeByDay(byDay: Array<{ date: string; count: number }>) {
  if (!byDay.length) return [];
  const counts = new Map(byDay.map((d) => [d.date, d.count]));
  const out: Array<{ tick: string; title: string; value: number }> = [];
  const day = new Date(`${byDay[0].date}T00:00:00Z`);
  const end = new Date(`${byDay[byDay.length - 1].date}T00:00:00Z`);
  let total = 0;
  for (; day <= end; day.setUTCDate(day.getUTCDate() + 1)) {
    const key = day.toISOString().slice(0, 10);
    const added = counts.get(key) ?? 0;
    total += added;
    const label = dayFmt.format(new Date(`${key}T12:00:00+07:00`));
    out.push({ tick: label, title: `${label}: +${added} đăng ký mới`, value: total });
  }
  return out;
}

function Stat({ label, value, hint, children }: { label: string; value: React.ReactNode; hint?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="stat-card">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      {children}
      {hint && <span className="stat-hint">{hint}</span>}
    </div>
  );
}

/** Dashboard theo sự kiện: đăng ký, check-in, mật độ khu vực, ngân sách. Tự làm mới mỗi 30 giây. */
export function DashboardView() {
  const { user } = useAuth();
  const access = useEventAccess();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const events = useApi((signal) => api.get<EventSummary[]>("/events", { signal }), [user?.id]);

  const options = useMemo(
    () =>
      access
        .filterEvents(events.data ?? [])
        .filter((e) => access.can(e.id, "viewDashboard"))
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
    [events.data, access],
  );
  const wanted = params.get("eventId");
  // Mặc định: sự kiện đang diễn ra, rồi sự kiện sắp tới gần nhất, rồi sự kiện đầu tiên.
  const now = Date.now();
  const fallback =
    options.find((e) => new Date(e.startsAt).getTime() <= now && new Date(e.endsAt).getTime() >= now) ??
    options.find((e) => new Date(e.startsAt).getTime() > now) ??
    options[0];
  const eventId = options.find((e) => e.id === wanted)?.id ?? fallback?.id ?? "";

  useEffect(() => {
    if (eventId && eventId !== wanted) router.replace(`${pathname}?eventId=${encodeURIComponent(eventId)}`, { scroll: false });
  }, [eventId, wanted, pathname, router]);

  const dash = useApi(
    eventId ? (signal) => api.get<Dashboard>(`/events/${encodeURIComponent(eventId)}/dashboard`, { signal }) : null,
    [eventId],
  );
  const { reload } = dash;
  useEffect(() => {
    if (!eventId) return;
    const t = window.setInterval(reload, 30_000);
    return () => window.clearInterval(t);
  }, [eventId, reload]);

  const d = dash.data?.event.id === eventId ? dash.data : null;
  const selected = options.find((e) => e.id === eventId);

  return (
    <section className="page-section">
      {wanted && selected && <BackToEvent eventId={selected.id} name={selected.name} />}
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        {d && <span className="muted small">Cập nhật {formatTime(d.generatedAt)} · tự làm mới mỗi 30 giây</span>}
      </div>
      <EventAccessNotice />

      {events.error && <p className="form-error" role="alert">{events.error}</p>}
      {events.data && options.length === 0 && (
        <div className="placeholder">Bạn chưa là Chủ sự kiện hoặc Đồng tổ chức của sự kiện nào.</div>
      )}

      {options.length > 0 && (
        <div className="resources-toolbar">
          <label className="field resources-event">
            <span>Sự kiện</span>
            <select value={eventId} onChange={(e) => router.replace(`${pathname}?eventId=${encodeURIComponent(e.target.value)}`, { scroll: false })}>
              {options.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                  {e.status === "DRAFT" ? " (bản nháp)" : e.status === "CANCELLED" ? " (đã huỷ)" : ""}
                </option>
              ))}
            </select>
          </label>
          {selected && <span className="muted small">{timeRange(selected.startsAt, selected.endsAt)}</span>}
        </div>
      )}

      {dash.error && <p className="form-error" role="alert">{dash.error}</p>}
      {eventId && !d && !dash.error && <div className="skeleton-list" aria-busy="true" />}

      {/* Đang tải lại thì giữ khung cũ, làm mờ nhẹ – không nháy. */}
      {d && (
        <div className={dash.loading ? "dashboard is-refreshing" : "dashboard"}>
          <DashboardBody d={d} eventId={eventId} />
        </div>
      )}
    </section>
  );
}

function DashboardBody({ d, eventId }: { d: Dashboard; eventId: string }) {
  const r = d.registrations;
  const c = d.checkIn;
  const b = d.budget;
  const rejected = c.totalAttempts - c.byResult.ACCEPTED;
  const regSeries = cumulativeByDay(r.byDay);
  const daily = c.bucketMinutes >= 24 * 60;
  const buckets = c.buckets.map((x) => {
    const tick = daily ? dayFmt.format(new Date(x.start)) : formatTime(x.start);
    const end = new Date(new Date(x.start).getTime() + c.bucketMinutes * 60_000).toISOString();
    return {
      tick,
      title: daily ? `Ngày ${tick}` : `${formatDateTime(x.start)}–${formatTime(end)}`,
      value: x.accepted,
      rejected: x.rejected,
    };
  });
  const results = (Object.keys(RESULT_LABELS) as Array<keyof typeof RESULT_LABELS>)
    .map((k) => ({ label: RESULT_LABELS[k], value: c.byResult[k] }))
    .filter((x) => x.value > 0)
    .sort((a, b2) => b2.value - a.value);
  const id = encodeURIComponent(eventId);

  return (
    <>
      <div className="stats-grid">
        <Stat
          label="Đã đăng ký"
          value={d.event.capacity ? `${formatCount(r.confirmed)} / ${formatCount(d.event.capacity)}` : formatCount(r.confirmed)}
          hint={[d.event.capacity ? `${pct(r.confirmed, d.event.capacity)} sức chứa` : "Không giới hạn chỗ", r.cancelled ? `${r.cancelled} đã huỷ` : ""]
            .filter(Boolean)
            .join(" · ")}
        >
          {d.event.capacity ? <Meter value={r.confirmed} max={d.event.capacity} label="Tỷ lệ lấp đầy" /> : null}
        </Stat>
        <Stat label="Đã check-in" value={`${formatCount(r.checkedIn)} / ${formatCount(r.confirmed)}`} hint={`${pct(r.checkedIn, r.confirmed)} người đã đăng ký · tính theo vé`}>
          <Meter value={r.checkedIn} max={r.confirmed} label="Tỷ lệ check-in" />
        </Stat>
        <Stat
          label="Lượt quét bị từ chối"
          value={formatCount(rejected)}
          hint={c.totalAttempts ? `${pct(rejected, c.totalAttempts)} trong ${formatCount(c.totalAttempts)} lượt quét` : "Chưa có lượt quét"}
        />
        <Stat
          label="Thực chi"
          value={formatMoney(b.actualExpense)}
          hint={
            b.plannedExpense
              ? b.actualExpense > b.plannedExpense
                ? `Vượt dự toán ${formatMoney(b.actualExpense - b.plannedExpense)}`
                : `${pct(b.actualExpense, b.plannedExpense)} dự toán ${formatMoney(b.plannedExpense)}`
              : "Chưa có dự toán"
          }
        >
          {b.plannedExpense > 0 && <Meter value={b.actualExpense} max={b.plannedExpense} label="Thực chi so với dự toán" />}
        </Stat>
      </div>

      <div className="dash-grid">
        <section className="dash-card" aria-labelledby="dash-reg">
          <h2 id="dash-reg">Đăng ký theo ngày</h2>
          <p className="muted small">Tổng số lượt đăng ký cộng dồn (kể cả sau đó huỷ).</p>
          {regSeries.length ? (
            <>
              <LineChart data={regSeries} ariaLabel="Số lượt đăng ký cộng dồn theo ngày" />
              <DataTable
                columns={["Ngày", "Đăng ký mới", "Cộng dồn"]}
                rows={r.byDay.map((x, i) => [
                  dayFmt.format(new Date(`${x.date}T12:00:00+07:00`)),
                  x.count,
                  r.byDay.slice(0, i + 1).reduce((s, y) => s + y.count, 0),
                ])}
              />
            </>
          ) : (
            <p className="empty-chart">Chưa có ai đăng ký.</p>
          )}
        </section>

        <section className="dash-card" aria-labelledby="dash-checkin">
          <h2 id="dash-checkin">Check-in hợp lệ theo {daily ? "ngày" : c.bucketMinutes >= 60 ? "giờ" : `${c.bucketMinutes} phút`}</h2>
          <p className="muted small">Số lượt quét được chấp nhận trong mỗi khung thời gian.</p>
          {buckets.length ? (
            <>
              <ColumnChart data={buckets} ariaLabel="Số lượt check-in hợp lệ theo khung thời gian" />
              <DataTable columns={["Khung", "Hợp lệ", "Bị từ chối"]} rows={buckets.map((x) => [x.title, x.value, x.rejected])} />
            </>
          ) : (
            <p className="empty-chart">
              Chưa có lượt quét. <Link href={`/check-in?eventId=${id}`}>Mở màn quét vé</Link>
            </p>
          )}
        </section>

        <section className="dash-card" aria-labelledby="dash-results">
          <h2 id="dash-results">Kết quả quét</h2>
          <p className="muted small">Tính theo lượt quét – một vé có thể bị quét nhiều lần.</p>
          {results.length ? <RankedBars data={results} ariaLabel="Số lượt quét theo kết quả" /> : <p className="empty-chart">Chưa có lượt quét.</p>}
        </section>

        <section className="dash-card" aria-labelledby="dash-zones">
          <h2 id="dash-zones">Mật độ theo khu vực</h2>
          <p className="muted small">Số người mới nhất từ cảm biến đếm người.</p>
          {d.zones.length ? (
            <RankedBars
              data={d.zones.map((z) => ({ label: z.zone, value: z.value, note: `${formatTime(z.recordedAt)} ${dayFmt.format(new Date(z.recordedAt))}` }))}
              format={(n) => `${formatCount(n)} ${d.zones[0]?.unit ?? ""}`.trim()}
              ariaLabel="Số người theo khu vực"
            />
          ) : (
            <p className="empty-chart">Chưa có dữ liệu cảm biến cho sự kiện này.</p>
          )}
        </section>

        <section className="dash-card dash-wide" aria-labelledby="dash-budget">
          <div className="section-head">
            <h2 id="dash-budget">Dự toán – thực chi theo nhóm</h2>
            <Link href={`/resources?eventId=${id}&tab=budget`}>Chi tiết ngân sách</Link>
          </div>
          <p className="muted small">
            Thu dự kiến {formatMoney(b.plannedIncome)} + tài trợ {formatMoney(b.sponsorTotal)} − thực chi = số dư{" "}
            <strong>{formatMoney(b.balance)}</strong>.
          </p>
          {b.byCategory.length ? (
            <>
              <PairedBars
                data={b.byCategory.map((x) => ({ label: x.category, a: x.planned, b: x.actual }))}
                labels={["Dự toán", "Thực chi"]}
                format={formatMoney}
                ariaLabel="Dự toán và thực chi theo nhóm"
              />
              <DataTable
                columns={["Nhóm", "Dự toán (₫)", "Thực chi (₫)", "Chênh lệch (₫)"]}
                rows={b.byCategory.map((x) => [x.category, x.planned, x.actual, x.actual - x.planned])}
              />
            </>
          ) : (
            <p className="empty-chart">
              Chưa có dự toán / khoản chi. <Link href={`/resources?eventId=${id}&tab=budget`}>Lập dự toán</Link>
            </p>
          )}
        </section>
      </div>
    </>
  );
}
