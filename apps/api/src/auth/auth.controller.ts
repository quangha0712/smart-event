import { Body, Controller, Get, HttpCode, Param, Patch, Post } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { AuthUser, CurrentUser, Public, Roles } from "./auth.decorators";
import { ChangePasswordDto, LoginDto, RegisterDto, UpdateProfileDto, UpdateRoleDto } from "./auth.dto";
import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post("register")
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Public()
  @Post("login")
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Get("me")
  me(@CurrentUser() user: AuthUser) {
    return this.auth.me(user.id);
  }

  /** Người dùng tự sửa thông tin hiển thị (hiện là họ tên). */
  @Patch("me")
  updateProfile(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.auth.updateProfile(user.id, dto);
  }

  /** Đổi mật khẩu: bắt buộc nhập đúng mật khẩu hiện tại. */
  @Patch("me/password")
  @HttpCode(204)
  async changePassword(@CurrentUser() user: AuthUser, @Body() dto: ChangePasswordDto) {
    await this.auth.changePassword(user.id, dto);
  }

  @Roles(UserRole.ADMIN)
  @Get("users")
  listUsers() {
    return this.auth.listUsers();
  }

  @Roles(UserRole.ADMIN)
  @Patch("users/:id/role")
  updateRole(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: UpdateRoleDto) {
    return this.auth.updateRole(user.id, id, dto.role);
  }
}
