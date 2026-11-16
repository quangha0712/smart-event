import { createHmac, timingSafeEqual } from "node:crypto";
import { requireSecret } from "../common/secrets";

/**
 * Mã QR của vé có dạng `SE1.<ticketId>.<chữ ký>`, chữ ký = HMAC-SHA256(TICKET_QR_SECRET, "SE1.<ticketId>").
 * Không biết secret thì không thể tự tạo mã hợp lệ, nên QR giả / QR tự đoán bị loại ngay khi quét.
 */
const VERSION = "SE1";

function sign(ticketId: string): Buffer {
  return createHmac("sha256", requireSecret("TICKET_QR_SECRET")).update(`${VERSION}.${ticketId}`).digest();
}

export function signTicketCode(ticketId: string): string {
  return `${VERSION}.${ticketId}.${sign(ticketId).toString("base64url")}`;
}

/** Trả về ticketId nếu chữ ký hợp lệ, ngược lại trả về null. */
export function verifyTicketCode(code: string): string | null {
  const parts = code.trim().split(".");
  if (parts.length !== 3 || parts[0] !== VERSION || !parts[1] || !parts[2]) return null;
  const [, ticketId, signature] = parts;
  const expected = sign(ticketId);
  const given = Buffer.from(signature, "base64url");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  return ticketId;
}
