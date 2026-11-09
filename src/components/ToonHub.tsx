import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ShoppingBag, Sparkles, Star, ChevronDown, CheckCircle, Send, MapPin, Mail, Phone, LogOut, User as UserIcon, Package, X, CheckCircle2, Film, ExternalLink, Plus, Minus, MessageSquare } from 'lucide-react';
import { CATEGORY_CONFIG, BEDDING_SUB_CONFIG, type Category, type BeddingType, type Product } from '../data/products';
import { auth, onAuthStateChanged, firebaseSignOut } from '../firebase';
import LoginModal, { type AuthUser } from './LoginModal';
import CartPage, { type CartItem, getStoredCart, saveStoredCart, clearStoredCart } from './CartPage';
import OrdersModal from './OrdersModal';
import { API_URL } from '../api';

// ─── Data ─────────────────────────────────────────────────────────────────────

const IMAGES = [
  {
    category: 'pillows',
    src: '/bed1.png',
    bg: '#B8A89A',
    title: 'LUXURY PILLOWS',
    desc: 'Sink into cloud-like comfort with our premium pillows and silky-soft bedding. Designed for the perfect night\'s sleep.',
  },
  {
    category: 'bedding',
    src: '/bed.png',
    bg: '#7D8C7C',
    title: 'BEDDING LUXE',
    desc: 'Pure organic cotton duvet set with ruffled accents, breathable weave, and tailored five-star elegance.',
  },
  {
    category: 'bath',
    src: '/bath1.png',
    bg: '#547282',
    title: 'ROYAL SPA TOWELS',
    desc: 'Extra-large plush Turkish and Egyptian cotton towels, ultra-absorbent and cloud-soft for a true spa experience.',
  },
] satisfies Array<{
  category: Category;
  src: string;
  bg: string;
  title: string;
  desc: string;
}>;

const HERO_BG_ITEMS = [
  { src: '/hero.jpg?v=2', position: 'center center', label: 'Suite' },
  { src: '/towels.jpg?v=2', position: 'center 50%', label: 'Towels' },
  { src: '/bed.jpg?v=2', position: 'center 50%', label: 'Bed' },
];

// 4 slides for seamless infinite loop (cloning first slide at end)
const HERO_BG_SLIDES = [...HERO_BG_ITEMS, HERO_BG_ITEMS[0]];

// ─── Grain overlay ────────────────────────────────────────────────────────────

const GRAIN_SVG = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='200' height='200' filter='url(%23n)' opacity='0.08'/></svg>`;

// ─── Animation constants ──────────────────────────────────────────────────────

const DUR = '680ms';
// Material-Design ease for opacity/filter; spring-like overshoot for transform
const EASE_STD  = 'cubic-bezier(0.4, 0, 0.2, 1)';
const EASE_SPRING = 'cubic-bezier(0.34, 1.28, 0.64, 1)';

const TRANSITION = [
  `transform ${DUR} ${EASE_SPRING}`,
  `filter    ${DUR} ${EASE_STD}`,
  `opacity   ${DUR} ${EASE_STD}`,
].join(', ');

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = 'center' | 'left' | 'right' | 'back';
type Direction = 'next' | 'prev';

export type ReviewItem = {
  id: number;
  product_id?: number | null;
  customer_name: string;
  customer_email?: string | null;
  user_uid?: string | null;
  rating: number;
  comment: string;
  sentiment?: string;
  created_at: string;
  product?: {
    id: number;
    name: string;
    category: string;
    image: string;
    badge?: string;
  } | null;
};

function formatReviewDate(dateStr: string): string {
  if (!dateStr) return 'Recently';
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHr / 24);

    if (diffDays === 0) {
      if (diffHr === 0) {
        if (diffMin <= 1) return 'Just now';
        return `${diffMin}m ago`;
      }
      return `${diffHr}h ago`;
    }
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 30) return `${diffDays}d ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return 'Recently';
  }
}

// ─── Pure-transform role styles ───────────────────────────────────────────────
//
//  The key insight that makes this GPU-composited and jank-free:
//
//  ALL items share identical layout properties:
//    left: 0  |  bottom: 0  |  height: BASE  |  transform-origin: 50% 100%
//
//  The transform-origin (bottom-center of the element) sits at:
//    viewport position = (pivotOffset, 100vh)
//    where pivotOffset = 0.5 × elementWidth = 0.5 × 0.6 × BASE
//
//  To place the visual bottom-center at target (X, Y):
//    translateX(X − pivotOffset)  translateY(Y − 100vh)  scale(S)
//
//  Because only transform/filter/opacity ever change, the browser can hand
//  every frame off to the GPU compositor — no layout recalculation at all.
//
//  Desktop BASE = 92vh  →  pivotOffset = 0.3 × 92vh = 27.6vh
//  Mobile  BASE = 60vh  →  pivotOffset = 0.3 × 60vh = 18vh
//
//  Scale factors derived from the original pixel ratios:
//    center desktop:  scale(1.68)   → visual height 154.6vh
//    left/right desk: scale(0.304)  → visual height  28  vh   (28/92)
//    back desktop:    scale(0.239)  → visual height  22  vh   (22/92)
//    center mobile:   scale(1.25)   → visual height  75  vh
//    left/right mob:  scale(0.267)  → visual height  16  vh   (16/60)
//    back mobile:     scale(0.217)  → visual height  13  vh   (13/60)

