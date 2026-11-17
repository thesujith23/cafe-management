import { Leaf } from 'lucide-react';

const CategoryNav = ({
  categories = [],
  selectedCategory,
  onSelectCategory,
  vegOnly,
  onToggleVegOnly,
}) => {
  return (
    <div className="order-category-bar">
      <div className="order-category-scroll" role="tablist" aria-label="Menu categories">
        <button type="button" role="tab" aria-selected={selectedCategory === 'all'} className={selectedCategory === 'all' ? 'is-active' : ''} onClick={() => onSelectCategory('all')}>Everything</button>
        {categories.map((cat) => <button type="button" role="tab" aria-selected={selectedCategory === cat._id} className={selectedCategory === cat._id ? 'is-active' : ''} key={cat._id} onClick={() => onSelectCategory(cat._id)}>{cat.name}</button>)}
      </div>
      <button type="button" className={`order-veg-filter ${vegOnly ? 'is-active' : ''}`} aria-pressed={vegOnly} onClick={onToggleVegOnly}><Leaf size={15} /><span>Vegetarian</span></button>
    </div>
  );
};

export default CategoryNav;
