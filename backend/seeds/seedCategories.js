const { Category } = require('../models');
const { v4: uuidv4 } = require('uuid');

// Generic categories commonly used across e-commerce platforms
const categories = [
  // Parent Categories
  {
    id: uuidv4(),
    name: 'Electronics',
    slug: 'electronics',
    description: 'Electronic devices, gadgets, and accessories',
    parentId: null,
    isActive: true,
    sortOrder: 1
  },
  {
    id: uuidv4(),
    name: 'Fashion',
    slug: 'fashion',
    description: 'Clothing, footwear, and fashion accessories',
    parentId: null,
    isActive: true,
    sortOrder: 2
  },
  {
    id: uuidv4(),
    name: 'Home & Kitchen',
    slug: 'home-kitchen',
    description: 'Home appliances, kitchenware, and home decor',
    parentId: null,
    isActive: true,
    sortOrder: 3
  },
  {
    id: uuidv4(),
    name: 'Beauty & Personal Care',
    slug: 'beauty-personal-care',
    description: 'Cosmetics, skincare, and personal care products',
    parentId: null,
    isActive: true,
    sortOrder: 4
  },
  {
    id: uuidv4(),
    name: 'Sports & Fitness',
    slug: 'sports-fitness',
    description: 'Sports equipment, fitness gear, and outdoor products',
    parentId: null,
    isActive: true,
    sortOrder: 5
  },
  {
    id: uuidv4(),
    name: 'Books & Stationery',
    slug: 'books-stationery',
    description: 'Books, office supplies, and educational materials',
    parentId: null,
    isActive: true,
    sortOrder: 6
  },
  {
    id: uuidv4(),
    name: 'Toys & Games',
    slug: 'toys-games',
    description: 'Toys, games, and entertainment products for all ages',
    parentId: null,
    isActive: true,
    sortOrder: 7
  },
  {
    id: uuidv4(),
    name: 'Automotive',
    slug: 'automotive',
    description: 'Car accessories, bike parts, and automotive products',
    parentId: null,
    isActive: true,
    sortOrder: 8
  },
  {
    id: uuidv4(),
    name: 'Health & Wellness',
    slug: 'health-wellness',
    description: 'Health supplements, medical devices, and wellness products',
    parentId: null,
    isActive: true,
    sortOrder: 9
  },
  {
    id: uuidv4(),
    name: 'Jewelry & Watches',
    slug: 'jewelry-watches',
    description: 'Jewelry, watches, and luxury accessories',
    parentId: null,
    isActive: true,
    sortOrder: 10
  },
  {
    id: uuidv4(),
    name: 'Pet Supplies',
    slug: 'pet-supplies',
    description: 'Pet food, accessories, and care products',
    parentId: null,
    isActive: true,
    sortOrder: 11
  },
  {
    id: uuidv4(),
    name: 'Baby Products',
    slug: 'baby-products',
    description: 'Baby care, feeding, and nursery products',
    parentId: null,
    isActive: true,
    sortOrder: 12
  },
  {
    id: uuidv4(),
    name: 'Furniture',
    slug: 'furniture',
    description: 'Home and office furniture',
    parentId: null,
    isActive: true,
    sortOrder: 13
  },
  {
    id: uuidv4(),
    name: 'Groceries & Food',
    slug: 'groceries-food',
    description: 'Food items, beverages, and grocery products',
    parentId: null,
    isActive: true,
    sortOrder: 14
  },
  {
    id: uuidv4(),
    name: 'Office Supplies',
    slug: 'office-supplies',
    description: 'Office equipment, supplies, and business products',
    parentId: null,
    isActive: true,
    sortOrder: 15
  }
];

// Subcategories for Electronics
const electronicsSubcategories = [
  {
    id: uuidv4(),
    name: 'Mobiles & Tablets',
    slug: 'mobiles-tablets',
    description: 'Smartphones, tablets, and mobile accessories',
    parentId: null, // Will be set to Electronics parent ID
    isActive: true,
    sortOrder: 1
  },
  {
    id: uuidv4(),
    name: 'Laptops & Computers',
    slug: 'laptops-computers',
    description: 'Laptops, desktops, and computer accessories',
    parentId: null,
    isActive: true,
    sortOrder: 2
  },
  {
    id: uuidv4(),
    name: 'Cameras & Photography',
    slug: 'cameras-photography',
    description: 'Cameras, lenses, and photography equipment',
    parentId: null,
    isActive: true,
    sortOrder: 3
  },
  {
    id: uuidv4(),
    name: 'Audio & Headphones',
    slug: 'audio-headphones',
    description: 'Headphones, speakers, and audio devices',
    parentId: null,
    isActive: true,
    sortOrder: 4
  },
  {
    id: uuidv4(),
    name: 'Televisions & Accessories',
    slug: 'televisions-accessories',
    description: 'TVs, home theater systems, and accessories',
    parentId: null,
    isActive: true,
    sortOrder: 5
  },
  {
    id: uuidv4(),
    name: 'Smart Home Devices',
    slug: 'smart-home-devices',
    description: 'Smart speakers, home automation, and IoT devices',
    parentId: null,
    isActive: true,
    sortOrder: 6
  }
];