function getRoleStyle(role: Role, isMobile: boolean): React.CSSProperties {
  const po = isMobile ? '18vh' : '27.6vh'; // pivot offset

  type RoleMap = Record<Role, { transform: string; filter: string; opacity: number; zIndex: number }>;

  const desktop: RoleMap = {
    center: {
      transform : `translateX(calc(50vw - ${po})) scale(0.88)`,
      filter    : 'blur(0px)',
      opacity   : 1,
      zIndex    : 20,
    },
    left: {
      transform : `translateX(calc(30vw - ${po})) translateY(-12vh) scale(0.304)`,
      filter    : 'blur(2px)',
      opacity   : 0.85,
      zIndex    : 10,
    },
    right: {
      transform : `translateX(calc(70vw - ${po})) translateY(-12vh) scale(0.304)`,
      filter    : 'blur(2px)',
      opacity   : 0.85,
      zIndex    : 10,
    },
    back: {
      transform : `translateX(calc(50vw - ${po})) translateY(-12vh) scale(0.239)`,
      filter    : 'blur(4px)',
      opacity   : 1,
      zIndex    : 5,
    },
  };

  const mobile: RoleMap = {
    center: {
      transform : `translateX(calc(50vw - ${po})) translateY(-24vh) scale(0.72)`,
      filter    : 'blur(0px)',
      opacity   : 1,
      zIndex    : 20,
    },
    left: {
      transform : `translateX(calc(12vw - ${po})) translateY(-34vh) scale(0.2)`,
      filter    : 'blur(2px)',
      opacity   : 0.7,
      zIndex    : 10,
    },
    right: {
      transform : `translateX(calc(88vw - ${po})) translateY(-34vh) scale(0.2)`,
      filter    : 'blur(2px)',
      opacity   : 0.7,
      zIndex    : 10,
    },
    back: {
      transform : `translateX(calc(50vw - ${po})) translateY(-34vh) scale(0.16)`,
      filter    : 'blur(4px)',
      opacity   : 1,
      zIndex    : 5,
    },
  };

  const { transform, filter, opacity, zIndex } = (isMobile ? mobile : desktop)[role];

  return {
    // ── Layout (NEVER changes between roles — keeps items in the GPU layer) ──
    position      : 'absolute',
    left          : 0,
    bottom        : 0,
    height        : isMobile ? '65vh' : '92vh',
    aspectRatio   : '0.6 / 1',
    transformOrigin: '50% 100%',   // bottom-center pivot

    // ── Animated (GPU-composited) ──
    transform,
    filter,
    opacity,
    zIndex,

    transition    : TRANSITION,
    willChange    : 'transform, filter, opacity',
    cursor        : (role === 'left' || role === 'right') ? 'pointer' : 'default',
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

const PRODUCT_DELAY      = 4000; // ms between product auto-advances
const BG_DELAY           = 5000; // ms between background scene auto-advances (decreased timing)
const BG_TRANSITION_DUR  = 850;  // ms for background slide animation
const AUTO_DELAY         = PRODUCT_DELAY;

export default function ToonHub() {
  const [activeIndex, setActiveIndex]   = useState(0);
  const [, setIsAnimating]              = useState(false);
  const [, setIsBgAnimating]            = useState(false);
  const [isMobile, setIsMobile]         = useState(window.innerWidth < 640);
  const [isHovered, setIsHovered]       = useState(false);
  const [progressKey, setProgressKey]   = useState(0); // bumped each slide to restart progress bar
  const [discoveryCategory, setDiscoveryCategory] = useState<Category | null>(null);
  const [currentUser, setCurrentUser]   = useState<AuthUser | null>(null);
  const [cartItems, setCartItems]       = useState<CartItem[]>([]);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showCart, setShowCart]         = useState(false);
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [pendingCartItem, setPendingCartItem] = useState<{ product: Product; config: any } | null>(null);
  const [cartToast, setCartToast] = useState<{ name: string; image: string; visible: boolean } | null>(null);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [pendingReviewOpen, setPendingReviewOpen] = useState(false);
  const [reviewToast, setReviewToast] = useState(false);

  const cartToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animTimer      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bgAnimTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isAnimatingRef = useRef(false);
  const isBgAnimatingRef = useRef(false);
  const autoTimer      = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartX    = useRef(0);
  const touchStartY    = useRef(0);

  // Background sliding images state (hero.jpg, towels.jpg, bed.jpg)
  const [bgIndex, setBgIndex]           = useState(0);
  const [bgTransition, setBgTransition] = useState(true);
  const bgTimerRef                      = useRef<ReturnType<typeof setInterval> | null>(null);

  const [products, setProducts] = useState<Record<Category, Product[]>>({
    pillows: [],
    bedding: [],
    bath: [],
  });
  const [, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/products`);
      if (res.ok) {
        const data = await res.json();
        const grouped: Record<Category, Product[]> = {
          pillows: [],
          bedding: [],
          bath: [],
        };
        if (Array.isArray(data)) {
          data.forEach((p: any) => {
            let cat = p.category as Category;
            if (cat === ('oud' as any) || cat === ('fragrance' as any)) {
              cat = 'pillows';
            }
            const normalizedProduct: Product = {
              ...p,
              price: Number(p.price) || 0,
              originalPrice: p.originalPrice !== undefined && p.originalPrice !== null ? Number(p.originalPrice) : undefined,
              rating: Number(p.rating) || 0,
              reviews: Number(p.reviews) || 0,
              bedding_type: p.bedding_type ?? null,
            };
            if (grouped[cat]) grouped[cat].push(normalizedProduct);
          });
        }
        setProducts(grouped);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchReviews = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/reviews`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setReviews(data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    } finally {
      setReviewsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchReviews();
  }, [fetchProducts, fetchReviews]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const userObj: AuthUser = {
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || 'Guest',
          identifier: firebaseUser.email || firebaseUser.phoneNumber || '',
          method: firebaseUser.phoneNumber ? 'phone' : 'google',
          photoURL: firebaseUser.photoURL || undefined,
        };
        setCurrentUser(userObj);
      } else {
        setCurrentUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleWriteReviewClick = useCallback(() => {
    if (!currentUser) {
      setPendingReviewOpen(true);
      setShowLoginModal(true);
    } else {
      setShowReviewModal(true);
    }
  }, [currentUser]);

  // Load cart from localStorage once user is known
  useEffect(() => {
    if (currentUser?.uid) {
      setCartItems(getStoredCart(currentUser.uid));
    } else {
      setCartItems([]);
    }
  }, [currentUser?.uid]);

  const showCartToast = useCallback((product: Product) => {
    if (cartToastTimer.current) clearTimeout(cartToastTimer.current);
    setCartToast({ name: product.name, image: product.image, visible: true });
    cartToastTimer.current = setTimeout(() => {
      setCartToast(null);
    }, 2800);
  }, []);

  const onAddToCart = useCallback((product: Product, config: any) => {
    if (!auth.currentUser) {
      setPendingCartItem({ product, config });
      setShowLoginModal(true);
      return;
    }
    const uid = auth.currentUser.uid;
    setCartItems(prev => {
      const existing = prev.find(item => item.productId === product.id);
      let updated: CartItem[];
      if (existing) {
        updated = prev.map(item =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        updated = [...prev, {
          productId: product.id,
          name: product.name,
          subtitle: product.subtitle,
          price: product.price,
          originalPrice: product.originalPrice,
          image: product.image,
          quantity: 1,
          configBg: config.bg,
          configPanel: config.panel,
          badge: product.badge,
        }];
      }
      saveStoredCart(uid, updated);
      return updated;
    });
    showCartToast(product);
  }, [showCartToast]);

  const onClearCart = useCallback(() => {
    const uid = auth.currentUser?.uid;
    if (uid) clearStoredCart(uid);
    setCartItems([]);
  }, []);

  const onLoginSuccess = useCallback((user: AuthUser) => {
    setCurrentUser(user);
    setShowLoginModal(false);
    if (pendingReviewOpen) {
      setPendingReviewOpen(false);
      setTimeout(() => setShowReviewModal(true), 120);
    }
    if (pendingCartItem) {
      // Small timeout to let state updates settle and avoid visual jitter
      setTimeout(() => {
        onAddToCart(pendingCartItem.product, pendingCartItem.config);
        setPendingCartItem(null);
      }, 100);
    }
  }, [pendingCartItem, onAddToCart]);

  const onUpdateQty = useCallback((productId: string | number, qty: number) => {
    const uid = auth.currentUser?.uid;
    setCartItems(prev => {
      const updated = prev.map(item =>
        item.productId === productId ? { ...item, quantity: qty } : item
      );
      if (uid) saveStoredCart(uid, updated);
      return updated;
    });
  }, []);

  const onRemove = useCallback((productId: string | number) => {
    const uid = auth.currentUser?.uid;
    setCartItems(prev => {
      const updated = prev.filter(item => item.productId !== productId);
      if (uid) saveStoredCart(uid, updated);
      return updated;
    });
  }, []);

  const handleSignOut = useCallback(async () => {
    try {
      await firebaseSignOut();
      setCurrentUser(null);
      setCartItems([]);
    } catch (err) {
      console.error('Failed to sign out:', err);
    }
  }, []);

  // ── Preload images ──
  useEffect(() => {
    IMAGES.forEach(({ src }) => { const i = new Image(); i.src = src; });
    HERO_BG_ITEMS.forEach(({ src }) => { const i = new Image(); i.src = src; });
  }, []);

  // ── Background sliding navigation & auto-advance ──
  const nextBgSlide = useCallback(() => {
    if (isAnimatingRef.current) return; // Never slide background if product is animating
    setBgTransition(true);
    setIsBgAnimating(true);
    isBgAnimatingRef.current = true;
    setBgIndex(prev => prev + 1);
    if (bgAnimTimer.current) clearTimeout(bgAnimTimer.current);
    bgAnimTimer.current = setTimeout(() => {
      setIsBgAnimating(false);
      isBgAnimatingRef.current = false;
    }, BG_TRANSITION_DUR + 50);
  }, []);

  const goToBgSlide = useCallback((targetIndex: number) => {
    setBgTransition(true);
    setIsBgAnimating(true);
    isBgAnimatingRef.current = true;
    setBgIndex(targetIndex);
    if (bgAnimTimer.current) clearTimeout(bgAnimTimer.current);
    bgAnimTimer.current = setTimeout(() => {
      setIsBgAnimating(false);
      isBgAnimatingRef.current = false;
    }, BG_TRANSITION_DUR + 50);
  }, []);

  // Infinite loop reset when reaching cloned slide
  useEffect(() => {
    if (bgIndex >= HERO_BG_ITEMS.length) {
      const resetTimer = setTimeout(() => {
        setBgTransition(false);
        setBgIndex(0);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setBgTransition(true);
          });
        });
      }, BG_TRANSITION_DUR);
      return () => clearTimeout(resetTimer);
    }
  }, [bgIndex]);

  // Auto-slide background on separate timing (BG_DELAY = 7500ms), avoiding product animation
  useEffect(() => {
    if (isHovered) {
      if (bgTimerRef.current) { clearInterval(bgTimerRef.current); bgTimerRef.current = null; }
      return;
    }
    bgTimerRef.current = setInterval(() => {
      if (!isAnimatingRef.current) {
        nextBgSlide();
      }
    }, BG_DELAY);
    return () => {
      if (bgTimerRef.current) clearInterval(bgTimerRef.current);
    };
  }, [isHovered, nextBgSlide]);

  // ── Responsive breakpoint ──
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // ── Cleanup ──
  useEffect(() => () => {
    if (animTimer.current) clearTimeout(animTimer.current);
    if (bgAnimTimer.current) clearTimeout(bgAnimTimer.current);
    if (autoTimer.current) clearInterval(autoTimer.current);
    if (bgTimerRef.current) clearInterval(bgTimerRef.current);
  }, []);

  // ── Navigate product (arrow buttons, dots, swipe, keyboard, or auto-advance) ──
  const navigate = useCallback((dir: Direction, resetAuto = true) => {
    if (isAnimatingRef.current || isBgAnimatingRef.current) return;
    setIsAnimating(true);
    isAnimatingRef.current = true;
    setProgressKey(k => k + 1); // restart progress bar
    setActiveIndex(p => dir === 'next' ? (p + 1) % IMAGES.length : (p - 1 + IMAGES.length) % IMAGES.length);
    // Note: product moves on the arrow independently — background is NOT moved here
    if (animTimer.current) clearTimeout(animTimer.current);
    animTimer.current = setTimeout(() => {
      setIsAnimating(false);
      isAnimatingRef.current = false;
    }, 680);
    // If user navigated manually, reset the product auto-advance interval
    if (resetAuto && autoTimer.current) {
      clearInterval(autoTimer.current);
      autoTimer.current = setInterval(() => {
        if (!isBgAnimatingRef.current) {
          navigate('next', false);
        }
      }, PRODUCT_DELAY);
    }
  }, []);

  // ── Auto-advance product on its timing (PRODUCT_DELAY = 4000ms), avoiding background animation ──
  useEffect(() => {
    if (isHovered) {
      if (autoTimer.current) { clearInterval(autoTimer.current); autoTimer.current = null; }
      return;
    }
    autoTimer.current = setInterval(() => {
      if (!isBgAnimatingRef.current) {
        navigate('next', false);
      }
    }, PRODUCT_DELAY);
    return () => { if (autoTimer.current) clearInterval(autoTimer.current); };
  }, [isHovered, navigate]);

  // ── Keyboard ──
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') navigate('next');
      if (e.key === 'ArrowLeft')  navigate('prev');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate]);

  // ── Touch swipe ──
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 44) {
      navigate(dx < 0 ? 'next' : 'prev');
    }
  }, [navigate]);

  // ── Role mapping ──
  const getRole = (i: number): Role => {
    const len = IMAGES.length;
    if (i === activeIndex) return 'center';
    if (i === (activeIndex - 1 + len) % len) return 'left';
    if (i === (activeIndex + 1) % len) return 'right';
    return 'back';
  };

  if (showCart && currentUser) {
    return (
      <CartPage
        items={cartItems}
        user={currentUser}
        onBack={() => setShowCart(false)}
        onUpdateQty={onUpdateQty}
        onRemove={onRemove}
        onClearCart={onClearCart}
        onOpenOrders={() => { setShowCart(false); setShowOrdersModal(true); }}
      />
    );
  }

  if (discoveryCategory) {
    return (
      <DiscoveryPage
        category={discoveryCategory}
        products={products[discoveryCategory] ?? []}
        onBack={() => setDiscoveryCategory(null)}
        onCategoryChange={setDiscoveryCategory}
        onAddToCart={onAddToCart}
        cartItemsCount={cartItems.reduce((acc, item) => acc + item.quantity, 0)}
        onCartClick={() => {
          if (!currentUser) {
            setShowLoginModal(true);
          } else {
            setShowCart(true);
          }
        }}
        user={currentUser}
        onSignOut={handleSignOut}
        onSignInClick={() => setShowLoginModal(true)}
      />
    );
  }

  return (
    <div
      style={{
        background      : "radial-gradient(circle at center, rgba(15, 15, 15, 0.9) 0%, rgba(0, 0, 0, 1) 100%)",
        fontFamily      : "'Inter', sans-serif",
      }}
      className="relative w-full overflow-x-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* ── Viewport ── */}
      <div
        style={{ height: '100vh', overflow: 'hidden' }}
        className="relative w-full"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >

        {/* 1 · Grain overlay */}
        <div
          aria-hidden="true"
          style={{
            position        : 'absolute',
            inset           : 0,
            pointerEvents   : 'none',
            zIndex          : 50,
            backgroundImage : `url("${GRAIN_SVG}")`,
            backgroundSize  : '200px 200px',
            backgroundRepeat: 'repeat',
            opacity         : 0.4,
          }}
        />

        {/* 2 · Hero Background Sliding Images (hero.jpg, towels.jpg, bed.jpg) */}
        <div
          aria-hidden="true"
          style={{
            position        : 'absolute',
            inset           : 0,
            overflow        : 'hidden',
            pointerEvents   : 'none',
            zIndex          : 1,
            animation       : 'heroFadeIn 1.8s cubic-bezier(0.25, 1, 0.5, 1) forwards',
          }}
        >
          {/* Smooth Sliding Track */}
          <div
            style={{
              position  : 'absolute',
              inset     : 0,
              width     : `${HERO_BG_SLIDES.length * 100}%`,
              height    : '100%',
              display   : 'flex',
              transform : `translateX(-${(bgIndex * 100) / HERO_BG_SLIDES.length}%)`,
              transition: bgTransition
                ? `transform ${BG_TRANSITION_DUR}ms cubic-bezier(0.22, 1, 0.36, 1)`
                : 'none',
              willChange: 'transform',
            }}
          >
            {HERO_BG_SLIDES.map((slide, idx) => (
              <div
                key={idx}
                style={{
                  width     : `${100 / HERO_BG_SLIDES.length}%`,
                  height    : '100%',
                  position  : 'relative',
                  flexShrink: 0,
                  overflow  : 'hidden',
                }}
              >
                <div
                  style={{
                    width             : '100%',
                    height            : '100%',
                    backgroundImage   : `url('${slide.src}')`,
                    backgroundSize    : 'cover',
                    backgroundPosition: slide.position,
                    backgroundRepeat  : 'no-repeat',
                    opacity           : 0.78,
                    filter            : 'saturate(1.08) contrast(1.04)',
                    imageRendering    : 'auto',
                    WebkitBackfaceVisibility: 'hidden',
                    backfaceVisibility: 'hidden',
                    transform         : (bgIndex % HERO_BG_ITEMS.length) === (idx % HERO_BG_ITEMS.length)
                      ? 'scale(1.015) translateZ(0)'
                      : 'scale(1) translateZ(0)',
                    transition        : 'transform 6s ease-out',
                  }}
                />
              </div>
            ))}
          </div>

          {/* Luxury atmosphere vignette & gradients */}
          <div
            style={{
              position        : 'absolute',
              inset           : 0,
              background      : 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0.02) 0%, rgba(5,5,5,0.55) 60%, rgba(5,5,5,0.95) 100%)',
            }}
          />
          <div
            style={{
              position        : 'absolute',
              top             : 0,
              left            : 0,
              right           : 0,
              height          : '140px',
              background      : 'linear-gradient(180deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)',
            }}
          />
          <div
            style={{
              position        : 'absolute',
              bottom          : 0,
              left            : 0,
              right           : 0,
              height          : '280px',
              background      : 'linear-gradient(0deg, #050505 0%, rgba(5,5,5,0.85) 50%, transparent 100%)',
            }}
          />
        </div>


        {/* 3 · Brand + Navigation header */}
        <div
          style={{
            position      : 'absolute',
            top           : '1rem',
            zIndex        : 60,
            display       : 'flex',
            alignItems    : 'center',
            justifyContent: 'space-between',
            width         : '100%',
            paddingLeft   : isMobile ? '1rem' : '1.75rem',
            paddingRight  : isMobile ? '1rem' : '1.75rem',
            boxSizing     : 'border-box',
          }}
        >
          {/* Logo brand in Navbar */}
          <div
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            style={{
              display    : 'flex',
              alignItems : 'center',
              gap        : isMobile ? '0.55rem' : '0.75rem',
              cursor     : 'pointer',
              userSelect : 'none',
              transition : 'transform 0.25s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.03)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <img
              src="/logo.png"
              alt="HIJAZ Logo"
              style={{
                height    : isMobile ? '38px' : '48px',
                width     : 'auto',
                objectFit : 'contain',
                filter    : 'drop-shadow(0 2px 10px rgba(212, 175, 55, 0.4))',
              }}
            />
            <span
              style={{
                fontSize     : isMobile ? '0.78rem' : '0.88rem',
                fontWeight   : 800,
                textTransform: 'uppercase',
                color        : 'white',
                opacity      : 0.95,
                letterSpacing: '0.22em',
              }}
            >
              HIJAZ
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.5rem' : '0.75rem' }}>
            {/* Subtle Luxury Scene Indicators */}
            <div
              style={{
                display    : 'flex',
                alignItems : 'center',
                gap        : '0.35rem',
                marginRight: isMobile ? '0.25rem' : '0.75rem',
                padding    : '0.25rem 0.5rem',
                borderRadius: '999px',
                background : 'rgba(255, 255, 255, 0.04)',
                border     : '1px solid rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(8px)',
              }}
            >
              {HERO_BG_ITEMS.map((item, i) => {
                const isActive = (bgIndex % HERO_BG_ITEMS.length) === i;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => goToBgSlide(i)}
                    title={`Scene: ${item.label}`}
                    aria-label={`Slide to ${item.label}`}
                    style={{
                      width       : isActive ? (isMobile ? '16px' : '22px') : '6px',
                      height      : '6px',
                      borderRadius: '999px',
                      background  : isActive
                        ? 'linear-gradient(90deg, #d4af37, #b8860b)'
                        : 'rgba(255, 255, 255, 0.28)',
                      border      : 'none',
                      cursor      : 'pointer',
                      padding     : 0,
                      transition  : 'all 350ms cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow   : isActive ? '0 0 8px rgba(212, 175, 55, 0.6)' : 'none',
                    }}
                  />
                );
              })}
            </div>
            {/* Your Orders button */}
            {currentUser && (
              <button
                id="orders-btn"
                aria-label="Your Orders"
                onClick={() => setShowOrdersModal(true)}
                style={{
                  display       : 'flex',
                  alignItems    : 'center',
                  justifyContent: 'center',
                  gap           : '0.375rem',
                  padding       : isMobile ? '0' : '0.375rem 0.875rem',
                  width         : isMobile ? '36px' : 'auto',
                  height        : isMobile ? '36px' : 'auto',
                  borderRadius  : isMobile ? '50%' : '999px',
                  border        : '1.5px solid rgba(155,106,69,0.4)',
                  background    : 'rgba(155,106,69,0.08)',
                  backdropFilter: 'blur(8px)',
                  color         : '#c8976a',
                  fontSize      : '0.72rem',
                  fontWeight    : 600,
                  letterSpacing : '0.08em',
                  textTransform : 'uppercase',
                  cursor        : 'pointer',
                  transition    : 'all 200ms ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(155,106,69,0.2)'; e.currentTarget.style.color = '#d4af37'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(155,106,69,0.08)'; e.currentTarget.style.color = '#c8976a'; }}
              >
                <Package size={isMobile ? 15 : 13} />
                {!isMobile && 'My Orders'}
              </button>
            )}

            {/* Cart Icon with count */}
            <button
              onClick={() => {
                if (!currentUser) {
                  setShowLoginModal(true);
                } else {
                  setShowCart(true);
                }
              }}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: isMobile ? '36px' : '36px',
                height: isMobile ? '36px' : '36px',
                borderRadius: '50%',
                border: '1.5px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.05)',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 200ms ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
            >
              <ShoppingBag size={15} />
              {cartItems.reduce((acc, item) => acc + item.quantity, 0) > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  background: 'linear-gradient(135deg, #7A4E2D, #9B6A45)',
                  color: 'white',
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                }}>
                  {cartItems.reduce((acc, item) => acc + item.quantity, 0)}
                </span>
              )}
            </button>

            {/* Auth status / Sign in */}
            {currentUser ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                {!isMobile && (
                  <button
                    onClick={handleSignOut}
                    title="Sign Out"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      border: '1.5px solid rgba(255,255,255,0.15)',
                      background: 'rgba(255,255,255,0.05)',
                      color: 'rgba(255,255,255,0.65)',
                      cursor: 'pointer',
                      transition: 'all 200ms ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = '#f87171'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; }}
                  >
                    <LogOut size={14} />
                  </button>
                )}
                {/* Avatar — tap to sign out on mobile */}
                <div
                  onClick={isMobile ? handleSignOut : undefined}
                  title={isMobile ? 'Tap to Sign Out' : undefined}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #7A4E2D, #9B6A45)',
                    border: '1.5px solid rgba(255,255,255,0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: 'white',
                    cursor: isMobile ? 'pointer' : 'default',
                  }}
                >
                  {currentUser.photoURL ? (
                    <img src={currentUser.photoURL} alt={currentUser.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    currentUser.name.charAt(0).toUpperCase()
                  )}
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                style={{
                  display       : 'flex',
                  alignItems    : 'center',
                  justifyContent: 'center',
                  gap           : '0.375rem',
                  padding       : isMobile ? '0' : '0.375rem 0.875rem',
                  width         : isMobile ? '36px' : 'auto',
                  height        : isMobile ? '36px' : 'auto',
                  borderRadius  : isMobile ? '50%' : '999px',
                  border        : '1.5px solid rgba(255,255,255,0.15)',
                  background    : 'rgba(255,255,255,0.05)',
                  backdropFilter: 'blur(8px)',
                  color         : 'white',
                  fontSize      : '0.72rem',
                  fontWeight    : 600,
                  letterSpacing : '0.08em',
                  textTransform : 'uppercase',
                  cursor        : 'pointer',
                  transition    : 'all 200ms ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
              >
                <UserIcon size={isMobile ? 15 : 13} />
                {!isMobile && 'Sign In'}
              </button>
            )}
          </div>
        </div>

        {/* 4 · Carousel — perspective gives subtle depth to the scale changes */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 3, perspective: '1400px' }}>
          {IMAGES.map((img, i) => {
            const role = getRole(i);
            return (
              <div
                key={i}
                style={getRoleStyle(role, isMobile)}
                onClick={() => {
                  if (role === 'left')  navigate('prev');
                  if (role === 'right') navigate('next');
                }}
              >
                {/*
                  Inner wrapper carries the float loop ONLY while center.
                  Kept separate so the float keyframe never interferes with
                  the position transition on the outer div.
                */}
                <div
                  style={{
                    width    : '100%',
                    height   : '100%',
                    animation: role === 'center'
                      ? 'toonFloat 4s ease-in-out infinite'
                      : 'none',
                  }}
                >
                  <img
                    src={img.src}
                    alt={`HIJAZ product ${i + 1}`}
                    draggable={false}
                    style={{
                      width         : '100%',
                      height        : '100%',
                      objectFit     : img.src === '/bed.png' ? 'cover' : 'contain',
                      objectPosition: img.src === '/bed.png' ? 'center 30%' : 'bottom center',
                      display       : 'block',
                      transform     : img.src === '/bed1.png'
                        ? 'scale(1.2)'
                        : img.src === '/bath1.png'
                          ? 'scale(1.2)'
                          : 'none',
                      transformOrigin: 'bottom center',
                      maskImage     : img.src === '/bed1.png'
                        ? 'linear-gradient(to bottom, black 82%, transparent 100%)'
                        : 'none',
                      WebkitMaskImage: img.src === '/bed1.png'
                        ? 'linear-gradient(to bottom, black 82%, transparent 100%)'
                        : 'none',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* 5 · Bottom UI — stacked layout on mobile */}
        {isMobile ? (
          /* ── Mobile: single column at the very bottom ── */
          <div style={{
            position      : 'absolute',
            bottom        : '7.5rem',
            left          : 0,
            right         : 0,
            zIndex        : 60,
            display       : 'flex',
            flexDirection : 'column',
            alignItems    : 'center',
            gap           : '0.45rem',
            padding       : '0 1.25rem',
            textAlign     : 'center',
            pointerEvents : 'none',
          }}>
            <p style={{
              fontWeight   : 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color        : 'white',
              fontSize     : 'clamp(1rem, 4.5vw, 1.25rem)',
              margin       : 0,
              textShadow   : '0 2px 10px rgba(0,0,0,0.8)',
              pointerEvents: 'auto',
            }}>
              {IMAGES[activeIndex].title}
            </p>
            <p style={{
              fontSize     : 'clamp(0.72rem, 3.2vw, 0.82rem)',
              color        : 'rgba(255, 255, 255, 0.75)',
              lineHeight   : 1.35,
              margin       : 0,
              maxWidth     : '320px',
              textShadow   : '0 1px 6px rgba(0,0,0,0.8)',
              pointerEvents: 'auto',
              display      : '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow     : 'hidden',
            }}>
              {IMAGES[activeIndex].desc}
            </p>
            <div style={{
              display       : 'flex',
              gap           : '0.85rem',
              alignItems    : 'center',
              justifyContent: 'center',
              width         : '100%',
              maxWidth      : '360px',
              marginTop     : '0.2rem',
              pointerEvents : 'auto',
            }}>
              <NavButton id="btn-prev" label="Previous figurine" isMobile={isMobile} onClick={() => navigate('prev')}>
                <ArrowLeft size={20} strokeWidth={2.5} />
              </NavButton>
              <DiscoverLink onClick={() => setDiscoveryCategory(IMAGES[activeIndex].category)} isMobile={true} />
              <NavButton id="btn-next" label="Next figurine" isMobile={isMobile} onClick={() => navigate('next')}>
                <ArrowRight size={20} strokeWidth={2.5} />
              </NavButton>
            </div>
          </div>
        ) : (
          /* ── Desktop: split corners ── */
          <>
            <div
              style={{ position: 'absolute', zIndex: 60, maxWidth: 340 }}
              className="bottom-20 left-24"
            >
              <p style={{
                fontWeight   : 700,
                textTransform: 'uppercase',
                letterSpacing: '0.02em',
                color        : 'white',
                opacity      : 0.95,
                marginBottom : '0.75rem',
                fontSize     : '22px',
              }}>
                {IMAGES[activeIndex].title}
              </p>

              <p style={{
                fontSize    : '0.875rem',
                color       : 'white',
                opacity     : 0.85,
                lineHeight  : 1.6,
                marginBottom: '1.25rem',
              }}>
                {IMAGES[activeIndex].desc}
              </p>

              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <NavButton id="btn-prev" label="Previous figurine" isMobile={isMobile} onClick={() => navigate('prev')}>
                  <ArrowLeft size={26} strokeWidth={2.25} />
                </NavButton>
                <NavButton id="btn-next" label="Next figurine" isMobile={isMobile} onClick={() => navigate('next')}>
                  <ArrowRight size={26} strokeWidth={2.25} />
                </NavButton>
              </div>
            </div>

            <div
              style={{ position: 'absolute', zIndex: 60 }}
              className="bottom-20 right-10"
            >
              <DiscoverLink onClick={() => setDiscoveryCategory(IMAGES[activeIndex].category)} isMobile={false} />
            </div>
          </>
        )}

        {/* Scroll Down Indicator — only on desktop to avoid clutter on mobile */}
        {!isMobile && (
          <div
            style={{
              position: 'absolute',
              bottom: '4.5rem',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 60,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.25rem',
              color: 'white',
              cursor: 'pointer',
              opacity: 0.8,
              animation: 'scrollBounce 2s infinite',
              transition: 'opacity 200ms ease',
            }}
            onClick={() => {
              const aboutSec = document.getElementById('about-section');
              if (aboutSec) aboutSec.scrollIntoView({ behavior: 'smooth' });
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.8'; }}
          >
            <span style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255, 255, 255, 0.4)' }}>
              SCROLL DOWN
            </span>
            <ChevronDown size={18} strokeWidth={2.5} style={{ color: '#9B6A45' }} />
          </div>
        )}

        {/* 7 · Auto-play progress bar + dots */}
        <div
          aria-hidden="true"
          style={{
            position   : 'absolute',
            bottom     : isMobile ? '0.85rem' : '0',
            left       : 0,
            right      : 0,
            zIndex     : 61,
            display    : 'flex',
            flexDirection: 'column',
            alignItems : 'center',
            gap        : '8px',
            paddingBottom: isMobile ? '0' : '14px',
            pointerEvents: 'none',
          }}
        >
          {/* Dot indicators */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', pointerEvents: 'auto' }}>
            {IMAGES.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => navigate(i > activeIndex ? 'next' : 'prev')}
                aria-label={`Go to slide ${i + 1}`}
                style={{
                  width           : i === activeIndex ? '24px' : '8px',
                  height          : '8px',
                  borderRadius    : '9999px',
                  background      : 'white',
                  opacity         : i === activeIndex ? 1 : 0.4,
                  border          : 'none',
                  cursor          : 'pointer',
                  padding         : 0,
                  transition      : 'width 300ms ease, opacity 300ms ease',
                  pointerEvents   : 'auto',
                  touchAction     : 'manipulation',
                }}
              />
            ))}
          </div>

          {/* Progress bar — CSS animation refills each slide via key */}
          <div style={{
            width           : '120px',
            height          : '2px',
            borderRadius    : '9999px',
            background      : 'rgba(255,255,255,0.25)',
            overflow        : 'hidden',
            pointerEvents   : 'none',
          }}>
            <div
              key={progressKey}
              style={{
                height          : '100%',
                borderRadius    : '9999px',
                background      : 'white',
                transformOrigin : 'left center',
                animation       : isHovered
                  ? 'none'
                  : `toonProgress ${AUTO_DELAY}ms linear forwards`,
              }}
            />
          </div>
        </div>

      </div>

      {/* About Section */}
      <AboutSection />

      {/* Reviews Section */}
      <ReviewsSection
        reviews={reviews}
        loading={reviewsLoading}
        currentUser={currentUser}
        onWriteReviewClick={handleWriteReviewClick}
      />

      {/* Contact Section */}
      <ContactSection />

      {showLoginModal && (
        <LoginModal
          onSuccess={onLoginSuccess}
          onClose={() => {
            setShowLoginModal(false);
            setPendingCartItem(null);
            setPendingReviewOpen(false);
          }}
        />
      )}

      {/* Review Modal */}
      {showReviewModal && currentUser && (
        <ReviewModal
          user={currentUser}
          products={Object.values(products).flat()}
          onClose={() => setShowReviewModal(false)}
          onSuccess={() => {
            setShowReviewModal(false);
            fetchReviews();
            fetchProducts();
            setReviewToast(true);
            setTimeout(() => setReviewToast(false), 4000);
          }}
        />
      )}

      {/* Orders Modal */}
      <OrdersModal
        isOpen={showOrdersModal}
        onClose={() => setShowOrdersModal(false)}
        user={currentUser}
        onContinueShopping={() => setShowOrdersModal(false)}
      />

      {/* Review Published Toast */}
      {reviewToast && (
        <div
          style={{
            position      : 'fixed',
            bottom        : isMobile ? '4.5rem' : '2.5rem',
            left          : '50%',
            transform     : 'translateX(-50%)',
            background    : 'linear-gradient(160deg, #181512 0%, #0d0b09 100%)',
            border        : '1.5px solid rgba(212, 175, 55, 0.45)',
            borderRadius  : '999px',
            padding       : '0.8rem 1.6rem',
            color         : 'white',
            fontSize      : '0.85rem',
            fontWeight    : 700,
            display       : 'flex',
            alignItems    : 'center',
            gap           : '0.6rem',
            boxShadow     : '0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(212,175,55,0.25)',
            zIndex        : 9500,
            animation     : 'toastFadeIn 250ms ease forwards',
            whiteSpace    : 'nowrap',
          }}
        >
          <CheckCircle2 size={18} color="#d4af37" />
          <span>✨ Thank you! Your review has been published.</span>
        </div>
      )}

      {/* Add-to-Cart Toast */}
      {cartToast && (
        <div
          style={{
            position      : 'fixed',
            bottom        : 'env(safe-area-inset-bottom, 1rem)',
            left          : isMobile ? '0.75rem' : 'auto',
            right         : isMobile ? '0.75rem' : '1.5rem',
            marginBottom  : isMobile ? '0.75rem' : '0.75rem',
            zIndex        : 9000,
            display       : 'flex',
            alignItems    : 'center',
            gap           : '0.75rem',
            padding       : '0.85rem 1rem',
            borderRadius  : '18px',
            background    : 'rgba(13,13,13,0.97)',
            border        : '1px solid rgba(155,106,69,0.4)',
            boxShadow     : '0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(155,106,69,0.12)',
            backdropFilter: 'blur(20px)',
            width         : isMobile ? 'auto' : 'auto',
            maxWidth      : isMobile ? '100%' : '340px',
            minWidth      : isMobile ? 'unset' : '280px',
            fontFamily    : "'Inter', sans-serif",
            color         : 'white',
            transform     : cartToast.visible ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.97)',
            opacity       : cartToast.visible ? 1 : 0,
            transition    : 'transform 320ms cubic-bezier(0.34,1.56,0.64,1), opacity 300ms ease',
          }}
        >
          {/* Product thumbnail */}
          <img
            src={cartToast.image}
            alt={cartToast.name}
            style={{
              width       : '44px',
              height      : '44px',
              borderRadius: '10px',
              objectFit   : 'cover',
              background  : '#1a1a1a',
              flexShrink  : 0,
              border      : '1px solid rgba(255,255,255,0.08)',
            }}
          />

          {/* Text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.15rem' }}>
              <CheckCircle2 size={12} color="#86efac" strokeWidth={2.5} />
              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#86efac', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Added to Cart
              </span>
            </div>
            <p style={{ fontSize: '0.82rem', fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {cartToast.name}
            </p>
          </div>

          {/* View Cart */}
          <button
            onClick={() => {
              setCartToast(null);
              if (!currentUser) { setShowLoginModal(true); } else { setShowCart(true); }
            }}
            style={{
              flexShrink    : 0,
              padding       : '0.45rem 0.8rem',
              borderRadius  : '10px',
              border        : 'none',
              background    : 'linear-gradient(135deg, #7A4E2D, #9B6A45)',
              color         : 'white',
              fontSize      : '0.73rem',
              fontWeight    : 700,
              cursor        : 'pointer',
              whiteSpace    : 'nowrap',
              transition    : 'opacity 150ms ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
          >
            View Cart
          </button>

          {/* Close button */}
          <button
            onClick={() => setCartToast(null)}
            aria-label="Dismiss"
            style={{
              flexShrink  : 0,
              width       : '28px',
              height      : '28px',
              borderRadius: '50%',
              border      : '1px solid rgba(255,255,255,0.1)',
              background  : 'rgba(255,255,255,0.04)',
              color       : 'rgba(255,255,255,0.5)',
              display     : 'flex',
              alignItems  : 'center',
              justifyContent: 'center',
              cursor      : 'pointer',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
          >
            <X size={13} />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── About Section ────────────────────────────────────────────────────────────

function AboutSection() {
  return (
    <section
      id="about-section"
      style={{
        position: 'relative',
        zIndex: 10,
        color: 'white',
        background: 'linear-gradient(180deg, #050505 0%, #0a0805 50%, #050505 100%)',
        overflow: 'hidden',
      }}
    >
      {/* Grain overlay matching hero */}
      <div
        aria-hidden="true"
        style={{
          position        : 'absolute',
          inset           : 0,
          pointerEvents   : 'none',
          zIndex          : 0,
          backgroundImage : `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='200' height='200' filter='url(%23n)' opacity='0.08'/></svg>")`,
          backgroundSize  : '200px 200px',
          backgroundRepeat: 'repeat',
          opacity         : 0.35,
        }}
      />
      {/* Subtle ambient glow */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(184, 168, 154, 0.03) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Gold top divider */}
      <div style={{
        height: '1px',
        background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.25), rgba(184,134,11,0.35), rgba(212,175,55,0.25), transparent)',
      }} />

      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: 'clamp(4rem, 10vw, 8rem) clamp(1.25rem, 5vw, 3rem)',
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
          gap: 'clamp(2rem, 6vw, 4rem)',
          alignItems: 'center',
        }}>
          {/* Brand Story */}
          <div>
            <p style={{
              fontSize: '0.7rem',
              fontWeight: 800,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: '#9B6A45',
              marginBottom: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
            }}>
              <span style={{ display: 'inline-block', width: '28px', height: '1px', background: 'linear-gradient(90deg, #9B6A45, #d4af37)' }} />
              Our Legacy
            </p>
            <h2 style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 'clamp(1.75rem, 5vw, 3.5rem)',
              fontWeight: 900,
              lineHeight: 1.05,
              color: 'white',
              margin: 0,
              textTransform: 'uppercase',
              letterSpacing: '-0.02em',
            }}>
              Crafting<br />
              <span style={{
                background: 'linear-gradient(135deg, #d4af37 0%, #b8860b 50%, #c8976a 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>Sensory Luxury</span>
            </h2>
            <p style={{
              marginTop: '1.5rem',
              fontSize: 'clamp(0.9rem, 2.5vw, 1.05rem)',
              lineHeight: 1.8,
              color: 'rgba(255, 255, 255, 0.55)',
            }}>
              HIJAZ is born from a desire to elevate daily rituals into transcendent sensory experiences.
              We meticulously blend ancient Middle Eastern heritage with modern refinement.
              From the deep, mysterious depths of hand-selected agarwood to the crisp luxury of organic cotton bedding,
              every product is an invitation to explore a world of uncompromised quality.
            </p>
            <p style={{
              marginTop: '1rem',
              fontSize: 'clamp(0.85rem, 2.5vw, 1rem)',
              lineHeight: 1.8,
              color: 'rgba(255, 255, 255, 0.35)',
            }}>
              Our perfumes are bottled in hand-finished decanters, our textiles woven by master craftsmen, and our home fragrances curated to define the ambience of sophisticated living.
            </p>

            {/* Gold accent rule */}
            <div style={{
              marginTop: '2rem',
              height: '1px',
              width: '80px',
              background: 'linear-gradient(90deg, #d4af37, transparent)',
            }} />
          </div>

          {/* Brand Highlights (2x2 Grid) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 'clamp(0.75rem, 2vw, 1rem)',
          }}>
            {[
              { title: 'Artisanal Crafting', desc: 'Every decanter is hand-filled; every textile woven to order by master weavers.', icon: '🏺' },
              { title: 'Pure Essences',      desc: '100% natural steam-distilled oils and resins, free from synthetic diluents.',    icon: '🌿' },
              { title: 'Eco-Sourced',        desc: 'Sustainably harvested agarwood and organic, fair-trade cotton fibers.',          icon: '🌍' },
              { title: 'Premium Quality',    desc: 'Rigorously tested to maintain rich aromatic notes and plush thread counts.',     icon: '👑' },
            ].map((item, idx) => (
              <div
                key={idx}
                style={{
                  padding: 'clamp(1rem, 3vw, 1.75rem)',
                  borderRadius: '20px',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  background: 'rgba(255, 255, 255, 0.02)',
                  backdropFilter: 'blur(12px)',
                  transition: 'all 320ms cubic-bezier(0.25, 1, 0.5, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(212, 175, 55, 0.04)';
                  e.currentTarget.style.border = '1px solid rgba(212, 175, 55, 0.2)';
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.5), 0 0 20px rgba(212,175,55,0.06)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                  e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.06)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', marginBottom: '0.75rem', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.4))' }}>{item.icon}</div>
                <h3 style={{ fontSize: 'clamp(0.8rem, 2.5vw, 0.95rem)', fontWeight: 700, color: 'rgba(255,255,255,0.9)', margin: '0 0 0.4rem 0', letterSpacing: '0.02em' }}>{item.title}</h3>
                <p style={{ fontSize: 'clamp(0.7rem, 2vw, 0.78rem)', color: 'rgba(255, 255, 255, 0.38)', lineHeight: 1.6, margin: 0 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Gold bottom divider */}
      <div style={{
        height: '1px',
        background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.2), rgba(184,134,11,0.3), rgba(212,175,55,0.2), transparent)',
      }} />
    </section>
  );
}




// ─── Review Modal ─────────────────────────────────────────────────────────────

function ReviewModal({
  user,
  products,
  onClose,
  onSuccess,
}: {
  user: AuthUser;
  products: Product[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [productId, setProductId] = useState<string>('general');
  const [comment, setComment] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || comment.trim().length < 5) {
      setError('Please write at least 5 characters for your review.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const payload: any = {
        customer_name: user.name || 'Verified Customer',
        customer_email: user.identifier || undefined,
        user_uid: user.uid,
        rating,
        comment: comment.trim(),
      };
      if (productId !== 'general') {
        payload.product_id = Number(productId);
      }

      const res = await fetch(`${API_URL}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to submit review');
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const ratingDescriptions: Record<number, string> = {
    5: '5.0 — Exceptional & Royal',
    4: '4.0 — High Quality & Great',
    3: '3.0 — Satisfactory',
    2: '2.0 — Needs Improvement',
    1: '1.0 — Disappointing',
  };

  const activeDisplayRating = hoverRating || rating;

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.82)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        animation: 'fadeIn 200ms ease forwards',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          background: 'linear-gradient(160deg, #181512 0%, #0d0b09 100%)',
          border: '1px solid rgba(212, 175, 55, 0.25)',
          borderRadius: '28px',
          padding: '2.5rem 2rem',
          position: 'relative',
          boxShadow: '0 40px 80px rgba(0,0,0,0.8), 0 0 60px rgba(212,175,55,0.12)',
          animation: 'slideUp 280ms cubic-bezier(0.34,1.28,0.64,1) forwards',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.05)',
            color: 'rgba(255,255,255,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 200ms ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'white'; e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(212,175,55,0.2), rgba(155,106,69,0.2))',
            border: '1.5px solid rgba(212,175,55,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
            boxShadow: '0 8px 24px rgba(212,175,55,0.15)',
          }}>
            <Star size={26} fill="#d4af37" color="#d4af37" />
          </div>
          <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'white', margin: 0, letterSpacing: '-0.01em' }}>
            Share Your Experience
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.35rem', lineHeight: 1.5 }}>
            Your feedback directly guides our craftsmanship and future collections.
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.12)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '12px',
            padding: '0.75rem 1rem',
            color: '#fca5a5',
            fontSize: '0.82rem',
            marginBottom: '1.25rem',
            textAlign: 'center',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Star Rating Selector */}
          <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
            <label style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '0.5rem', fontWeight: 700 }}>
              Your Rating
            </label>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
              {[1, 2, 3, 4, 5].map((star) => {
                const filled = star <= activeDisplayRating;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(null)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0.25rem',
                      transform: star <= activeDisplayRating ? 'scale(1.15)' : 'scale(1)',
                      transition: 'transform 180ms ease',
                    }}
                  >
                    <Star
                      size={32}
                      fill={filled ? '#d4af37' : 'transparent'}
                      color={filled ? '#d4af37' : 'rgba(255,255,255,0.25)'}
                      strokeWidth={1.5}
                    />
                  </button>
                );
              })}
            </div>
            <p style={{ fontSize: '0.78rem', color: '#d4af37', fontWeight: 700, margin: '0.4rem 0 0', minHeight: '1.2rem' }}>
              {ratingDescriptions[activeDisplayRating] || ''}
            </p>
          </div>

          {/* Product / Topic selector */}
          <div>
            <label style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '0.4rem', fontWeight: 700 }}>
              Collection / Product (Optional)
            </label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              style={{
                width: '100%',
                padding: '0.8rem 1rem',
                background: '#151311',
                border: '1.5px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                color: 'white',
                outline: 'none',
                fontSize: '0.88rem',
                fontFamily: 'inherit',
                cursor: 'pointer',
              }}
            >
              <option value="general">✨ General Store & Brand Experience</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  🛍️ {p.name} {p.category ? `(${p.category.toUpperCase()})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Comment Textarea */}
          <div>
            <label style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '0.4rem', fontWeight: 700 }}>
              Your Review
            </label>
            <textarea
              required
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us about the scent sillage, fabric quality, packaging, or customer service..."
              style={{
                width: '100%',
                padding: '0.85rem 1rem',
                background: 'rgba(255,255,255,0.03)',
                border: '1.5px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                color: 'white',
                outline: 'none',
                fontSize: '0.9rem',
                lineHeight: 1.6,
                fontFamily: 'inherit',
                resize: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => { e.target.style.borderColor = '#d4af37'; }}
              onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}
            />
          </div>

          {/* Reviewer Note */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.6rem 0.85rem',
            borderRadius: '10px',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.05)',
          }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #7A4E2D, #9B6A45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.72rem',
              fontWeight: 700,
              color: 'white',
            }}>
              {(user.name || 'U').charAt(0).toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: '0.78rem', color: 'white', fontWeight: 600, margin: 0 }}>
                Posting as <span style={{ color: '#d4af37' }}>{user.name}</span>
              </p>
              <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
                {user.identifier}
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.95rem',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #7A4E2D 0%, #9B6A45 50%, #d4af37 100%)',
              color: 'white',
              fontWeight: 800,
              fontSize: '0.88rem',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              cursor: loading ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 240ms ease',
              boxShadow: '0 8px 24px rgba(155,106,69,0.3)',
              marginTop: '0.5rem',
            }}
          >
            {loading ? (
              <span>Submitting Review...</span>
            ) : (
              <>
                <Send size={15} />
                <span>Publish Review</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Reviews Section ──────────────────────────────────────────────────────────

function ReviewsSection({
  reviews,
  loading,
  currentUser,
  onWriteReviewClick,
}: {
  reviews: ReviewItem[];
  loading: boolean;
  currentUser: AuthUser | null;
  onWriteReviewClick: () => void;
}) {
  return (
    <section
      id="reviews-section"
      style={{
        position: 'relative',
        zIndex: 10,
        color: 'white',
        background: 'linear-gradient(180deg, #050505 0%, #070604 50%, #050505 100%)',
        overflow: 'hidden',
      }}
    >
      {/* Grain overlay */}
      <div
        aria-hidden="true"
        style={{
          position        : 'absolute',
          inset           : 0,
          pointerEvents   : 'none',
          zIndex          : 0,
          backgroundImage : `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='200' height='200' filter='url(%23n)' opacity='0.08'/></svg>")`,
          backgroundSize  : '200px 200px',
          backgroundRepeat: 'repeat',
          opacity         : 0.35,
        }}
      />
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 50% at 50% 60%, rgba(155, 106, 69, 0.04) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.2), rgba(184,134,11,0.3), rgba(212,175,55,0.2), transparent)' }} />
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: 'clamp(3rem, 8vw, 6rem) clamp(1.25rem, 5vw, 3rem) clamp(4rem, 10vw, 8rem)', position: 'relative', zIndex: 1 }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          marginBottom: 'clamp(2rem, 6vw, 3.5rem)',
          flexWrap: 'wrap',
          gap: '1.25rem',
        }}>
          <div>
            <p style={{
              fontSize: '0.7rem',
              fontWeight: 800,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: '#9B6A45',
              marginBottom: '0.65rem',
              display: 'flex', alignItems: 'center', gap: '0.6rem',
            }}>
              <span style={{ display: 'inline-block', width: '28px', height: '1px', background: 'linear-gradient(90deg, #9B6A45, #d4af37)' }} />
              Testimonials &amp; Feedback
            </p>
            <h2 style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 'clamp(1.75rem, 4.5vw, 3rem)',
              fontWeight: 900,
              color: 'white',
              margin: 0,
              textTransform: 'uppercase',
              letterSpacing: '-0.02em',
            }}>
              Customer{' '}
              <span style={{ background: 'linear-gradient(135deg, #d4af37 0%, #b8860b 50%, #c8976a 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Experiences</span>
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {currentUser && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.45rem 0.85rem',
              borderRadius: '999px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              fontSize: '0.76rem',
              color: 'rgba(255, 255, 255, 0.75)',
            }}>
              <div style={{
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #7A4E2D, #9B6A45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.65rem',
                fontWeight: 700,
                color: 'white',
              }}>
                {(currentUser.name || 'U').charAt(0).toUpperCase()}
              </div>
              <span style={{ fontWeight: 600 }}>{currentUser.name}</span>
            </div>
          )}

          {/* Write a Review CTA Button */}
          <button
            onClick={onWriteReviewClick}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1.4rem',
            borderRadius: '999px',
            border: '1.5px solid rgba(212, 175, 55, 0.4)',
            background: 'rgba(212, 175, 55, 0.08)',
            backdropFilter: 'blur(10px)',
            color: '#d4af37',
            fontSize: '0.82rem',
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            transition: 'all 240ms cubic-bezier(0.25, 1, 0.5, 1)',
            boxShadow: '0 4px 20px rgba(212, 175, 55, 0.12)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #7A4E2D, #9B6A45)';
            e.currentTarget.style.color = 'white';
            e.currentTarget.style.borderColor = 'transparent';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(122, 78, 45, 0.35)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(212, 175, 55, 0.08)';
            e.currentTarget.style.color = '#d4af37';
            e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.4)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(212, 175, 55, 0.12)';
          }}
        >
              <Star size={15} fill="#d4af37" color="#d4af37" />
              <span>Write a Review</span>
            </button>
          </div>
        </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'rgba(255,255,255,0.4)' }}>
          <p>Loading customer reviews...</p>
        </div>
      ) : reviews.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '4.5rem 2rem',
          borderRadius: '24px',
          border: '1px dashed rgba(255, 255, 255, 0.1)',
          background: 'rgba(255, 255, 255, 0.015)',
          maxWidth: '560px',
          margin: '0 auto',
        }}>
          <Star size={36} color="#d4af37" style={{ opacity: 0.6, marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white', margin: 0 }}>
            Be the First to Review
          </h3>
          <p style={{ fontSize: '0.88rem', color: 'rgba(255, 255, 255, 0.45)', margin: '0.6rem 0 1.5rem', lineHeight: 1.6 }}>
            Share your experience with our artisanal attars, fine fragrances, and luxury collections.
          </p>
          <button
            onClick={onWriteReviewClick}
            style={{
              padding: '0.65rem 1.4rem',
              borderRadius: '999px',
              border: 'none',
              background: 'linear-gradient(135deg, #7A4E2D, #9B6A45)',
              color: 'white',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Leave a Review
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
          gap: 'clamp(1rem, 3vw, 2rem)',
        }}>
          {reviews.map((rev) => {
            const ratingNum = Number(rev.rating) || 5;
            const initials = (rev.customer_name || 'U').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

            return (
              <div
                key={rev.id}
                style={{
                  padding: '2.25rem 1.85rem',
                  borderRadius: '24px',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  background: 'rgba(255, 255, 255, 0.015)',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 320ms cubic-bezier(0.25, 1, 0.5, 1)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                  e.currentTarget.style.border = '1px solid rgba(212, 175, 55, 0.25)';
                  e.currentTarget.style.transform = 'translateY(-6px)';
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(212, 175, 55, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.015)';
                  e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div>
                  {/* Top rating + product tag */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={15}
                          fill={i < ratingNum ? '#d4af37' : 'transparent'}
                          color={i < ratingNum ? '#d4af37' : 'rgba(255,255,255,0.2)'}
                        />
                      ))}
                    </div>
                    {rev.product ? (
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        color: 'rgba(212, 175, 55, 0.9)',
                        background: 'rgba(212, 175, 55, 0.08)',
                        border: '1px solid rgba(212, 175, 55, 0.2)',
                        padding: '0.2rem 0.55rem',
                        borderRadius: '6px',
                      }}>
                        {rev.product.name}
                      </span>
                    ) : (
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        color: 'rgba(255, 255, 255, 0.45)',
                        background: 'rgba(255, 255, 255, 0.04)',
                        padding: '0.2rem 0.55rem',
                        borderRadius: '6px',
                      }}>
                        Brand Experience
                      </span>
                    )}
                  </div>

                  {/* Review Text */}
                  <p style={{
                    fontSize: '0.925rem',
                    lineHeight: 1.7,
                    color: 'rgba(255, 255, 255, 0.78)',
                    margin: '0 0 1.5rem 0',
                    fontStyle: 'italic',
                  }}>
                    "{rev.comment}"
                  </p>
                </div>

                {/* Reviewer Details */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                  paddingTop: '1.25rem',
                }}>
                  {/* Initials Avatar */}
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #7A4E2D, #9B6A45)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    color: 'white',
                    border: '1.5px solid rgba(255, 255, 255, 0.15)',
                    flexShrink: 0,
                  }}>
                    {initials}
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.88rem', fontWeight: 750, color: 'white', margin: 0 }}>
                      {rev.customer_name}
                    </h4>
                    <p style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.4)', margin: '0.15rem 0 0' }}>
                      Verified Buyer • <span style={{ opacity: 0.85 }}>{formatReviewDate(rev.created_at)}</span>
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        )}
      </div>
      <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.2), rgba(184,134,11,0.3), rgba(212,175,55,0.2), transparent)' }} />
    </section>
  );
}

