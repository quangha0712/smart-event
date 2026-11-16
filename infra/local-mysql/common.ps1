# Hàm dùng chung cho start.ps1 / stop.ps1.

try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch {}

function Get-DbConfig {
  $envFile = Join-Path $PSScriptRoot "..\..\.env"
  if (-not (Test-Path $envFile)) { throw "Không tìm thấy .env. Sao chép .env.example thành .env trước." }
  $line = Get-Content $envFile -Encoding UTF8 | Where-Object { $_ -match '^\s*DATABASE_URL\s*=' } | Select-Object -First 1
  if (-not $line) { throw "Không thấy DATABASE_URL trong .env." }
  $url = ($line -split '=', 2)[1].Trim().Trim('"', "'")
  if ($url -notmatch '^mysql://([^:@/]+):([^@]*)@([^:/]+)(?::(\d+))?/([^?]+)') {
    throw "DATABASE_URL không đúng dạng mysql://user:password@host:port/database"
  }
  $port = 3306
  if ($Matches[4]) { $port = [int]$Matches[4] }
  return [pscustomobject]@{
    User     = [uri]::UnescapeDataString($Matches[1])
    Password = [uri]::UnescapeDataString($Matches[2])
    Port     = $port
    Database = $Matches[5]
  }
}

function Find-MysqlBin {
  if ($env:MYSQL_BIN -and (Test-Path (Join-Path $env:MYSQL_BIN "mysqld.exe"))) { return $env:MYSQL_BIN }
  $found = Get-ChildItem "$env:ProgramFiles\MySQL\MySQL Server *\bin\mysqld.exe" -ErrorAction SilentlyContinue |
    Sort-Object { [version]($_.Directory.Parent.Name -replace '^MySQL Server ', '') } -Descending |
    Select-Object -First 1
  if (-not $found) { throw "Không tìm thấy MySQL Server. Cài MySQL 8.x hoặc đặt biến MYSQL_BIN trỏ tới thư mục bin." }
  return $found.DirectoryName
}

function Get-DataDir {
  return Join-Path $env:LOCALAPPDATA "smart-event\mysql-data"
}

function Test-PortOpen([int]$port) {
  $client = New-Object System.Net.Sockets.TcpClient
  try {
    $async = $client.BeginConnect("127.0.0.1", $port, $null, $null)
    return ($async.AsyncWaitHandle.WaitOne(300) -and $client.Connected)
  } catch { return $false } finally { $client.Close() }
}
