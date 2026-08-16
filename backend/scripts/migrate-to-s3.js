/**
 * S3 Migration Script
 * Migrates all local file uploads to AWS S3
 * 
 * Usage:
 *   node scripts/migrate-to-s3.js --dry-run      # Preview migration without making changes
 *   node scripts/migrate-to-s3.js                # Run actual migration
 *   node scripts/migrate-to-s3.js --table=banners # Migrate specific table only
 */

const path = require('path');
const fs = require('fs');
const { sequelize } = require('../models');
const { s3, bucket } = require('../config/aws');
const { v4: uuidv4 } = require('uuid');

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const tableArg = args.find(arg => arg.startsWith('--table='));
const targetTable = tableArg ? tableArg.split('=')[1] : null;

// Migration statistics
const stats = {
  total: 0,
  success: 0,
  skipped: 0,
  failed: 0,
  errors: []
};

/**
 * Upload a local file to S3
 */
async function uploadFileToS3(localPath, s3Key) {
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  const fullPath = path.join(uploadsDir, localPath.replace('/uploads/', ''));

  // Check if file exists locally
  if (!fs.existsSync(fullPath)) {
    throw new Error(`File not found: ${fullPath}`);
  }

  // Read file buffer
  const fileBuffer = fs.readFileSync(fullPath);
  
  // Determine content type from file extension
  const ext = path.extname(localPath).toLowerCase();
  const contentTypeMap = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf',
    '.mp4': 'video/mp4',
    '.mov': 'video/quicktime',
    '.avi': 'video/x-msvideo'
  };
  const contentType = contentTypeMap[ext] || 'application/octet-stream';

  // Upload to S3
  const params = {
    Bucket: bucket,
    Key: s3Key,
    Body: fileBuffer,
    ContentType: contentType
  };

  const result = await s3.upload(params).promise();
  return result.Location;
}

/**
 * Generate S3 key from local path
 */
function generateS3Key(localPath, prefix = '') {
  const filename = path.basename(localPath);
  const ext = path.extname(filename);
  const timestamp = Date.now();
  const uniqueId = uuidv4().split('-')[0];
  
  return `${prefix}/${timestamp}_${uniqueId}${ext}`;
}

/**
 * Migrate product images
 */
async function migrateProductImages() {
  console.log('\n📷 Migrating product_images table...');
  
  const [rows] = await sequelize.query(`
    SELECT id, image_url, thumbnail_url, product_id
    FROM product_images
    WHERE image_url LIKE '/uploads/%' OR thumbnail_url LIKE '/uploads/%'
  `);

  console.log(`Found ${rows.length} product images to migrate`);
  stats.total += rows.length;

  for (const row of rows) {
    try {
      let newImageUrl = row.image_url;
      let newThumbnailUrl = row.thumbnail_url;

      // Migrate main image
      if (row.image_url && row.image_url.startsWith('/uploads/')) {
        if (isDryRun) {
          console.log(`[DRY-RUN] Would migrate: ${row.image_url} -> products/images/...`);
        } else {
          const s3Key = generateS3Key(row.image_url, 'products/images');
          newImageUrl = await uploadFileToS3(row.image_url, s3Key);
          console.log(`✓ Migrated image ${row.id}: ${newImageUrl}`);
        }
      }

      // Migrate thumbnail if exists
      if (row.thumbnail_url && row.thumbnail_url.startsWith('/uploads/')) {
        if (isDryRun) {
          console.log(`[DRY-RUN] Would migrate thumbnail: ${row.thumbnail_url}`);
        } else {
          const s3Key = generateS3Key(row.thumbnail_url, 'products/thumbnails');
          newThumbnailUrl = await uploadFileToS3(row.thumbnail_url, s3Key);
        }
      }

      // Update database
      if (!isDryRun) {
        await sequelize.query(`
          UPDATE product_images
          SET image_url = ?, thumbnail_url = ?
          WHERE id = ?
        `, { replacements: [newImageUrl, newThumbnailUrl, row.id] });
      }

      stats.success++;
    } catch (error) {
      stats.failed++;
      stats.errors.push({ table: 'product_images', id: row.id, error: error.message });
      console.error(`✗ Failed to migrate product image ${row.id}:`, error.message);
    }
  }
}