// ─── Contact Section ──────────────────────────────────────────────────────────

function ContactSection() {
  const [formState, setFormState] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.name || !formState.email || !formState.message) return;

    setLoading(true);
    try {
      await fetch(`${API_URL}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formState),
      });
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setLoading(false);
      setSubmitted(true);
      setFormState({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setSubmitted(false), 5000);
    }
  };

  return (
    <section
      id="contact-section"
      style={{
        position: 'relative',
        zIndex: 10,
        color: 'white',
        background: 'linear-gradient(180deg, #050505 0%, #080705 50%, #050505 100%)',
        overflow: 'hidden',
      }}
    >
      {/* Grain overlay */}
      <div
        aria-hidden="true"
        style={{
          position        : 'absolute',
          inset           : 0,
          pointerEvents   : 'none',
          zIndex          : 0,
          backgroundImage : `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='200' height='200' filter='url(%23n)' opacity='0.08'/></svg>")`,
          backgroundSize  : '200px 200px',
          backgroundRepeat: 'repeat',
          opacity         : 0.35,
        }}
      />
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 50% at 50% 40%, rgba(155, 106, 69, 0.03) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.2), rgba(184,134,11,0.3), rgba(212,175,55,0.2), transparent)' }} />

      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: 'clamp(3rem, 8vw, 6rem) clamp(1.25rem, 5vw, 3rem) clamp(4rem, 10vw, 8rem)',
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
          gap: 'clamp(2rem, 6vw, 4rem)',
          alignItems: 'flex-start',
        }}>
          {/* Contact Info */}
          <div>
            <p style={{
              fontSize: '0.7rem',
              fontWeight: 800,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: '#9B6A45',
              marginBottom: '0.85rem',
              display: 'flex', alignItems: 'center', gap: '0.6rem',
            }}>
              <span style={{ display: 'inline-block', width: '28px', height: '1px', background: 'linear-gradient(90deg, #9B6A45, #d4af37)' }} />
              Get in touch
            </p>
            <h2 style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 'clamp(2rem, 4.5vw, 3rem)',
              fontWeight: 900,
              color: 'white',
              margin: 0,
              textTransform: 'uppercase',
              letterSpacing: '-0.02em',
            }}>
              Connect{' '}
              <span style={{ background: 'linear-gradient(135deg, #d4af37 0%, #b8860b 50%, #c8976a 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>With Us</span>
            </h2>
            <p style={{
              marginTop: '1.25rem',
              fontSize: '1rem',
              lineHeight: 1.7,
              color: 'rgba(255, 255, 255, 0.45)',
              marginBottom: '2.5rem',
            }}>
              For inquiries regarding bespoke decanting, wholesale, bulk orders, or custom luxury linen solutions, please reach out to our concierge team.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{
                width: '44px', height: '44px', borderRadius: '12px',
                border: '1px solid rgba(212,175,55,0.15)',
                background: 'rgba(212,175,55,0.04)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9B6A45',
              }}>
                <Mail size={18} />
              </div>
              <div>
                <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>EMAIL CONCIERGE</p>
                <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'white', margin: '0.2rem 0 0' }}>concierge@hijazluxury.com</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '12px',
                border: '1px solid rgba(212,175,55,0.15)',
                background: 'rgba(212,175,55,0.04)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9B6A45',
              }}>
                <Phone size={18} />
              </div>
              <div>
                <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>PHONE INQUIRIES</p>
                <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'white', margin: '0.2rem 0 0' }}>+971 4 123 4567</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '12px',
                border: '1px solid rgba(212,175,55,0.15)',
                background: 'rgba(212,175,55,0.04)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9B6A45',
              }}>
                <MapPin size={18} />
              </div>
              <div>
                <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>FLAGSHIP LOCATION</p>
                <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'white', margin: '0.2rem 0 0' }}>Royal Pavilion, Downtown Dubai, UAE</p>
              </div>
            </div>
            </div>
          </div>

          {/* Contact Form */}
          <div style={{
            padding: 'clamp(1.25rem, 5vw, 2.5rem)',
            borderRadius: '24px',
            border: '1px solid rgba(212,175,55,0.1)',
            background: 'rgba(212, 175, 55, 0.02)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
          }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'white', margin: '0 0 1.5rem 0', letterSpacing: '0.02em' }}>Send a Message</h3>
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.4rem' }}>Your Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Liam Vance"
                  value={formState.name}
                  onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1.5px solid rgba(255,255,255,0.08)',
                    borderRadius: '10px',
                    color: 'white',
                    outline: 'none',
                    fontSize: '0.875rem',
                    transition: 'all 200ms ease',
                  }}
                  onFocus={(e) => { e.target.style.border = '1.5px solid #9B6A45'; e.target.style.background = 'rgba(255,255,255,0.06)'; }}
                  onBlur={(e) => { e.target.style.border = '1.5px solid rgba(255,255,255,0.08)'; e.target.style.background = 'rgba(255,255,255,0.03)'; }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.4rem' }}>Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={formState.email}
                  onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1.5px solid rgba(255,255,255,0.08)',
                    borderRadius: '10px',
                    color: 'white',
                    outline: 'none',
                    fontSize: '0.875rem',
                    transition: 'all 200ms ease',
                  }}
                  onFocus={(e) => { e.target.style.border = '1.5px solid #9B6A45'; e.target.style.background = 'rgba(255,255,255,0.06)'; }}
                  onBlur={(e) => { e.target.style.border = '1.5px solid rgba(255,255,255,0.08)'; e.target.style.background = 'rgba(255,255,255,0.03)'; }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.4rem' }}>Subject (Optional)</label>
              <input
                type="text"
                placeholder="How can we assist you?"
                value={formState.subject}
                onChange={(e) => setFormState({ ...formState, subject: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1.5px solid rgba(255,255,255,0.08)',
                  borderRadius: '10px',
                  color: 'white',
                  outline: 'none',
                  fontSize: '0.875rem',
                  transition: 'all 200ms ease',
                }}
                onFocus={(e) => { e.target.style.border = '1.5px solid #9B6A45'; e.target.style.background = 'rgba(255,255,255,0.06)'; }}
                onBlur={(e) => { e.target.style.border = '1.5px solid rgba(255,255,255,0.08)'; e.target.style.background = 'rgba(255,255,255,0.03)'; }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.4rem' }}>Message</label>
              <textarea
                required
                rows={4}
                placeholder="Type your message here..."
                value={formState.message}
                onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1.5px solid rgba(255,255,255,0.08)',
                  borderRadius: '10px',
                  color: 'white',
                  outline: 'none',
                  fontSize: '0.875rem',
                  transition: 'all 200ms ease',
                  resize: 'none',
                  fontFamily: 'inherit',
                }}
                onFocus={(e) => { e.target.style.border = '1.5px solid #9B6A45'; e.target.style.background = 'rgba(255,255,255,0.06)'; }}
                onBlur={(e) => { e.target.style.border = '1.5px solid rgba(255,255,255,0.08)'; e.target.style.background = 'rgba(255,255,255,0.03)'; }}
              />
            </div>

            <button
              type="submit"
              disabled={loading || submitted}
              style={{
                width: '100%',
                padding: '0.85rem',
                borderRadius: '10px',
                border: 'none',
                background: submitted 
                  ? '#2e7d32' 
                  : 'linear-gradient(135deg, #7A4E2D, #9B6A45)',
                color: 'white',
                fontWeight: 700,
                fontSize: '0.85rem',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                cursor: (loading || submitted) ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'all 240ms cubic-bezier(0.25, 1, 0.5, 1)',
                boxShadow: submitted ? 'none' : '0 4px 15px rgba(122, 78, 45, 0.25)',
              }}
              onMouseEnter={(e) => {
                if (!loading && !submitted) {
                  e.currentTarget.style.opacity = '0.9';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(122, 78, 45, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading && !submitted) {
                  e.currentTarget.style.opacity = '1';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(122, 78, 45, 0.25)';
                }
              }}
            >
              {loading ? (
                <span>Sending...</span>
              ) : submitted ? (
                <>
                  <CheckCircle size={16} />
                  <span>Message Sent</span>
                </>
              ) : (
                <>
                  <Send size={14} />
                  <span>Send Message</span>
                </>
              )}
            </button>
          </form>
          </div>
        </div>
      </div>
      <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.15), rgba(184,134,11,0.25), rgba(212,175,55,0.15), transparent)' }} />
    </section>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function NavButton({
  id, label, isMobile, onClick, children,
}: {
  id: string;
  label: string;
  isMobile: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const sz = isMobile ? '2.75rem' : '4rem';

  return (
    <button
      id={id}
      type="button"
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      onMouseEnter={() => { if (!isMobile) setHovered(true); }}
      onMouseLeave={() => { setHovered(false); setPressed(false); }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        width          : sz,
        height         : sz,
        minWidth       : sz,
        minHeight      : sz,
        borderRadius   : '50%',
        border         : '1.5px solid rgba(255,255,255,0.75)',
        background     : isMobile ? 'rgba(0,0,0,0.45)' : (hovered ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.04)'),
        backdropFilter : 'blur(10px)',
        color          : 'white',
        display        : 'flex',
        alignItems     : 'center',
        justifyContent : 'center',
        cursor         : 'pointer',
        transform      : pressed
          ? 'scale(0.92)'
          : hovered
            ? 'scale(1.08)'
            : 'scale(1)',
        transition     : 'transform 140ms ease, background 140ms ease',
        outline        : 'none',
        flexShrink     : 0,
        pointerEvents  : 'auto',
        touchAction    : 'manipulation',
        boxShadow      : '0 4px 14px rgba(0,0,0,0.35)',
      }}
    >
      {children}
    </button>
  );
}

