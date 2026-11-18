"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/features/auth/AuthProvider";
import { api, ApiError } from "@/lib/api";
import { canDo, EVENT_ROLE_CAPABILITIES, type EventCapability } from "@/lib/eventPermissions";
import type { EventMemberRole, MyEventMembership } from "@/types/eventMember";

type EventAccessValue = {
  /** "ready" khi đã biết danh sách sự kiện của người dùng (hoặc không cần biết: khách, người tham dự, ADMIN). */
  status: "loading" | "ready";
  /** false khi API đang chạy là bản cũ, chưa có GET /me/event-memberships (404) → tạm không lọc, hiện banner. */
  supported: boolean;
  error: string;
  memberships: MyEventMembership[];
  roleOf: (eventId: string) => EventMemberRole | undefined;
  can: (eventId: string, capability: EventCapability) => boolean;
  /** Có quyền này ở ít nhất một sự kiện (dùng cho menu / trang tổng). */
  canAny: (capability: EventCapability) => boolean;
  /** Ban tổ chức mà mọi sự kiện mình thuộc đều chỉ là Nhân viên check-in → vào thẳng màn quét vé. */
  isCheckInOnly: boolean;
  /** Ban tổ chức chỉ thấy sự kiện mình là thành viên; ADMIN, người tham dự, khách thấy nguyên danh sách. */
  filterEvents: <T extends { id: string }>(events: T[]) => T[];
  reload: () => void;
  /** Ghi nhận ngay một vai trò mới (vd vừa tạo sự kiện → OWNER) mà không chờ tải lại từ API. */
  remember: (membership: MyEventMembership) => void;
};

const EventAccessContext = createContext<EventAccessValue | null>(null);

export function EventAccessProvider({ children }: { children: React.ReactNode }) {
  const { user, status: authStatus } = useAuth();
  const isOrganizer = user?.role === "ORGANIZER";
  const [memberships, setMemberships] = useState<MyEventMembership[]>([]);
  const [loading, setLoading] = useState(false);
  const [supported, setSupported] = useState(true);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((v) => v + 1), []);
  const remember = useCallback(
    (m: MyEventMembership) => setMemberships((list) => [...list.filter((x) => x.eventId !== m.eventId), m]),
    [],
  );

  useEffect(() => {
    setMemberships([]);
    setError("");
    setSupported(true);
    if (!isOrganizer) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    api
      .get<MyEventMembership[]>("/me/event-memberships", { signal: controller.signal })
      .then((list) => setMemberships(list))
      .catch((e) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        if (e instanceof ApiError && e.status === 404) setSupported(false);
        else setError(e instanceof ApiError ? e.message : "Không tải được danh sách sự kiện của bạn.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [isOrganizer, user?.id, version]);

  const value = useMemo<EventAccessValue>(() => {
    const byEvent = new Map(memberships.map((m) => [m.eventId, m.role]));
    // API bản cũ chưa hỗ trợ: coi Ban tổ chức như Chủ mọi sự kiện để giao diện vẫn dùng được (API vẫn tự chặn quyền).
    const fallback = isOrganizer && !supported;
    const roleOf = (eventId: string) => (fallback ? "OWNER" : byEvent.get(eventId));
    return {
      status: authStatus === "loading" || loading ? "loading" : "ready",
      supported,
      error,
      memberships,
      roleOf,
      can: (eventId, capability) => canDo(user, roleOf(eventId), capability),
      canAny: (capability) => {
        if (!user) return false;
        if (user.role === "ADMIN" || fallback) return true;
        return memberships.some((m) => EVENT_ROLE_CAPABILITIES[m.role].includes(capability));
      },
      isCheckInOnly:
        isOrganizer && supported && memberships.length > 0 && memberships.every((m) => m.role === "CHECKIN_STAFF"),
      filterEvents: (events) => (isOrganizer && supported ? events.filter((e) => byEvent.has(e.id)) : events),
      reload,
      remember,
    };
  }, [authStatus, loading, supported, error, memberships, isOrganizer, user, reload, remember]);

  return <EventAccessContext.Provider value={value}>{children}</EventAccessContext.Provider>;
}

export function useEventAccess() {
  const ctx = useContext(EventAccessContext);
  if (!ctx) throw new Error("useEventAccess phải được dùng bên trong <EventAccessProvider>");
  return ctx;
}

/** Banner nhắc khi API thành viên sự kiện chưa sẵn sàng (chỉ Ban tổ chức thấy). */
export function EventAccessNotice() {
  const { supported, error } = useEventAccess();
  if (error) return <p className="form-error" role="alert">{error}</p>;
  if (supported) return null;
  return (
    <p className="notice-warn" role="status">
      Chưa lọc theo sự kiện bạn tham gia: API đang chạy chưa có <code>GET /me/event-memberships</code> (cần cập nhật API và chạy
      migration mới). Tạm thời hiển thị mọi sự kiện.
    </p>
  );
}
