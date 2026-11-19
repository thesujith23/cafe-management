import { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { formatINR } from '../../utils/formatters';
import { Plus, Minus, Check, Clock } from 'lucide-react';

const ItemDetailModal = ({ isOpen, onClose, item, onAddToCart }) => {
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [quantity, setQuantity] = useState(1);

  // Initialize defaults on item change
  useEffect(() => {
    if (item) {
      const defaultSize = item.sizes?.find((s) => s.isDefault) || item.sizes?.[0] || null;
      setSelectedSize(defaultSize);
      setSelectedAddons([]);
      setSpecialInstructions('');
      setQuantity(1);
    }
  }, [item]);

  if (!item) return null;

  // Toggle addon checkbox
  const handleToggleAddon = (addon) => {
    setSelectedAddons((prev) => {
      const exists = prev.some((a) => (a._id || a.name) === (addon._id || addon.name));
      if (exists) {
        return prev.filter((a) => (a._id || a.name) !== (addon._id || addon.name));
      }
      return [...prev, addon];
    });
  };

  // Price calculation
  const basePrice = selectedSize ? selectedSize.price : item.price;
  const addonsTotal = selectedAddons.reduce((sum, a) => sum + (a.price || 0), 0);
  const unitPrice = basePrice + addonsTotal;
  const discountMultiplier = (100 - (item.discountPercent || 0)) / 100;
  const totalPrice = Math.round(unitPrice * quantity * discountMultiplier * 100) / 100;

  const handleAdd = () => {
    onAddToCart(item, {
      size: selectedSize,
      addons: selectedAddons,
      specialInstructions,
      quantity,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={item.name} maxWidth="max-w-md" className="guest-checkout-modal guest-item-modal">
      <div className="space-y-5 font-futura guest-checkout-content guest-item-content">
        {/* Item Header & Veg icon */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`w-4 h-4 rounded-xs border flex items-center justify-center p-0.5 ${
                  item.isVeg ? 'border-emerald-600 bg-emerald-50' : 'border-rose-600 bg-rose-50'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    item.isVeg ? 'bg-emerald-600' : 'bg-rose-600'
                  }`}
                />
              </span>
              <span className="text-xs font-semibold text-space_indigo-400 font-aleo">
                {item.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
              </span>
              {item.prepTime && (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-space_indigo bg-thistle-900 px-2 py-0.5 rounded-full border border-thistle-700 font-aleo">
                  <Clock className="w-3 h-3 text-dusty_mauve" />
                  ~{item.prepTime} mins
                </span>
              )}
            </div>
            <p className="text-xs text-space_indigo-400 leading-relaxed font-aleo">
              {item.description}
            </p>
          </div>
          <div className="text-right shrink-0">
            <div className="text-xl font-extrabold text-space_indigo font-futura">
              {formatINR(item.price)}
            </div>
            {item.discountPercent > 0 && (
              <span className="text-[11px] font-bold text-space_indigo bg-thistle-800 px-2 py-0.5 rounded-md border border-thistle-600">
                {item.discountPercent}% OFF
              </span>
            )}
          </div>
        </div>

        {/* Sizes section if available */}
        {item.sizes && item.sizes.length > 0 && (
          <div className="space-y-2 pt-3 border-t border-thistle-700">
            <label className="text-xs font-bold uppercase tracking-wider text-space_indigo font-aleo">
              Select Portion / Size
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {item.sizes.map((size) => {
                const isSelected = selectedSize?._id === size._id || selectedSize?.name === size.name;
                return (
                  <button
                    key={size._id || size.name}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={`flex items-center justify-between p-3 rounded-2xl border text-sm font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'border-dusty_mauve bg-thistle-900 text-space_indigo font-bold shadow-2xs ring-1 ring-dusty_mauve'
                        : 'border-thistle-700 bg-white hover:border-dusty_mauve text-space_indigo-400'
                    }`}
                  >
                    <span className="font-aleo text-xs">{size.name}</span>
                    <span className="text-xs font-bold text-space_indigo font-futura">{formatINR(size.price)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Add-ons section if available */}
        {item.addons && item.addons.length > 0 && (
          <div className="space-y-2 pt-3 border-t border-thistle-700">
            <label className="text-xs font-bold uppercase tracking-wider text-space_indigo font-aleo">
              Gourmet Add-ons
            </label>
            <div className="space-y-2">
              {item.addons.map((addon) => {
                const isChecked = selectedAddons.some(
                  (a) => (a._id || a.name) === (addon._id || addon.name)
                );
                return (
                  <div
                    key={addon._id || addon.name}
                    onClick={() => handleToggleAddon(addon)}
                    className={`flex items-center justify-between p-2.5 rounded-2xl border text-sm cursor-pointer transition-all ${
                      isChecked
                        ? 'border-dusty_mauve bg-thistle-900 text-space_indigo font-medium'
                        : 'border-thistle-700 bg-white hover:border-thistle-600 text-space_indigo-400'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                          isChecked
                            ? 'bg-space_indigo border-space_indigo text-white'
                            : 'border-thistle-600 bg-white'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className="font-aleo text-xs text-space_indigo">{addon.name}</span>
                    </div>
                    <span className="text-xs font-bold text-space_indigo font-futura">
                      +{formatINR(addon.price)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Special Instructions */}
        <div className="space-y-1.5 pt-3 border-t border-thistle-700">
          <label className="text-xs font-bold uppercase tracking-wider text-space_indigo font-aleo">
            Special Instructions
          </label>
          <input
            type="text"
            placeholder="e.g., Less spicy, no onions, extra ice..."
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-thistle-700 bg-lavender_blush-900 text-xs text-space_indigo focus:outline-hidden focus:border-dusty_mauve focus:ring-2 focus:ring-dusty_mauve/20 placeholder:text-space_indigo-400 transition-all"
          />
        </div>

        {/* Quantity Controls & Add to Cart button */}
        <div className="flex items-center gap-3 pt-3 border-t border-thistle-700">
          <div className="flex items-center border border-thistle-700 rounded-xl overflow-hidden bg-thistle-900 shadow-2xs">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="px-3 py-2 text-space_indigo-400 hover:bg-thistle-800 hover:text-space_indigo active:scale-90 transition-all cursor-pointer"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="px-3 py-2 text-xs font-bold text-space_indigo min-w-8 text-center font-futura">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              className="px-3 py-2 text-space_indigo-400 hover:bg-thistle-800 hover:text-space_indigo active:scale-90 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleAdd}
            className="item-add-button"
            aria-label={`Add ${item.name} to order for ${formatINR(totalPrice)}`}
          >
            <span>Add to Order</span>
            <span className="sr-only">, {formatINR(totalPrice)}</span>
            <span aria-hidden="true">{formatINR(totalPrice)}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ItemDetailModal;