function DiscoverLink({ onClick, isMobile }: { onClick: () => void; isMobile?: boolean }) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  if (isMobile) {
    return (
      <button
        type="button"
        id="discover-link"
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        style={{
          display       : 'flex',
          alignItems    : 'center',
          gap           : '0.45rem',
          fontFamily    : "'Inter', sans-serif",
          fontSize      : '0.75rem',
          fontWeight    : 800,
          color         : 'white',
          letterSpacing : '0.08em',
          textTransform : 'uppercase',
          border        : '1.5px solid rgba(212,175,55,0.65)',
          background    : 'linear-gradient(135deg, rgba(122,78,45,0.92), rgba(155,106,69,0.92))',
          backdropFilter: 'blur(10px)',
          padding       : '0.65rem 1.25rem',
          borderRadius  : '12px',
          cursor        : 'pointer',
          transition    : 'all 200ms ease',
          whiteSpace    : 'nowrap',
          boxShadow     : '0 4px 16px rgba(122,78,45,0.45)',
          pointerEvents : 'auto',
          touchAction   : 'manipulation',
        }}
        onTouchStart={(e) => { e.currentTarget.style.transform = 'scale(0.96)'; e.currentTarget.style.opacity = '0.9'; }}
        onTouchEnd={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.opacity = '1'; }}
      >
        Discover It
        <ArrowRight size={14} strokeWidth={2.5} />
      </button>
    );
  }

  return (
    <button
      type="button"
      id="discover-link"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false); }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        display       : 'flex',
        alignItems    : 'center',
        gap           : '0.6rem',
        fontFamily    : "'Inter', sans-serif",
        fontSize      : '0.9rem',
        fontWeight    : 800,
        color         : 'white',
        letterSpacing : '0.1em',
        textTransform : 'uppercase',
        border        : '1.5px solid rgba(212,175,55,0.6)',
        background    : hovered
          ? 'linear-gradient(135deg, #8B5A2B, #B07840)'
          : 'linear-gradient(135deg, rgba(122,78,45,0.9), rgba(155,106,69,0.9))',
        backdropFilter: 'blur(12px)',
        padding       : '0.85rem 2rem',
        borderRadius  : '14px',
        cursor        : 'pointer',
        transform     : pressed
          ? 'scale(0.97)'
          : hovered
            ? 'translateY(-2px) scale(1.02)'
            : 'translateY(0) scale(1)',
        transition    : 'all 220ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        boxShadow     : hovered
          ? '0 10px 32px rgba(122,78,45,0.55), 0 0 0 1px rgba(212,175,55,0.3)'
          : '0 4px 18px rgba(122,78,45,0.38)',
        whiteSpace    : 'nowrap',
      }}
    >
      Discover It
      <ArrowRight
        size={16}
        strokeWidth={2.5}
        style={{
          transform : hovered ? 'translateX(3px)' : 'translateX(0)',
          transition: 'transform 220ms ease',
        }}
      />
    </button>
  );
}

