/**
 * Maps a menu item to a photo that matches its name.
 *
 * Photos live in client/public/images/menu/<slug>.jpg and are fetched by
 * client/scripts/fetch-menu-images.mjs. Anything the map does not know falls back to a
 * keyword rule, then to the item's category, so a newly added dish still gets a picture.
 */

const BASE = '/images/menu';

const BY_NAME = {
  'butter chicken thali': 'butter-chicken-thali',
  'paneer tikka masala': 'paneer-tikka-masala',
  'chicken biryani': 'chicken-biryani',
  'veg biryani': 'veg-biryani',
  'dal makhani combo': 'dal-makhani-combo',
  'samosa': 'samosa',
  'chicken tikka': 'chicken-tikka',
  'paneer pakora': 'paneer-pakora',
  'masala fries': 'masala-fries',
  'spring rolls': 'spring-rolls',
  'masala dosa': 'masala-dosa',
  'idli sambar': 'idli-sambar',
  'poha': 'poha',
  'egg bhurji and toast': 'egg-bhurji',
  'masala chai': 'masala-chai',
  'filter coffee': 'filter-coffee',
  'mango lassi': 'mango-lassi',
  'cold coffee': 'cold-coffee',
  'fresh lime soda': 'fresh-lime-soda',
  'gulab jamun': 'gulab-jamun',
  'rasmalai': 'rasmalai',
  'brownie with ice cream': 'brownie-ice-cream',
  'chefs special thali': 'chefs-special-thali',
  'weekend brunch platter': 'weekend-brunch-platter',
};

// Longest/most specific patterns first: "veg biryani" must beat the generic biryani rule.
const RULES = [
  [/veg(etable)? biryani/, 'veg-biryani'],
  [/biryani/, 'chicken-biryani'],
  [/gulab|jamun/, 'gulab-jamun'],
  [/rasmalai|ras malai/, 'rasmalai'],
  [/brownie|chocolate cake/, 'brownie-ice-cream'],
  [/thali/, 'chefs-special-thali'],
  [/brunch|platter/, 'weekend-brunch-platter'],
  [/dosa/, 'masala-dosa'],
  [/idli/, 'idli-sambar'],
  [/poha/, 'poha'],
  [/bhurji|scrambled egg/, 'egg-bhurji'],
  [/samosa/, 'samosa'],
  [/pakora|pakoda/, 'paneer-pakora'],
  [/spring roll/, 'spring-rolls'],
  [/fries/, 'masala-fries'],
  [/tikka masala|paneer/, 'paneer-tikka-masala'],
  [/tikka|tandoori/, 'chicken-tikka'],
  [/butter chicken|makhani/, 'butter-chicken-thali'],
  [/dal|lentil/, 'dal-makhani-combo'],
  [/lassi/, 'mango-lassi'],
  [/cold coffee|iced coffee|frappe/, 'cold-coffee'],
  [/coffee/, 'filter-coffee'],
  [/chai|tea/, 'masala-chai'],
  [/lime|soda|lemonade|juice|shake|smoothie/, 'fresh-lime-soda'],
];

const BY_CATEGORY = {
  meals: 'chefs-special-thali',
  snacks: 'samosa',
  breakfast: 'masala-dosa',
  beverages: 'masala-chai',
  desserts: 'gulab-jamun',
  specials: 'chefs-special-thali',
};

const normalize = (value) => String(value || '')
  .toLowerCase()
  .replace(/&/g, ' and ')
  .replace(/\([^)]*\)/g, ' ')
  .replace(/[^a-z0-9]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

export const getMenuImageSlug = (item) => {
  if (!item) return null;

  const name = normalize(item.name || item.menuItem?.name);
  const exact = BY_NAME[name];
  if (exact) return exact;

  for (const [pattern, slug] of RULES) {
    if (pattern.test(name)) return slug;
  }

  const category = normalize(item.category?.name || item.category);
  return BY_CATEGORY[category] || 'chefs-special-thali';
};

export const getMenuImage = (item) => {
  const slug = getMenuImageSlug(item);
  return slug ? `${BASE}/${slug}.jpg` : null;
};

export default getMenuImage;
