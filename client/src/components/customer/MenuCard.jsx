import { useState } from 'react';
import { Check, Clock3, Plus, SlidersHorizontal } from 'lucide-react';
import { formatINR } from '../../utils/formatters';

const FOOD_SHEET = '/images/cafe-food-montage.png';

function getFoodPosition(item) {
  const name = `${item.name || ''} ${item.category?.name || ''}`.toLowerCase();
  if (/dessert|brownie|cake|sweet|ice cream|jamun|rasmalai/.test(name)) return '100% 100%';
  if (/drink|beverage|coffee|tea|lassi|juice|soda|shake/.test(name)) return '0% 100%';
  if (/breakfast|dosa|idli|poha|snack|samosa|fries|roll|pakora/.test(name)) return '100% 0%';
  return '0% 0%';
}

const MenuCard = ({ item, onSelect, onQuickAdd }) => {
  const [photoFailed, setPhotoFailed] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const hasCustomizations = Boolean(item.sizes?.length || item.addons?.length);
  const isOutOfStock = !item.isAvailable;
  const uploadedImage = item.image && !photoFailed;
  const fallbackPosition = getFoodPosition(item);

  const addItem = () => {
    if (hasCustomizations) {
      onSelect(item);
      return;
    }
    onQuickAdd(item);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1000);
  };

  return (
    <article className={`order-food-card ${isOutOfStock ? 'is-unavailable' : ''}`}>
      <button className="order-food-photo-button" type="button" onClick={() => onSelect(item)} aria-label={`View ${item.name}`}>
        {uploadedImage ? (
          <img className="order-food-photo" src={item.image} alt={item.name} loading="lazy" onError={() => setPhotoFailed(true)} />
        ) : (
          <span className="order-food-photo order-food-photo-sheet" role="img" aria-label={item.name} style={{ backgroundImage: `url(${FOOD_SHEET})`, backgroundPosition: fallbackPosition }} />
        )}
        <span className={`order-food-diet ${item.isVeg ? 'is-veg' : 'is-nonveg'}`} title={item.isVeg ? 'Vegetarian' : 'Contains meat'}><i />{item.isVeg ? 'Veg' : 'Non-veg'}</span>
        {item.discountPercent > 0 && <span className="order-food-discount">{item.discountPercent}% off</span>}
        {isOutOfStock && <span className="order-food-soldout">Sold out</span>}
      </button>
      <div className="order-food-copy">
        <div className="order-food-title-row">
          <button type="button" className="order-food-title" onClick={() => onSelect(item)}>{item.name}</button>
          {item.prepTime > 0 && <span className="order-prep-time"><Clock3 size={13} />{item.prepTime} min</span>}
        </div>
        <p>{item.description || 'Freshly prepared in our café kitchen.'}</p>
        <div className="order-food-bottom">
          <strong>{formatINR(item.price)}</strong>
          <button type="button" className={`order-add-button ${justAdded ? 'is-added' : ''}`} onClick={addItem} disabled={isOutOfStock} aria-label={justAdded ? `${item.name} added` : `${hasCustomizations ? 'Customize' : 'Add'} ${item.name}`}>
            {justAdded ? <Check size={16} /> : hasCustomizations ? <SlidersHorizontal size={15} /> : <Plus size={17} />}
            <span>{justAdded ? 'Added' : hasCustomizations ? 'Options' : 'Add'}</span>
          </button>
        </div>
      </div>
    </article>
  );
};

export default MenuCard;
