# Create a timestamped ZIP backup of the Assets folder
$root = Join-Path $PSScriptRoot ".."
$assets = Join-Path $root "Assets"
if (-not (Test-Path $assets)) {
    Write-Host "Assets folder not found: $assets" -ForegroundColor Red
    exit 1
}

$backups = Join-Path $root "backups"
if (-not (Test-Path $backups)) { New-Item -Path $backups -ItemType Directory | Out-Null }

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$zipPath = Join-Path $backups "assets-backup-$timestamp.zip"

Write-Host "Creating backup: $zipPath" -ForegroundColor Green
Compress-Archive -Path (Join-Path $assets "*") -DestinationPath $zipPath -Force
Write-Host "Backup complete." -ForegroundColor Green
