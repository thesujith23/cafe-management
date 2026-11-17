import dns from 'dns';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

import User from './models/User.js';
import CafeSettings from './models/CafeSettings.js';
import DiningTable from './models/DiningTable.js';
import QRToken from './models/QRToken.js';
import MenuCategory from './models/MenuCategory.js';
import MenuItem from './models/MenuItem.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cafe_management';

// Fix Windows/ISP local DNS SRV query failures for mongodb+srv URLs
if (MONGODB_URI && MONGODB_URI.includes('mongodb+srv')) {
  try {
    dns.setServers(['8.8.8.8', '8.8.4.4']);
  } catch {}
}

const tables = [
  { tableId: 'TBL-001', displayName: 'Table 1', capacity: 4 },
  { tableId: 'TBL-002', displayName: 'Table 2', capacity: 4 },
  { tableId: 'TBL-003', displayName: 'Table 3', capacity: 6 },
  { tableId: 'TBL-004', displayName: 'Table 4', capacity: 2 },
  { tableId: 'TBL-005', displayName: 'Table 5', capacity: 8 },
  { tableId: 'TBL-006', displayName: 'Table 6', capacity: 4 },
];

const categories = [
  { name: 'Meals', description: 'Full meals and combos', displayOrder: 1 },
  { name: 'Snacks', description: 'Light bites and starters', displayOrder: 2 },
  { name: 'Breakfast', description: 'Morning favorites', displayOrder: 3 },
  { name: 'Beverages', description: 'Hot and cold drinks', displayOrder: 4 },
  { name: 'Desserts', description: 'Sweet treats', displayOrder: 5 },
  { name: 'Specials', description: 'Chef\'s special items', displayOrder: 6 },
];

