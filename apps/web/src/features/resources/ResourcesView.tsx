"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { BackToEvent } from "@/components/BackToEvent";
import { useAuth } from "@/features/auth/AuthProvider";
import { EventAccessNotice, useEventAccess } from "@/features/events/EventAccessProvider";
import { api } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import type { EventSummary } from "@/types/event";
import { BudgetTab } from "./BudgetTab";
import { SponsorsTab, VendorsTab } from "./PartnersTabs";
import { StaffTab } from "./StaffTab";

const TABS = [
  { key: "staff", label: "Nhân sự & phân ca" },
  { key: "vendors", label: "Nhà cung cấp" },
  { key: "sponsors", label: "Tài trợ" },
  { key: "budget", label: "Dự toán – thực chi" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

/**
 * Nguồn lực & ngân sách: chọn sự kiện (chỉ sự kiện mình là Chủ / Đồng tổ chức) rồi chuyển giữa 4 tab.
 * Sự kiện và tab đang chọn nằm trên URL (?eventId=&tab=) để tải lại / chia sẻ link vẫn đúng chỗ.
 */
export function ResourcesView() {
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
        .filter((e) => access.can(e.id, "manageResources") && e.status !== "CANCELLED")
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
    [events.data, access],
  );

  const wantedEvent = params.get("eventId");
  const eventId = options.find((e) => e.id === wantedEvent)?.id ?? options[0]?.id ?? "";
  const tabParam = params.get("tab");
  const tab: TabKey = TABS.some((t) => t.key === tabParam) ? (tabParam as TabKey) : "staff";

  function navigate(next: { eventId?: string; tab?: TabKey }) {
    const q = new URLSearchParams(params.toString());
    if (next.eventId !== undefined) q.set("eventId", next.eventId);
    if (next.tab !== undefined) q.set("tab", next.tab);
    router.replace(`${pathname}?${q.toString()}`, { scroll: false });
  }

  // Ghi sự kiện mặc định lên URL khi chưa có / không hợp lệ.
  useEffect(() => {
    if (eventId && eventId !== wantedEvent) navigate({ eventId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, wantedEvent]);

  const selected = options.find((e) => e.id === eventId);

  return (
    <section className="page-section">
      {selected && <BackToEvent eventId={selected.id} name={selected.name} />}
      <h1 className="page-title">Nguồn lực & ngân sách</h1>
      <EventAccessNotice />

      {events.error && <p className="form-error" role="alert">{events.error}</p>}
      {events.loading && !events.data && <div className="skeleton-list" aria-busy="true" />}
      {events.data && options.length === 0 && (
        <div className="placeholder">Bạn chưa là Chủ sự kiện hoặc Đồng tổ chức của sự kiện nào đang hoạt động.</div>
      )}

      {selected && (
        <>
          <div className="resources-toolbar">
            <label className="field resources-event">
              <span>Sự kiện</span>
              <select value={eventId} onChange={(e) => navigate({ eventId: e.target.value })}>
                {options.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                    {e.status === "DRAFT" ? " (bản nháp)" : ""}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="tabs" role="tablist" aria-label="Nguồn lực">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                role="tab"
                id={`tab-${t.key}`}
                aria-selected={tab === t.key}
                aria-controls={`panel-${t.key}`}
                className={tab === t.key ? "tab active" : "tab"}
                onClick={() => navigate({ tab: t.key })}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* key theo sự kiện: đổi sự kiện thì các form đang mở được đóng lại. */}
          <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} key={`${eventId}-${tab}`}>
            {tab === "staff" && <StaffTab eventId={eventId} />}
            {tab === "vendors" && <VendorsTab />}
            {tab === "sponsors" && <SponsorsTab eventId={eventId} />}
            {tab === "budget" && <BudgetTab eventId={eventId} />}
          </div>
        </>
      )}
    </section>
  );
}
