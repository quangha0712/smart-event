# Tắt MySQL riêng của dự án (đã bật bằng `npm run db:local`).
$ErrorActionPreference = "Stop"
. "$PSScriptRoot\common.ps1"

$cfg = Get-DbConfig
$bin = Find-MysqlBin

if (-not (Test-PortOpen $cfg.Port)) {
  Write-Host "Không có MySQL nào chạy ở cổng $($cfg.Port)."
  exit 0
}
& "$bin\mysqladmin.exe" -h 127.0.0.1 -P $cfg.Port -u root shutdown
if ($LASTEXITCODE -ne 0) { throw "Không tắt được MySQL ở cổng $($cfg.Port) (có thể đây không phải MySQL của dự án)." }
Write-Host "Đã tắt MySQL dự án ở cổng $($cfg.Port)." -ForegroundColor Green
