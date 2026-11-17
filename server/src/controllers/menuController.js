import mongoose from 'mongoose';
import MenuCategory from '../models/MenuCategory.js';
import MenuItem from '../models/MenuItem.js';

const fallbackCategories = [
  { _id: 'cat_1', name: 'Meals', description: 'Full meals and combos', displayOrder: 1 },
  { _id: 'cat_2', name: 'Snacks', description: 'Light bites and starters', displayOrder: 2 },
  { _id: 'cat_3', name: 'Breakfast', description: 'Morning favorites', displayOrder: 3 },
  { _id: 'cat_4', name: 'Beverages', description: 'Hot and cold drinks', displayOrder: 4 },
  { _id: 'cat_5', name: 'Desserts', description: 'Sweet treats', displayOrder: 5 },
  { _id: 'cat_6', name: 'Specials', description: 'Chef\'s special items', displayOrder: 6 },
];

export const fallbackMenuItems = [
  { _id: 'item_1', name: 'Butter Chicken Thali', description: 'Creamy butter chicken with naan, rice, dal, and salad', price: 349, isVeg: false, prepTime: 25, isAvailable: true, category: { _id: 'cat_1', name: 'Meals' } },
  { _id: 'item_2', name: 'Paneer Tikka Masala', description: 'Cottage cheese in rich tomato gravy with roti and rice', price: 299, isVeg: true, prepTime: 20, isAvailable: true, category: { _id: 'cat_1', name: 'Meals' } },
  { _id: 'item_3', name: 'Chicken Biryani', description: 'Fragrant basmati rice with tender chicken pieces', price: 279, isVeg: false, prepTime: 30, isAvailable: true, category: { _id: 'cat_1', name: 'Meals' } },
  { _id: 'item_4', name: 'Veg Biryani', description: 'Aromatic rice with seasonal vegetables and herbs', price: 229, isVeg: true, prepTime: 25, isAvailable: true, category: { _id: 'cat_1', name: 'Meals' } },
  { _id: 'item_5', name: 'Dal Makhani Combo', description: 'Slow-cooked black lentils with butter naan and jeera rice', price: 249, isVeg: true, prepTime: 20, isAvailable: true, category: { _id: 'cat_1', name: 'Meals' } },
  { _id: 'item_6', name: 'Samosa (2 pcs)', description: 'Crispy pastry filled with spiced potatoes', price: 79, isVeg: true, prepTime: 10, isAvailable: true, category: { _id: 'cat_2', name: 'Snacks' } },
  { _id: 'item_7', name: 'Chicken Tikka', description: 'Marinated grilled chicken pieces', price: 199, isVeg: false, prepTime: 15, isAvailable: true, category: { _id: 'cat_2', name: 'Snacks' } },
  { _id: 'item_8', name: 'Masala Fries', description: 'Crispy fries tossed with Indian spices', price: 129, isVeg: true, prepTime: 10, isAvailable: true, category: { _id: 'cat_2', name: 'Snacks' } },
  { _id: 'item_9', name: 'Masala Dosa', description: 'Crispy crepe with potato filling, sambar, and chutneys', price: 149, isVeg: true, prepTime: 15, isAvailable: true, category: { _id: 'cat_3', name: 'Breakfast' } },
  { _id: 'item_10', name: 'Masala Chai', description: 'Traditional Indian spiced tea', price: 49, isVeg: true, prepTime: 5, isAvailable: true, category: { _id: 'cat_4', name: 'Beverages' }, sizes: [{ name: 'Regular', price: 49, isDefault: true }, { name: 'Large', price: 69 }] },
  { _id: 'item_11', name: 'Filter Coffee', description: 'South Indian style filter coffee', price: 59, isVeg: true, prepTime: 5, isAvailable: true, category: { _id: 'cat_4', name: 'Beverages' } },
  { _id: 'item_12', name: 'Cold Coffee', description: 'Chilled coffee blended with ice cream', price: 129, isVeg: true, prepTime: 5, isAvailable: true, category: { _id: 'cat_4', name: 'Beverages' } },
  { _id: 'item_13', name: 'Gulab Jamun (2 pcs)', description: 'Warm milk-solid dumplings in sugar syrup', price: 89, isVeg: true, prepTime: 5, isAvailable: true, category: { _id: 'cat_5', name: 'Desserts' } },
  { _id: 'item_14', name: 'Chef\'s Special Thali', description: 'Today\'s special: a curated selection by our chef', price: 449, isVeg: false, prepTime: 30, discountPercent: 10, isAvailable: true, category: { _id: 'cat_6', name: 'Specials' } },
];