/**
 * Migrate product videos
 */
async function migrateProductVideos() {
  console.log('\n🎥 Migrating product_videos table...');
  
  const [rows] = await sequelize.query(`
    SELECT id, video_url, thumbnail_url, product_id
    FROM product_videos
    WHERE video_url LIKE '/uploads/%' OR thumbnail_url LIKE '/uploads/%'
  `);

  console.log(`Found ${rows.length} product videos to migrate`);
  stats.total += rows.length;

  for (const row of rows) {
    try {
      let newVideoUrl = row.video_url;
      let newThumbnailUrl = row.thumbnail_url;

      if (row.video_url && row.video_url.startsWith('/uploads/')) {
        if (isDryRun) {
          console.log(`[DRY-RUN] Would migrate: ${row.video_url} -> products/videos/...`);
        } else {
          const s3Key = generateS3Key(row.video_url, 'products/videos');
          newVideoUrl = await uploadFileToS3(row.video_url, s3Key);
          console.log(`✓ Migrated video ${row.id}: ${newVideoUrl}`);
        }
      }

      if (row.thumbnail_url && row.thumbnail_url.startsWith('/uploads/')) {
        if (isDryRun) {
          console.log(`[DRY-RUN] Would migrate thumbnail: ${row.thumbnail_url}`);
        } else {
          const s3Key = generateS3Key(row.thumbnail_url, 'products/thumbnails');
          newThumbnailUrl = await uploadFileToS3(row.thumbnail_url, s3Key);
        }
      }

      if (!isDryRun) {
        await sequelize.query(`
          UPDATE product_videos
          SET video_url = ?, thumbnail_url = ?
          WHERE id = ?
        `, { replacements: [newVideoUrl, newThumbnailUrl, row.id] });
      }

      stats.success++;
    } catch (error) {
      stats.failed++;
      stats.errors.push({ table: 'product_videos', id: row.id, error: error.message });
      console.error(`✗ Failed to migrate product video ${row.id}:`, error.message);
    }
  }
}

/**
 * Migrate product catalogs
 */
async function migrateProductCatalogs() {
  console.log('\n📄 Migrating products (catalog_url)...');
  
  const [rows] = await sequelize.query(`
    SELECT id, catalog_url, name
    FROM products
    WHERE catalog_url LIKE '/uploads/%'
  `);

  console.log(`Found ${rows.length} product catalogs to migrate`);
  stats.total += rows.length;

  for (const row of rows) {
    try {
      if (isDryRun) {
        console.log(`[DRY-RUN] Would migrate: ${row.catalog_url} -> products/catalogs/...`);
      } else {
        const s3Key = generateS3Key(row.catalog_url, 'products/catalogs');
        const newCatalogUrl = await uploadFileToS3(row.catalog_url, s3Key);
        
        await sequelize.query(`
          UPDATE products
          SET catalog_url = ?
          WHERE id = ?
        `, { replacements: [newCatalogUrl, row.id] });
        
        console.log(`✓ Migrated catalog for product ${row.id}: ${newCatalogUrl}`);
      }
      stats.success++;
    } catch (error) {
      stats.failed++;
      stats.errors.push({ table: 'products', id: row.id, error: error.message });
      console.error(`✗ Failed to migrate catalog for product ${row.id}:`, error.message);
    }
  }
}

/**
 * Migrate manufacturer documents
 */
