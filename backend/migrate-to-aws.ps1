# PowerShell Database Migration Script
# Alternative to Node.js script - Pure PowerShell

Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   Database Migration: Local MySQL → AWS RDS           ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Configuration
$LocalHost = "localhost"
$LocalUser = "root"
$LocalPassword = ""  # UPDATE THIS
$LocalDatabase = "skaarvi_db"

$AwsHost = "skaarvi-db.cxm0emkgszfj.ap-south-1.rds.amazonaws.com"
$AwsUser = "admin"
$AwsPassword = "Skaarvi2026"
$AwsDatabase = "skaarvi_db"

$DumpFile = "db-dump.sql"

# Check MySQL tools
Write-Host "🔍 Checking MySQL tools..." -ForegroundColor Yellow
try {
    $null = Get-Command mysqldump -ErrorAction Stop
    Write-Host "✅ mysqldump found" -ForegroundColor Green
} catch {
    Write-Host "❌ mysqldump not found in PATH" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please add MySQL bin directory to PATH:" -ForegroundColor Yellow
    Write-Host "  Common locations:" -ForegroundColor Yellow
    Write-Host "    - C:\Program Files\MySQL\MySQL Server 8.x\bin" -ForegroundColor Gray
    Write-Host "    - C:\xampp\mysql\bin" -ForegroundColor Gray
    Write-Host ""
    Write-Host "To add temporarily (this session only):" -ForegroundColor Yellow
    Write-Host '  $env:Path += ";C:\Program Files\MySQL\MySQL Server 8.0\bin"' -ForegroundColor Gray
    exit 1
}

# Export from local
Write-Host ""
Write-Host "📤 Exporting local database..." -ForegroundColor Yellow
Write-Host "   Database: $LocalDatabase" -ForegroundColor Gray
Write-Host "   Host: $LocalHost" -ForegroundColor Gray

$exportCmd = "mysqldump -h $LocalHost -u $LocalUser"
if ($LocalPassword) {
    $exportCmd += " -p$LocalPassword"
}
$exportCmd += " --single-transaction --routines --triggers --databases $LocalDatabase"

try {
    Invoke-Expression "$exportCmd > $DumpFile"
    $fileSize = (Get-Item $DumpFile).Length / 1MB
    Write-Host "✅ Export completed" -ForegroundColor Green
    Write-Host "📊 Dump file size: $($fileSize.ToString('F2')) MB" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Export failed: $_" -ForegroundColor Red
    exit 1
}

# Import to AWS
Write-Host ""
Write-Host "📥 Importing to AWS RDS..." -ForegroundColor Yellow
Write-Host "   Database: $AwsDatabase" -ForegroundColor Gray
Write-Host "   Host: $AwsHost" -ForegroundColor Gray

$importCmd = "mysql -h $AwsHost -u $AwsUser -p$AwsPassword $AwsDatabase"

try {
    Get-Content $DumpFile | Invoke-Expression $importCmd
    Write-Host "✅ Import completed" -ForegroundColor Green
} catch {
    Write-Host "❌ Import failed: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "  - RDS status is not 'Available'" -ForegroundColor Gray
    Write-Host "  - Security group doesn't allow your IP" -ForegroundColor Gray
    Write-Host "  - Database doesn't exist on RDS" -ForegroundColor Gray
    exit 1
}

# Cleanup
Write-Host ""
Write-Host "🧹 Cleaning up..." -ForegroundColor Yellow
Remove-Item $DumpFile -ErrorAction SilentlyContinue
Write-Host "✅ Cleanup completed" -ForegroundColor Green

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║            ✅ MIGRATION COMPLETED SUCCESSFULLY         ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Verify data in AWS RDS" -ForegroundColor Gray
Write-Host "   2. Check backend ECS logs for database connection" -ForegroundColor Gray
Write-Host "   3. Test application functionality" -ForegroundColor Gray
