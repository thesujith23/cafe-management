import { useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { formatINR } from '../../utils/formatters';
import { X, Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';

const CartDrawer = ({ isOpen, onClose, onProceedToPayment }) => {
  const {
    items,
    tableInfo,
    updateQuantity,
    clearCart,
    customerNotes,
    setCustomerNotes,
    subtotal,
    taxDetails,
    totalAmount,
    itemCount,
  } = useCart();

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end font-futura guest-cart-overlay" role="dialog" aria-modal="true" aria-label="Your order">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-space_indigo-100/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-lavender_blush-900 h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200 border-l border-thistle-700 guest-cart-panel">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-thistle-700 bg-white/95 backdrop-blur-md guest-cart-header">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-thistle-900 border border-thistle-700 flex items-center justify-center text-space_indigo shadow-2xs">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-tenez font-bold text-space_indigo text-lg leading-none">
                Your Order {tableInfo?.displayName ? `• ${tableInfo.displayName}` : ''}
              </h3>
              <p className="text-xs text-space_indigo-400 mt-1 font-aleo">
                {itemCount} {itemCount === 1 ? 'item' : 'items'} selected
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {items.length > 0 && (
              <button
                onClick={clearCart}
                title="Clear Cart"
                className="p-2 text-space_indigo-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-space_indigo-400 hover:text-space_indigo rounded-xl hover:bg-thistle-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-space_indigo-400">
              <div className="w-16 h-16 rounded-2xl bg-thistle-900 border border-thistle-700 flex items-center justify-center mb-3 text-dusty_mauve shadow-2xs">
                <ShoppingBag className="w-8 h-8 stroke-1" />
              </div>
              <p className="font-tenez text-space_indigo text-lg">Your cart is empty</p>
              <p className="text-xs text-space_indigo-400 mt-1 max-w-xs font-aleo">
                Explore our signature café dishes & reserve your favorites for table service.
              </p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.cartKey}
                className="p-3.5 rounded-2xl border border-thistle-700 bg-white hover:border-dusty_mauve transition-all shadow-2xs space-y-2.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <span
                      className={`mt-1 w-3.5 h-3.5 rounded-xs border flex items-center justify-center p-0.5 shrink-0 ${
                        item.isVeg ? 'border-emerald-600 bg-emerald-50' : 'border-rose-600 bg-rose-50'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          item.isVeg ? 'bg-emerald-600' : 'bg-rose-600'
                        }`}
                      />
                    </span>
                    <div>
                      <h4 className="font-tenez font-bold text-space_indigo text-sm leading-snug">
                        {item.name}
                      </h4>
                      {item.selectedSize && (
                        <span className="inline-block mt-1 text-[11px] font-semibold text-space_indigo bg-thistle-900 px-2 py-0.5 rounded-md border border-thistle-700 font-futura">
                          Size: {item.selectedSize.name}
                        </span>
                      )}
                      {item.selectedAddons && item.selectedAddons.length > 0 && (
                        <div className="text-[11px] text-space_indigo-400 mt-1 font-aleo">
                          + {item.selectedAddons.map((a) => a.name).join(', ')}
                        </div>
                      )}
                      {item.specialInstructions && (
                        <div className="text-[11px] italic text-dusty_mauve mt-1 bg-thistle-900 px-2 py-0.5 rounded border border-thistle-700">
                          Note: "{item.specialInstructions}"
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-extrabold text-sm text-space_indigo font-futura">
                      {formatINR(item.itemTotal)}
                    </div>
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center justify-between pt-2 border-t border-thistle-800">
                  <span className="text-[11px] text-space_indigo-400 font-aleo">
                    {formatINR(item.unitPrice)} each
                  </span>
                  <div className="flex items-center border border-thistle-700 rounded-xl overflow-hidden bg-thistle-900 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.cartKey, item.quantity - 1)}
                      className="px-2.5 py-1 text-space_indigo-400 hover:bg-thistle-800 hover:text-space_indigo active:scale-90 transition-all cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 py-0.5 text-xs font-bold text-space_indigo min-w-6 text-center font-futura">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.cartKey, item.quantity + 1)}
                      className="px-2.5 py-1 text-space_indigo-400 hover:bg-thistle-800 hover:text-space_indigo active:scale-90 transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer with Notes & Bill Breakdown */}
        {items.length > 0 && (
          <div className="p-5 border-t border-thistle-700 bg-white/95 backdrop-blur-md space-y-3.5 guest-cart-footer">
            {/* Dietary notes */}
            <div>
              <input
                type="text"
                placeholder="Special cooking notes or dietary preferences..."
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-thistle-700 bg-lavender_blush-900 text-space_indigo placeholder:text-space_indigo-400 focus:outline-hidden focus:border-dusty_mauve focus:ring-2 focus:ring-dusty_mauve/20 transition-all"
              />
            </div>

            {/* Bill breakdown */}
            <div className="space-y-1.5 text-xs text-space_indigo-400 pt-1 font-aleo">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-space_indigo font-futura">{formatINR(subtotal)}</span>
              </div>
              <div className="flex justify-between text-space_indigo-400">
                <span>CGST (2.5%)</span>
                <span className="font-futura">{formatINR(taxDetails.cgst)}</span>
              </div>
              <div className="flex justify-between text-space_indigo-400">
                <span>SGST (2.5%)</span>
                <span className="font-futura">{formatINR(taxDetails.sgst)}</span>
              </div>
              <div className="flex justify-between text-space_indigo-400">
                <span>Service Charge (5%)</span>
                <span className="font-futura">{formatINR(taxDetails.serviceCharge)}</span>
              </div>
              <div className="flex justify-between pt-2.5 border-t border-thistle-700 text-sm font-bold text-space_indigo">
                <span className="font-tenez text-base">Total Payable</span>
                <span className="font-futura text-dusty_mauve text-base font-extrabold">{formatINR(totalAmount)}</span>
              </div>
            </div>

            {/* Proceed to checkout */}
            <button
              type="button"
              onClick={onProceedToPayment}
              className="guest-place-order"
              aria-label={`Review and place order for ${formatINR(totalAmount)}`}
            >
              <span className="flex items-center justify-between w-full">
                <span>Review & Place Order</span>
                <span className="bg-[#ffd3c7] px-2.5 py-0.5 rounded-lg text-xs font-black text-[#2f4a3a]">
                  {formatINR(totalAmount)}
                </span>
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartDrawer;
