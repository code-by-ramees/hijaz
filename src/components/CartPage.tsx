import { useState, useEffect } from 'react';
import { ArrowLeft, ShoppingBag, Trash2, Plus, Minus, Tag, ChevronRight, X, Loader2 } from 'lucide-react';
import type { AuthUser } from './LoginModal';
import CheckoutPage from './CheckoutPage';
import { API_URL } from '../api';

// ─── Types ────────────────────────────────────────────────────────────────────

export type CartItem = {
  productId: string | number;
  name: string;
  subtitle: string;
  price: number;
  originalPrice?: number;
  image: string;
  quantity: number;
  configBg: string;
  configPanel: string;
  badge?: string;
};

// ─── Per-User Cart Persistence Helpers ────────────────────────────────────────

export function getStoredCart(userId?: string): CartItem[] {
  if (!userId) return [];
  try {
    const raw = localStorage.getItem(`hijaz_cart_${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Failed to get cart from localStorage', err);
    return [];
  }
}

export function saveStoredCart(userId: string | undefined, items: CartItem[]): void {
  if (!userId) return;
  try {
    localStorage.setItem(`hijaz_cart_${userId}`, JSON.stringify(items));
  } catch (err) {
    console.error('Failed to save cart to localStorage', err);
  }
}

export function clearStoredCart(userId?: string): void {
  if (!userId) return;
  try {
    localStorage.removeItem(`hijaz_cart_${userId}`);
  } catch (err) {
    console.error('Failed to clear cart from localStorage', err);
  }
}

type Props = {
  items: CartItem[];
  user: AuthUser;
  onBack: () => void;
  onUpdateQty: (productId: string | number, qty: number) => void;
  onRemove: (productId: string | number) => void;
  onClearCart?: () => void;
  onOpenOrders?: () => void;
};

// ─── CartPage ─────────────────────────────────────────────────────────────────

export default function CartPage({ items, user, onBack, onUpdateQty, onRemove, onClearCart, onOpenOrders }: Props) {
  const [settings, setSettings] = useState({
    shipping_fee: 99,
    free_shipping_threshold: 999,
    free_shipping_enabled: true,
    estimated_delivery_days: '2 - 4 Business Days',
  });
  const [coupon, setCoupon] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    message: string;
    discount_amount: number;
  } | null>(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [showCheckoutPage, setShowCheckoutPage] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/settings?t=${Date.now()}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setSettings({
            shipping_fee: data.shipping_fee !== undefined && data.shipping_fee !== null ? Number(data.shipping_fee) : 99,
            free_shipping_threshold: data.free_shipping_threshold !== undefined && data.free_shipping_threshold !== null ? Number(data.free_shipping_threshold) : 999,
            free_shipping_enabled: Boolean(data.free_shipping_enabled),
            estimated_delivery_days: data.estimated_delivery_days || '2 - 4 Business Days',
          });
        }
      })
      .catch((err) => console.log('Using default shipping settings:', err));
  }, []);

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const discount = appliedCoupon ? appliedCoupon.discount_amount : 0;
  const shipping =
    settings.free_shipping_enabled && subtotal >= settings.free_shipping_threshold
      ? 0
      : settings.shipping_fee;
  const total = Math.max(0, subtotal - discount + shipping);

  const handleCoupon = async () => {
    if (!coupon.trim()) return;
    setCouponError('');
    setCouponLoading(true);

    try {
      const res = await fetch(`${API_URL}/coupons/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: coupon.trim(),
          subtotal: subtotal,
        }),
      });

      const data = await res.json();

      if (res.ok && data.valid) {
        setAppliedCoupon({
          code: data.code,
          message: data.message,
          discount_amount: Number(data.discount_amount) || 0,
        });
        setCoupon('');
      } else {
        setCouponError(data.message || 'Invalid or inapplicable coupon.');
      }
    } catch (err: any) {
      setCouponError('Unable to validate coupon at this moment.');
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponError('');
  };

  if (showCheckoutPage) {
    return (
      <CheckoutPage
        items={items}
        user={user}
        total={total}
        subtotal={subtotal}
        discount={discount}
        shipping={shipping}
        couponCode={appliedCoupon?.code}
        onBack={() => setShowCheckoutPage(false)}
        onOrderSuccess={() => {
          setShowCheckoutPage(false);
          onBack();
        }}
        onClearCart={onClearCart}
        onOpenOrders={onOpenOrders}
      />
    );
  }

  return (
    <main style={{
      minHeight: '100vh',
      background: '#050505',
      fontFamily: "'Inter', sans-serif",
      color: 'white',
      position: 'relative',
    }}>
      {/* Watermark logo */}
      <div aria-hidden="true" style={{
        position: 'fixed',
        inset: 0,
        backgroundImage: "url('/logo.png')",
        backgroundSize: 'clamp(340px, 40vw, 600px)',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        opacity: 0.025,
        filter: 'blur(40px)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* ── Header ── */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(5,5,5,0.85)',
        backdropFilter: 'blur(20px)',
        padding: '1rem 2rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
      }}>
        <button
          onClick={onBack}
          aria-label="Back"
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(255,255,255,0.03)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'all 180ms ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
        >
          <ArrowLeft size={17} strokeWidth={2.25} />
        </button>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img
            src="/logo.png"
            alt="HIJAZ Logo"
            style={{
              height: '32px',
              width: 'auto',
              objectFit: 'contain',
              filter: 'drop-shadow(0 2px 6px rgba(212, 175, 55, 0.35))',
            }}
          />
          <div>
            <span style={{
              fontSize: '0.68rem',
              fontWeight: 800,
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              color: '#d4af37',
              display: 'block',
            }}>HIJAZ</span>
            <h1 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, letterSpacing: '-0.01em' }}>
              Your Cart
            </h1>
          </div>
        </div>

        {/* User pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          padding: '0.4rem 0.9rem',
          borderRadius: '999px',
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.03)',
        }}>
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.name}
              style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #7A4E2D, #9B6A45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.65rem',
              fontWeight: 700,
            }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'rgba(255,255,255,0.75)' }}>
            {user.name.split(' ')[0]}
          </span>
        </div>
      </header>

      {/* ── Body ── */}
      <div style={{
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '2.5rem 1.5rem 6rem',
        position: 'relative',
        zIndex: 5,
        display: 'grid',
        gridTemplateColumns: items.length === 0 ? '1fr' : 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '2rem',
        alignItems: 'start',
      }}>

        {/* ── Empty state ── */}
        {items.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '7rem 2rem',
            color: 'rgba(255,255,255,0.35)',
            border: '1px dashed rgba(255,255,255,0.07)',
            borderRadius: '24px',
            background: 'rgba(255,255,255,0.01)',
            maxWidth: '480px',
            margin: '0 auto',
          }}>
            <ShoppingBag size={52} strokeWidth={1.2} style={{ opacity: 0.2, marginBottom: '1.5rem' }} />
            <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white', margin: '0 0 0.5rem' }}>
              Your cart is empty
            </p>
            <p style={{ fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '2rem' }}>
              Discover our premium collection and add your favourites.
            </p>
            <button
              onClick={onBack}
              style={{
                padding: '0.8rem 2rem',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #7A4E2D, #9B6A45)',
                color: 'white',
                fontWeight: 700,
                fontSize: '0.875rem',
                cursor: 'pointer',
                boxShadow: '0 4px 18px rgba(122,78,45,0.35)',
                transition: 'all 200ms ease',
              }}
            >
              Continue Shopping
            </button>
          </div>
        )}

        {/* ── Item list ── */}
        {items.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{
              fontSize: '0.72rem',
              fontWeight: 800,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.35)',
              margin: '0 0 0.5rem',
            }}>
              {items.length} {items.length === 1 ? 'item' : 'items'} in your cart
            </p>

            {items.map((item) => (
              <CartItemRow
                key={item.productId}
                item={item}
                onQtyChange={(qty) => onUpdateQty(item.productId, qty)}
                onRemove={() => onRemove(item.productId)}
              />
            ))}
          </div>
        )}

        {/* ── Order Summary ── */}
        {items.length > 0 && (
          <div style={{
            padding: '2rem',
            borderRadius: '24px',
            border: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(255,255,255,0.02)',
            backdropFilter: 'blur(16px)',
            position: 'sticky',
            top: '90px',
          }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 1.5rem', letterSpacing: '-0.01em' }}>
              Order Summary
            </h2>

            {/* Row helper */}
            {[
              { l: 'Subtotal', v: `₹${subtotal.toLocaleString()}` },
              ...(appliedCoupon ? [{ l: `Coupon (${appliedCoupon.code})`, v: `-₹${discount.toLocaleString()}`, accent: true }] : []),
              { l: shipping === 0 ? 'Shipping (Free Delivery)' : 'Express Shipping', v: shipping === 0 ? 'FREE' : `₹${shipping.toLocaleString()}` },
            ].map(({ l, v, accent }) => (
              <div key={l} style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.88rem',
                marginBottom: '0.75rem',
                color: accent ? '#86efac' : 'rgba(255,255,255,0.55)',
              }}>
                <span>{l}</span>
                <span style={{ fontWeight: 600, color: accent ? '#86efac' : 'rgba(255,255,255,0.85)' }}>{v}</span>
              </div>
            ))}

            <div style={{
              height: '1px',
              background: 'rgba(255,255,255,0.06)',
              margin: '1rem 0',
            }} />

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '1.15rem',
              fontWeight: 800,
              color: 'white',
              marginBottom: '1.5rem',
            }}>
              <span>Total</span>
              <span>₹{total.toLocaleString()}</span>
            </div>

            {/* Coupon input */}
            {!appliedCoupon ? (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    placeholder="Enter coupon code"
                    value={coupon}
                    onChange={(e) => { setCoupon(e.target.value.toUpperCase()); setCouponError(''); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleCoupon(); }}
                    style={{
                      flex: 1,
                      padding: '0.7rem 0.9rem',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1.5px solid rgba(255,255,255,0.08)',
                      borderRadius: '10px',
                      color: 'white',
                      outline: 'none',
                      fontSize: '0.85rem',
                      textTransform: 'uppercase',
                    }}
                    onFocus={(e) => { e.target.style.border = '1.5px solid #d4af37'; }}
                    onBlur={(e)  => { e.target.style.border = '1.5px solid rgba(255,255,255,0.08)'; }}
                  />
                  <button
                    onClick={handleCoupon}
                    disabled={couponLoading || !coupon.trim()}
                    style={{
                      padding: '0 1.1rem',
                      borderRadius: '10px',
                      border: '1.5px solid rgba(212,175,55,0.4)',
                      background: 'rgba(212,175,55,0.1)',
                      color: '#d4af37',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: couponLoading || !coupon.trim() ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      transition: 'all 150ms ease',
                      whiteSpace: 'nowrap',
                      opacity: couponLoading || !coupon.trim() ? 0.6 : 1,
                    }}
                  >
                    {couponLoading ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <>
                        <Tag size={13} />
                        Apply
                      </>
                    )}
                  </button>
                </div>
                {couponError && (
                  <p style={{ fontSize: '0.75rem', color: '#f87171', margin: '0.4rem 0 0' }}>
                    {couponError}
                  </p>
                )}
                <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.25)', margin: '0.4rem 0 0' }}>
                  Try <strong style={{ color: '#d4af37' }}>HIJAZ10</strong> or <strong style={{ color: '#d4af37' }}>ROYAL200</strong>
                </p>
              </div>
            ) : (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.65rem 0.9rem',
                borderRadius: '10px',
                background: 'rgba(134,239,172,0.08)',
                border: '1px solid rgba(134,239,172,0.25)',
                fontSize: '0.8rem',
                color: '#86efac',
                marginBottom: '1rem',
                fontWeight: 600,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Tag size={14} />
                  <span>{appliedCoupon.message}</span>
                </div>
                <button
                  type="button"
                  onClick={removeCoupon}
                  title="Remove coupon"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'rgba(255,255,255,0.5)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '2px',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#f87171'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
                >
                  <X size={15} />
                </button>
              </div>
            )}

            {shipping > 0 && settings.free_shipping_enabled && subtotal < settings.free_shipping_threshold && (
              <p style={{
                fontSize: '0.75rem',
                color: 'rgba(255,255,255,0.4)',
                marginBottom: '1.25rem',
                lineHeight: 1.5,
              }}>
                Add ₹{Math.max(0, settings.free_shipping_threshold - subtotal).toLocaleString()} more for <strong style={{ color: '#d4af37' }}>free express delivery</strong>
              </p>
            )}

            {/* Checkout button */}
            <button
              onClick={() => setShowCheckoutPage(true)}
              style={{
                width: '100%',
                padding: '1rem',
                borderRadius: '14px',
                border: 'none',
                background: 'linear-gradient(135deg, #7A4E2D, #9B6A45)',
                color: 'white',
                fontWeight: 800,
                fontSize: '0.95rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'all 200ms ease',
                boxShadow: '0 4px 24px rgba(122,78,45,0.4)',
                letterSpacing: '0.02em',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.9';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 8px 30px rgba(122,78,45,0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 24px rgba(122,78,45,0.4)';
              }}
            >
              Proceed to Checkout
              <ChevronRight size={18} />
            </button>

            {/* Trust badges */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '1.25rem',
              marginTop: '1.25rem',
              flexWrap: 'wrap',
            }}>
              {['🔒 Secure Payment', '📦 Fast Delivery', '↩️ Easy Returns'].map(t => (
                <span key={t} style={{
                  fontSize: '0.68rem',
                  color: 'rgba(255,255,255,0.25)',
                  fontWeight: 600,
                }}>
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

// ─── Cart Item Row ─────────────────────────────────────────────────────────────

function CartItemRow({
  item,
  onQtyChange,
  onRemove,
}: {
  item: CartItem;
  onQtyChange: (qty: number) => void;
  onRemove: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        gap: '1rem',
        padding: '1.25rem',
        borderRadius: '18px',
        border: `1px solid ${hovered ? `${item.configBg}44` : 'rgba(255,255,255,0.06)'}`,
        background: hovered ? 'rgba(255,255,255,0.035)' : 'rgba(255,255,255,0.015)',
        backdropFilter: 'blur(8px)',
        transition: 'all 280ms cubic-bezier(0.25,1,0.5,1)',
        transform: hovered ? 'translateX(4px)' : 'translateX(0)',
        alignItems: 'center',
      }}
    >
      {/* Product image */}
      <div style={{
        width: '80px',
        height: '80px',
        flexShrink: 0,
        borderRadius: '12px',
        background: `radial-gradient(circle, ${item.configBg}22, transparent 70%)`,
        border: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>
        <img
          src={item.image}
          alt={item.name}
          draggable={false}
          style={{
            width: '70px',
            height: '70px',
            objectFit: 'contain',
            transform: hovered ? 'scale(1.07)' : 'scale(1)',
            transition: 'transform 320ms ease',
          }}
          onError={(e) => { e.currentTarget.src = '/athar.png'; }}
        />
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
          <div style={{ minWidth: 0 }}>
            <h3 style={{
              fontSize: '0.95rem',
              fontWeight: 800,
              color: 'white',
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              letterSpacing: '-0.01em',
            }}>
              {item.name}
            </h3>
            <p style={{ fontSize: '0.76rem', color: 'rgba(255,255,255,0.4)', margin: '0.2rem 0 0' }}>
              {item.subtitle}
            </p>
          </div>
          {/* Remove */}
          <button
            onClick={onRemove}
            aria-label="Remove item"
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '8px',
              border: '1px solid rgba(248,113,113,0.15)',
              background: 'rgba(248,113,113,0.05)',
              color: 'rgba(248,113,113,0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'all 150ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(248,113,113,0.15)';
              e.currentTarget.style.color = '#f87171';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(248,113,113,0.05)';
              e.currentTarget.style.color = 'rgba(248,113,113,0.6)';
            }}
          >
            <Trash2 size={13} />
          </button>
        </div>

        {/* Price + qty row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '0.85rem',
        }}>
          <div>
            <span style={{ fontSize: '1rem', fontWeight: 800, color: 'white' }}>
              ₹{(item.price * item.quantity).toLocaleString()}
            </span>
            {item.originalPrice && (
              <span style={{
                fontSize: '0.75rem',
                color: 'rgba(255,255,255,0.3)',
                textDecoration: 'line-through',
                marginLeft: '0.5rem',
              }}>
                ₹{(item.originalPrice * item.quantity).toLocaleString()}
              </span>
            )}
          </div>

          {/* Qty stepper */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '10px',
            overflow: 'hidden',
          }}>
            <StepBtn
              icon={<Minus size={12} />}
              onClick={() => onQtyChange(Math.max(1, item.quantity - 1))}
              disabled={item.quantity <= 1}
            />
            <span style={{
              padding: '0 0.85rem',
              fontSize: '0.9rem',
              fontWeight: 700,
              color: 'white',
              minWidth: '2rem',
              textAlign: 'center',
              userSelect: 'none',
            }}>
              {item.quantity}
            </span>
            <StepBtn
              icon={<Plus size={12} />}
              onClick={() => onQtyChange(item.quantity + 1)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StepBtn({
  icon, onClick, disabled = false,
}: {
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '32px',
        height: '32px',
        background: 'rgba(255,255,255,0.04)',
        border: 'none',
        color: disabled ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.7)',
        cursor: disabled ? 'default' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 120ms ease',
      }}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.background = 'rgba(255,255,255,0.09)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
      }}
    >
      {icon}
    </button>
  );
}
