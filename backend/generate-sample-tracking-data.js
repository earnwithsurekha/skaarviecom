const { sequelize } = require('./models');

async function generateSampleData() {
  try {
    console.log('📊 Generating sample demand analytics data...\n');

    // Get existing products
    const [products] = await sequelize.query(`
      SELECT id, name FROM products WHERE deleted_at IS NULL LIMIT 20
    `);
    
    if (products.length === 0) {
      console.log('❌ No products found in database. Please add products first.');
      process.exit(1);
    }

    console.log(`Found ${products.length} products to generate data for...\n`);

    // Get some users (resellers/customers)
    const [users] = await sequelize.query(`
      SELECT id FROM users WHERE role IN ('reseller', 'customer') LIMIT 10
    `);

    const [resellers] = await sequelize.query(`
      SELECT id FROM resellers LIMIT 10
    `);

    let clicksInserted = 0;
    let savesInserted = 0;
    let sharesInserted = 0;

    // Generate data for each product
    for (const product of products) {
      // Random number of clicks (10-100 per product)
      const numClicks = Math.floor(Math.random() * 90) + 10;
      
      for (let i = 0; i < numClicks; i++) {
        const daysAgo = Math.floor(Math.random() * 30); // Last 30 days
        const user = users[Math.floor(Math.random() * users.length)];
        const sources = ['search', 'category', 'featured', 'recommendation', 'direct'];
        const source = sources[Math.floor(Math.random() * sources.length)];

        await sequelize.query(`
          INSERT INTO product_clicks (id, product_id, user_id, source, created_at, updated_at)
          VALUES (UUID(), ?, ?, ?, DATE_SUB(NOW(), INTERVAL ? DAY), DATE_SUB(NOW(), INTERVAL ? DAY))
        `, {
          replacements: [product.id, user?.id || null, source, daysAgo, daysAgo]
        });
        
        clicksInserted++;
      }

      // Random number of saves (2-15 per product, less than clicks)
      const numSaves = Math.floor(Math.random() * 13) + 2;
      
      for (let i = 0; i < numSaves && i < users.length; i++) {
        const daysAgo = Math.floor(Math.random() * 30);
        const user = users[i];
        const sources = ['wishlist', 'favorites', 'saved_items'];
        const source = sources[Math.floor(Math.random() * sources.length)];

        try {
          await sequelize.query(`
            INSERT INTO product_saves (id, product_id, user_id, source, created_at, updated_at)
            VALUES (UUID(), ?, ?, ?, DATE_SUB(NOW(), INTERVAL ? DAY), DATE_SUB(NOW(), INTERVAL ? DAY))
          `, {
            replacements: [product.id, user.id, source, daysAgo, daysAgo]
          });
          
          savesInserted++;
        } catch (error) {
          // Skip duplicate user-product combinations
          if (!error.message.includes('Duplicate entry')) {
            console.error(`Error inserting save: ${error.message}`);
          }
        }
      }

      // Random number of shares (1-8 per product, less than saves)
      const numShares = Math.floor(Math.random() * 7) + 1;
      
      for (let i = 0; i < numShares; i++) {
        const daysAgo = Math.floor(Math.random() * 30);
        const user = users[Math.floor(Math.random() * users.length)];
        const platforms = ['whatsapp', 'facebook', 'twitter', 'telegram', 'instagram', 'link'];
        const sources = ['social', 'messaging', 'email', 'copy_link'];
        const platform = platforms[Math.floor(Math.random() * platforms.length)];
        const source = sources[Math.floor(Math.random() * sources.length)];

        await sequelize.query(`
          INSERT INTO product_shares (id, product_id, user_id, platform, source, created_at, updated_at)
          VALUES (UUID(), ?, ?, ?, ?, DATE_SUB(NOW(), INTERVAL ? DAY), DATE_SUB(NOW(), INTERVAL ? DAY))
        `, {
          replacements: [product.id, user?.id || null, platform, source, daysAgo, daysAgo]
        });
        
        sharesInserted++;
      }

      process.stdout.write(`✓ Generated data for: ${product.name.substring(0, 40)}...\n`);
    }

    console.log('\n✨ Sample Data Generation Complete!\n');
    console.log('📈 Statistics:');
    console.log(`  • Products processed: ${products.length}`);
    console.log(`  • Total clicks inserted: ${clicksInserted}`);
    console.log(`  • Total saves inserted: ${savesInserted}`);
    console.log(`  • Total shares inserted: ${sharesInserted}`);
    console.log(`  • Average clicks per product: ${Math.round(clicksInserted / products.length)}`);
    console.log(`  • Average saves per product: ${Math.round(savesInserted / products.length)}`);
    console.log(`  • Average shares per product: ${Math.round(sharesInserted / products.length)}`);
    
    // Calculate some conversion metrics
    const [orders] = await sequelize.query(`
      SELECT COUNT(DISTINCT o.id) as totalOrders
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      WHERE o.order_status != 'cancelled'
      AND oi.product_id IN (${products.map(p => `'${p.id}'`).join(',')})
    `);
    
    const totalOrders = orders[0]?.totalOrders || 0;
    const conversionRate = clicksInserted > 0 ? ((totalOrders / clicksInserted) * 100).toFixed(2) : 0;
    
    console.log(`  • Total orders: ${totalOrders}`);
    console.log(`  • Overall conversion rate: ${conversionRate}%`);
    
    console.log('\n🎉 You can now view the demand analytics at:');
    console.log('   http://localhost:3000/admin/demand-analytics\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error generating sample data:', error);
    process.exit(1);
  }
}

generateSampleData();
