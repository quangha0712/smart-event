"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, ApiError, UNAUTHORIZED_EVENT } from "@/lib/api";
import { clearSession, getStoredUser, getToken, saveSession, saveUser } from "@/lib/session";
import type { AuthUser, LoginResponse, UserRole } from "@/types/auth";

type AuthStatus = "loading" | "authenticated" | "anonymous";

type AuthContextValue = {
  user: AuthUser | null;
  status: AuthStatus;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
  /** ADMIN luôn được tính là có quyền. */
  hasRole: (...roles: UserRole[]) => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function hasRole(user: AuthUser | null, roles: readonly UserRole[]) {
  if (!user) return false;
  return roles.length === 0 || user.role === "ADMIN" || roles.includes(user.role);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  // Khôi phục phiên khi tải trang: hiện ngay user đã lưu, sau đó hỏi lại /auth/me để chắc token còn hợp lệ
  // và quyền chưa bị ADMIN đổi.
  useEffect(() => {
    const token = getToken();
    if (!token) {
      clearSession();
      setStatus("anonymous");
      return;
    }
    const stored = getStoredUser();
    if (stored) {
      setUser(stored);
      setStatus("authenticated");
    }
    const controller = new AbortController();
    api
      .get<AuthUser>("/auth/me", { signal: controller.signal })
      .then((fresh) => {
        saveUser(fresh);
        setUser(fresh);
        setStatus("authenticated");
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        // Mất kết nối API thì giữ phiên đã lưu; chỉ đăng xuất khi token thật sự bị từ chối.
        if (error instanceof ApiError && error.status === 401) {
          setUser(null);
          setStatus("anonymous");
        } else if (!stored) {
          setStatus("anonymous");
        }
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const onUnauthorized = () => {
      setUser(null);
      setStatus("anonymous");
    };
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await api.post<LoginResponse>("/auth/login", { email, password }, { auth: false });
    saveSession(result.accessToken, result.user);
    setUser(result.user);
    setStatus("authenticated");
    return result.user;
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    setStatus("anonymous");
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, status, login, logout, hasRole: (...roles) => hasRole(user, roles) }),
    [user, status, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth phải được dùng bên trong <AuthProvider>");
  return ctx;
}

/** Trang mặc định sau khi đăng nhập theo quyền. */
export function homePathFor(user: AuthUser) {
  return user.role === "ATTENDEE" ? "/events" : "/dashboard";
}
