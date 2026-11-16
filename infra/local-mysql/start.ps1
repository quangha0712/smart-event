# Chạy MySQL riêng cho dự án mà không cần Docker hay mật khẩu root của MySQL đã cài.
# Dùng: npm run db:local   (giữ cửa sổ mở; Ctrl+C hoặc `npm run db:local:stop` để tắt)
#
# - Dùng mysqld.exe của MySQL Server đã cài (hoặc thư mục bin chỉ định qua biến môi trường MYSQL_BIN).
# - Dữ liệu lưu tại %LOCALAPPDATA%\smart-event\mysql-data (ngoài repo).
# - Tài khoản, mật khẩu, cổng, tên database đọc từ DATABASE_URL trong .env.
# - Lần đầu: khởi tạo data dir (root không mật khẩu, chỉ nghe 127.0.0.1), tạo database và tài khoản ứng dụng.

$ErrorActionPreference = "Stop"
. "$PSScriptRoot\common.ps1"

$cfg = Get-DbConfig
$bin = Find-MysqlBin
$dataDir = Get-DataDir

if (Test-PortOpen $cfg.Port) {
  Write-Host "Cổng $($cfg.Port) đã có tiến trình lắng nghe." -ForegroundColor Yellow
  Write-Host "Nếu đó là MySQL của dự án thì không cần chạy lại. Nếu là MySQL khác, đổi cổng trong DATABASE_URL của .env (ví dụ 3307)."
  exit 0
}

if (-not (Test-Path (Join-Path $dataDir "mysql"))) {
  Write-Host "Khởi tạo data dir lần đầu: $dataDir"
  New-Item -ItemType Directory -Force $dataDir | Out-Null
  & "$bin\mysqld.exe" --initialize-insecure "--datadir=$dataDir" --console
  if ($LASTEXITCODE -ne 0) { throw "Khởi tạo MySQL thất bại." }
}

# Chạy từ thư mục data để tránh lỗi đường dẫn có ký tự Unicode (CreateProcess 267).
$server = Start-Process -FilePath "$bin\mysqld.exe" -WorkingDirectory (Split-Path $dataDir) -NoNewWindow -PassThru -ArgumentList @(
  "--datadir=`"$dataDir`"", "--port=$($cfg.Port)", "--mysqlx=OFF", "--bind-address=127.0.0.1", "--console"
)

$deadline = (Get-Date).AddSeconds(60)
while (-not (Test-PortOpen $cfg.Port)) {
  if ($server.HasExited) { throw "mysqld dừng ngay khi khởi động (mã $($server.ExitCode)). Xem log phía trên." }
  if ((Get-Date) -gt $deadline) { throw "Quá 60 giây mà MySQL chưa sẵn sàng." }
  Start-Sleep -Milliseconds 500
}

$u = $cfg.User.Replace("'", "''")
$p = $cfg.Password.Replace("'", "''")
$sql = @"
CREATE DATABASE IF NOT EXISTS ``$($cfg.Database)`` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '$u'@'localhost' IDENTIFIED WITH caching_sha2_password BY '$p';
CREATE USER IF NOT EXISTS '$u'@'127.0.0.1' IDENTIFIED WITH caching_sha2_password BY '$p';
GRANT ALL PRIVILEGES ON *.* TO '$u'@'localhost';
GRANT ALL PRIVILEGES ON *.* TO '$u'@'127.0.0.1';
FLUSH PRIVILEGES;
"@
$sql | & "$bin\mysql.exe" -h 127.0.0.1 -P $cfg.Port -u root
if ($LASTEXITCODE -ne 0) { throw "Không tạo được database/tài khoản ứng dụng." }

Write-Host ""
Write-Host "MySQL dự án sẵn sàng tại 127.0.0.1:$($cfg.Port), database '$($cfg.Database)', tài khoản '$($cfg.User)'." -ForegroundColor Green
Write-Host "Mở terminal khác và chạy: npm run db:migrate (lần đầu), npm run db:seed, npm run dev"
Write-Host "Giữ cửa sổ này mở. Tắt: Ctrl+C hoặc npm run db:local:stop"

$server.WaitForExit()