async function migrateManufacturerDocuments() {
  console.log('\n🏭 Migrating manufacturer documents...');
  
  const [rows] = await sequelize.query(`
    SELECT id, company_logo_url, gst_certificate_url, pan_card_url, cancelled_cheque_url
    FROM manufacturers
    WHERE company_logo_url LIKE '/uploads/%' 
       OR gst_certificate_url LIKE '/uploads/%'
       OR pan_card_url LIKE '/uploads/%'
       OR cancelled_cheque_url LIKE '/uploads/%'
  `);

  console.log(`Found ${rows.length} manufacturers with documents to migrate`);
  stats.total += rows.length * 4; // 4 possible document types

  for (const row of rows) {
    const documents = [
      { field: 'company_logo_url', value: row.company_logo_url, prefix: 'documents/logos' },
      { field: 'gst_certificate_url', value: row.gst_certificate_url, prefix: 'documents/gst' },
      { field: 'pan_card_url', value: row.pan_card_url, prefix: 'documents/pan' },
      { field: 'cancelled_cheque_url', value: row.cancelled_cheque_url, prefix: 'documents/cheques' }
    ];

    for (const doc of documents) {
      try {
        if (doc.value && doc.value.startsWith('/uploads/')) {
          if (isDryRun) {
            console.log(`[DRY-RUN] Would migrate ${doc.field}: ${doc.value}`);
          } else {
            const s3Key = generateS3Key(doc.value, doc.prefix);
            const newUrl = await uploadFileToS3(doc.value, s3Key);
            
            await sequelize.query(`
              UPDATE manufacturers
              SET ${doc.field} = ?
              WHERE id = ?
            `, { replacements: [newUrl, row.id] });
            
            console.log(`✓ Migrated ${doc.field} for manufacturer ${row.id}`);
          }
          stats.success++;
        } else {
          stats.skipped++;
        }
      } catch (error) {
        stats.failed++;
        stats.errors.push({ table: 'manufacturers', id: row.id, field: doc.field, error: error.message });
        console.error(`✗ Failed to migrate ${doc.field} for manufacturer ${row.id}:`, error.message);
      }
    }
  }
}

/**
 * Migrate reseller profile photos
 */
async function migrateResellerProfiles() {
  console.log('\n👤 Migrating reseller profile photos...');
  
  const [rows] = await sequelize.query(`
    SELECT id, profile_photo_url
    FROM resellers
    WHERE profile_photo_url LIKE '/uploads/%'
  `);

  console.log(`Found ${rows.length} reseller profile photos to migrate`);
  stats.total += rows.length;

  for (const row of rows) {
    try {
      if (isDryRun) {
        console.log(`[DRY-RUN] Would migrate: ${row.profile_photo_url} -> profiles/...`);
      } else {
        const s3Key = generateS3Key(row.profile_photo_url, 'profiles');
        const newUrl = await uploadFileToS3(row.profile_photo_url, s3Key);
        
        await sequelize.query(`
          UPDATE resellers
          SET profile_photo_url = ?
          WHERE id = ?
        `, { replacements: [newUrl, row.id] });
        
        console.log(`✓ Migrated profile photo for reseller ${row.id}`);
      }
      stats.success++;
    } catch (error) {
      stats.failed++;
      stats.errors.push({ table: 'resellers', id: row.id, error: error.message });
      console.error(`✗ Failed to migrate profile photo for reseller ${row.id}:`, error.message);
    }
  }
}

/**
 * Migrate user profile photos
 */
async function migrateUserProfiles() {
  console.log('\n👥 Migrating user profile photos...');
  
  const [rows] = await sequelize.query(`
    SELECT id, profile_photo
    FROM users
    WHERE profile_photo LIKE '/uploads/%'
  `);

  console.log(`Found ${rows.length} user profile photos to migrate`);
  stats.total += rows.length;

  for (const row of rows) {
    try {
      if (isDryRun) {
        console.log(`[DRY-RUN] Would migrate: ${row.profile_photo} -> profiles/...`);
      } else {
        const s3Key = generateS3Key(row.profile_photo, 'profiles');
        const newUrl = await uploadFileToS3(row.profile_photo, s3Key);
        
        await sequelize.query(`
          UPDATE users
          SET profile_photo = ?
          WHERE id = ?
        `, { replacements: [newUrl, row.id] });
        
        console.log(`✓ Migrated profile photo for user ${row.id}`);
      }
      stats.success++;
    } catch (error) {
      stats.failed++;
      stats.errors.push({ table: 'users', id: row.id, error: error.message });
      console.error(`✗ Failed to migrate profile photo for user ${row.id}:`, error.message);
    }
  }
}

