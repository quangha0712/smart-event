/**
 * Đọc secret bắt buộc từ biến môi trường; dừng khởi động nếu thiếu, quá ngắn hoặc còn là giá trị mẫu.
 * Tạo secret: node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
 */
export function requireSecret(name: string): string {
  const value = process.env[name];
  if (!value || value.length < 32 || value.startsWith("replace-this")) {
    throw new Error(
      `${name} chưa được cấu hình đúng trong .env (cần chuỗi ngẫu nhiên >= 32 ký tự). ` +
        `Tạo bằng: node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`,
    );
  }
  return value;
}