export const runSeed = async (isStandalone = false) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
      console.log('Connected to MongoDB');
    }

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      CafeSettings.deleteMany({}),
      DiningTable.deleteMany({}),
      QRToken.deleteMany({}),
      MenuCategory.deleteMany({}),
      MenuItem.deleteMany({}),
    ]);
    console.log('Cleared existing data');

    // Create owner account
    const owner = await User.create({
      name: 'Admin',
      email: 'admin@cafe.com',
      password: 'admin123',
      role: 'owner',
    });
    console.log('Created owner: admin@cafe.com / admin123');

    // Create staff accounts
    await User.create({ name: 'Counter Staff', email: 'counter@cafe.com', password: 'counter123', role: 'counter' });
    await User.create({ name: 'Kitchen Staff', email: 'kitchen@cafe.com', password: 'kitchen123', role: 'kitchen' });
    console.log('Created staff accounts');

    // Create cafe settings
    await CafeSettings.create({
      cafeName: 'Smart Café',
      tagline: 'Scan. Order. Enjoy.',
      address: '123 Main Street, Mumbai, India',
      phone: '+91 98765 43210',
      email: 'hello@smartcafe.in',
      gstNumber: '27XXXXX1234X1Z5',
    });
    console.log('Created cafe settings');

    // Create tables with QR tokens
    for (const tableData of tables) {
      const table = await DiningTable.create(tableData);
      const token = QRToken.generateToken();
      const qrToken = await QRToken.create({ table: table._id, token });
      table.currentQrToken = qrToken._id;
      await table.save();
      console.log(`Created ${table.tableId} with QR token: ${token.substring(0, 12)}...`);
    }

    // Create categories
    const createdCategories = {};
    for (const cat of categories) {
      const created = await MenuCategory.create(cat);
      createdCategories[cat.name] = created._id;
    }
    console.log('Created menu categories');

    // Create sample menu items
    const menuItems = [
      // Meals
      { name: 'Butter Chicken Thali', description: 'Creamy butter chicken with naan, rice, dal, and salad', price: 349, category: createdCategories['Meals'], isVeg: false, prepTime: 25, image: '' },
      { name: 'Paneer Tikka Masala', description: 'Cottage cheese in rich tomato gravy with roti and rice', price: 299, category: createdCategories['Meals'], isVeg: true, prepTime: 20, image: '' },
      { name: 'Chicken Biryani', description: 'Fragrant basmati rice with tender chicken pieces', price: 279, category: createdCategories['Meals'], isVeg: false, prepTime: 30, image: '' },
      { name: 'Veg Biryani', description: 'Aromatic rice with seasonal vegetables and herbs', price: 229, category: createdCategories['Meals'], isVeg: true, prepTime: 25, image: '' },
      { name: 'Dal Makhani Combo', description: 'Slow-cooked black lentils with butter naan and jeera rice', price: 249, category: createdCategories['Meals'], isVeg: true, prepTime: 20, image: '' },

      // Snacks
      { name: 'Samosa (2 pcs)', description: 'Crispy pastry filled with spiced potatoes', price: 79, category: createdCategories['Snacks'], isVeg: true, prepTime: 10, image: '' },
      { name: 'Chicken Tikka', description: 'Marinated grilled chicken pieces', price: 199, category: createdCategories['Snacks'], isVeg: false, prepTime: 15, image: '' },
      { name: 'Paneer Pakora', description: 'Cottage cheese fritters with mint chutney', price: 149, category: createdCategories['Snacks'], isVeg: true, prepTime: 12, image: '' },
      { name: 'Masala Fries', description: 'Crispy fries tossed with Indian spices', price: 129, category: createdCategories['Snacks'], isVeg: true, prepTime: 10, image: '' },
      { name: 'Spring Rolls (4 pcs)', description: 'Crispy rolls with vegetable filling', price: 159, category: createdCategories['Snacks'], isVeg: true, prepTime: 12, image: '' },

      // Breakfast
      { name: 'Masala Dosa', description: 'Crispy crepe with potato filling, sambar, and chutneys', price: 149, category: createdCategories['Breakfast'], isVeg: true, prepTime: 15, image: '' },
      { name: 'Idli Sambar (4 pcs)', description: 'Steamed rice cakes with sambar and chutney', price: 119, category: createdCategories['Breakfast'], isVeg: true, prepTime: 10, image: '' },
      { name: 'Poha', description: 'Flattened rice with peanuts and spices', price: 99, category: createdCategories['Breakfast'], isVeg: true, prepTime: 10, image: '' },
      { name: 'Egg Bhurji & Toast', description: 'Spiced scrambled eggs with buttered toast', price: 139, category: createdCategories['Breakfast'], isVeg: false, prepTime: 10, image: '' },

      // Beverages
      { name: 'Masala Chai', description: 'Traditional Indian spiced tea', price: 49, category: createdCategories['Beverages'], isVeg: true, prepTime: 5, sizes: [{ name: 'Regular', price: 49, isDefault: true }, { name: 'Large', price: 69 }], image: '' },
      { name: 'Filter Coffee', description: 'South Indian style filter coffee', price: 59, category: createdCategories['Beverages'], isVeg: true, prepTime: 5, image: '' },
      { name: 'Mango Lassi', description: 'Creamy mango yogurt smoothie', price: 99, category: createdCategories['Beverages'], isVeg: true, prepTime: 5, image: '' },
      { name: 'Cold Coffee', description: 'Chilled coffee blended with ice cream', price: 129, category: createdCategories['Beverages'], isVeg: true, prepTime: 5, image: '' },
      { name: 'Fresh Lime Soda', description: 'Refreshing lime with soda, sweet or salted', price: 69, category: createdCategories['Beverages'], isVeg: true, prepTime: 3, image: '' },

      // Desserts
      { name: 'Gulab Jamun (2 pcs)', description: 'Warm milk-solid dumplings in sugar syrup', price: 89, category: createdCategories['Desserts'], isVeg: true, prepTime: 5, image: '' },
      { name: 'Rasmalai (2 pcs)', description: 'Soft paneer balls in saffron milk', price: 109, category: createdCategories['Desserts'], isVeg: true, prepTime: 5, image: '' },
      { name: 'Brownie with Ice Cream', description: 'Warm chocolate brownie topped with vanilla ice cream', price: 179, category: createdCategories['Desserts'], isVeg: true, prepTime: 8, image: '' },

      // Specials
      { name: 'Chef\'s Special Thali', description: 'Today\'s special: a curated selection by our chef', price: 449, category: createdCategories['Specials'], isVeg: false, prepTime: 30, discountPercent: 10, image: '' },
      { name: 'Weekend Brunch Platter', description: 'Eggs, sausages, pancakes, fruit, and coffee', price: 399, category: createdCategories['Specials'], isVeg: false, prepTime: 25, image: '' },
    ];

    await MenuItem.insertMany(menuItems);
    console.log(`Created ${menuItems.length} menu items`);

    console.log('\n✅ Seed completed successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('   Owner:   admin@cafe.com / admin123');
    console.log('   Counter: counter@cafe.com / counter123');
    console.log('   Kitchen: kitchen@cafe.com / kitchen123');

    if (isStandalone) {
      process.exit(0);
    }
    return true;
  } catch (error) {
    console.error('Seed error:', error);
    if (isStandalone) {
      process.exit(1);
    }
    throw error;
  }
};

// If run directly from CLI
const isDirectExecution = process.argv[1] && (
  process.argv[1].endsWith('seed.js') ||
  process.argv[1].endsWith('seed')
);

if (isDirectExecution) {
  runSeed(true);
}

export default runSeed;
