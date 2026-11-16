import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UserRole } from "@prisma/client";
import { compare, hash, hashSync } from "bcryptjs";
import { PrismaService } from "../prisma/prisma.module";
import { LoginDto, RegisterDto } from "./auth.dto";
import { JwtPayload } from "./auth.guard";

const BCRYPT_ROUNDS = 10;
/** Hash giả để so sánh khi email không tồn tại, tránh lộ email qua thời gian phản hồi. */
const DUMMY_HASH = hashSync("smart-event-dummy-password", BCRYPT_ROUNDS);

const publicUser = { id: true, email: true, fullName: true, role: true, createdAt: true } as const;

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService) {}

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email }, select: { id: true } });
    if (exists) throw new ConflictException("Email đã được sử dụng");
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        fullName: dto.fullName.trim(),
        passwordHash: await hash(dto.password, BCRYPT_ROUNDS),
        role: UserRole.ATTENDEE,
      },
      select: publicUser,
    });
    return this.issueToken(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    const ok = await compare(dto.password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !ok) throw new UnauthorizedException("Email hoặc mật khẩu không đúng");
    const { passwordHash: _omit, updatedAt: _u, ...rest } = user;
    return this.issueToken(rest);
  }

  me(id: string) {
    return this.prisma.user.findUniqueOrThrow({ where: { id }, select: publicUser });
  }

  listUsers() {
    return this.prisma.user.findMany({ select: publicUser, orderBy: { createdAt: "asc" } });
  }

  async updateRole(actorId: string, userId: string, role: UserRole) {
    if (actorId === userId && role !== UserRole.ADMIN) {
      throw new BadRequestException("Không thể tự hạ quyền ADMIN của chính mình");
    }
    return this.prisma.user.update({ where: { id: userId }, data: { role }, select: publicUser });
  }

  private async issueToken(user: { id: string; email: string; fullName: string; role: UserRole }) {
    const payload: JwtPayload = { sub: user.id };
    return { accessToken: await this.jwt.signAsync(payload), tokenType: "Bearer", user };
  }
}
