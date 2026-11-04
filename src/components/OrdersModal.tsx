import { useState, useEffect } from 'react';
import { X, Package, CheckCircle2, Clock, Truck, Calendar, ShoppingBag } from 'lucide-react';
import type { AuthUser } from './LoginModal';
import { API_URL } from '../api';

export type OrderItem = {
  productId: string | number;
  name: string;
  price: number;
  quantity: number;
  image: string;
  subtitle?: string;
};

export type Order = {
  id: string;
  date: string;
  totalAmount: number;
  items: OrderItem[];
  status: 'Delivered' | 'Processing' | 'Shipped' | 'Cancelled';
  shippingAddress?: string;
  paymentMethod?: string;
  paymentId?: string;
};

export function getStoredOrders(userId?: string): Order[] {
  if (!userId) return [];
  try {
    const raw = localStorage.getItem(`hijaz_orders_${userId}`);
    if (raw === null) {
      return [];
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse orders from localStorage', err);
    return [];
  }
}

export function clearStoredOrders(userId?: string): void {
  if (!userId) return;
  try {
    localStorage.removeItem(`hijaz_orders_${userId}`);
  } catch (err) {
    console.error('Failed to clear orders from localStorage', err);
  }
}

export function saveOrderToStorage(newOrder: Order, userId?: string): Order[] {
  if (!userId) return [newOrder];
  const existing = getStoredOrders(userId);
  const updated = [newOrder, ...existing];
  try {
    localStorage.setItem(`hijaz_orders_${userId}`, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save order to localStorage', err);
  }
  return updated;
}

type Props = {
  isOpen: boolean;
  onClose: () => void;
  user: AuthUser | null;
  onContinueShopping?: () => void;
};

export default function OrdersModal({ isOpen, onClose, user, onContinueShopping }: Props) {
  const [filter, setFilter] = useState<'ALL' | 'PROCESSING' | 'DELIVERED'>('ALL');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const [visible, setVisible] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // Animate in/out and load orders
  useEffect(() => {
    if (isOpen) {
      const local = getStoredOrders(user?.uid);
      setOrders(local);
      requestAnimationFrame(() => setVisible(true));

      // Fetch live orders from backend
      if (user?.uid) {
        fetch(`${API_URL}/orders?user_uid=${encodeURIComponent(user.uid)}`)
          .then((res) => (res.ok ? res.json() : null))
          .then((backendOrders) => {
            if (Array.isArray(backendOrders) && backendOrders.length > 0) {
              const normalized: Order[] = backendOrders.map((bo: any) => ({
                id: bo.order_number || `#HJ-${bo.id}`,
                date: bo.created_at
                  ? new Date(bo.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : 'Recent',
                totalAmount: Number(bo.total_amount) || 0,
                status: bo.status || 'Processing',
                shippingAddress: bo.shipping_address,
                paymentMethod: bo.payment_method,
                items: Array.isArray(bo.items) ? bo.items : [],
              }));
              setOrders(normalized);
              try {
                localStorage.setItem(`hijaz_orders_${user.uid}`, JSON.stringify(normalized));
              } catch (_) {}
            }
          })
          .catch((err) => console.log('Using local orders cache:', err));
      }
    } else {
      setVisible(false);
    }
  }, [isOpen, user?.uid]);

  const handleClearOrders = () => {
    if (window.confirm('Are you sure you want to clear your order history?')) {
      clearStoredOrders(user?.uid);
      setOrders([]);
    }
  };

  if (!isOpen) return null;

  const filteredOrders = orders.filter((ord) => {
    if (filter === 'PROCESSING') return ord.status === 'Processing' || ord.status === 'Shipped';
    if (filter === 'DELIVERED') return ord.status === 'Delivered';
    return true;
  });

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'Delivered':
        return (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
            padding: '0.25rem 0.65rem', borderRadius: '999px',
            background: 'rgba(134,239,172,0.12)', border: '1px solid rgba(134,239,172,0.28)',
            color: '#86efac', fontSize: '0.68rem', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>
            <CheckCircle2 size={11} /> Delivered
          </span>
        );
      case 'Shipped':
        return (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
            padding: '0.25rem 0.65rem', borderRadius: '999px',
            background: 'rgba(147,197,253,0.12)', border: '1px solid rgba(147,197,253,0.28)',
            color: '#93c5fd', fontSize: '0.68rem', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>
            <Truck size={11} /> Shipped
          </span>
        );
      case 'Processing':
      default:
        return (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
            padding: '0.25rem 0.65rem', borderRadius: '999px',
            background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.28)',
            color: '#fbbf24', fontSize: '0.68rem', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>
            <Clock size={11} /> Processing
          </span>
        );
    }
  };

  // Mobile: bottom sheet, Desktop: centered modal
  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: 999,
    display: 'flex',
    alignItems: isMobile ? 'flex-end' : 'center',
    justifyContent: 'center',
    background: 'rgba(0,0,0,0.82)',
    backdropFilter: visible ? 'blur(14px)' : 'blur(0px)',
    padding: isMobile ? 0 : '1rem',
    fontFamily: "'Inter', sans-serif",
    color: 'white',
    transition: 'backdrop-filter 300ms ease',
  };

  const panelStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    maxWidth: isMobile ? '100%' : '680px',
    maxHeight: isMobile ? '92vh' : '88vh',
    background: '#0d0d0d',
    border: isMobile ? 'none' : '1px solid rgba(255,255,255,0.1)',
    borderTop: '1px solid rgba(255,255,255,0.1)',
    borderRadius: isMobile ? '24px 24px 0 0' : '24px',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 -8px 48px rgba(0,0,0,0.8), 0 0 24px rgba(155,106,69,0.12)',
    overflow: 'hidden',
    transform: visible
      ? 'translateY(0)'
      : isMobile ? 'translateY(100%)' : 'translateY(24px) scale(0.98)',
    opacity: visible ? 1 : 0,
    transition: 'transform 380ms cubic-bezier(0.34, 1.3, 0.64, 1), opacity 300ms ease',
  };

  return (
    <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={panelStyle}>

        {/* Drag handle on mobile */}
        {isMobile && (
          <div style={{
            width: '40px', height: '4px', borderRadius: '2px',
            background: 'rgba(255,255,255,0.18)',
            margin: '0.75rem auto 0',
            flexShrink: 0,
          }} />
        )}

        {/* Header */}
        <div style={{
          padding: isMobile ? '0.875rem 1rem 0.875rem' : '1.25rem 1.5rem',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
            <Package size={isMobile ? 17 : 19} color="#9B6A45" />
            <div>
              <h2 style={{ fontSize: isMobile ? '1rem' : '1.15rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                Your Orders
              </h2>
              <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', margin: '0.1rem 0 0' }}>
                {user ? user.name : 'Purchase history'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {orders.length > 0 && (
              <button
                onClick={handleClearOrders}
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  padding: '0.4rem 0.75rem',
                  borderRadius: '999px',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#ef4444',
                  cursor: 'pointer',
                  transition: 'all 180ms ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; }}
              >
                Clear History
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                width: '36px', height: '36px', borderRadius: '50%',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.04)',
                color: 'rgba(255,255,255,0.7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'all 180ms ease', flexShrink: 0,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'white'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div style={{
          display: 'flex',
          gap: '0.4rem',
          padding: isMobile ? '0.65rem 1rem' : '0.75rem 1.5rem',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          flexShrink: 0,
        }}>
          {(['ALL', 'PROCESSING', 'DELIVERED'] as const).map((tab) => {
            const isActive = filter === tab;
            return (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                style={{
                  padding: isMobile ? '0.4rem 0.85rem' : '0.45rem 1rem',
                  borderRadius: '999px',
                  border: isActive ? '1px solid rgba(155,106,69,0.5)' : '1px solid rgba(255,255,255,0.08)',
                  background: isActive ? 'rgba(155,106,69,0.15)' : 'rgba(255,255,255,0.02)',
                  color: isActive ? '#d4af37' : 'rgba(255,255,255,0.55)',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {tab === 'ALL' ? 'All' : tab === 'PROCESSING' ? 'In Progress' : 'Delivered'}
              </button>
            );
          })}
        </div>

        {/* Orders List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: isMobile ? '1rem' : '1.25rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          WebkitOverflowScrolling: 'touch' as any,
        }}>
          {filteredOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'rgba(255,255,255,0.4)' }}>
              <ShoppingBag size={42} strokeWidth={1.2} style={{ opacity: 0.2, marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'white', margin: '0 0 0.4rem' }}>No orders found</h3>
              <p style={{ fontSize: '0.82rem', margin: '0 0 1.25rem' }}>
                {filter === 'ALL' ? "You haven't placed any luxury orders yet." : `No orders under this filter.`}
              </p>
              {onContinueShopping && (
                <button
                  onClick={() => { onClose(); onContinueShopping(); }}
                  style={{
                    padding: '0.7rem 1.5rem', borderRadius: '12px', border: 'none',
                    background: 'linear-gradient(135deg, #7A4E2D, #9B6A45)',
                    color: 'white', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
                  }}
                >
                  Explore Collection
                </button>
              )}
            </div>
          ) : (
            filteredOrders.map((ord) => (
              <div
                key={ord.id}
                style={{
                  borderRadius: '16px',
                  border: '1px solid rgba(255,255,255,0.07)',
                  background: 'rgba(255,255,255,0.02)',
                  padding: isMobile ? '1rem' : '1.15rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem',
                }}
              >
                {/* Order header row */}
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '0.5rem',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  paddingBottom: '0.75rem',
                  flexWrap: 'wrap',
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 800, fontSize: isMobile ? '0.85rem' : '0.92rem', color: '#d4af37' }}>
                        {ord.id}
                      </span>
                      {getStatusBadge(ord.status)}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.3rem' }}>
                      <Calendar size={11} />
                      <span>{ord.date}</span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                      Total
                    </span>
                    <span style={{ fontSize: isMobile ? '1rem' : '1.05rem', fontWeight: 800, color: 'white' }}>
                      ₹{ord.totalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Items */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {ord.items.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.7rem',
                        background: 'rgba(255,255,255,0.015)',
                        padding: '0.55rem 0.7rem',
                        borderRadius: '10px',
                      }}
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        style={{
                          width: isMobile ? '42px' : '46px',
                          height: isMobile ? '42px' : '46px',
                          borderRadius: '8px',
                          objectFit: 'cover',
                          border: '1px solid rgba(255,255,255,0.08)',
                          background: '#151515',
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4 style={{ fontSize: isMobile ? '0.82rem' : '0.85rem', fontWeight: 700, margin: 0, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.name}
                        </h4>
                        {item.subtitle && (
                          <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.38)', margin: '0.12rem 0 0' }}>
                            {item.subtitle}
                          </p>
                        )}
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.65)' }}>
                          {item.quantity}× ₹{item.price.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {ord.shippingAddress && (
                  <div style={{
                    fontSize: '0.72rem',
                    color: 'rgba(255,255,255,0.38)',
                    background: 'rgba(255,255,255,0.01)',
                    padding: '0.45rem 0.7rem',
                    borderRadius: '8px',
                    border: '1px dashed rgba(255,255,255,0.06)',
                  }}>
                    📍 <strong style={{ color: 'rgba(255,255,255,0.65)' }}>{ord.shippingAddress}</strong>
                  </div>
                )}
              </div>
            ))
          )}

          {/* Bottom safe-area spacing on mobile */}
          {isMobile && <div style={{ height: 'env(safe-area-inset-bottom, 0.5rem)' }} />}
        </div>
      </div>
    </div>
  );
}
