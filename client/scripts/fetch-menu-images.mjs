/**
 * Downloads one food photo per menu item from Wikimedia Commons into
 * client/public/images/menu/<slug>.jpg
 *
 * Run from the client folder:  node scripts/fetch-menu-images.mjs
 * Re-running is safe; existing files are kept unless --force is passed.
 */
import { mkdir, writeFile, stat } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, '../public/images/menu');

const MEDIA = {
  'butter-chicken-thali': ['butter chicken', 'chicken makhani'],
  'paneer-tikka-masala': ['paneer tikka masala', 'shahi paneer'],
  'chicken-biryani': ['chicken biryani', 'hyderabadi biryani'],
  'veg-biryani': ['vegetable biryani', 'veg biryani'],
  'dal-makhani-combo': ['dal makhani', 'dal makhani naan'],
  'samosa': ['samosa', 'samosas'],
  'chicken-tikka': ['chicken tikka', 'tandoori chicken'],
  'paneer-pakora': ['paneer pakora', 'pakora'],
  'masala-fries': ['french fries', 'fries', 'potato fries'],
  'spring-rolls': ['spring roll', 'spring rolls'],
  'masala-dosa': ['dosa', 'masala dosa'],
  'idli-sambar': ['idli', 'idli sambar'],
  'poha': ['poha', 'flattened rice'],
  'egg-bhurji': ['scrambled eggs', 'bhurji'],
  'masala-chai': ['masala chai', 'chai', 'tea cup'],
  'filter-coffee': ['filter coffee', 'south indian coffee'],
  'mango-lassi': ['lassi', 'mango smoothie'],
  'cold-coffee': ['iced coffee glass', 'cold coffee drink'],
  'fresh-lime-soda': ['lime soda', 'lemonade glass'],
  'gulab-jamun': ['gulab jamun', 'gulab jamun dessert'],
  'rasmalai': ['rasmalai', 'ras malai'],
  'brownie-ice-cream': ['brownie ice cream', 'chocolate brownie'],
  'chefs-special-thali': ['indian thali', 'thali meal'],
  'weekend-brunch-platter': ['brunch platter', 'breakfast platter'],
};

const force = process.argv.includes('--force');

const searchCommons = async (term) => {
  const url = 'https://commons.wikimedia.org/w/api.php?action=query&generator=search'
    + '&gsrsearch=' + encodeURIComponent('filetype:bitmap ' + term)
    + '&gsrlimit=3&gsrnamespace=6&prop=imageinfo&iiprop=url&iiurlwidth=900&format=json';
  const res = await fetch(url, { headers: { 'User-Agent': 'LittleWindowCafe/1.0 (menu images)' } });
  if (!res.ok) return null;
  const data = await res.json();
  const pages = Object.values(data?.query?.pages || {});
  pages.sort((a, b) => (a.index || 0) - (b.index || 0));
  for (const page of pages) {
    const src = page?.imageinfo?.[0]?.thumburl;
    if (src) return src;
  }
  return null;
};

const main = async () => {
  await mkdir(outDir, { recursive: true });
  const results = { downloaded: [], skipped: [], failed: [] };

  for (const [slug, terms] of Object.entries(MEDIA)) {
    const target = path.join(outDir, `${slug}.jpg`);
    if (!force) {
      try {
        const info = await stat(target);
        if (info.size > 8000) {
          results.skipped.push(slug);
          continue;
        }
      } catch { /* not downloaded yet */ }
    }

    let saved = false;
    for (const term of terms) {
      try {
        const src = await searchCommons(term);
        if (!src) continue;
        const img = await fetch(src, { headers: { 'User-Agent': 'LittleWindowCafe/1.0 (menu images)' } });
        if (!img.ok) continue;
        const buf = Buffer.from(await img.arrayBuffer());
        if (buf.length < 8000) continue;
        await writeFile(target, buf);
        results.downloaded.push(`${slug} (${Math.round(buf.length / 1024)} kB)`);
        saved = true;
        break;
      } catch (error) {
        // try the next search term
      }
    }
    if (!saved) results.failed.push(slug);
  }

  console.log(JSON.stringify(results, null, 2));
};

main();