function DiscoveryPage({
  category,
  products,
  onBack,
  onCategoryChange,
  onAddToCart,
  cartItemsCount,
  onCartClick,
  user,
  onSignOut,
  onSignInClick,
}: {
  category: Category;
  products: Product[];
  onBack: () => void;
  onCategoryChange: (category: Category) => void;
  onAddToCart: (product: Product, config: any) => void;
  cartItemsCount: number;
  onCartClick: () => void;
  user: AuthUser | null;
  onSignOut: () => void;
  onSignInClick: () => void;
}) {
  const config = CATEGORY_CONFIG[category];
  const categories = Object.keys(CATEGORY_CONFIG) as Category[];

  // ── Bedding sub-section state ──
  const beddingSubTypes = Object.keys(BEDDING_SUB_CONFIG) as BeddingType[];
  const [activeBeddingSub, setActiveBeddingSub] = useState<BeddingType>('king');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Filter products for the active view
  const visibleProducts = category === 'bedding'
    ? products.filter(p => (p.bedding_type ?? 'king') === activeBeddingSub)
    : products;

  const totalReviews = products.reduce((sum, product) => sum + (Number(product.reviews) || 0), 0);
  const bestRating = products.length > 0 ? Math.max(...products.map((product) => Number(product.rating) || 0)).toFixed(1) : '—';

  return (
    <main
      id="discovery-page"
      style={{
        minHeight  : '100vh',
        overflowY  : 'auto',
        background : '#050505',
        fontFamily : "'Outfit', 'Inter', sans-serif",
        color      : 'white',
        position   : 'relative',
      }}
    >
      {/* ── Blurred logo watermark ── */}
      <div
        aria-hidden="true"
        style={{
          position       : 'fixed',
          inset          : 0,
          backgroundImage: "url('/logo.png')",
          backgroundSize : 'clamp(360px, 45vw, 680px)',
          backgroundPosition: 'center 35%',
          backgroundRepeat: 'no-repeat',
          opacity        : 0.035,
          filter         : 'blur(40px)',
          pointerEvents  : 'none',
          zIndex         : 0,
        }}
      />
      
      {/* Category color glow at top */}
      <div
        aria-hidden="true"
        style={{
          position       : 'fixed',
          top            : 0,
          left           : 0,
          right          : 0,
          height         : '420px',
          background     : `linear-gradient(180deg, ${config.bg}22 0%, transparent 100%)`,
          pointerEvents  : 'none',
          zIndex         : 0,
        }}
      />

      {/* ── Header ── */}
      <header style={{
        position      : 'sticky',
        top           : 0,
        zIndex        : 100,
        borderBottom  : '1px solid rgba(255, 255, 255, 0.05)',
        background    : 'rgba(5, 5, 5, 0.75)',
        backdropFilter: 'blur(20px)',
        padding       : 'clamp(0.65rem, 2vw, 1rem) clamp(0.85rem, 3vw, 2rem)',
        display       : 'flex',
        alignItems    : 'center',
        justifyContent: 'space-between',
        gap           : '0.5rem',
      }}>
        {/* Left segment */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexShrink: 0 }}>
          {/* Back */}
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to home"
            style={{
              width         : '44px',
              height        : '44px',
              borderRadius  : '50%',
              border        : '1px solid rgba(255, 255, 255, 0.12)',
              background    : 'rgba(255, 255, 255, 0.03)',
              color         : 'white',
              display       : 'flex',
              alignItems    : 'center',
              justifyContent: 'center',
              cursor        : 'pointer',
              flexShrink    : 0,
              transition    : 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            onMouseEnter={(e) => { 
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'; 
              e.currentTarget.style.transform = 'translateX(-2px)';
            }}
            onMouseLeave={(e) => { 
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'; 
              e.currentTarget.style.transform = 'translateX(0)';
            }}
          >
            <ArrowLeft size={18} strokeWidth={2.25} />
          </button>

          {/* Logo brand */}
          <div
            onClick={onBack}
            style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', cursor: 'pointer' }}
          >
            <img
              src="/logo.png"
              alt="HIJAZ Logo"
              style={{
                height: '28px',
                width: 'auto',
                objectFit: 'contain',
                filter: 'drop-shadow(0 2px 6px rgba(212, 175, 55, 0.35))',
              }}
            />
            <span style={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(255, 255, 255, 0.85)' }}>
              HIJAZ
            </span>
          </div>
        </div>

        {/* Middle segment: Category pills (scrolling on mobile) */}
        <div style={{
          display       : 'flex',
          gap           : '0.25rem',
          overflowX     : 'auto',
          borderRadius  : '999px',
          border        : '1px solid rgba(255, 255, 255, 0.08)',
          background    : 'rgba(255, 255, 255, 0.02)',
          padding       : '0.25rem',
          backdropFilter: 'blur(10px)',
          scrollbarWidth: 'none',
        }}>
          {categories.map((item) => {
            const itemConfig = CATEGORY_CONFIG[item];
            const active = item === category;
            const tabLabel = item === 'pillows' ? 'PILLOWS' : item === 'bath' ? 'BATH' : 'BEDDING';
            return (
              <button
                key={item}
                type="button"
                onClick={() => onCategoryChange(item)}
                style={{
                  flexShrink     : 0,
                  padding        : '0.45rem 1.15rem',
                  borderRadius   : '999px',
                  border         : 'none',
                  background     : active ? `linear-gradient(135deg, ${itemConfig.bg}, ${itemConfig.panel})` : 'transparent',
                  color          : active ? 'white' : 'rgba(255, 255, 255, 0.45)',
                  fontWeight     : active ? 700 : 500,
                  fontSize       : '0.78rem',
                  textTransform  : 'uppercase',
                  letterSpacing  : '0.06em',
                  cursor         : 'pointer',
                  transition     : 'all 240ms ease',
                  whiteSpace     : 'nowrap',
                  boxShadow      : active ? `0 4px 12px ${itemConfig.bg}30` : 'none',
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = 'white'; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; }}
              >
                {tabLabel}
              </button>
            );
          })}
        </div>

        {/* Right segment: Cart & Auth */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
          {/* Cart Icon with count */}
          <button
            onClick={onCartClick}
            aria-label="View Cart"
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              border: '1.5px solid rgba(255, 255, 255, 0.12)',
              background: 'rgba(255, 255, 255, 0.03)',
              color: 'white',
              cursor: 'pointer',
              transition: 'all 200ms ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
          >
            <ShoppingBag size={16} />
            {cartItemsCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: 'linear-gradient(135deg, #7A4E2D, #9B6A45)',
                color: 'white',
                fontSize: '0.65rem',
                fontWeight: 800,
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              }}>
                {cartItemsCount}
              </span>
            )}
          </button>

          {/* Auth status / Sign in */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                onClick={onSignOut}
                title="Sign Out"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  border: '1.5px solid rgba(255, 255, 255, 0.12)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  color: 'rgba(255, 255, 255, 0.65)',
                  cursor: 'pointer',
                  transition: 'all 200ms ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'; e.currentTarget.style.color = '#f87171'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'; e.currentTarget.style.color = 'rgba(255, 255, 255, 0.65)'; }}
              >
                <LogOut size={15} />
              </button>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #7A4E2D, #9B6A45)',
                border: '1.5px solid rgba(255,255,255,0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: 'white',
              }}>
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  user.name.charAt(0).toUpperCase()
                )}
              </div>
            </div>
          ) : (
            <button
              onClick={onSignInClick}
              style={{
                display       : 'flex',
                alignItems    : 'center',
                gap           : '0.375rem',
                padding       : '0.45rem 1rem',
                borderRadius  : '999px',
                border        : '1.5px solid rgba(255,255,255,0.15)',
                background    : 'rgba(255,255,255,0.05)',
                backdropFilter: 'blur(8px)',
                color         : 'white',
                fontSize      : '0.75rem',
                fontWeight    : 600,
                letterSpacing : '0.08em',
                textTransform : 'uppercase',
                cursor        : 'pointer',
                transition    : 'all 200ms ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
            >
              <UserIcon size={14} />
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* ── Hero Section ── */}
      <section style={{
        position  : 'relative',
        zIndex    : 5,
        padding   : 'clamp(2rem, 6vw, 4rem) clamp(1rem, 4vw, 2rem) clamp(1.5rem, 4vw, 2.5rem)',
        maxWidth  : '1200px',
        margin    : '0 auto',
        display   : 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
        gap       : 'clamp(1.5rem, 4vw, 3rem)',
        alignItems: 'center',
      }}>
        <div>
          <p style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.25em', textTransform: 'uppercase', color: `${config.panel}`, marginBottom: '0.85rem' }}>
            Exclusive Discoveries
          </p>
          <h1 style={{
            fontFamily : "'Trebuchet MS', sans-serif",
            fontSize   : 'clamp(2.5rem, 6.5vw, 4.5rem)',
            fontWeight : 900,
            lineHeight : 1.05,
            color      : 'white',
            margin     : 0,
            textTransform: 'uppercase',
            letterSpacing: '-0.02em',
          }}>
            {config.label}
          </h1>
          <p style={{ marginTop: '1.25rem', fontSize: '1.025rem', lineHeight: 1.7, color: 'rgba(255, 255, 255, 0.55)', maxWidth: '480px' }}>
            {config.tagline}
          </p>
          
          {/* High-fidelity Stat badges */}
          <div style={{ display: 'flex', gap: '0.875rem', marginTop: '2.25rem', flexWrap: 'wrap' }}>
            {[
              { v: products.length.toString(), l: 'Items' },
              { v: bestRating, l: 'Top Rating' },
              { v: `${totalReviews}+`, l: 'Reviews' },
            ].map(({ v, l }) => (
              <div key={l} style={{
                padding       : '1rem 1.5rem',
                borderRadius  : '16px',
                border        : '1px solid rgba(255, 255, 255, 0.06)',
                background    : 'rgba(255, 255, 255, 0.02)',
                backdropFilter: 'blur(8px)',
                minWidth      : '100px',
                boxShadow     : '0 8px 24px rgba(0,0,0,0.1)',
              }}>
                <p style={{ fontSize: '1.65rem', fontWeight: 800, color: 'white', margin: 0, lineHeight: 1, letterSpacing: '-0.01em' }}>{v}</p>
                <p style={{ fontSize: '0.68rem', fontWeight: 700, color: 'rgba(255, 255, 255, 0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0.4rem 0 0' }}>{l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Hero Card Showcase */}
        <div style={{
          position      : 'relative',
          maxWidth      : '460px',
          margin        : '0 auto',
          width         : '100%',
          aspectRatio   : '1 / 1',
          borderRadius  : '24px',
          border        : `1px solid ${config.bg}45`,
          overflow      : 'hidden',
          boxShadow     : `0 24px 64px rgba(0, 0, 0, 0.6), 0 0 80px ${config.bg}20`,
        }}>
          {/* Lifestyle Atmospheric Background */}
          <div
            style={{
              position          : 'absolute',
              inset             : 0,
              backgroundImage   : `url('${config.bgImage || '/hero.jpg'}')`,
              backgroundSize    : 'cover',
              backgroundPosition: 'center center',
              filter            : 'brightness(0.55) contrast(1.1)',
              transform         : 'scale(1.05)',
            }}
          />

          {/* Vignette & Gradients Overlay */}
          <div
            style={{
              position  : 'absolute',
              inset     : 0,
              background: `radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0.15) 0%, rgba(5,5,5,0.7) 65%, #050505 100%)`,
            }}
          />
          <div
            style={{
              position  : 'absolute',
              inset     : 0,
              background: `radial-gradient(circle at 50% 30%, ${config.bg}30, transparent 75%)`,
            }}
          />

          {/* Sparkles & Luxury Badge */}
          <Sparkles style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', color: '#d4af37', zIndex: 3, animation: 'pulse 2s infinite alternate' }} size={20} />
          <div
            style={{
              position      : 'absolute',
              top           : '1.25rem',
              left          : '1.25rem',
              zIndex        : 3,
              padding       : '0.35rem 0.85rem',
              borderRadius  : '999px',
              background    : 'rgba(5, 5, 5, 0.65)',
              backdropFilter: 'blur(10px)',
              border        : '1px solid rgba(255, 255, 255, 0.12)',
              fontSize      : '0.68rem',
              fontWeight    : 700,
              letterSpacing : '0.12em',
              textTransform : 'uppercase',
              color         : '#d4af37',
            }}
          >
            Signature Series
          </div>

          {/* Shadow beneath floating cutout */}
          <div aria-hidden="true" style={{
            position     : 'absolute',
            bottom       : '8%',
            left         : '50%',
            transform    : 'translateX(-50%)',
            width        : '75%',
            height       : '36px',
            borderRadius : '50%',
            background   : 'rgba(0, 0, 0, 0.85)',
            filter       : 'blur(20px)',
            zIndex       : 1,
          }} />

          {/* Floating Product Cutout */}
          <div
            style={{
              position  : 'relative',
              zIndex    : 2,
              width     : '100%',
              height    : '100%',
              display   : 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation : 'toonFloat 4.5s ease-in-out infinite',
            }}
          >
            <img
              src={config.heroImage}
              alt={config.label}
              draggable={false}
              style={{ 
                width          : '85%', 
                height         : '85%', 
                objectFit      : config.heroImage === '/bed.png' ? 'cover' : 'contain',
                objectPosition : config.heroImage === '/bed.png' ? 'center 30%' : 'bottom center',
                transform      : config.heroImage === '/bath1.png'
                  ? 'scale(1.2)'
                  : config.heroImage === '/bed1.png'
                    ? 'scale(1.22)'
                    : 'none',
                transformOrigin: 'bottom center',
                filter         : 'drop-shadow(0 16px 32px rgba(0,0,0,0.7))',
                maskImage      : config.heroImage === '/bed1.png'
                  ? 'linear-gradient(to bottom, black 82%, transparent 100%)'
                  : 'none',
                WebkitMaskImage: config.heroImage === '/bed1.png'
                  ? 'linear-gradient(to bottom, black 82%, transparent 100%)'
                  : 'none',
              }}
            />
          </div>
        </div>
      </section>

      {/* ── Bedding Sub-Section Tabs (only for Bedding category) ── */}
      {category === 'bedding' && (
        <section style={{
          position  : 'relative',
          zIndex    : 5,
          maxWidth  : '1200px',
          margin    : '0 auto',
          padding   : '0 clamp(1rem, 4vw, 2rem) clamp(1rem, 3vw, 1.5rem)',
        }}>
          {/* Sub-section header */}
          <div style={{ marginBottom: '1.25rem' }}>
            <p style={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', margin: 0 }}>
              Shop by Size
            </p>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'white', margin: '0.25rem 0 0', letterSpacing: '-0.01em' }}>
              Bedding Collections
            </h2>
          </div>

          {/* Sub-tabs */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {beddingSubTypes.map((sub) => {
              const subConf = BEDDING_SUB_CONFIG[sub];
              const isActive = activeBeddingSub === sub;
              const subCount = products.filter(p => (p.bedding_type ?? 'king') === sub).length;
              return (
                <button
                  key={sub}
                  id={`bedding-sub-${sub}`}
                  type="button"
                  onClick={() => setActiveBeddingSub(sub)}
                  style={{
                    display       : 'flex',
                    alignItems    : 'center',
                    gap           : '0.55rem',
                    padding       : '0.7rem 1.4rem',
                    borderRadius  : '14px',
                    border        : isActive
                      ? `1.5px solid ${config.panel}80`
                      : '1.5px solid rgba(255,255,255,0.08)',
                    background    : isActive
                      ? `linear-gradient(135deg, ${config.bg}33, ${config.panel}22)`
                      : 'rgba(255,255,255,0.02)',
                    color         : isActive ? 'white' : 'rgba(255,255,255,0.45)',
                    fontWeight    : isActive ? 700 : 500,
                    fontSize      : '0.85rem',
                    cursor        : 'pointer',
                    transition    : 'all 240ms cubic-bezier(0.25, 1, 0.5, 1)',
                    boxShadow     : isActive ? `0 6px 20px ${config.bg}25` : 'none',
                    backdropFilter: 'blur(8px)',
                  }}
                  onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; } }}
                  onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; } }}
                >
                  <span style={{ fontSize: '1.1rem' }}>{subConf.icon}</span>
                  <span>{subConf.label}</span>
                  <span style={{
                    fontSize  : '0.68rem',
                    fontWeight: 700,
                    padding   : '0.15rem 0.5rem',
                    borderRadius: '999px',
                    background: isActive ? `${config.bg}55` : 'rgba(255,255,255,0.06)',
                    color     : isActive ? 'white' : 'rgba(255,255,255,0.35)',
                  }}>{subCount}</span>
                </button>
              );
            })}
          </div>

          {/* Active sub-section banner */}
          {(() => {
            const subConf = BEDDING_SUB_CONFIG[activeBeddingSub];
            return (
              <div style={{
                marginTop   : '1.25rem',
                padding     : '1rem 1.5rem',
                borderRadius: '16px',
                border      : `1px solid ${config.bg}30`,
                background  : `linear-gradient(135deg, ${config.bg}12, ${config.panel}08)`,
                display     : 'flex',
                alignItems  : 'center',
                gap         : '1rem',
              }}>
                <span style={{ fontSize: '2rem', flexShrink: 0 }}>{subConf.icon}</span>
                <div>
                  <p style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'white' }}>
                    {subConf.label} Size Collection
                  </p>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: 'rgba(255,255,255,0.45)' }}>
                    {subConf.tagline}
                  </p>
                </div>
              </div>
            );
          })()}
        </section>
      )}

      {/* ── Products Grid ── */}
      <section style={{ position: 'relative', zIndex: 5, padding: 'clamp(1rem, 3vw, 2rem) clamp(1rem, 4vw, 2rem) clamp(3rem, 8vw, 6rem)', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '1.25rem' }}>
          <div>
            <p style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255, 255, 255, 0.35)', margin: 0 }}>Curated Catalog</p>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', margin: '0.35rem 0 0', letterSpacing: '-0.01em' }}>
              {category === 'bedding'
                ? `${BEDDING_SUB_CONFIG[activeBeddingSub].label} Size — Premium Selection`
                : 'Premium Selection'}
            </h2>
          </div>
          <span style={{
            padding      : '0.5rem 1.15rem',
            borderRadius : '999px',
            border       : '1px solid rgba(255, 255, 255, 0.08)',
            background   : 'rgba(255, 255, 255, 0.02)',
            color        : 'rgba(255, 255, 255, 0.45)',
            fontSize     : '0.8rem',
            fontWeight   : 600,
            letterSpacing: '0.04em',
          }}>
            {visibleProducts.length} {visibleProducts.length === 1 ? 'Product' : 'Products'} Available
          </span>
        </div>

        {visibleProducts.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '7rem 2rem', 
            color: 'rgba(255, 255, 255, 0.35)',
            background: 'rgba(255,255,255,0.01)',
            border: '1px dashed rgba(255,255,255,0.06)',
            borderRadius: '20px',
            maxWidth: '500px',
            margin: '0 auto',
          }}>
            {category === 'bedding'
              ? <p style={{ fontSize: '2rem', margin: '0 0 0.75rem' }}>{BEDDING_SUB_CONFIG[activeBeddingSub].icon}</p>
              : null}
            <p style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white', margin: 0 }}>
              {category === 'bedding'
                ? `No ${BEDDING_SUB_CONFIG[activeBeddingSub].label} Size Products Yet`
                : 'No Products in this Category'}
            </p>
            <p style={{ fontSize: '0.88rem', color: 'rgba(255, 255, 255, 0.4)', marginTop: '0.5rem', lineHeight: 1.5 }}>
              Use the admin credentials (`admin123`) to unlock the Admin Panel and add new items with custom image uploads.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 'clamp(0.85rem, 2vw, 1.5rem)', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 250px), 1fr))' }}>
            {visibleProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                config={config}
                onAddToCart={() => onAddToCart(product, config)}
                onOpenDetail={() => setSelectedProduct(product)}
              />
            ))}
          </div>
        )}

        {/* ── Product Detail Modal ── */}
        {selectedProduct && (
          <ProductDetailModal
            product={selectedProduct}
            config={config}
            onClose={() => setSelectedProduct(null)}
            onAddToCart={(qty) => {
              for (let i = 0; i < qty; i++) {
                onAddToCart(selectedProduct, config);
              }
            }}
          />
        )}
      </section>
    </main>
  );
}

