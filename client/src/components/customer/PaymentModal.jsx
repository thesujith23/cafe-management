import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../common/Modal';
import { orderApi, paymentApi } from '../../api/apiServices';
import { useCart } from '../../context/CartContext';
import { formatINR } from '../../utils/formatters';
import { CreditCard, ShieldCheck, Sparkles, Loader2 } from 'lucide-react';
import { DEMO_MODE } from '../../utils/demoMode';

const PaymentModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const {
    token,
    items,
    tableInfo,
    customerNotes,
    customerInfo,
    taxAmount,
    totalAmount,
    clearCart,
  } = useCart();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  // Process checkout with Razorpay or Sandbox simulation
  const handlePay = async (simulate = true) => {
    try {
      setLoading(true);
      setError('');

      // Step 1: Create Order in DB
      const orderPayload = {
        items: items.map((i) => ({
          menuItemId: i.menuItemId,
          name: i.name,
          quantity: i.quantity,
          selectedSizeId: i.selectedSizeId,
          selectedAddonIds: i.selectedAddonIds,
          specialInstructions: i.specialInstructions,
        })),
        customerNotes,
        customerName: customerInfo?.name || '',
        customerPhone: customerInfo?.phone || '',
      };

      const orderRes = await orderApi.createOrder(token, orderPayload);
      const createdOrder = orderRes.data?.order || orderRes.data || orderRes.order;
      if (!orderRes.success || !createdOrder?._id) {
        throw new Error(orderRes.message || 'Failed to initialize order');
      }

      // Step 2: Create Payment Order
      const paymentRes = await paymentApi.createPaymentOrder(createdOrder._id, token);
      if (!paymentRes.success || !paymentRes.data) {
        throw new Error(paymentRes.message || 'Failed to initialize payment');
      }

      const { razorpayOrderId, isDemo, keyId } = paymentRes.data;

      // Step 3: Handle Verification
      // If demo mode or simulation requested or no valid Razorpay key:
      if (simulate || isDemo || !window.Razorpay) {
        const verifyRes = await paymentApi.verifyPayment({
          razorpay_order_id: razorpayOrderId,
          razorpay_payment_id: `pay_demo_${Date.now()}`,
          razorpay_signature: 'demo_signature',
          tableToken: token,
        });

        if (verifyRes.success) {
          clearCart();
          onClose();
          navigate(`/track/${token}?orderId=${createdOrder._id}`);
          return;
        }
      }

      // If live Razorpay checkout is configured and available in window:
      if (window.Razorpay && keyId && !isDemo) {
        const options = {
          key: keyId,
          amount: Math.round(totalAmount * 100),
          currency: 'INR',
          name: 'Little Window Café',
          description: createdOrder.orderNumber
            ? `Order ${createdOrder.orderNumber}`
            : 'Table order',
          order_id: razorpayOrderId,
          handler: async (response) => {
            try {
              const verifyRes = await paymentApi.verifyPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                tableToken: token,
              });

              if (verifyRes.success) {
                clearCart();
                onClose();
                navigate(`/track/${token}?orderId=${createdOrder._id}`);
              }
            } catch (err) {
              setError(err.message || 'Verification failed');
            }
          },
          prefill: {
            name: customerInfo?.name || `Table Guest (${tableInfo?.displayName || 'Table'})`,
            contact: customerInfo?.phone || '9999999999',
          },
          theme: {
            color: '#ff9277',
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      }
    } catch (err) {
      setError(err.message || 'Payment processing failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirm & pay" maxWidth="max-w-md" className="guest-checkout-modal">
      <div className="space-y-4 font-futura guest-checkout-content">
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Order Summary Box */}
        <div className="p-4 rounded-2xl bg-lavender_blush-900 border border-thistle-700 space-y-2.5 guest-checkout-summary">
          <div className="flex items-center justify-between text-xs font-aleo text-space_indigo font-bold uppercase tracking-wider">
            <span>Dining Table</span>
            <span className="text-space_indigo font-futura font-bold">{tableInfo?.displayName || 'Dine-In'}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-space_indigo-400 font-aleo">
            <span>Items Selected</span>
            <span className="text-space_indigo font-futura font-semibold">{items.length} {items.length === 1 ? 'dish' : 'dishes'}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-space_indigo-400 font-aleo">
            <span>Taxes & Service Charge</span>
            <span className="text-space_indigo font-futura font-semibold">{formatINR(taxAmount)}</span>
          </div>
          <div className="flex items-center justify-between pt-2.5 border-t border-thistle-700 text-base font-bold text-space_indigo">
            <span className="font-tenez text-lg">Total Payable</span>
            <span className="font-futura text-dusty_mauve text-lg font-extrabold">{formatINR(totalAmount)}</span>
          </div>
        </div>

        {/* Security badge */}
        <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 text-emerald-900 text-xs font-aleo guest-checkout-security">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Secure payment by Razorpay — UPI, cards, netbanking</span>
        </div>

        {/* Payment CTA Buttons */}
        <div className="space-y-3 pt-2 guest-checkout-actions">
          {window.Razorpay && (
            <button
              type="button"
              disabled={loading}
              onClick={() => handlePay(false)}
              className="guest-pay-online"
              aria-label={loading ? 'Processing payment…' : `Pay ${formatINR(totalAmount)} online`}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CreditCard className="w-4 h-4" />
              )}
              <span>Pay {formatINR(totalAmount)} Online</span>
            </button>
          )}

          {DEMO_MODE && (
            <button
              type="button"
              disabled={loading}
              onClick={() => handlePay(true)}
              className="guest-pay-demo"
              aria-label={loading ? 'Sending order…' : `Pay ${formatINR(totalAmount)} instantly (demo)`}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sending your order…</span>
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span>Pay instantly — demo ({formatINR(totalAmount)})</span>
                </span>
              )}
            </button>
          )}

          {!window.Razorpay && !DEMO_MODE && (
            <p className="text-xs text-center text-space_indigo-400 font-aleo px-2">
              Online payment isn’t available right now. Please place the order with a team member at the counter.
            </p>
          )}

          <p className="text-[11px] text-center text-space_indigo-400 font-aleo pt-1">
            Your order goes to the kitchen as soon as the payment clears.
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default PaymentModal;
