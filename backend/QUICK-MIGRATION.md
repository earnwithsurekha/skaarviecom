# Quick Migration Commands

## Option 1: Using Node.js Script (Recommended)

```powershell
cd backend
node migrate-to-aws.js
```

## Option 2: Using PowerShell Script

```powershell
cd backend
# First, edit migrate-to-aws.ps1 and set $LocalPassword
.\migrate-to-aws.ps1
```

## Option 3: Manual Commands

### Add MySQL to PATH (if needed):
```powershell
$env:Path += ";C:\Program Files\MySQL\MySQL Server 8.0\bin"
# OR
$env:Path += ";C:\xampp\mysql\bin"
```

### Export from Local:
```powershell
cd backend
mysqldump -h localhost -u root -p --single-transaction --routines --triggers --databases skaarvi_db > db-dump.sql
```

### Import to AWS:
```powershell
mysql -h skaarvi-db.cxm0emkgszfj.ap-south-1.rds.amazonaws.com -u admin -pSkaarvi2026 skaarvi_db < db-dump.sql
```

### Verify:
```powershell
mysql -h skaarvi-db.cxm0emkgszfj.ap-south-1.rds.amazonaws.com -u admin -pSkaarvi2026 -e "SHOW TABLES;" skaarvi_db
```

## Before Running:

1. **Check RDS Status** is "Available" (not "Starting")
2. **Update Security Group** to allow your IP (port 3306)
3. **Set Local Password** in the script you choose

## What You Need:

- ✅ Local MySQL password
- ✅ RDS endpoint: skaarvi-db.cxm0emkgszfj.ap-south-1.rds.amazonaws.com
- ✅ RDS admin password: Skaarvi2026
- ✅ MySQL tools (mysqldump, mysql) in PATH

## Troubleshooting:

### "mysqldump not found"
Add MySQL bin directory to PATH (see above)

### "Access denied"
- Check local MySQL password
- Verify RDS security group allows your IP

### "Can't connect"
- Wait for RDS status to be "Available"
- Check security group rules in RDS console
