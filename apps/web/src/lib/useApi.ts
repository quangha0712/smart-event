"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError } from "./api";

/** Gọi một API khi component mở; trả về dữ liệu, lỗi và hàm tải lại. `null` = chưa gọi (ví dụ chưa đăng nhập). */
export function useApi<T>(loader: ((signal: AbortSignal) => Promise<T>) | null, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(Boolean(loader));
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    if (!loader) return;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    loader(controller.signal)
      .then((result) => setData(result))
      .catch((e) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setError(e instanceof ApiError ? e.message : "Không tải được dữ liệu.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, ...deps]);

  return { data, error, loading, reload, setData };
}
