# Database Migration Guide: Local MySQL → AWS RDS

## Prerequisites

1. **MySQL Client Tools** must be installed and in PATH:
   - `mysqldump` for export
   - `mysql` for import

### Finding MySQL Tools on Windows:

Common MySQL installation paths:
- `C:\Program Files\MySQL\MySQL Server 8.x\bin`
- `C:\xampp\mysql\bin`
- `C:\wamp64\bin\mysql\mysqlx.x.x\bin`

### Adding MySQL to PATH (Windows):

**Option 1: Temporary (Current Session)**
```powershell
$env:Path += ";C:\Program Files\MySQL\MySQL Server 8.0\bin"
```

**Option 2: Permanent**
1. Search "Environment Variables" in Windows
2. Edit "System Environment Variables"
3. Add MySQL bin directory to PATH

## Configuration

Before running, update these settings in `migrate-to-aws.js`:

```javascript
const LOCAL_CONFIG = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'YOUR_LOCAL_PASSWORD', // ← Update this
  database: 'skaarvi_db'
};
```

AWS RDS config is already set (no changes needed).

## Usage

### Step 1: Ensure RDS is Available
Make sure your AWS RDS status is **"Available"** (not "Starting").

### Step 2: Update Security Group
Ensure your current IP can access RDS:
- Go to RDS Security Group (RDS-Sg)
- Add inbound rule: MySQL/Aurora (port 3306) from your IP

### Step 3: Run Migration
```powershell
cd backend
node migrate-to-aws.js
```

## What the Script Does

1. ✅ **Checks** if mysqldump is available
2. 📤 **Exports** local database to `db-dump.sql`
3. 📥 **Imports** dump file to AWS RDS
4. 🔍 **Verifies** table count
5. 🧹 **Cleans up** temporary dump file

## Migration Process

```
Local MySQL → db-dump.sql → AWS RDS MySQL
```

**Estimated Time:** 1-5 minutes (depends on database size)

## Troubleshooting

### Error: "mysqldump not found"
**Solution:** Add MySQL bin directory to PATH (see above)

### Error: "Access denied"
**Solutions:**
- Check local MySQL password
- Ensure AWS RDS security group allows your IP

### Error: "Can't connect to MySQL server"
**Solutions:**
- Check RDS status is "Available"
- Verify RDS endpoint is correct
- Check security group rules

### Error: "Database doesn't exist"
**Solution:** The script creates the database automatically. If it fails:
```sql
-- Connect to RDS and create database manually:
mysql -h skaarvi-db.cxm0emkgszfj.ap-south-1.rds.amazonaws.com -u admin -p
CREATE DATABASE IF NOT EXISTS skaarvi_db;
```

## Alternative: Manual Migration

If the script doesn't work, use manual commands:

### Export:
```bash
mysqldump -h localhost -u root -p --single-transaction --routines --triggers --databases skaarvi_db > db-dump.sql
```

### Import:
```bash
mysql -h skaarvi-db.cxm0emkgszfj.ap-south-1.rds.amazonaws.com -u admin -pSkaarvi2026 skaarvi_db < db-dump.sql
```

## After Migration

1. **Verify Data:**
   ```sql
   mysql -h skaarvi-db.cxm0emkgszfj.ap-south-1.rds.amazonaws.com -u admin -p
   USE skaarvi_db;
   SHOW TABLES;
   SELECT COUNT(*) FROM users;
   ```

2. **Update Backend Environment Variables:**
   Your ECS Task Definition already has these set:
   - DB_HOST=skaarvi-db.cxm0emkgszfj.ap-south-1.rds.amazonaws.com
   - DB_USER=admin
   - DB_PASSWORD=Skaarvi2026
   - DB_NAME=skaarvi_db

3. **Test Application:**
   Check backend logs for "✅ Database connected successfully"

## Security Notes

⚠️ **Important:**
- The dump file contains sensitive data - it's automatically deleted after migration
- Don't commit `db-dump.sql` to git (already in .gitignore)
- After migration, restrict RDS security group to only ECS tasks (remove your local IP if not needed)

## Support

If you encounter issues:
1. Check RDS status is "Available"
2. Verify security group allows your IP
3. Ensure local MySQL is running
4. Check MySQL tools are in PATH
