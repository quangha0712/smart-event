import type { AuthUser } from "@/types/auth";

/**
 * Lưu phiên đăng nhập trong localStorage của trình duyệt.
 * Mọi truy cập đều bọc try/catch vì localStorage có thể bị chặn (chế độ riêng tư, chặn cookie...).
 */
const TOKEN_KEY = "smart-event.accessToken";
const USER_KEY = "smart-event.user";

function storage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Đọc thời điểm hết hạn (exp, giây) trong payload JWT. Không kiểm tra chữ ký – việc đó do API làm. */
function tokenExpiresAt(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return typeof json.exp === "number" ? json.exp * 1000 : null;
  } catch {
    return null;
  }
}

/** Trả về token nếu còn hạn; token hết hạn bị xoá luôn. */
export function getToken(): string | null {
  const s = storage();
  let token: string | null = null;
  try {
    token = s?.getItem(TOKEN_KEY) ?? null;
  } catch {
    return null;
  }
  if (!token) return null;
  const exp = tokenExpiresAt(token);
  if (exp !== null && exp <= Date.now()) {
    clearSession();
    return null;
  }
  return token;
}

export function getStoredUser(): AuthUser | null {
  try {
    const raw = storage()?.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function saveSession(token: string, user: AuthUser) {
  try {
    const s = storage();
    s?.setItem(TOKEN_KEY, token);
    s?.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // Không lưu được thì phiên chỉ tồn tại tới khi tải lại trang.
  }
}

export function saveUser(user: AuthUser) {
  try {
    storage()?.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // bỏ qua
  }
}

export function clearSession() {
  try {
    const s = storage();
    s?.removeItem(TOKEN_KEY);
    s?.removeItem(USER_KEY);
  } catch {
    // bỏ qua
  }
}
