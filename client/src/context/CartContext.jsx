import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [tableInfo, setTableInfo] = useState(null);
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '', guests: 1 });
  const [items, setItems] = useState([]);
  const [customerNotes, setCustomerNotes] = useState('');

  // Load cart and customer info from storage when token changes
  useEffect(() => {
    if (!token) return;
    try {
      const saved = localStorage.getItem(`cafe_cart_${token}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        setItems(parsed.items || []);
        setCustomerNotes(parsed.customerNotes || '');
      } else {
        setItems([]);
        setCustomerNotes('');
      }

      // Name and phone last for the visit only: sessionStorage clears when the tab
      // closes, so a borrowed phone or a shared tablet does not keep a guest's contact.
      const savedCust = sessionStorage.getItem(`cafe_customer_${token}`);
      if (savedCust) {
        setCustomerInfo(JSON.parse(savedCust));
      }
    } catch {
      setItems([]);
    }
  }, [token]);

  // Persist guest contact for this visit only
  useEffect(() => {
    if (!token || !customerInfo.name) return;
    try {
      sessionStorage.setItem(`cafe_customer_${token}`, JSON.stringify(customerInfo));
    } catch {
      // Storage unavailable fallback
    }
  }, [token, customerInfo]);

  // Persist cart to storage on change
  useEffect(() => {
    if (!token) return;
    try {
      localStorage.setItem(
        `cafe_cart_${token}`,
        JSON.stringify({ items, customerNotes })
      );
    } catch {
      // Storage unavailable fallback
    }
  }, [token, items, customerNotes]);

  // Add item with size and addons options
  const addItem = (menuItem, options = {}) => {
    const selectedSize = options.size || null;
    const selectedAddons = options.addons || [];
    const specialInstructions = options.specialInstructions || '';
    const quantity = options.quantity || 1;

    const unitPrice = selectedSize ? selectedSize.price : menuItem.price;
    const addonsTotal = selectedAddons.reduce((sum, a) => sum + (a.price || 0), 0);
    const itemUnitPrice = unitPrice + addonsTotal;

    // Apply item level discount if any
    const discountMultiplier = (100 - (menuItem.discountPercent || 0)) / 100;
    const discountedItemTotal = Math.round(itemUnitPrice * quantity * discountMultiplier * 100) / 100;

    const cartKey = `${menuItem._id}_${selectedSize?.name || 'base'}_${selectedAddons.map(a => a._id || a.name).sort().join('-')}_${specialInstructions}`;

    setItems((prev) => {
      const existingIdx = prev.findIndex((i) => i.cartKey === cartKey);
      if (existingIdx > -1) {
        const updated = [...prev];
        const newQty = updated[existingIdx].quantity + quantity;
        updated[existingIdx].quantity = newQty;
        updated[existingIdx].discountPercent = menuItem.discountPercent || 0;
        updated[existingIdx].itemTotal = Math.round(itemUnitPrice * newQty * discountMultiplier * 100) / 100;
        return updated;
      }

      return [
        ...prev,
        {
          cartKey,
          menuItemId: menuItem._id,
          name: menuItem.name,
          unitPrice,
          quantity,
          discountPercent: menuItem.discountPercent || 0,
          selectedSizeId: selectedSize?._id,
          selectedSize: selectedSize ? { name: selectedSize.name, price: selectedSize.price } : null,
          selectedAddonIds: selectedAddons.map(a => a._id).filter(Boolean),
          selectedAddons: selectedAddons.map(a => ({ name: a.name, price: a.price })),
          specialInstructions,
          itemTotal: discountedItemTotal,
          isVeg: menuItem.isVeg,
          prepTime: menuItem.prepTime || 15,
        },
      ];
    });
  };

  const updateQuantity = (cartKey, newQty) => {
    if (newQty <= 0) {
      removeItem(cartKey);
      return;
    }

    setItems((prev) =>
      prev.map((item) => {
        if (item.cartKey === cartKey) {
          const addonsTotal = (item.selectedAddons || []).reduce((sum, a) => sum + (a.price || 0), 0);
          const itemUnitPrice = item.unitPrice + addonsTotal;
          const discountMultiplier = (100 - (item.discountPercent || 0)) / 100;
          const discountedTotal = Math.round(itemUnitPrice * newQty * discountMultiplier * 100) / 100;
          return {
            ...item,
            quantity: newQty,
            itemTotal: discountedTotal,
          };
        }
        return item;
      })
    );
  };

  const removeItem = (cartKey) => {
    setItems((prev) => prev.filter((item) => item.cartKey !== cartKey));
  };

  const clearCart = () => {
    setItems([]);
    setCustomerNotes('');
    if (token) {
      localStorage.removeItem(`cafe_cart_${token}`);
    }
  };

  // Calculations
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = Math.round(items.reduce((sum, i) => sum + i.itemTotal, 0) * 100) / 100;

  // 2.5% CGST + 2.5% SGST + 5% Service Charge
  const cgst = Math.round(subtotal * 0.025 * 100) / 100;
  const sgst = Math.round(subtotal * 0.025 * 100) / 100;
  const serviceCharge = Math.round(subtotal * 0.05 * 100) / 100;
  const taxAmount = Math.round((cgst + sgst + serviceCharge) * 100) / 100;
  const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;

  return (
    <CartContext.Provider
      value={{
        token,
        setToken,
        tableInfo,
        setTableInfo,
        customerInfo,
        setCustomerInfo,
        items,
        customerNotes,
        setCustomerNotes,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        itemCount,
        subtotal,
        taxDetails: { cgst, sgst, serviceCharge },
        taxAmount,
        totalAmount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