// Subcategories for Fashion
const fashionSubcategories = [
  {
    id: uuidv4(),
    name: 'Men\'s Clothing',
    slug: 'mens-clothing',
    description: 'Clothing for men',
    parentId: null,
    isActive: true,
    sortOrder: 1
  },
  {
    id: uuidv4(),
    name: 'Women\'s Clothing',
    slug: 'womens-clothing',
    description: 'Clothing for women',
    parentId: null,
    isActive: true,
    sortOrder: 2
  },
  {
    id: uuidv4(),
    name: 'Kids\' Clothing',
    slug: 'kids-clothing',
    description: 'Clothing for children',
    parentId: null,
    isActive: true,
    sortOrder: 3
  },
  {
    id: uuidv4(),
    name: 'Footwear',
    slug: 'footwear',
    description: 'Shoes, sandals, and footwear accessories',
    parentId: null,
    isActive: true,
    sortOrder: 4
  },
  {
    id: uuidv4(),
    name: 'Bags & Luggage',
    slug: 'bags-luggage',
    description: 'Bags, backpacks, and travel luggage',
    parentId: null,
    isActive: true,
    sortOrder: 5
  }
];

const seedCategories = async () => {
  try {
    console.log('🌱 Starting category seeding...');

    // Check if categories already exist
    const existingCount = await Category.count();
    if (existingCount > 0) {
      console.log(`⚠️  Database already has ${existingCount} categories.`);
      console.log('   Checking if subcategories need to be added...\n');
      
      // Check and add subcategories if parents exist
      const electronicsCategory = await Category.findOne({ where: { slug: 'electronics' } });
      const fashionCategory = await Category.findOne({ where: { slug: 'fashion' } });
      
      let addedCount = 0;
      
      if (electronicsCategory) {
        const existingElectronicsSubs = await Category.count({ where: { parentId: electronicsCategory.id } });
        if (existingElectronicsSubs === 0) {
          electronicsSubcategories.forEach(sub => {
            sub.parentId = electronicsCategory.id;
          });
          await Category.bulkCreate(electronicsSubcategories);
          addedCount += electronicsSubcategories.length;
          console.log(`✅ Added ${electronicsSubcategories.length} Electronics subcategories`);
        } else {
          console.log(`   Electronics already has ${existingElectronicsSubs} subcategories`);
        }
      }
      
      if (fashionCategory) {
        const existingFashionSubs = await Category.count({ where: { parentId: fashionCategory.id } });
        if (existingFashionSubs === 0) {
          fashionSubcategories.forEach(sub => {
            sub.parentId = fashionCategory.id;
          });
          await Category.bulkCreate(fashionSubcategories);
          addedCount += fashionSubcategories.length;
          console.log(`✅ Added ${fashionSubcategories.length} Fashion subcategories`);
        } else {
          console.log(`   Fashion already has ${existingFashionSubs} subcategories`);
        }
      }
      
      if (addedCount === 0) {
        console.log('   All categories are already seeded. No changes made.');
      } else {
        console.log(`\n🎉 Added ${addedCount} new subcategories!`);
      }
      
      const totalCount = await Category.count();
      console.log(`📊 Total categories in database: ${totalCount}`);
      return;
    }

    // Insert parent categories first
    await Category.bulkCreate(categories);
    console.log(`✅ Inserted ${categories.length} parent categories`);

    // Get Electronics parent ID
    const electronicsCategory = await Category.findOne({ where: { slug: 'electronics' } });
    if (electronicsCategory) {
      electronicsSubcategories.forEach(sub => {
        sub.parentId = electronicsCategory.id;
      });
      await Category.bulkCreate(electronicsSubcategories);
      console.log(`✅ Inserted ${electronicsSubcategories.length} Electronics subcategories`);
    }

    // Get Fashion parent ID
    const fashionCategory = await Category.findOne({ where: { slug: 'fashion' } });
    if (fashionCategory) {
      fashionSubcategories.forEach(sub => {
        sub.parentId = fashionCategory.id;
      });
      await Category.bulkCreate(fashionSubcategories);
      console.log(`✅ Inserted ${fashionSubcategories.length} Fashion subcategories`);
    }

    // Verify total count
    const totalCount = await Category.count();
    console.log(`\n🎉 Category seeding completed successfully!`);
    console.log(`📊 Total categories in database: ${totalCount}`);
    console.log(`   - Parent categories: ${categories.length}`);
    console.log(`   - Subcategories: ${electronicsSubcategories.length + fashionSubcategories.length}`);

  } catch (error) {
    console.error('❌ Error seeding categories:', error);
    throw error;
  }
};

// Run seed if called directly
if (require.main === module) {
  const sequelize = require('../config/database');
  
  seedCategories()
    .then(() => {
      console.log('\n✨ Done! You can now close this process.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Seed failed:', error);
      process.exit(1);
    });
}

module.exports = seedCategories;