/**
 * Migrate banners
 */
async function migrateBanners() {
  console.log('\n🎨 Migrating banners...');
  
  const [rows] = await sequelize.query(`
    SELECT id, image_url, title
    FROM banners
    WHERE image_url LIKE '/uploads/%' AND deleted_at IS NULL
  `);

  console.log(`Found ${rows.length} banners to migrate`);
  stats.total += rows.length;

  for (const row of rows) {
    try {
      if (isDryRun) {
        console.log(`[DRY-RUN] Would migrate: ${row.image_url} -> banners/...`);
      } else {
        const s3Key = generateS3Key(row.image_url, 'banners');
        const newUrl = await uploadFileToS3(row.image_url, s3Key);
        
        await sequelize.query(`
          UPDATE banners
          SET image_url = ?
          WHERE id = ?
        `, { replacements: [newUrl, row.id] });
        
        console.log(`✓ Migrated banner ${row.id}: ${row.title}`);
      }
      stats.success++;
    } catch (error) {
      stats.failed++;
      stats.errors.push({ table: 'banners', id: row.id, error: error.message });
      console.error(`✗ Failed to migrate banner ${row.id}:`, error.message);
    }
  }
}

/**
 * Main migration function
 */
async function runMigration() {
  console.log('========================================');
  console.log('🚀 S3 Migration Script');
  console.log('========================================');
  console.log(`Mode: ${isDryRun ? 'DRY-RUN (no changes will be made)' : 'LIVE'}`);
  console.log(`AWS S3 Bucket: ${bucket}`);
  console.log(`Target Table: ${targetTable || 'ALL'}`);
  console.log('========================================\n');

  const startTime = Date.now();

  try {
    // Test S3 connection
    console.log('Testing S3 connection...');
    await s3.headBucket({ Bucket: bucket }).promise();
    console.log('✓ S3 connection successful\n');

    // Run migrations based on target table
    const migrations = {
      'product_images': migrateProductImages,
      'product_videos': migrateProductVideos,
      'products': migrateProductCatalogs,
      'manufacturers': migrateManufacturerDocuments,
      'resellers': migrateResellerProfiles,
      'users': migrateUserProfiles,
      'banners': migrateBanners
    };

    if (targetTable) {
      if (migrations[targetTable]) {
        await migrations[targetTable]();
      } else {
        console.error(`❌ Unknown table: ${targetTable}`);
        console.log(`Available tables: ${Object.keys(migrations).join(', ')}`);
        process.exit(1);
      }
    } else {
      // Run all migrations
      for (const [table, migrationFn] of Object.entries(migrations)) {
        await migrationFn();
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n========================================');
    console.log('📊 Migration Summary');
    console.log('========================================');
    console.log(`Total files processed: ${stats.total}`);
    console.log(`✓ Successful: ${stats.success}`);
    console.log(`⊘ Skipped: ${stats.skipped}`);
    console.log(`✗ Failed: ${stats.failed}`);
    console.log(`⏱ Duration: ${duration}s`);
    console.log('========================================\n');

    if (stats.errors.length > 0) {
      console.log('❌ Errors encountered:');
      stats.errors.forEach((err, idx) => {
        console.log(`${idx + 1}. ${err.table} (ID: ${err.id}): ${err.error}`);
      });
      console.log('\n');
    }

    if (isDryRun) {
      console.log('ℹ️  This was a DRY-RUN. No changes were made.');
      console.log('Run without --dry-run flag to perform actual migration.\n');
    } else {
      console.log('✅ Migration completed!');
      console.log('\nNext steps:');
      console.log('1. Verify images are accessible in your application');
      console.log('2. Test file uploads with new S3 backend');
      console.log('3. Create backup of backend/uploads directory');
      console.log('4. After verification, you can remove local uploads folder\n');
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run migration
runMigration();
