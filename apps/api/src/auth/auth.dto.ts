import { UserRole } from "@prisma/client";
import { Transform } from "class-transformer";
import { IsEmail, IsEnum, IsNotEmpty, IsString, MaxLength, MinLength } from "class-validator";

const normalizeEmail = ({ value }: { value: unknown }) => (typeof value === "string" ? value.trim().toLowerCase() : value);

export class LoginDto {
  @Transform(normalizeEmail)
  @IsEmail({}, { message: "Email không hợp lệ" })
  email!: string;

  @IsString()
  @IsNotEmpty({ message: "Cần nhập mật khẩu" })
  @MaxLength(72)
  password!: string;
}

/** Đăng ký công khai luôn tạo tài khoản ATTENDEE; ADMIN mới đổi được quyền. */
export class RegisterDto {
  @Transform(normalizeEmail)
  @IsEmail({}, { message: "Email không hợp lệ" })
  @MaxLength(191)
  email!: string;

  @IsString()
  @IsNotEmpty({ message: "Cần nhập họ tên" })
  @MaxLength(191)
  fullName!: string;

  /** bcrypt chỉ dùng 72 byte đầu nên giới hạn độ dài. */
  @IsString()
  @MinLength(8, { message: "Mật khẩu tối thiểu 8 ký tự" })
  @MaxLength(72, { message: "Mật khẩu tối đa 72 ký tự" })
  password!: string;
}

export class UpdateRoleDto {
  @IsEnum(UserRole, { message: "Quyền phải là ADMIN, ORGANIZER hoặc ATTENDEE" })
  role!: UserRole;
}