// ─── Format Instagram / Video Embed URLs ──────────────────────────────────────
function formatEmbedSrc(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  
  // Instagram Reel or Post shortcode match
  const instaMatch = trimmed.match(/instagram\.com\/(?:reel|reels|p)\/([A-Za-z0-9_-]+)/i);
  if (instaMatch) {
    return `https://www.instagram.com/p/${instaMatch[1]}/embed/`;
  }

  // YouTube match
  const ytMatch = trimmed.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]+)/i);
  if (ytMatch) {
    return `https://www.youtube.com/embed/${ytMatch[1]}`;
  }

  // Generic iframe or http embed url
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return null;
}

// ─── Premium Glassmorphic Product Card ─────────────────────────────────────────
function ProductCard({
  product,
  config,
  onAddToCart,
  onOpenDetail,
}: {
  product: Product;
  config: { bg: string; panel: string };
  onAddToCart: () => void;
  onOpenDetail: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [added, setAdded] = useState(false);
  const addedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart();
    if (addedTimerRef.current) clearTimeout(addedTimerRef.current);
    setAdded(true);
    addedTimerRef.current = setTimeout(() => setAdded(false), 1800);
  };

  return (
    <article
      onClick={onOpenDetail}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius  : '20px',
        border        : `1px solid ${hovered ? `${config.bg}60` : 'rgba(255, 255, 255, 0.05)'}`,
        background    : hovered ? `rgba(255, 255, 255, 0.04)` : 'rgba(255, 255, 255, 0.015)',
        backdropFilter: 'blur(8px)',
        overflow      : 'hidden',
        transform     : hovered ? 'translateY(-6px)' : 'translateY(0)',
        transition    : 'all 320ms cubic-bezier(0.25, 1, 0.5, 1)',
        boxShadow     : hovered ? `0 20px 40px rgba(0,0,0,0.5), 0 0 24px ${config.bg}20` : 'none',
        cursor        : 'pointer',
      }}
    >
      {/* Product Image Stage */}
      <div style={{
        position  : 'relative',
        aspectRatio: '4 / 3.2',
        display   : 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow  : 'hidden',
        background: `radial-gradient(circle at 50% 30%, ${config.bg}1a 0%, transparent 70%)`,
        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
      }}>
        {product.badge && (
          <span style={{
            position     : 'absolute',
            top          : '0.875rem',
            left         : '0.875rem',
            padding      : '0.25rem 0.65rem',
            borderRadius : '8px',
            background   : `linear-gradient(135deg, ${config.bg}, ${config.panel})`,
            color        : 'white',
            fontSize     : '0.65rem',
            fontWeight   : 800,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            zIndex       : 2,
            boxShadow    : `0 4px 10px ${config.bg}22`,
          }}>{product.badge}</span>
        )}
        <img
          src={product.image}
          alt={product.name}
          draggable={false}
          style={{
            height    : '150px',
            width     : '85%',
            objectFit : 'contain',
            padding   : '0.5rem',
            transform : hovered ? 'scale(1.08) translateY(-4px)' : 'scale(1)',
            transition: 'transform 450ms cubic-bezier(0.25, 1, 0.5, 1)',
          }}
          onError={(e) => { e.currentTarget.src = '/bed1.png'; }}
        />
        {/* Subtle view details badge on hover */}
        {hovered && (
          <div style={{
            position: 'absolute',
            bottom: '8px',
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(6px)',
            color: '#d4af37',
            fontSize: '0.65rem',
            fontWeight: 700,
            padding: '3px 10px',
            borderRadius: '999px',
            border: '1px solid rgba(212,175,55,0.3)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}>
            Click to View Details
          </div>
        )}
      </div>

      {/* Product Information Details */}
      <div style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <div style={{ minWidth: 0 }}>
            <h3 style={{ color: 'white', fontWeight: 800, fontSize: '1rem', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.01em' }}>{product.name}</h3>
            <p style={{ color: 'rgba(255, 255, 255, 0.45)', fontSize: '0.78rem', margin: '0.25rem 0 0', lineHeight: 1.4 }}>{product.subtitle}</p>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <p style={{ color: 'white', fontWeight: 800, fontSize: '1.1rem', margin: 0 }}>₹{Number(product.price).toLocaleString('en-IN')}</p>
            {product.originalPrice && (
              <p style={{ color: 'rgba(255, 255, 255, 0.3)', fontSize: '0.75rem', textDecoration: 'line-through', margin: '0.15rem 0 0' }}>₹{Number(product.originalPrice).toLocaleString('en-IN')}</p>
            )}
          </div>
        </div>

        {/* Product Description */}
        {product.description && (
          <p style={{ color: 'rgba(255, 255, 255, 0.35)', fontSize: '0.76rem', lineHeight: 1.55, margin: '0 0 1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {product.description}
          </p>
        )}

        {/* Card Footer Rating & Action Button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '1rem', marginTop: '0.5rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', fontWeight: 700, color: 'rgba(255, 255, 255, 0.85)' }}>
            <Star size={13} fill="#d4af37" color="#d4af37" />
            {(Number(product.rating) || 0).toFixed(1)}
            <span style={{ color: 'rgba(255, 255, 255, 0.3)', fontWeight: 500 }}>({product.reviews})</span>
          </span>
          
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={added}
            style={{
              display       : 'flex',
              alignItems    : 'center',
              gap           : '0.4rem',
              padding       : '0.55rem 1.15rem',
              borderRadius  : '10px',
              border        : added ? '1.5px solid rgba(134,239,172,0.5)' : 'none',
              background    : added
                ? 'linear-gradient(135deg, #166534, #15803d)'
                : `linear-gradient(135deg, ${config.bg}, ${config.panel})`,
              color         : 'white',
              fontWeight    : 700,
              fontSize      : '0.78rem',
              cursor        : added ? 'default' : 'pointer',
              transition    : 'all 280ms cubic-bezier(0.34, 1.56, 0.64, 1)',
              boxShadow     : added
                ? '0 4px 14px rgba(22,101,52,0.45)'
                : `0 4px 12px ${config.bg}22`,
              transform     : added ? 'scale(1.04)' : 'scale(1)',
              whiteSpace    : 'nowrap',
            }}
            onMouseEnter={(e) => {
              if (!added) {
                e.currentTarget.style.opacity = '0.9';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!added) {
                e.currentTarget.style.opacity = '1';
                e.currentTarget.style.transform = 'scale(1)';
              }
            }}
          >
            {added ? (
              <>
                <CheckCircle size={13} strokeWidth={2.5} />
                <span>Added!</span>
              </>
            ) : (
              <>
                <ShoppingBag size={13} />
                <span>Add to Cart</span>
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}

// ─── Luxurious Product Detail Modal ──────────────────────────────────────────
function ProductDetailModal({
  product,
  config,
  onClose,
  onAddToCart,
}: {
  product: Product;
  config: { bg: string; panel: string };
  onClose: () => void;
  onAddToCart: (qty: number) => void;
}) {
  // All images: main image + extra images
  const allImages = Array.from(
    new Set([product.image, ...(product.images || [])].filter(Boolean))
  );
  const [activeImage, setActiveImage] = useState<string>(product.image || allImages[0] || '/bed1.png');
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  // Reviews state
  const [reviewsList, setReviewsList] = useState<any[]>(
    product.customerReviews || product.customer_reviews || []
  );
  const [reviewsLoading, setReviewsLoading] = useState(true);

  // New review form
  const [reviewerName, setReviewerName] = useState('');
  const [reviewerRating, setReviewerRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewerComment, setReviewerComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviewError, setReviewError] = useState('');

  // Fetch reviews on mount
  useEffect(() => {
    let isMounted = true;
    const fetchReviews = async () => {
      try {
        const res = await fetch(`${API_URL}/reviews?product_id=${product.id}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data)) {
            setReviewsList(data);
          }
        }
      } catch (err) {
        console.error('Failed to fetch reviews:', err);
      } finally {
        if (isMounted) setReviewsLoading(false);
      }
    };
    fetchReviews();
    return () => { isMounted = false; };
  }, [product.id]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleAddCart = () => {
    onAddToCart(qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2200);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerName.trim() || !reviewerComment.trim()) {
      setReviewError('Please provide your name and review comment.');
      return;
    }

    setSubmittingReview(true);
    setReviewError('');
    try {
      const res = await fetch(`${API_URL}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: product.id,
          customer_name: reviewerName.trim(),
          rating: reviewerRating,
          comment: reviewerComment.trim(),
        }),
      });

      if (res.ok) {
        const newRev = await res.json();
        setReviewsList((prev) => [newRev, ...prev]);
        setReviewerName('');
        setReviewerComment('');
        setReviewerRating(5);
        setReviewSuccess(true);
        setTimeout(() => setReviewSuccess(false), 4000);
      } else {
        const err = await res.json().catch(() => ({}));
        setReviewError(err.message || 'Failed to submit review.');
      }
    } catch {
      setReviewError('Network error. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Average rating calculated from current reviews list
  const avgRating = reviewsList.length > 0
    ? (reviewsList.reduce((acc, r) => acc + (Number(r.rating) || 0), 0) / reviewsList.length).toFixed(1)
    : (Number(product.rating) || 5.0).toFixed(1);

  // Discount percentage
  const discountPercent = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;

  return (
    <div
      onClick={onClose}
      style={{
        position      : 'fixed',
        inset         : 0,
        zIndex        : 9999,
        background    : 'rgba(5, 5, 7, 0.88)',
        backdropFilter: 'blur(20px)',
        display       : 'flex',
        alignItems    : 'center',
        justifyContent: 'center',
        padding       : 'clamp(1rem, 3vw, 2.5rem)',
        overflowY     : 'auto',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position      : 'relative',
          width         : '100%',
          maxWidth      : '1050px',
          maxHeight     : '90vh',
          overflowY     : 'auto',
          background    : 'linear-gradient(145deg, #121214, #0a0a0c)',
          borderRadius  : '24px',
          border        : '1px solid rgba(212, 175, 55, 0.28)',
          boxShadow     : '0 25px 80px rgba(0, 0, 0, 0.85), 0 0 40px rgba(212, 175, 55, 0.1)',
          padding       : 'clamp(1.25rem, 3.5vw, 2.5rem)',
          color         : 'white',
        }}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          style={{
            position      : 'absolute',
            top           : '1.25rem',
            right         : '1.25rem',
            width         : '38px',
            height        : '38px',
            borderRadius  : '50%',
            background    : 'rgba(255, 255, 255, 0.05)',
            border        : '1px solid rgba(255, 255, 255, 0.1)',
            color         : 'rgba(255, 255, 255, 0.8)',
            display       : 'flex',
            alignItems    : 'center',
            justifyContent: 'center',
            cursor        : 'pointer',
            transition    : 'all 200ms ease',
            zIndex        : 10,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; e.currentTarget.style.color = '#ef4444'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; }}
        >
          <X size={18} />
        </button>

        {/* Top Product Showcase (Gallery + Info) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))',
          gap: 'clamp(1.5rem, 4vw, 2.75rem)',
          marginBottom: '2.5rem',
        }}>
          {/* Left Column: Interactive Image Gallery */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Main Stage Image */}
            <div
              style={{
                position      : 'relative',
                aspectRatio   : '1 / 1',
                borderRadius  : '20px',
                border        : '1px solid rgba(255, 255, 255, 0.08)',
                background    : `radial-gradient(circle at 50% 40%, ${config.bg}22 0%, rgba(0,0,0,0.6) 75%)`,
                display       : 'flex',
                alignItems    : 'center',
                justifyContent: 'center',
                overflow      : 'hidden',
                padding       : '1.5rem',
              }}
            >
              {product.badge && (
                <span
                  style={{
                    position     : 'absolute',
                    top          : '1rem',
                    left         : '1rem',
                    padding      : '0.35rem 0.8rem',
                    borderRadius : '8px',
                    background   : 'linear-gradient(135deg, #7A4E2D, #d4af37)',
                    color        : 'white',
                    fontSize     : '0.72rem',
                    fontWeight   : 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    boxShadow    : '0 4px 12px rgba(212,175,55,0.3)',
                    zIndex       : 2,
                  }}
                >
                  {product.badge}
                </span>
              )}

              <img
                src={activeImage}
                alt={product.name}
                style={{
                  maxHeight : '90%',
                  maxWidth  : '90%',
                  objectFit : 'contain',
                  filter    : 'drop-shadow(0 15px 30px rgba(0,0,0,0.7))',
                  transition: 'transform 300ms ease',
                }}
                onError={(e) => { e.currentTarget.src = '/bed1.png'; }}
              />
            </div>

            {/* Thumbnail Selector Strip */}
            {allImages.length > 1 && (
              <div style={{ display: 'flex', gap: '0.65rem', overflowX: 'auto', paddingBottom: '0.35rem' }}>
                {allImages.map((img, idx) => {
                  const isCurrent = img === activeImage;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImage(img)}
                      style={{
                        position    : 'relative',
                        width       : '68px',
                        height      : '68px',
                        borderRadius: '12px',
                        border      : isCurrent ? '2px solid #d4af37' : '1.5px solid rgba(255, 255, 255, 0.1)',
                        background  : 'rgba(255, 255, 255, 0.02)',
                        boxShadow   : isCurrent ? '0 0 12px rgba(212, 175, 55, 0.4)' : 'none',
                        cursor      : 'pointer',
                        padding     : '4px',
                        overflow    : 'hidden',
                        flexShrink  : 0,
                        transition  : 'all 200ms ease',
                      }}
                    >
                      <img
                        src={img}
                        alt={`Thumb ${idx}`}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        onError={(e) => { e.currentTarget.src = '/bed1.png'; }}
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Product Overview, Price & Cart */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {/* Category / Bedding size pills */}
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
              <span style={{
                padding: '0.3rem 0.75rem', borderRadius: '999px',
                background: 'rgba(212, 175, 55, 0.1)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                color: '#d4af37', fontSize: '0.72rem', fontWeight: 800,
                letterSpacing: '0.08em', textTransform: 'uppercase',
              }}>
                {product.category || 'Luxury'}
              </span>

              {product.category === 'bedding' && product.bedding_type && (
                <span style={{
                  padding: '0.3rem 0.75rem', borderRadius: '999px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: 'white', fontSize: '0.72rem', fontWeight: 800,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                }}>
                  {BEDDING_SUB_CONFIG[product.bedding_type]?.icon} {BEDDING_SUB_CONFIG[product.bedding_type]?.label} Size
                </span>
              )}

              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                fontSize: '0.72rem', color: '#4ade80', fontWeight: 700,
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 6px #4ade80' }} />
                In Stock & Ready to Ship
              </span>
            </div>

            {/* Title & Subtitle */}
            <h1 style={{
              fontSize: 'clamp(1.6rem, 3.5vw, 2.2rem)',
              fontWeight: 800,
              color: 'white',
              margin: '0 0 0.35rem',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
            }}>
              {product.name}
            </h1>
            
            {product.subtitle && (
              <p style={{
                fontSize: '0.95rem',
                color: 'rgba(255, 255, 255, 0.55)',
                margin: '0 0 1.25rem',
                lineHeight: 1.5,
              }}>
                {product.subtitle}
              </p>
            )}

            {/* Rating Stars Summary */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={16}
                    fill={s <= Math.round(Number(avgRating)) ? '#d4af37' : 'none'}
                    color={s <= Math.round(Number(avgRating)) ? '#d4af37' : 'rgba(255,255,255,0.2)'}
                  />
                ))}
              </div>
              <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'white' }}>{avgRating}</span>
              <span style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '0.85rem' }}>
                ({reviewsList.length} verified {reviewsList.length === 1 ? 'review' : 'reviews'})
              </span>
            </div>

            {/* Pricing Section */}
            <div style={{
              display: 'flex', alignItems: 'baseline', gap: '1rem',
              padding: '1rem 1.25rem', borderRadius: '16px',
              background: 'rgba(255, 255, 255, 0.025)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              marginBottom: '1.5rem',
            }}>
              <span style={{ fontSize: '2rem', fontWeight: 900, color: '#d4af37', letterSpacing: '-0.02em' }}>
                ₹{Number(product.price).toLocaleString('en-IN')}
              </span>
              {product.originalPrice && (
                <span style={{ fontSize: '1.1rem', color: 'rgba(255, 255, 255, 0.35)', textDecoration: 'line-through' }}>
                  ₹{Number(product.originalPrice).toLocaleString('en-IN')}
                </span>
              )}
              {discountPercent && (
                <span style={{
                  padding: '0.25rem 0.65rem', borderRadius: '6px',
                  background: 'rgba(22, 101, 52, 0.3)', border: '1px solid rgba(74, 222, 128, 0.3)',
                  color: '#4ade80', fontSize: '0.75rem', fontWeight: 800,
                }}>
                  {discountPercent}% OFF
                </span>
              )}
            </div>

            {/* Product Description */}
            <div style={{ marginBottom: '1.75rem' }}>
              <h4 style={{
                fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.12em',
                textTransform: 'uppercase', color: 'rgba(255, 255, 255, 0.45)', margin: '0 0 0.5rem',
              }}>
                Product Description
              </h4>
              <p style={{
                fontSize: '0.92rem', lineHeight: 1.7,
                color: 'rgba(255, 255, 255, 0.75)', margin: 0,
                whiteSpace: 'pre-line',
              }}>
                {product.description || 'Crafted with peerless artistry and unmatched luxury. Designed to elevate your sanctuary into an opulent oasis of relaxation and timeless style.'}
              </p>
            </div>

            {/* Quantity Selector & Add to Cart Action */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              {/* Qty Box */}
              <div style={{
                display: 'flex', alignItems: 'center',
                borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.12)',
                background: 'rgba(255, 255, 255, 0.03)',
              }}>
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  style={{
                    padding: '0.75rem 0.85rem', background: 'none', border: 'none',
                    color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center',
                  }}
                >
                  <Minus size={14} />
                </button>
                <span style={{ minWidth: '32px', textAlign: 'center', fontWeight: 800, fontSize: '0.95rem' }}>
                  {qty}
                </span>
                <button
                  type="button"
                  onClick={() => setQty((q) => q + 1)}
                  style={{
                    padding: '0.75rem 0.85rem', background: 'none', border: 'none',
                    color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center',
                  }}
                >
                  <Plus size={14} />
                </button>
              </div>

              {/* Add to Cart Button */}
              <button
                type="button"
                onClick={handleAddCart}
                disabled={added}
                style={{
                  flex: 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
                  padding: '0.85rem 1.5rem', borderRadius: '12px',
                  border: added ? '1.5px solid rgba(134,239,172,0.6)' : 'none',
                  background: added
                    ? 'linear-gradient(135deg, #166534, #15803d)'
                    : 'linear-gradient(135deg, #7A4E2D, #d4af37)',
                  color: 'white', fontSize: '0.92rem', fontWeight: 800,
                  cursor: added ? 'default' : 'pointer',
                  boxShadow: added ? '0 6px 20px rgba(22,101,52,0.45)' : '0 6px 24px rgba(212,175,55,0.3)',
                  transition: 'all 240ms ease',
                }}
              >
                {added ? (
                  <>
                    <CheckCircle size={18} strokeWidth={2.5} />
                    <span>Added {qty} to Cart!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag size={18} />
                    <span>Add to Cart • ₹{(Number(product.price) * qty).toLocaleString('en-IN')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ── Section: Instagram Reels & Video Showcase ── */}
        {product.embed_urls && product.embed_urls.length > 0 && (
          <div style={{
            marginBottom: '2.5rem',
            padding: 'clamp(1.25rem, 3vw, 2rem)',
            borderRadius: '20px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(212, 175, 55, 0.18)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
              <Film size={20} color="#d4af37" />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'white', margin: 0, letterSpacing: '-0.01em' }}>
                Featured Instagram Reels & Video Experience
              </h3>
            </div>
            <p style={{ margin: '0 0 1.5rem', fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.45)' }}>
              Watch this exquisite piece in motion — see the luxurious fabric drape, stitching, and craftsmanship.
            </p>

            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1.25rem',
              justifyContent: 'center',
              alignItems: 'flex-start',
            }}>
              {product.embed_urls.map((rawUrl, idx) => {
                const embedSrc = formatEmbedSrc(rawUrl);
                if (!embedSrc) return null;
                const isInsta = rawUrl.toLowerCase().includes('instagram.com');
                return (
                  <div
                    key={idx}
                    style={{
                      width: '100%',
                      maxWidth: isInsta ? '320px' : '480px',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      border: '1px solid rgba(212, 175, 55, 0.22)',
                      background: 'rgba(0, 0, 0, 0.65)',
                      boxShadow: '0 12px 32px rgba(0, 0, 0, 0.45)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <div style={{
                      width: '100%',
                      aspectRatio: isInsta ? '9 / 14' : '16 / 9',
                      maxHeight: isInsta ? '500px' : '280px',
                      position: 'relative',
                      background: '#050505',
                      overflow: 'hidden',
                    }}>
                      <iframe
                        src={embedSrc}
                        title={`Reel ${idx + 1}`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        scrolling="no"
                        style={{
                          width: '100%',
                          height: '100%',
                          border: 'none',
                          display: 'block',
                        }}
                      />
                    </div>
                    <div style={{
                      width: '100%', padding: '0.65rem 1rem',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.06)',
                    }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#d4af37' }}>
                        {isInsta ? '📸 Instagram Reel' : '🎬 Product Reel'}
                      </span>
                      <a
                        href={rawUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.3rem',
                          color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: '0.72rem',
                        }}
                      >
                        Open Original <ExternalLink size={11} />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Section: Customer Reviews & Write a Review Form ── */}
        <div style={{
          padding: 'clamp(1.25rem, 3vw, 2rem)',
          borderRadius: '20px',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
            <MessageSquare size={20} color="#d4af37" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'white', margin: 0 }}>
              Customer Reviews ({reviewsList.length})
            </h3>
          </div>
          <p style={{ margin: '0 0 1.5rem', fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.45)' }}>
            Read authentic experiences from valued patrons or share your own thoughts.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
            gap: '2rem',
            alignItems: 'start',
          }}>
            {/* Reviews List */}
            <div>
              {reviewsLoading ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>
                  Loading reviews...
                </div>
              ) : reviewsList.length === 0 ? (
                <div style={{
                  padding: '2rem', textAlign: 'center',
                  background: 'rgba(255,255,255,0.015)',
                  borderRadius: '14px', border: '1px dashed rgba(255,255,255,0.08)',
                }}>
                  <p style={{ fontSize: '1.5rem', margin: '0 0 0.5rem' }}>✨</p>
                  <p style={{ color: 'white', fontWeight: 700, margin: 0, fontSize: '0.9rem' }}>
                    No reviews yet for this product.
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.4)', margin: '0.35rem 0 0', fontSize: '0.78rem' }}>
                    Be the very first to share your experience with other patrons!
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxHeight: '380px', overflowY: 'auto' }}>
                  {reviewsList.map((rev, idx) => (
                    <div
                      key={rev.id || idx}
                      style={{
                        padding: '1rem',
                        borderRadius: '12px',
                        background: 'rgba(255, 255, 255, 0.025)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                        <span style={{ fontWeight: 800, color: 'white', fontSize: '0.88rem' }}>
                          {rev.customer_name}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              size={12}
                              fill={s <= Math.round(Number(rev.rating)) ? '#d4af37' : 'none'}
                              color={s <= Math.round(Number(rev.rating)) ? '#d4af37' : 'rgba(255,255,255,0.2)'}
                            />
                          ))}
                        </div>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.7)', lineHeight: 1.5 }}>
                        {rev.comment}
                      </p>
                      {rev.created_at && (
                        <span style={{ display: 'block', fontSize: '0.68rem', color: 'rgba(255, 255, 255, 0.3)', marginTop: '0.5rem' }}>
                          {new Date(rev.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Write a Review Card */}
            <form
              onSubmit={handleSubmitReview}
              style={{
                padding: '1.25rem',
                borderRadius: '16px',
                background: 'rgba(212, 175, 55, 0.03)',
                border: '1px solid rgba(212, 175, 55, 0.2)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem',
              }}
            >
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#d4af37' }}>
                Write a Review
              </h4>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                How would you rate this product?
              </p>

              {/* Interactive Stars */}
              <div style={{ display: 'flex', gap: '0.35rem', cursor: 'pointer' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewerRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    <Star
                      size={22}
                      fill={star <= (hoverRating || reviewerRating) ? '#d4af37' : 'none'}
                      color={star <= (hoverRating || reviewerRating) ? '#d4af37' : 'rgba(255,255,255,0.25)'}
                    />
                  </button>
                ))}
              </div>

              {/* Name */}
              <div>
                <input
                  type="text"
                  placeholder="Your Name *"
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.05)',
                    color: 'white',
                    fontSize: '0.82rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  required
                />
              </div>

              {/* Comment */}
              <div>
                <textarea
                  rows={3}
                  placeholder="Share your thoughts on the quality, texture, and comfort... *"
                  value={reviewerComment}
                  onChange={(e) => setReviewerComment(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.05)',
                    color: 'white',
                    fontSize: '0.82rem',
                    outline: 'none',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                  }}
                  required
                />
              </div>

              {reviewError && (
                <div style={{ color: '#ef4444', fontSize: '0.74rem' }}>{reviewError}</div>
              )}
              {reviewSuccess && (
                <div style={{ color: '#4ade80', fontSize: '0.74rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <CheckCircle size={13} /> Review published! Thank you.
                </div>
              )}

              <button
                type="submit"
                disabled={submittingReview}
                style={{
                  padding: '0.65rem 1rem',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #7A4E2D, #d4af37)',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: submittingReview ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                }}
              >
                <Send size={13} />
                <span>{submittingReview ? 'Submitting...' : 'Post Review'}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}


