import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  CreditCard,
  DollarSign,
  MapPin,
  Home,
  Building,
  ChevronRight,
  Lock,
  Zap,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import type { CartItem } from './CartPage';
import type { AuthUser } from './LoginModal';
import { saveOrderToStorage, type Order } from './OrdersModal';
import { API_URL } from '../api';

type Props = {
  items: CartItem[];
  user: AuthUser;
  total: number;
  subtotal: number;
  discount: number;
  shipping: number;
  couponCode?: string;
  onBack: () => void;
  onOrderSuccess: () => void;
  onClearCart?: () => void;
  onOpenOrders?: () => void;
};

type AddressForm = {
  fullName: string;
  email: string;
  phone: string;
  street: string;
  district: string;
  city: string;
  state: string;
  pinCode: string;
  addressType: 'Home' | 'Office';
};

// Helper to ensure Razorpay checkout.js script is loaded
const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function CheckoutPage({
  items,
  user,
  total,
  subtotal,
  discount,
  shipping,
  couponCode,
  onBack,
  onOrderSuccess,
  onClearCart,
  onOpenOrders,
}: Props) {
  const [address, setAddress] = useState<AddressForm>({
    fullName: user.name && user.name !== 'Guest' ? user.name : '',
    email: user.identifier && user.identifier.includes('@') ? user.identifier : '',
    phone: '',
    street: '',
    district: '',
    city: '',
    state: '',
    pinCode: '',
    addressType: 'Home',
  });

  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay');
  const [errors, setErrors] = useState<Partial<Record<keyof AddressForm | string, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isAuthErrorNotice, setIsAuthErrorNotice] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

  const [shippingFee, setShippingFee] = useState<number>(shipping);
  const [currentTotal, setCurrentTotal] = useState<number>(total);
  const [deliveryDays, setDeliveryDays] = useState<string>('');

  useEffect(() => {
    fetch(`${API_URL}/settings?t=${Date.now()}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          const fee = data.shipping_fee !== undefined && data.shipping_fee !== null ? Number(data.shipping_fee) : shipping;
          const thresh = data.free_shipping_threshold !== undefined && data.free_shipping_threshold !== null ? Number(data.free_shipping_threshold) : 999;
          const freeEnabled = Boolean(data.free_shipping_enabled);
          const isFree = freeEnabled && subtotal >= thresh;
          const finalShipping = isFree ? 0 : fee;
          setShippingFee(finalShipping);
          setCurrentTotal(Math.max(0, subtotal - discount + finalShipping));
          if (data.estimated_delivery_days) {
            setDeliveryDays(data.estimated_delivery_days);
          }
        }
      })
      .catch(() => {});
  }, [subtotal, discount, shipping]);

  const validate = () => {
    const errs: Partial<Record<string, string>> = {};
    if (!address.fullName.trim()) errs.fullName = 'Full Name is required.';
    if (!address.email.trim()) {
      errs.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address.email.trim())) {
      errs.email = 'Enter a valid email address.';
    }
    if (!address.phone.trim()) errs.phone = 'Phone number is required.';
    if (!address.street.trim()) errs.street = 'Street address is required.';
    if (!address.district.trim()) errs.district = 'District is required.';
    if (!address.city.trim()) errs.city = 'City is required.';
    if (!address.state.trim()) errs.state = 'State / Region is required.';
    if (!address.pinCode.trim()) errs.pinCode = 'Pin Code is required.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Complete and finalize the order in state & localStorage
  const finalizeOrder = (
    method: 'razorpay' | 'cod',
    paymentId?: string,
    existingOrderNumber?: string
  ) => {
    const formattedAddress = `${address.street}, ${address.district}, ${address.city}, ${address.state} - ${address.pinCode} (${address.addressType})`.trim();

    const orderNumber = existingOrderNumber || `#HJ-${Math.floor(10000 + Math.random() * 90000)}`;

    const newOrder: Order = {
      id: orderNumber,
      date: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      totalAmount: currentTotal,
      status: 'Processing',
      shippingAddress: formattedAddress,
      paymentMethod: method === 'razorpay' ? 'Razorpay Online' : 'Cash on Delivery',
      paymentId: paymentId,
      items: items.map((item) => ({
        productId: item.productId,
        name: item.name,
        subtitle: item.subtitle,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
      })),
    };

    // Save locally for the current user
    saveOrderToStorage(newOrder, user.uid);

    if (onClearCart) onClearCart();
    setIsSubmitting(false);
    setPlacedOrder(newOrder);
  };

  // Process payment with Razorpay
  const handleRazorpayPayment = async (simulate = false) => {
    setPaymentError(null);
    setIsAuthErrorNotice(false);

    const formattedAddress = `${address.street}, ${address.district}, ${address.city}, ${address.state} - ${address.pinCode} (${address.addressType})`.trim();
    const orderNumber = `#HJ-${Math.floor(10000 + Math.random() * 90000)}`;

    try {
      // 1. Create order on backend
      const res = await fetch(`${API_URL}/payment/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_number: orderNumber,
          user_uid: user.uid,
          customer_name: address.fullName,
          customer_email: address.email,
          customer_phone: address.phone,
          shipping_address: formattedAddress,
          address_type: address.addressType,
          total_amount: currentTotal,
          subtotal: subtotal,
          discount: discount,
          shipping_fee: shippingFee,
          coupon_code: couponCode,
          simulate: simulate,
          items: items.map((item) => ({
            productId: item.productId,
            name: item.name,
            subtitle: item.subtitle,
            price: item.price,
            quantity: item.quantity,
            image: item.image,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setIsSubmitting(false);
        setPaymentError(data.message || 'Failed to initialize payment gateway.');
        if (data.is_auth_error) {
          setIsAuthErrorNotice(true);
        }
        return;
      }

      // Handle Dev Sandbox Simulation
      if (data.simulated) {
        // Complete mock verification
        const simPayId = 'sim_pay_' + Math.random().toString(36).substring(2, 12);
        const verifyRes = await fetch(`${API_URL}/payment/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            razorpay_order_id: data.razorpay_order_id,
            razorpay_payment_id: simPayId,
            razorpay_signature: 'sim_signature_dev',
            order_number: orderNumber,
            coupon_code: couponCode,
          }),
        });
        const verifyData = await verifyRes.json();
        if (verifyData.success) {
          finalizeOrder('razorpay', simPayId, orderNumber);
        } else {
          setPaymentError(verifyData.message || 'Simulation verification failed');
          setIsSubmitting(false);
        }
        return;
      }

      // 2. Ensure Razorpay SDK is loaded
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded || !(window as any).Razorpay) {
        setIsSubmitting(false);
        setPaymentError('Razorpay SDK failed to load. Please check your internet connection.');
        return;
      }

      // 3. Launch official Razorpay Checkout modal
      const options = {
        key: data.razorpay_key,
        amount: data.amount,
        currency: data.currency || 'INR',
        name: 'HIJAZ Luxury Fragrances',
        description: `Order ${orderNumber}`,
        image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=200&auto=format&fit=crop',
        order_id: data.razorpay_order_id,
        prefill: {
          name: address.fullName,
          email: address.email,
          contact: address.phone,
        },
        notes: {
          order_number: orderNumber,
          address: formattedAddress,
        },
        theme: {
          color: '#7A4E2D',
          backdrop_color: 'rgba(0,0,0,0.85)',
        },
        modal: {
          ondismiss: () => {
            setIsSubmitting(false);
          },
        },
        handler: async (response: any) => {
          try {
            // Verify payment signature on backend
            const verifyRes = await fetch(`${API_URL}/payment/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                order_number: orderNumber,
                coupon_code: couponCode,
              }),
            });

            const verifyData = await verifyRes.json();

            if (verifyData.success) {
              finalizeOrder('razorpay', response.razorpay_payment_id, orderNumber);
            } else {
              setPaymentError(verifyData.message || 'Payment signature verification failed.');
              setIsSubmitting(false);
            }
          } catch (err: any) {
            console.error('Payment verification error:', err);
            setPaymentError('Payment verification request failed: ' + (err.message || 'Network error'));
            setIsSubmitting(false);
          }
        },
      };

      const rzp = new (window as any).Razorpay(options);

      rzp.on('payment.failed', (response: any) => {
        setIsSubmitting(false);
        setPaymentError(response.error?.description || 'Payment was declined or cancelled.');
      });

      rzp.open();
    } catch (err: any) {
      console.error('Checkout error:', err);
      setIsSubmitting(false);
      setPaymentError(err.message || 'An unexpected error occurred during checkout.');
    }
  };

  // Process Cash on Delivery order
  const handleCodPayment = async () => {
    setPaymentError(null);
    const formattedAddress = `${address.street}, ${address.district}, ${address.city}, ${address.state} - ${address.pinCode} (${address.addressType})`.trim();
    const orderNumber = `#HJ-${Math.floor(10000 + Math.random() * 90000)}`;

    try {
      const res = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_number: orderNumber,
          user_uid: user.uid,
          customer_name: address.fullName,
          customer_email: address.email,
          customer_phone: address.phone,
          shipping_address: formattedAddress,
          address_type: address.addressType,
          payment_method: 'cod',
          payment_status: 'pending',
          status: 'Processing',
          subtotal: subtotal,
          discount: discount,
          shipping_fee: shippingFee,
          coupon_code: couponCode,
          total_amount: currentTotal,
          items: items.map((item) => ({
            productId: item.productId,
            name: item.name,
            subtitle: item.subtitle,
            price: item.price,
            quantity: item.quantity,
            image: item.image,
          })),
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to save order to server');
      }

      finalizeOrder('cod', undefined, orderNumber);
    } catch (err: any) {
      console.error('COD order creation failed:', err);
      setPaymentError('Failed to place order. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    if (paymentMethod === 'razorpay') {
      handleRazorpayPayment(false);
    } else {
      handleCodPayment();
    }
  };

  // ─── Order Success View ──────────────────────────────────────────────────
  if (placedOrder) {
    return (
      <main
        style={{
          minHeight: '100vh',
          background: 'radial-gradient(circle at center, #150f0c 0%, #050505 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'Inter', sans-serif",
          padding: '2rem 1.5rem',
        }}
      >
        <div
          style={{
            maxWidth: '560px',
            width: '100%',
            background: 'rgba(20, 20, 20, 0.85)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(212, 175, 55, 0.25)',
            borderRadius: '24px',
            padding: '2.5rem 2rem',
            textAlign: 'center',
            boxShadow: '0 24px 80px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,255,255,0.1)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.25rem',
          }}
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #7A4E2D 0%, #d4af37 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 32px rgba(212,175,55,0.4)',
            }}
          >
            <CheckCircle2 size={46} color="white" />
          </div>

          <div>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: '#d4af37',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <Sparkles size={13} />
              Payment & Order Confirmed
            </span>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: '0.35rem 0 0.25rem', letterSpacing: '-0.02em' }}>
              Thank You For Your Order!
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
              Order ID: <strong style={{ color: 'white' }}>{placedOrder.id}</strong> — Placed on {placedOrder.date}
            </p>
          </div>

          <div
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '16px',
              padding: '1.25rem',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#d4af37', fontSize: '0.82rem', fontWeight: 700 }}>
              <MapPin size={16} />
              <span>Delivery Address</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.5, margin: 0 }}>
              <strong>{address.fullName}</strong> ({address.phone})<br />
              {placedOrder.shippingAddress}
            </p>

            <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '0.25rem 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>Payment Method</span>
              <span style={{ fontWeight: 700, color: '#86efac', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <CheckCircle2 size={13} />
                {placedOrder.paymentMethod || (paymentMethod === 'razorpay' ? 'Razorpay Online' : 'Cash on Delivery')}
              </span>
            </div>

            {placedOrder.paymentId && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>Razorpay Payment ID</span>
                <span style={{ fontFamily: 'monospace', color: '#d4af37', fontWeight: 600 }}>
                  {placedOrder.paymentId}
                </span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 800 }}>
              <span style={{ color: 'white' }}>Total Amount Paid</span>
              <span style={{ color: '#d4af37' }}>₹{placedOrder.totalAmount.toLocaleString()}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.875rem', width: '100%', marginTop: '0.5rem' }}>
            <button
              onClick={() => {
                if (onOpenOrders) onOpenOrders();
                onOrderSuccess();
              }}
              style={{
                flex: 1,
                padding: '0.875rem',
                borderRadius: '12px',
                border: '1.5px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.05)',
                color: 'white',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 200ms ease',
              }}
            >
              View My Orders
            </button>
            <button
              onClick={onOrderSuccess}
              style={{
                flex: 1,
                padding: '0.875rem',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #7A4E2D 0%, #9B6A45 100%)',
                color: 'white',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(122,78,45,0.4)',
                transition: 'all 200ms ease',
              }}
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#050505',
        color: 'white',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Header */}
      <header
        style={{
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          padding: '1.25rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(10,10,10,0.85)',
          backdropFilter: 'blur(16px)',
          position: 'sticky' as const,
          top: 0,
          zIndex: 50,
        }}
      >
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            padding: '0.5rem 1rem',
            borderRadius: '999px',
            color: 'white',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 200ms ease',
          }}
        >
          <ArrowLeft size={16} />
          Back to Cart
        </button>

        <span
          style={{
            fontSize: '0.85rem',
            fontWeight: 800,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'white',
          }}
        >
          HIJAZ · CHECKOUT
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#86efac', fontSize: '0.75rem', fontWeight: 600 }}>
          <ShieldCheck size={16} />
          <span>256-Bit SSL Secured</span>
        </div>
      </header>

      <form onSubmit={handlePlaceOrder} style={{ maxWidth: '1140px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem' }}>

          {/* Left Column: Address & Payment Selection */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            {/* Error Notification Banner */}
            {paymentError && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '16px',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <AlertCircle size={20} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700, color: '#fca5a5' }}>
                      Payment Gateway Notice
                    </h4>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.45 }}>
                      {paymentError}
                    </p>
                  </div>
                </div>

                {/* If keys are missing or invalid in local dev, provide sandbox simulation */}
                {isAuthErrorNotice && (
                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.04)',
                      borderRadius: '10px',
                      padding: '0.75rem 1rem',
                      fontSize: '0.78rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '1rem',
                      flexWrap: 'wrap',
                    }}
                  >
                    <span style={{ color: 'rgba(255,255,255,0.75)' }}>
                      Want to test checkout flow right now without active Razorpay keys?
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRazorpayPayment(true)}
                      style={{
                        padding: '0.45rem 0.85rem',
                        borderRadius: '8px',
                        border: '1px solid #d4af37',
                        background: 'rgba(212,175,55,0.15)',
                        color: '#d4af37',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      <Sparkles size={13} />
                      Simulate Test Payment
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 1. Delivery Address Section */}
            <div
              style={{
                background: 'rgba(20, 20, 20, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '20px',
                padding: '1.75rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'rgba(155,106,69,0.15)',
                    border: '1px solid rgba(155,106,69,0.3)',
                    color: '#d4af37',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MapPin size={18} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>Delivery Address</h2>
                  <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', margin: '0.15rem 0 0' }}>
                    Where should we dispatch your luxury parcel?
                  </p>
                </div>
              </div>

              {/* Address Type */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {(['Home', 'Office'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setAddress({ ...address, addressType: type })}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      padding: '0.65rem',
                      borderRadius: '10px',
                      border: address.addressType === type ? '1.5px solid #d4af37' : '1px solid rgba(255,255,255,0.1)',
                      background: address.addressType === type ? 'rgba(212,175,55,0.1)' : 'rgba(255,255,255,0.02)',
                      color: address.addressType === type ? '#d4af37' : 'rgba(255,255,255,0.6)',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 200ms ease',
                    }}
                  >
                    {type === 'Home' ? <Home size={15} /> : <Building size={15} />}
                    {type}
                  </button>
                ))}
              </div>

              {/* Full Name & Phone */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', marginBottom: '0.4rem' }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={address.fullName}
                    onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.8rem 1rem',
                      borderRadius: '10px',
                      border: errors.fullName ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.12)',
                      background: 'rgba(255,255,255,0.03)',
                      color: 'white',
                      fontSize: '0.88rem',
                      outline: 'none',
                    }}
                  />
                  {errors.fullName && <span style={{ color: '#ef4444', fontSize: '0.72rem', marginTop: '0.25rem', display: 'block' }}>{errors.fullName}</span>}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', marginBottom: '0.4rem' }}>
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={address.phone}
                    onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.8rem 1rem',
                      borderRadius: '10px',
                      border: errors.phone ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.12)',
                      background: 'rgba(255,255,255,0.03)',
                      color: 'white',
                      fontSize: '0.88rem',
                      outline: 'none',
                    }}
                  />
                  {errors.phone && <span style={{ color: '#ef4444', fontSize: '0.72rem', marginTop: '0.25rem', display: 'block' }}>{errors.phone}</span>}
                </div>
              </div>

              {/* Email */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', marginBottom: '0.4rem' }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  value={address.email}
                  onChange={(e) => setAddress({ ...address, email: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.8rem 1rem',
                    borderRadius: '10px',
                    border: errors.email ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.12)',
                    background: 'rgba(255,255,255,0.03)',
                    color: 'white',
                    fontSize: '0.88rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                {errors.email && <span style={{ color: '#ef4444', fontSize: '0.72rem', marginTop: '0.25rem', display: 'block' }}>{errors.email}</span>}
              </div>

              {/* Street Address */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', marginBottom: '0.4rem' }}>
                  Street Address *
                </label>
                <input
                  type="text"
                  value={address.street}
                  onChange={(e) => setAddress({ ...address, street: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.8rem 1rem',
                    borderRadius: '10px',
                    border: errors.street ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.12)',
                    background: 'rgba(255,255,255,0.03)',
                    color: 'white',
                    fontSize: '0.88rem',
                    outline: 'none',
                  }}
                />
                {errors.street && <span style={{ color: '#ef4444', fontSize: '0.72rem', marginTop: '0.25rem', display: 'block' }}>{errors.street}</span>}
              </div>

              {/* District & City */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', marginBottom: '0.4rem' }}>
                    District *
                  </label>
                  <input
                    type="text"
                    value={address.district}
                    onChange={(e) => setAddress({ ...address, district: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.8rem 1rem',
                      borderRadius: '10px',
                      border: errors.district ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.12)',
                      background: 'rgba(255,255,255,0.03)',
                      color: 'white',
                      fontSize: '0.88rem',
                      outline: 'none',
                    }}
                  />
                  {errors.district && <span style={{ color: '#ef4444', fontSize: '0.72rem', marginTop: '0.25rem', display: 'block' }}>{errors.district}</span>}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', marginBottom: '0.4rem' }}>
                    City *
                  </label>
                  <input
                    type="text"
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.8rem 1rem',
                      borderRadius: '10px',
                      border: errors.city ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.12)',
                      background: 'rgba(255,255,255,0.03)',
                      color: 'white',
                      fontSize: '0.88rem',
                      outline: 'none',
                    }}
                  />
                  {errors.city && <span style={{ color: '#ef4444', fontSize: '0.72rem', marginTop: '0.25rem', display: 'block' }}>{errors.city}</span>}
                </div>
              </div>

              {/* State & Pin Code */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', marginBottom: '0.4rem' }}>
                    State *
                  </label>
                  <input
                    type="text"
                    value={address.state}
                    onChange={(e) => setAddress({ ...address, state: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.8rem 1rem',
                      borderRadius: '10px',
                      border: errors.state ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.12)',
                      background: 'rgba(255,255,255,0.03)',
                      color: 'white',
                      fontSize: '0.88rem',
                      outline: 'none',
                    }}
                  />
                  {errors.state && <span style={{ color: '#ef4444', fontSize: '0.72rem', marginTop: '0.25rem', display: 'block' }}>{errors.state}</span>}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', marginBottom: '0.4rem' }}>
                    Pin Code *
                  </label>
                  <input
                    type="text"
                    value={address.pinCode}
                    onChange={(e) => setAddress({ ...address, pinCode: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.8rem 1rem',
                      borderRadius: '10px',
                      border: errors.pinCode ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.12)',
                      background: 'rgba(255,255,255,0.03)',
                      color: 'white',
                      fontSize: '0.88rem',
                      outline: 'none',
                    }}
                  />
                  {errors.pinCode && <span style={{ color: '#ef4444', fontSize: '0.72rem', marginTop: '0.25rem', display: 'block' }}>{errors.pinCode}</span>}
                </div>
              </div>

            </div>

            {/* 2. Payment Method Section */}
            <div
              style={{
                background: 'rgba(20, 20, 20, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '20px',
                padding: '1.75rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: 'rgba(155,106,69,0.15)',
                      border: '1px solid rgba(155,106,69,0.3)',
                      color: '#d4af37',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CreditCard size={18} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>Payment Method</h2>
                    <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', margin: '0.15rem 0 0' }}>
                      Choose your preferred payment method
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    background: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.25)',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '999px',
                    color: '#60a5fa',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                  }}
                >
                  <Lock size={11} />
                  <span>Razorpay Verified</span>
                </div>
              </div>

              {/* Payment Options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>

                {/* Option 1: Razorpay Online Payment */}
                <label
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.85rem',
                    padding: '1.25rem',
                    borderRadius: '16px',
                    border: paymentMethod === 'razorpay' ? '1.5px solid #d4af37' : '1px solid rgba(255,255,255,0.08)',
                    background: paymentMethod === 'razorpay' ? 'linear-gradient(135deg, rgba(212,175,55,0.08) 0%, rgba(122,78,45,0.08) 100%)' : 'rgba(255,255,255,0.02)',
                    cursor: 'pointer',
                    transition: 'all 200ms ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === 'razorpay'}
                        onChange={() => setPaymentMethod('razorpay')}
                        style={{ accentColor: '#d4af37', width: '18px', height: '18px' }}
                      />
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'white' }}>
                            Pay Online via Razorpay
                          </span>
                          <span
                            style={{
                              background: 'linear-gradient(135deg, #7A4E2D 0%, #d4af37 100%)',
                              color: 'black',
                              fontSize: '0.62rem',
                              fontWeight: 800,
                              padding: '0.15rem 0.5rem',
                              borderRadius: '999px',
                              letterSpacing: '0.04em',
                            }}
                          >
                            RECOMMENDED
                          </span>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.2rem', display: 'block' }}>
                          UPI (GPay / PhonePe / Paytm), Credit & Debit Cards, NetBanking, Wallets
                        </span>
                      </div>
                    </div>
                    <Zap size={20} color="#d4af37" />
                  </div>

                  {/* Badges for supported Razorpay methods */}
                  {paymentMethod === 'razorpay' && (
                    <div
                      style={{
                        paddingTop: '0.75rem',
                        borderTop: '1px solid rgba(255,255,255,0.06)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '0.5rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {['UPI', 'GPay', 'PhonePe', 'Visa', 'Mastercard', 'RuPay', 'NetBanking'].map((badge) => (
                          <span
                            key={badge}
                            style={{
                              background: 'rgba(255,255,255,0.06)',
                              border: '1px solid rgba(255,255,255,0.08)',
                              borderRadius: '6px',
                              padding: '0.2rem 0.45rem',
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              color: 'rgba(255,255,255,0.7)',
                            }}
                          >
                            {badge}
                          </span>
                        ))}
                      </div>

                      <span style={{ fontSize: '0.7rem', color: '#86efac', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <ShieldCheck size={13} />
                        Zero Extra Fees
                      </span>
                    </div>
                  )}
                </label>

                {/* Option 2: Cash on Delivery */}
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1.15rem 1.25rem',
                    borderRadius: '16px',
                    border: paymentMethod === 'cod' ? '1.5px solid #d4af37' : '1px solid rgba(255,255,255,0.08)',
                    background: paymentMethod === 'cod' ? 'rgba(212,175,55,0.08)' : 'rgba(255,255,255,0.02)',
                    cursor: 'pointer',
                    transition: 'all 200ms ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
                      style={{ accentColor: '#d4af37', width: '18px', height: '18px' }}
                    />
                    <div>
                      <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'white', display: 'block' }}>
                        Cash on Delivery (COD)
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)' }}>
                        Pay cash upon receiving your luxury package
                      </span>
                    </div>
                  </div>
                  <DollarSign size={20} color="#d4af37" />
                </label>

              </div>
            </div>

          </div>

          {/* Right Column: Order Summary */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div
              style={{
                background: 'rgba(20, 20, 20, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '20px',
                padding: '1.75rem',
                position: 'sticky',
                top: '6rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
              }}
            >
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>Order Summary</h2>

              {/* Item Thumbnails */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', maxHeight: '240px', overflowY: 'auto' }}>
                {items.map((item) => (
                  <div key={item.productId} style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '10px',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        padding: '4px',
                        flexShrink: 0,
                      }}
                    >
                      <img src={item.image} alt={item.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'white', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.name}
                      </p>
                      <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', margin: '0.15rem 0 0' }}>
                        Qty: {item.quantity} × ₹{item.price.toLocaleString()}
                      </p>
                    </div>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'white' }}>
                      ₹{(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} />

              {/* Calculations */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.6)' }}>
                  <span>Subtotal</span>
                  <span>₹{subtotal.toLocaleString()}</span>
                </div>
                {discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#86efac' }}>
                    <span>Coupon Discount</span>
                    <span>-₹{discount.toLocaleString()}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.6)' }}>
                  <span>Express Shipping{deliveryDays ? ` (${deliveryDays})` : ''}</span>
                  <span>{shippingFee === 0 ? 'FREE' : `₹${shippingFee.toLocaleString()}`}</span>
                </div>
                <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '0.35rem 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.15rem', fontWeight: 800, color: 'white' }}>
                  <span>Total Amount</span>
                  <span style={{ color: '#d4af37' }}>₹{currentTotal.toLocaleString()}</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '1rem',
                  borderRadius: '14px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #7A4E2D 0%, #9B6A45 100%)',
                  color: 'white',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 24px rgba(122,78,45,0.4)',
                  transition: 'all 200ms ease',
                  opacity: isSubmitting ? 0.7 : 1,
                }}
              >
                {isSubmitting ? (
                  <span>Initiating Gateway...</span>
                ) : paymentMethod === 'razorpay' ? (
                  <>
                    <Lock size={16} />
                    <span>Pay ₹{total.toLocaleString()} via Razorpay</span>
                    <ChevronRight size={18} />
                  </>
                ) : (
                  <>
                    <Lock size={16} />
                    <span>Confirm COD Order (₹{total.toLocaleString()})</span>
                    <ChevronRight size={18} />
                  </>
                )}
              </button>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  fontSize: '0.72rem',
                  color: 'rgba(255,255,255,0.4)',
                }}
              >
                <ShieldCheck size={14} color="#86efac" />
                <span>100% Secure Checkout powered by Razorpay</span>
              </div>
            </div>
          </div>

        </div>
      </form>
    </main>
  );
}