// ===== CATEGORIES =====

// @desc    Get all active categories
// @route   GET /api/menu/categories
export const getCategories = async (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.json({ success: true, data: fallbackCategories, isFallback: true });
  }

  try {
    const filter = req.user ? {} : { isActive: true };
    const categories = await MenuCategory.find(filter).sort({ displayOrder: 1 });
    res.json({ success: true, data: categories });
  } catch (error) {
    console.warn('Notice: getCategories database query failed, using fallback:', error.message);
    res.json({ success: true, data: fallbackCategories, isFallback: true });
  }
};

// @desc    Create category
// @route   POST /api/menu/categories
export const createCategory = async (req, res, next) => {
  try {
    const category = await MenuCategory.create(req.body);
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

// @desc    Update category
// @route   PUT /api/menu/categories/:id
export const updateCategory = async (req, res, next) => {
  try {
    const category = await MenuCategory.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    });
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
    res.json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete (deactivate) category
// @route   DELETE /api/menu/categories/:id
export const deleteCategory = async (req, res, next) => {
  try {
    const category = await MenuCategory.findByIdAndUpdate(
      req.params.id, { isActive: false }, { new: true }
    );
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
    res.json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

// ===== MENU ITEMS =====

// @desc    Get menu items (optionally by category)
// @route   GET /api/menu/items
export const getMenuItems = async (req, res, next) => {
  const { category, search, vegOnly } = req.query;

  if (mongoose.connection.readyState !== 1) {
    let items = [...fallbackMenuItems];
    if (category && category !== 'all') {
      items = items.filter((i) => i.category?._id === category || i.category === category);
    }
    if (vegOnly === 'true') {
      items = items.filter((i) => i.isVeg);
    }
    if (search) {
      const q = search.toLowerCase();
      items = items.filter((i) => i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q));
    }
    return res.json({ success: true, data: { items }, isFallback: true });
  }

  try {
    const filter = { isArchived: false };

    // Public access = only available items; admin sees all
    if (!req.user) {
      filter.isAvailable = true;
    }

    if (category) filter.category = category;
    if (vegOnly === 'true') filter.isVeg = true;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const items = await MenuItem.find(filter)
      .populate('category', 'name slug')
      .sort({ displayOrder: 1, name: 1 });

    res.json({ success: true, data: { items } });
  } catch (error) {
    console.warn('Notice: getMenuItems database query failed, using fallback:', error.message);
    res.json({ success: true, data: { items: fallbackMenuItems }, isFallback: true });
  }
};

// @desc    Get single menu item
// @route   GET /api/menu/items/:id
export const getMenuItem = async (req, res, next) => {
  try {
    const item = await MenuItem.findById(req.params.id).populate('category', 'name slug');
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    res.json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};

// @desc    Create menu item
// @route   POST /api/menu/items
export const createMenuItem = async (req, res, next) => {
  try {
    const item = await MenuItem.create(req.body);
    const populated = await item.populate('category', 'name slug');
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Update menu item
// @route   PUT /api/menu/items/:id
export const updateMenuItem = async (req, res, next) => {
  try {
    const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    }).populate('category', 'name slug');
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    res.json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};

// @desc    Archive menu item (soft delete)
// @route   DELETE /api/menu/items/:id
export const archiveMenuItem = async (req, res, next) => {
  try {
    const item = await MenuItem.findByIdAndUpdate(
      req.params.id, { isArchived: true, isAvailable: false }, { new: true }
    );
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    res.json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle item availability
// @route   PATCH /api/menu/items/:id/availability
export const toggleAvailability = async (req, res, next) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    item.isAvailable = !item.isAvailable;
    await item.save();
    res.json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};
