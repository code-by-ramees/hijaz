import { useState, useEffect, useCallback } from 'react';
import {
  X,
  Settings,
  Tag,
  Save,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Truck,
  Percent,
  DollarSign,
  Calendar,
  RefreshCw,
  Package,
  ShieldCheck,
  Zap,
  Star,
  Upload,
  Image as ImageIcon,
  Film,
  MessageSquare,
  ExternalLink,
} from 'lucide-react';
import { API_URL } from '../api';
import { type Product, type BeddingType, BEDDING_SUB_CONFIG } from '../data/products';

// ─── Types ────────────────────────────────────────────────────────────────────

type BusinessSettings = {
  id?: number;
  shipping_fee: number;
  free_shipping_threshold: number;
  free_shipping_enabled: boolean;
  estimated_delivery_days: string;
  business_name: string;
  support_email: string;
  support_phone: string;
  tax_percentage: number;
};

type Coupon = {
  id: number;
  code: string;
  description: string | null;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  max_discount_amount: number | null;
  is_active: boolean;
  usage_limit: number | null;
  used_count: number;
  expires_at: string | null;
  created_at: string;
};

type CouponForm = {
  code: string;
  description: string;
  discount_type: 'percent' | 'fixed';
  discount_value: string;
  min_order_amount: string;
  max_discount_amount: string;
  is_active: boolean;
  usage_limit: string;
  expires_at: string;
};

type Tab = 'settings' | 'coupons' | 'products';

const EMPTY_COUPON_FORM: CouponForm = {
  code: '',
  description: '',
  discount_type: 'percent',
  discount_value: '',
  min_order_amount: '',
  max_discount_amount: '',
  is_active: true,
  usage_limit: '',
  expires_at: '',
};

type ProductForm = {
  category: 'pillows' | 'bedding' | 'bath';
  bedding_type: BeddingType;
  name: string;
  subtitle: string;
  description: string;
  price: string;
  originalPrice: string;
  badge: string;
  rating: string;
  reviews: string;
  image: string;
  images: string[];
  embed_urls: string[];
  review_customer_name: string;
  review_rating: string;
  review_comment: string;
};

const EMPTY_PRODUCT_FORM: ProductForm = {
  category: 'bedding',
  bedding_type: 'king',
  name: '',
  subtitle: '',
  description: '',
  price: '',
  originalPrice: '',
  badge: '',
  rating: '5.0',
  reviews: '0',
  image: '',
  images: [],
  embed_urls: [],
  review_customer_name: '',
  review_rating: '5.0',
  review_comment: '',
};

// ─── Styled input helper ───────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.65rem 0.875rem',
  borderRadius: '10px',
  border: '1px solid rgba(255,255,255,0.1)',
  background: 'rgba(255,255,255,0.05)',
  color: 'white',
  fontSize: '0.875rem',
  fontFamily: "'Inter', sans-serif",
  outline: 'none',
  transition: 'border-color 200ms ease, box-shadow 200ms ease',
  boxSizing: 'border-box' as const,
};

const labelStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 700,
  color: 'rgba(255,255,255,0.5)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: '0.4rem',
  display: 'block',
};

// ─── BusinessAdmin Component ──────────────────────────────────────────────────

export default function BusinessAdmin({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<Tab>('settings');

  // ── Business Settings state ──
  const [settings, setSettings] = useState<BusinessSettings>({
    shipping_fee: 99,
    free_shipping_threshold: 999,
    free_shipping_enabled: true,
    estimated_delivery_days: '2 - 4 Business Days',
    business_name: 'HIJAZ Luxury Fragrances',
    support_email: 'care@hijazperfumes.com',
    support_phone: '+91 98765 43210',
    tax_percentage: 0,
  });
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);
  const [settingsError, setSettingsError] = useState('');

  // ── Coupons state ──
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponsLoading, setCouponsLoading] = useState(true);
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [couponForm, setCouponForm] = useState<CouponForm>(EMPTY_COUPON_FORM);
  const [couponSaving, setCouponSaving] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  // ── Products state ──
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<ProductForm>(EMPTY_PRODUCT_FORM);
  const [productImageFile, setProductImageFile] = useState<File | null>(null);
  const [productImagePreview, setProductImagePreview] = useState<string | null>(null);
  const [productSaving, setProductSaving] = useState(false);
  const [productError, setProductError] = useState('');
  const [productSuccess, setProductSuccess] = useState('');
  const [deletingProductId, setDeletingProductId] = useState<string | number | null>(null);
  const [productCategoryFilter, setProductCategoryFilter] = useState<'all' | 'pillows' | 'bedding' | 'bath'>('all');
  const [productBeddingFilter, setProductBeddingFilter] = useState<'all' | BeddingType>('all');

  // ── Extra Images, Thumbnail Selector & Embeds & Reviews state ──
  const [extraImageFiles, setExtraImageFiles] = useState<File[]>([]);
  const [extraImagePreviews, setExtraImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [selectedThumbnailSource, setSelectedThumbnailSource] = useState<string>('primary'); // 'primary' | 'existing:idx' | 'new:idx'
  const [embedUrls, setEmbedUrls] = useState<string[]>([]);
  const [newEmbedInput, setNewEmbedInput] = useState<string>('');
  const [extraImageUrlInput, setExtraImageUrlInput] = useState<string>('');
  const [productReviews, setProductReviews] = useState<any[]>([]);

  // ── Fetch Settings ──
  const fetchSettings = useCallback(async () => {
    setSettingsLoading(true);
    try {
      const res = await fetch(`${API_URL}/settings`);
      if (res.ok) {
        const data = await res.json();
        setSettings({
          shipping_fee: Number(data.shipping_fee) || 99,
          free_shipping_threshold: Number(data.free_shipping_threshold) || 999,
          free_shipping_enabled: Boolean(data.free_shipping_enabled),
          estimated_delivery_days: data.estimated_delivery_days || '2 - 4 Business Days',
          business_name: data.business_name || 'HIJAZ Luxury Fragrances',
          support_email: data.support_email || 'care@hijazperfumes.com',
          support_phone: data.support_phone || '+91 98765 43210',
          tax_percentage: Number(data.tax_percentage) || 0,
        });
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    } finally {
      setSettingsLoading(false);
    }
  }, []);

  // ── Fetch Coupons ──
  const fetchCoupons = useCallback(async () => {
    setCouponsLoading(true);
    try {
      const res = await fetch(`${API_URL}/coupons`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setCoupons(data);
      }
    } catch (err) {
      console.error('Failed to fetch coupons:', err);
    } finally {
      setCouponsLoading(false);
    }
  }, []);

  // ── Fetch Products ──
  const fetchProducts = useCallback(async () => {
    setProductsLoading(true);
    try {
      const res = await fetch(`${API_URL}/products`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setProducts(data);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setProductsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
    fetchCoupons();
    fetchProducts();
  }, [fetchSettings, fetchCoupons, fetchProducts]);

  // ── Save Settings ──
  const handleSaveSettings = async () => {
    setSettingsSaving(true);
    setSettingsError('');
    setSettingsSuccess(false);
    try {
      const res = await fetch(`${API_URL}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shipping_fee: Number(settings.shipping_fee),
          free_shipping_threshold: Number(settings.free_shipping_threshold),
          free_shipping_enabled: settings.free_shipping_enabled,
          estimated_delivery_days: settings.estimated_delivery_days,
          business_name: settings.business_name,
          support_email: settings.support_email,
          support_phone: settings.support_phone,
          tax_percentage: Number(settings.tax_percentage),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSettingsSuccess(true);
        setTimeout(() => setSettingsSuccess(false), 3000);
      } else {
        setSettingsError(data.message || 'Failed to save settings.');
      }
    } catch {
      setSettingsError('Network error. Please try again.');
    } finally {
      setSettingsSaving(false);
    }
  };

  // ── Open Coupon Form ──
  const openCreateCoupon = () => {
    setEditingCoupon(null);
    setCouponForm(EMPTY_COUPON_FORM);
    setCouponError('');
    setShowCouponForm(true);
  };

  const openEditCoupon = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setCouponForm({
      code: coupon.code,
      description: coupon.description || '',
      discount_type: coupon.discount_type,
      discount_value: String(coupon.discount_value),
      min_order_amount: coupon.min_order_amount ? String(coupon.min_order_amount) : '',
      max_discount_amount: coupon.max_discount_amount ? String(coupon.max_discount_amount) : '',
      is_active: coupon.is_active,
      usage_limit: coupon.usage_limit ? String(coupon.usage_limit) : '',
      expires_at: coupon.expires_at ? coupon.expires_at.split('T')[0] : '',
    });
    setCouponError('');
    setShowCouponForm(true);
  };

  // ── Save Coupon ──
  const handleSaveCoupon = async () => {
    if (!couponForm.code.trim()) {
      setCouponError('Coupon code is required.');
      return;
    }
    if (!couponForm.discount_value || Number(couponForm.discount_value) <= 0) {
      setCouponError('Discount value must be greater than 0.');
      return;
    }
    setCouponSaving(true);
    setCouponError('');
    try {
      const payload = {
        code: couponForm.code.toUpperCase().trim(),
        description: couponForm.description || null,
        discount_type: couponForm.discount_type,
        discount_value: Number(couponForm.discount_value),
        min_order_amount: couponForm.min_order_amount ? Number(couponForm.min_order_amount) : 0,
        max_discount_amount: couponForm.max_discount_amount ? Number(couponForm.max_discount_amount) : null,
        is_active: couponForm.is_active,
        usage_limit: couponForm.usage_limit ? Number(couponForm.usage_limit) : null,
        expires_at: couponForm.expires_at || null,
      };

      const url = editingCoupon
        ? `${API_URL}/coupons/${editingCoupon.id}`
        : `${API_URL}/coupons`;
      const method = editingCoupon ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setCouponSuccess(editingCoupon ? 'Coupon updated!' : 'Coupon created!');
        setTimeout(() => setCouponSuccess(''), 3000);
        setShowCouponForm(false);
        fetchCoupons();
      } else {
        const msg =
          data.errors
            ? Object.values(data.errors).flat().join(' ')
            : data.message || 'Failed to save coupon.';
        setCouponError(String(msg));
      }
    } catch {
      setCouponError('Network error. Please try again.');
    } finally {
      setCouponSaving(false);
    }
  };

  // ── Delete Coupon ──
  const handleDeleteCoupon = async (id: number) => {
    if (!confirm('Delete this coupon? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`${API_URL}/coupons/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setCoupons((prev) => prev.filter((c) => c.id !== id));
        setCouponSuccess('Coupon deleted.');
        setTimeout(() => setCouponSuccess(''), 2500);
      }
    } catch {
      console.error('Failed to delete coupon');
    } finally {
      setDeletingId(null);
    }
  };

  // ── Toggle Coupon ──
  const handleToggleCoupon = async (id: number) => {
    setTogglingId(id);
    try {
      const res = await fetch(`${API_URL}/coupons/${id}/toggle`, { method: 'PATCH' });
      const data = await res.json();
      if (res.ok && data.success) {
        setCoupons((prev) =>
          prev.map((c) => (c.id === id ? { ...c, is_active: data.coupon.is_active } : c))
        );
      }
    } catch {
      console.error('Failed to toggle coupon');
    } finally {
      setTogglingId(null);
    }
  };

  // ── Product Handlers ──
  const openCreateProduct = () => {
    setEditingProduct(null);
    setProductForm(EMPTY_PRODUCT_FORM);
    setProductImageFile(null);
    setProductImagePreview(null);
    setExtraImageFiles([]);
    setExtraImagePreviews([]);
    setExistingImages([]);
    setSelectedThumbnailSource('primary');
    setEmbedUrls([]);
    setNewEmbedInput('');
    setExtraImageUrlInput('');
    setProductReviews([]);
    setProductError('');
    setShowProductForm(true);
  };

  const openEditProduct = async (prod: Product) => {
    setEditingProduct(prod);
    setProductForm({
      category: (prod.category as 'pillows' | 'bedding' | 'bath') || 'bedding',
      bedding_type: (prod.bedding_type as BeddingType) || 'king',
      name: prod.name,
      subtitle: prod.subtitle || '',
      description: prod.description || '',
      price: String(prod.price),
      originalPrice: prod.originalPrice ? String(prod.originalPrice) : '',
      badge: prod.badge || '',
      rating: String(prod.rating ?? '5.0'),
      reviews: String(prod.reviews ?? '0'),
      image: prod.image || '',
      images: prod.images || [],
      embed_urls: prod.embed_urls || [],
      review_customer_name: '',
      review_rating: '5.0',
      review_comment: '',
    });
    setProductImageFile(null);
    setProductImagePreview(prod.image || null);
    setExtraImageFiles([]);
    setExtraImagePreviews([]);
    setExistingImages(prod.images || []);
    setSelectedThumbnailSource('primary');
    setEmbedUrls(prod.embed_urls || []);
    setNewEmbedInput('');
    setExtraImageUrlInput('');
    setProductError('');
    setShowProductForm(true);

    try {
      const res = await fetch(`${API_URL}/reviews?product_id=${prod.id}`);
      if (res.ok) {
        const revs = await res.json();
        setProductReviews(Array.isArray(revs) ? revs : []);
      }
    } catch {
      setProductReviews(prod.customerReviews || prod.customer_reviews || []);
    }
  };

  const handleProductImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProductImageFile(file);
      setSelectedThumbnailSource('primary');
      const reader = new FileReader();
      reader.onload = (ev) => {
        setProductImagePreview(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExtraImagesFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setExtraImageFiles((prev) => [...prev, ...files]);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setExtraImagePreviews((prev) => [...prev, ev.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddExtraImageUrl = () => {
    if (!extraImageUrlInput.trim()) return;
    setExistingImages((prev) => [...prev, extraImageUrlInput.trim()]);
    setExtraImageUrlInput('');
  };

  const handleRemoveExistingImage = (idx: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== idx));
    if (selectedThumbnailSource === `existing:${idx}`) {
      setSelectedThumbnailSource('primary');
    }
  };

  const handleRemoveNewExtraFile = (idx: number) => {
    setExtraImageFiles((prev) => prev.filter((_, i) => i !== idx));
    setExtraImagePreviews((prev) => prev.filter((_, i) => i !== idx));
    if (selectedThumbnailSource === `new:${idx}`) {
      setSelectedThumbnailSource('primary');
    }
  };

  const handleAddEmbedUrl = () => {
    const trimmed = newEmbedInput.trim();
    if (!trimmed) return;
    if (!embedUrls.includes(trimmed)) {
      setEmbedUrls((prev) => [...prev, trimmed]);
    }
    setNewEmbedInput('');
  };

  const handleRemoveEmbedUrl = (idx: number) => {
    setEmbedUrls((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleDeleteReviewItem = async (reviewId: number) => {
    if (!window.confirm('Delete this review?')) return;
    try {
      const res = await fetch(`${API_URL}/reviews/${reviewId}`, { method: 'DELETE' });
      if (res.ok) {
        setProductReviews((prev) => prev.filter((r) => r.id !== reviewId));
        fetchProducts();
      }
    } catch (err) {
      console.error('Failed to delete review', err);
    }
  };

  const handleSaveProduct = async () => {
    if (!productForm.name.trim()) {
      setProductError('Product name is required.');
      return;
    }
    if (!productForm.price || isNaN(Number(productForm.price)) || Number(productForm.price) <= 0) {
      setProductError('Please enter a valid price.');
      return;
    }

    setProductSaving(true);
    setProductError('');
    setProductSuccess('');

    try {
      const formData = new FormData();
      formData.append('category', productForm.category);
      if (productForm.category === 'bedding') {
        formData.append('bedding_type', productForm.bedding_type || 'king');
      }
      formData.append('name', productForm.name.trim());
      if (productForm.subtitle) formData.append('subtitle', productForm.subtitle.trim());
      if (productForm.description) formData.append('description', productForm.description.trim());
      formData.append('price', productForm.price);
      if (productForm.originalPrice) formData.append('originalPrice', productForm.originalPrice);
      if (productForm.badge) formData.append('badge', productForm.badge.trim());
      if (productForm.rating) formData.append('rating', productForm.rating);
      if (productForm.reviews) formData.append('reviews', productForm.reviews);

      // Gallery Images (existing & extra)
      existingImages.forEach((url) => {
        formData.append('existing_images[]', url);
      });
      extraImageFiles.forEach((file) => {
        formData.append('extra_images[]', file);
      });

      // Embed URLs (Instagram Reels, etc.)
      embedUrls.forEach((url) => {
        formData.append('embed_urls[]', url);
      });

      // Main Thumbnail selection
      if (selectedThumbnailSource.startsWith('existing:')) {
        const idx = parseInt(selectedThumbnailSource.split(':')[1], 10);
        if (existingImages[idx]) {
          formData.append('thumbnail_image', existingImages[idx]);
        }
      } else if (selectedThumbnailSource.startsWith('new:')) {
        const idx = parseInt(selectedThumbnailSource.split(':')[1], 10);
        if (extraImageFiles[idx]) {
          formData.append('image', extraImageFiles[idx]);
        }
      } else {
        if (productImageFile) {
          formData.append('image', productImageFile);
        } else if (productForm.image) {
          formData.append('image', productForm.image.trim());
        }
      }

      // Review adding during create or edit
      if (productForm.review_customer_name.trim() && productForm.review_comment.trim()) {
        formData.append('review_customer_name', productForm.review_customer_name.trim());
        formData.append('review_rating', productForm.review_rating || '5.0');
        formData.append('review_comment', productForm.review_comment.trim());
      }

      const url = editingProduct ? `${API_URL}/products/${editingProduct.id}` : `${API_URL}/products`;
      if (editingProduct) {
        formData.append('_method', 'PUT');
      }

      const res = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        setProductSuccess(editingProduct ? 'Product updated successfully!' : 'Product added successfully!');
        setShowProductForm(false);
        fetchProducts();
        setTimeout(() => setProductSuccess(''), 3000);
      } else {
        const data = await res.json().catch(() => ({}));
        setProductError(data.message || 'Failed to save product.');
      }
    } catch {
      setProductError('Network error. Please try again.');
    } finally {
      setProductSaving(false);
    }
  };

  const handleDeleteProduct = async (id: string | number) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    setDeletingProductId(id);
    try {
      const res = await fetch(`${API_URL}/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete product:', err);
    } finally {
      setDeletingProductId(null);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(12px)',
        padding: '1rem',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '900px',
          maxHeight: '90vh',
          background: 'linear-gradient(160deg, #111010 0%, #0a0a0a 100%)',
          border: '1px solid rgba(212,175,55,0.2)',
          borderRadius: '24px',
          boxShadow: '0 40px 100px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.06)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            padding: '1.25rem 1.75rem',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
            background: 'rgba(255,255,255,0.015)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #7A4E2D, #d4af37)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(212,175,55,0.3)',
              }}
            >
              <ShieldCheck size={18} color="white" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'white', letterSpacing: '-0.01em' }}>
                Admin Panel
              </h2>
              <p style={{ margin: 0, fontSize: '0.73rem', color: 'rgba(255,255,255,0.4)' }}>
                Business Settings, Coupons & Product Catalog
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.04)',
              color: 'rgba(255,255,255,0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 200ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239,68,68,0.15)';
              e.currentTarget.style.color = '#f87171';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* ── Tabs ── */}
        <div
          style={{
            padding: '0.875rem 1.75rem 0',
            display: 'flex',
            gap: '0.25rem',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            flexShrink: 0,
          }}
        >
          {([
            { id: 'settings' as Tab, label: 'Business Settings', icon: Settings },
            { id: 'coupons' as Tab, label: 'Coupon Manager', icon: Tag },
            { id: 'products' as Tab, label: 'Products', icon: Package },
          ]).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.65rem 1.1rem',
                borderRadius: '10px 10px 0 0',
                border: 'none',
                background: activeTab === id ? 'rgba(212,175,55,0.1)' : 'transparent',
                color: activeTab === id ? '#d4af37' : 'rgba(255,255,255,0.4)',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 200ms ease',
                borderBottom: activeTab === id ? '2px solid #d4af37' : '2px solid transparent',
                letterSpacing: '0.02em',
              }}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        {/* ── Content ── */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '1.75rem' }}>

          {/* ════════════ SETTINGS TAB ════════════ */}
          {activeTab === 'settings' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

              {settingsLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem', gap: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                  <Loader2 size={22} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Loading settings…</span>
                </div>
              ) : (
                <>
                  {/* Shipping */}
                  <section
                    style={{
                      background: 'rgba(255,255,255,0.025)',
                      border: '1px solid rgba(255,255,255,0.07)',
                      borderRadius: '18px',
                      padding: '1.5rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
                      <Truck size={16} color="#d4af37" />
                      <h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: 'white' }}>Shipping Configuration</h3>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                      <div>
                        <label style={labelStyle}>Shipping Fee (₹)</label>
                        <div style={{ position: 'relative' }}>
                          <span style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem', pointerEvents: 'none' }}>₹</span>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={settings.shipping_fee}
                            onChange={(e) => setSettings((s) => ({ ...s, shipping_fee: Number(e.target.value) }))}
                            style={{ ...inputStyle, paddingLeft: '1.75rem' }}
                            onFocus={(e) => { e.target.style.borderColor = 'rgba(212,175,55,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(212,175,55,0.1)'; }}
                            onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
                          />
                        </div>
                      </div>

                      <div>
                        <label style={labelStyle}>Free Shipping Above (₹)</label>
                        <div style={{ position: 'relative' }}>
                          <span style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem', pointerEvents: 'none' }}>₹</span>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={settings.free_shipping_threshold}
                            onChange={(e) => setSettings((s) => ({ ...s, free_shipping_threshold: Number(e.target.value) }))}
                            style={{ ...inputStyle, paddingLeft: '1.75rem' }}
                            onFocus={(e) => { e.target.style.borderColor = 'rgba(212,175,55,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(212,175,55,0.1)'; }}
                            onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
                          />
                        </div>
                      </div>

                      <div>
                        <label style={labelStyle}>Estimated Delivery</label>
                        <input
                          type="text"
                          placeholder="e.g. 2 - 4 Business Days"
                          value={settings.estimated_delivery_days}
                          onChange={(e) => setSettings((s) => ({ ...s, estimated_delivery_days: e.target.value }))}
                          style={inputStyle}
                          onFocus={(e) => { e.target.style.borderColor = 'rgba(212,175,55,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(212,175,55,0.1)'; }}
                          onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
                        />
                      </div>
                    </div>

                    <div
                      style={{
                        marginTop: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.875rem 1rem',
                        borderRadius: '10px',
                        background: settings.free_shipping_enabled ? 'rgba(134,239,172,0.06)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${settings.free_shipping_enabled ? 'rgba(134,239,172,0.2)' : 'rgba(255,255,255,0.06)'}`,
                        cursor: 'pointer',
                        transition: 'all 200ms ease',
                      }}
                      onClick={() => setSettings((s) => ({ ...s, free_shipping_enabled: !s.free_shipping_enabled }))}
                    >
                      {settings.free_shipping_enabled ? (
                        <ToggleRight size={24} color="#86efac" />
                      ) : (
                        <ToggleLeft size={24} color="rgba(255,255,255,0.3)" />
                      )}
                      <div>
                        <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: settings.free_shipping_enabled ? '#86efac' : 'rgba(255,255,255,0.5)' }}>
                          Free Shipping Feature
                        </p>
                        <p style={{ margin: 0, fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)' }}>
                          {settings.free_shipping_enabled
                            ? `Active — Free shipping on orders over ₹${settings.free_shipping_threshold}`
                            : 'Disabled — Shipping fee applied to all orders'}
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* Tax */}
                  <section
                    style={{
                      background: 'rgba(255,255,255,0.025)',
                      border: '1px solid rgba(255,255,255,0.07)',
                      borderRadius: '18px',
                      padding: '1.5rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
                      <Percent size={16} color="#d4af37" />
                      <h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: 'white' }}>Tax & Pricing</h3>
                    </div>
                    <div style={{ maxWidth: '220px' }}>
                      <label style={labelStyle}>Tax Percentage (%)</label>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem', pointerEvents: 'none' }}>%</span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={settings.tax_percentage}
                          onChange={(e) => setSettings((s) => ({ ...s, tax_percentage: Number(e.target.value) }))}
                          style={{ ...inputStyle, paddingRight: '2rem' }}
                          onFocus={(e) => { e.target.style.borderColor = 'rgba(212,175,55,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(212,175,55,0.1)'; }}
                          onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
                        />
                      </div>
                      <p style={{ margin: '0.4rem 0 0', fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)' }}>
                        Set to 0 to disable tax calculation
                      </p>
                    </div>
                  </section>

                  {/* Business Info */}
                  <section
                    style={{
                      background: 'rgba(255,255,255,0.025)',
                      border: '1px solid rgba(255,255,255,0.07)',
                      borderRadius: '18px',
                      padding: '1.5rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
                      <Package size={16} color="#d4af37" />
                      <h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: 'white' }}>Business Information</h3>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                      <div>
                        <label style={labelStyle}>Business Name</label>
                        <input
                          type="text"
                          value={settings.business_name}
                          onChange={(e) => setSettings((s) => ({ ...s, business_name: e.target.value }))}
                          style={inputStyle}
                          onFocus={(e) => { e.target.style.borderColor = 'rgba(212,175,55,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(212,175,55,0.1)'; }}
                          onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>Support Email</label>
                        <input
                          type="email"
                          value={settings.support_email}
                          onChange={(e) => setSettings((s) => ({ ...s, support_email: e.target.value }))}
                          style={inputStyle}
                          onFocus={(e) => { e.target.style.borderColor = 'rgba(212,175,55,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(212,175,55,0.1)'; }}
                          onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>Support Phone</label>
                        <input
                          type="text"
                          value={settings.support_phone}
                          onChange={(e) => setSettings((s) => ({ ...s, support_phone: e.target.value }))}
                          style={inputStyle}
                          onFocus={(e) => { e.target.style.borderColor = 'rgba(212,175,55,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(212,175,55,0.1)'; }}
                          onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
                        />
                      </div>
                    </div>
                  </section>

                  {settingsError && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.875rem 1rem', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5', fontSize: '0.82rem' }}>
                      <AlertCircle size={16} />
                      {settingsError}
                    </div>
                  )}
                  {settingsSuccess && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.875rem 1rem', borderRadius: '10px', background: 'rgba(134,239,172,0.08)', border: '1px solid rgba(134,239,172,0.25)', color: '#86efac', fontSize: '0.82rem' }}>
                      <CheckCircle2 size={16} />
                      Settings saved successfully!
                    </div>
                  )}

                  <button
                    onClick={handleSaveSettings}
                    disabled={settingsSaving}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      width: '100%',
                      padding: '0.9rem',
                      borderRadius: '14px',
                      border: 'none',
                      background: settingsSaving ? 'rgba(122,78,45,0.4)' : 'linear-gradient(135deg, #7A4E2D 0%, #d4af37 100%)',
                      color: 'white',
                      fontSize: '0.9rem',
                      fontWeight: 800,
                      cursor: settingsSaving ? 'not-allowed' : 'pointer',
                      boxShadow: settingsSaving ? 'none' : '0 4px 20px rgba(212,175,55,0.3)',
                      transition: 'all 200ms ease',
                      letterSpacing: '0.04em',
                    }}
                    onMouseEnter={(e) => { if (!settingsSaving) e.currentTarget.style.opacity = '0.9'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                  >
                    {settingsSaving ? (
                      <><Loader2 size={17} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</>
                    ) : (
                      <><Save size={17} /> Save Settings</>
                    )}
                  </button>
                </>
              )}
            </div>
          )}

          {/* ════════════ COUPONS TAB ════════════ */}
          {activeTab === 'coupons' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'white' }}>Coupon Codes</h3>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)' }}>
                    {coupons.length} coupon{coupons.length !== 1 ? 's' : ''} total
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={fetchCoupons}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.4rem',
                      padding: '0.55rem 0.875rem', borderRadius: '10px',
                      border: '1px solid rgba(255,255,255,0.1)',
                      background: 'rgba(255,255,255,0.04)',
                      color: 'rgba(255,255,255,0.6)',
                      fontSize: '0.78rem', fontWeight: 600,
                      cursor: 'pointer', transition: 'all 200ms ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'white'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
                  >
                    <RefreshCw size={13} /> Refresh
                  </button>
                  <button
                    onClick={openCreateCoupon}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.4rem',
                      padding: '0.55rem 1.1rem', borderRadius: '10px', border: 'none',
                      background: 'linear-gradient(135deg, #7A4E2D, #d4af37)',
                      color: 'white', fontSize: '0.78rem', fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(212,175,55,0.25)',
                      transition: 'all 200ms ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                  >
                    <Plus size={14} /> New Coupon
                  </button>
                </div>
              </div>

              {couponSuccess && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.75rem 1rem', borderRadius: '10px', background: 'rgba(134,239,172,0.08)', border: '1px solid rgba(134,239,172,0.25)', color: '#86efac', fontSize: '0.82rem' }}>
                  <CheckCircle2 size={15} />
                  {couponSuccess}
                </div>
              )}

              {/* Coupon Form */}
              {showCouponForm && (
                <div
                  style={{
                    background: 'rgba(212,175,55,0.04)',
                    border: '1px solid rgba(212,175,55,0.2)',
                    borderRadius: '18px',
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700, color: '#d4af37' }}>
                      {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
                    </h4>
                    <button
                      onClick={() => setShowCouponForm(false)}
                      style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '0.25rem' }}
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.875rem' }}>
                    <div>
                      <label style={labelStyle}>Code *</label>
                      <input
                        type="text"
                        placeholder="SAVE20"
                        value={couponForm.code}
                        onChange={(e) => setCouponForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                        style={{ ...inputStyle, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em' }}
                        onFocus={(e) => { e.target.style.borderColor = 'rgba(212,175,55,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(212,175,55,0.1)'; }}
                        onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
                      />
                    </div>

                    <div>
                      <label style={labelStyle}>Discount Type *</label>
                      <select
                        value={couponForm.discount_type}
                        onChange={(e) => setCouponForm((f) => ({ ...f, discount_type: e.target.value as 'percent' | 'fixed' }))}
                        style={{ ...inputStyle, cursor: 'pointer' }}
                        onFocus={(e) => { e.target.style.borderColor = 'rgba(212,175,55,0.5)'; }}
                        onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                      >
                        <option value="percent" style={{ background: '#111' }}>Percentage (%)</option>
                        <option value="fixed" style={{ background: '#111' }}>Fixed Amount (₹)</option>
                      </select>
                    </div>

                    <div>
                      <label style={labelStyle}>
                        Value * {couponForm.discount_type === 'percent' ? '(%)' : '(₹)'}
                      </label>
                      <div style={{ position: 'relative' }}>
                        {couponForm.discount_type === 'fixed' && (
                          <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.35)', fontSize: '0.82rem', pointerEvents: 'none' }}>₹</span>
                        )}
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder={couponForm.discount_type === 'percent' ? '10' : '100'}
                          value={couponForm.discount_value}
                          onChange={(e) => setCouponForm((f) => ({ ...f, discount_value: e.target.value }))}
                          style={{ ...inputStyle, paddingLeft: couponForm.discount_type === 'fixed' ? '1.75rem' : '0.875rem' }}
                          onFocus={(e) => { e.target.style.borderColor = 'rgba(212,175,55,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(212,175,55,0.1)'; }}
                          onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={labelStyle}>Min Order (₹)</label>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.35)', fontSize: '0.82rem', pointerEvents: 'none' }}>₹</span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          placeholder="500"
                          value={couponForm.min_order_amount}
                          onChange={(e) => setCouponForm((f) => ({ ...f, min_order_amount: e.target.value }))}
                          style={{ ...inputStyle, paddingLeft: '1.75rem' }}
                          onFocus={(e) => { e.target.style.borderColor = 'rgba(212,175,55,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(212,175,55,0.1)'; }}
                          onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
                        />
                      </div>
                    </div>

                    {couponForm.discount_type === 'percent' && (
                      <div>
                        <label style={labelStyle}>Max Cap (₹)</label>
                        <div style={{ position: 'relative' }}>
                          <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.35)', fontSize: '0.82rem', pointerEvents: 'none' }}>₹</span>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            placeholder="500"
                            value={couponForm.max_discount_amount}
                            onChange={(e) => setCouponForm((f) => ({ ...f, max_discount_amount: e.target.value }))}
                            style={{ ...inputStyle, paddingLeft: '1.75rem' }}
                            onFocus={(e) => { e.target.style.borderColor = 'rgba(212,175,55,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(212,175,55,0.1)'; }}
                            onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label style={labelStyle}>Usage Limit</label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        placeholder="Unlimited"
                        value={couponForm.usage_limit}
                        onChange={(e) => setCouponForm((f) => ({ ...f, usage_limit: e.target.value }))}
                        style={inputStyle}
                        onFocus={(e) => { e.target.style.borderColor = 'rgba(212,175,55,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(212,175,55,0.1)'; }}
                        onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
                      />
                    </div>

                    <div>
                      <label style={labelStyle}>Expiry Date</label>
                      <input
                        type="date"
                        value={couponForm.expires_at}
                        onChange={(e) => setCouponForm((f) => ({ ...f, expires_at: e.target.value }))}
                        style={{ ...inputStyle, colorScheme: 'dark' }}
                        onFocus={(e) => { e.target.style.borderColor = 'rgba(212,175,55,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(212,175,55,0.1)'; }}
                        onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>Description (optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. 20% off for new customers"
                      value={couponForm.description}
                      onChange={(e) => setCouponForm((f) => ({ ...f, description: e.target.value }))}
                      style={inputStyle}
                      onFocus={(e) => { e.target.style.borderColor = 'rgba(212,175,55,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(212,175,55,0.1)'; }}
                      onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>

                  <div
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.6rem',
                      padding: '0.65rem 0.875rem', borderRadius: '10px',
                      background: couponForm.is_active ? 'rgba(134,239,172,0.06)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${couponForm.is_active ? 'rgba(134,239,172,0.2)' : 'rgba(255,255,255,0.06)'}`,
                      cursor: 'pointer', transition: 'all 200ms ease',
                    }}
                    onClick={() => setCouponForm((f) => ({ ...f, is_active: !f.is_active }))}
                  >
                    {couponForm.is_active ? (
                      <ToggleRight size={20} color="#86efac" />
                    ) : (
                      <ToggleLeft size={20} color="rgba(255,255,255,0.3)" />
                    )}
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: couponForm.is_active ? '#86efac' : 'rgba(255,255,255,0.5)' }}>
                      {couponForm.is_active ? 'Coupon Active' : 'Coupon Inactive'}
                    </span>
                  </div>

                  {couponError && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5', fontSize: '0.8rem' }}>
                      <AlertCircle size={14} />
                      {couponError}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '0.625rem', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => setShowCouponForm(false)}
                      style={{
                        padding: '0.6rem 1.25rem', borderRadius: '10px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(255,255,255,0.04)',
                        color: 'rgba(255,255,255,0.6)', fontSize: '0.82rem', fontWeight: 600,
                        cursor: 'pointer', transition: 'all 200ms ease',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveCoupon}
                      disabled={couponSaving}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                        padding: '0.6rem 1.25rem', borderRadius: '10px', border: 'none',
                        background: couponSaving ? 'rgba(122,78,45,0.4)' : 'linear-gradient(135deg, #7A4E2D, #d4af37)',
                        color: 'white', fontSize: '0.82rem', fontWeight: 700,
                        cursor: couponSaving ? 'not-allowed' : 'pointer',
                        boxShadow: couponSaving ? 'none' : '0 4px 12px rgba(212,175,55,0.25)',
                        transition: 'all 200ms ease',
                      }}
                      onMouseEnter={(e) => { if (!couponSaving) e.currentTarget.style.opacity = '0.9'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                    >
                      {couponSaving ? (
                        <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</>
                      ) : (
                        <><Save size={14} /> {editingCoupon ? 'Update' : 'Create'} Coupon</>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Coupons List */}
              {couponsLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem', gap: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                  <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Loading coupons…</span>
                </div>
              ) : coupons.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3.5rem 2rem', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '18px', color: 'rgba(255,255,255,0.3)' }}>
                  <Tag size={32} style={{ marginBottom: '0.75rem', opacity: 0.4 }} />
                  <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 600 }}>No coupons yet</p>
                  <p style={{ margin: '0.4rem 0 0', fontSize: '0.78rem' }}>Click "New Coupon" to create your first discount code.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {coupons.map((coupon) => {
                    const isExpired = coupon.expires_at ? new Date(coupon.expires_at) < new Date() : false;
                    return (
                      <div
                        key={coupon.id}
                        style={{
                          background: 'rgba(255,255,255,0.025)',
                          border: `1px solid ${coupon.is_active && !isExpired ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)'}`,
                          borderRadius: '14px',
                          padding: '1rem 1.125rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1rem',
                          flexWrap: 'wrap',
                          opacity: coupon.is_active && !isExpired ? 1 : 0.55,
                          transition: 'all 200ms ease',
                        }}
                      >
                        {/* Code badge */}
                        <span style={{
                          flexShrink: 0,
                          display: 'inline-block',
                          padding: '0.35rem 0.75rem',
                          borderRadius: '8px',
                          background: coupon.is_active && !isExpired
                            ? 'linear-gradient(135deg, rgba(122,78,45,0.5), rgba(212,175,55,0.3))'
                            : 'rgba(255,255,255,0.06)',
                          border: coupon.is_active && !isExpired
                            ? '1px solid rgba(212,175,55,0.35)'
                            : '1px solid rgba(255,255,255,0.08)',
                          color: coupon.is_active && !isExpired ? '#d4af37' : 'rgba(255,255,255,0.35)',
                          fontWeight: 800,
                          fontSize: '0.88rem',
                          letterSpacing: '0.1em',
                          fontFamily: 'monospace',
                        }}>
                          {coupon.code}
                        </span>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: '120px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                              padding: '0.2rem 0.55rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700,
                              background: coupon.discount_type === 'percent' ? 'rgba(139,92,246,0.15)' : 'rgba(34,197,94,0.12)',
                              color: coupon.discount_type === 'percent' ? '#c4b5fd' : '#86efac',
                            }}>
                              {coupon.discount_type === 'percent' ? <Percent size={10} /> : <DollarSign size={10} />}
                              {coupon.discount_type === 'percent' ? `${coupon.discount_value}% OFF` : `₹${coupon.discount_value} OFF`}
                            </span>
                            {isExpired && (
                              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#f87171', background: 'rgba(239,68,68,0.1)', padding: '0.15rem 0.45rem', borderRadius: '6px' }}>Expired</span>
                            )}
                            {!coupon.is_active && !isExpired && (
                              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.05)', padding: '0.15rem 0.45rem', borderRadius: '6px' }}>Disabled</span>
                            )}
                          </div>
                          <div style={{ marginTop: '0.3rem', display: 'flex', gap: '0.875rem', flexWrap: 'wrap' }}>
                            {coupon.min_order_amount > 0 && (
                              <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)' }}>Min ₹{coupon.min_order_amount}</span>
                            )}
                            {coupon.usage_limit && (
                              <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)' }}>
                                <span style={{ color: coupon.used_count >= coupon.usage_limit ? '#fca5a5' : 'rgba(255,255,255,0.5)' }}>
                                  {coupon.used_count}
                                </span>/{coupon.usage_limit} used
                              </span>
                            )}
                            {coupon.expires_at && (
                              <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                <Calendar size={10} />
                                {new Date(coupon.expires_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                            )}
                          </div>
                          {coupon.description && (
                            <p style={{ margin: '0.25rem 0 0', fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>
                              {coupon.description}
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                          <button
                            onClick={() => handleToggleCoupon(coupon.id)}
                            disabled={togglingId === coupon.id}
                            title={coupon.is_active ? 'Deactivate' : 'Activate'}
                            style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              width: '34px', height: '34px', borderRadius: '8px',
                              border: '1px solid rgba(255,255,255,0.08)',
                              background: coupon.is_active ? 'rgba(134,239,172,0.1)' : 'rgba(255,255,255,0.04)',
                              color: coupon.is_active ? '#86efac' : 'rgba(255,255,255,0.4)',
                              cursor: togglingId === coupon.id ? 'not-allowed' : 'pointer',
                              transition: 'all 200ms ease',
                            }}
                          >
                            {togglingId === coupon.id ? (
                              <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                            ) : coupon.is_active ? (
                              <ToggleRight size={15} />
                            ) : (
                              <ToggleLeft size={15} />
                            )}
                          </button>

                          <button
                            onClick={() => openEditCoupon(coupon)}
                            title="Edit"
                            style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              width: '34px', height: '34px', borderRadius: '8px',
                              border: '1px solid rgba(255,255,255,0.08)',
                              background: 'rgba(255,255,255,0.04)',
                              color: 'rgba(255,255,255,0.5)',
                              cursor: 'pointer', transition: 'all 200ms ease',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(212,175,55,0.12)'; e.currentTarget.style.color = '#d4af37'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
                          >
                            <Edit3 size={13} />
                          </button>

                          <button
                            onClick={() => handleDeleteCoupon(coupon.id)}
                            disabled={deletingId === coupon.id}
                            title="Delete"
                            style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              width: '34px', height: '34px', borderRadius: '8px',
                              border: '1px solid rgba(255,255,255,0.08)',
                              background: 'rgba(255,255,255,0.04)',
                              color: 'rgba(255,255,255,0.4)',
                              cursor: deletingId === coupon.id ? 'not-allowed' : 'pointer',
                              transition: 'all 200ms ease',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; e.currentTarget.style.color = '#f87171'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
                          >
                            {deletingId === coupon.id ? (
                              <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                            ) : (
                              <Trash2 size={13} />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {coupons.length > 0 && (
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', padding: '0.875rem 1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  {[
                    { label: 'Total', value: coupons.length, color: 'white' },
                    { label: 'Active', value: coupons.filter((c) => c.is_active).length, color: '#86efac' },
                    { label: 'Expired', value: coupons.filter((c) => c.expires_at && new Date(c.expires_at) < new Date()).length, color: '#f87171' },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Zap size={11} color={color} />
                      <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>{label}:</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color }}>{value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ════════════ PRODUCTS TAB ════════════ */}
          {activeTab === 'products' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

              {/* Header with actions */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'white' }}>
                    Product Catalog
                  </h3>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)' }}>
                    Manage products, assign categories, and organize Bedding into King, Queen, and Single sub-sections.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                  <button
                    onClick={fetchProducts}
                    disabled={productsLoading}
                    title="Refresh products"
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.4rem',
                      padding: '0.6rem 0.9rem', borderRadius: '10px',
                      border: '1px solid rgba(255,255,255,0.1)',
                      background: 'rgba(255,255,255,0.04)',
                      color: 'rgba(255,255,255,0.7)',
                      fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                      transition: 'all 200ms ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'white'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
                  >
                    <RefreshCw size={13} style={{ animation: productsLoading ? 'spin 1s linear infinite' : 'none' }} />
                    <span>Refresh</span>
                  </button>

                  <button
                    onClick={openCreateProduct}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.45rem',
                      padding: '0.6rem 1.25rem', borderRadius: '10px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #7A4E2D, #d4af37)',
                      color: 'white', fontSize: '0.82rem', fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 4px 16px rgba(212,175,55,0.3)',
                      transition: 'all 200ms ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(212,175,55,0.45)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(212,175,55,0.3)'; }}
                  >
                    <Plus size={15} strokeWidth={2.5} />
                    <span>Add Product</span>
                  </button>
                </div>
              </div>

              {/* Feedback banners */}
              {productSuccess && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.875rem 1.25rem', borderRadius: '12px', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', color: '#86efac', fontSize: '0.85rem' }}>
                  <CheckCircle2 size={16} />
                  <span>{productSuccess}</span>
                </div>
              )}
              {productError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.875rem 1.25rem', borderRadius: '12px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', fontSize: '0.85rem' }}>
                  <AlertCircle size={16} />
                  <span>{productError}</span>
                </div>
              )}

              {/* ── Product Create / Edit Modal Form ── */}
              {showProductForm && (
                <div
                  style={{
                    background: 'linear-gradient(160deg, rgba(25,23,20,0.98), rgba(15,14,13,0.98))',
                    border: '1.5px solid rgba(212,175,55,0.35)',
                    borderRadius: '20px',
                    padding: '1.75rem',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.7)',
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <Package size={18} color="#d4af37" />
                      <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'white' }}>
                        {editingProduct ? 'Edit Product' : 'Add New Product'}
                      </h4>
                    </div>
                    <button
                      onClick={() => setShowProductForm(false)}
                      style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(255,255,255,0.04)',
                        color: 'rgba(255,255,255,0.5)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {/* Category Selection */}
                    <div>
                      <label style={labelStyle}>Category</label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem' }}>
                        {(['bedding', 'pillows', 'bath'] as const).map((cat) => {
                          const isCatSelected = productForm.category === cat;
                          const label = cat === 'bedding' ? '🛏️ Bedding' : cat === 'pillows' ? '☁️ Pillows' : '🛁 Bath';
                          return (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => setProductForm((f) => ({ ...f, category: cat }))}
                              style={{
                                padding: '0.75rem 1rem',
                                borderRadius: '12px',
                                border: isCatSelected ? '1.5px solid #d4af37' : '1px solid rgba(255,255,255,0.08)',
                                background: isCatSelected ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.03)',
                                color: isCatSelected ? '#d4af37' : 'rgba(255,255,255,0.6)',
                                fontWeight: 700,
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                                transition: 'all 200ms ease',
                                textAlign: 'center',
                              }}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 👑 BEDDING SUB-SECTION (KING / QUEEN / SINGLE) - ONLY WHEN BEDDING IS SELECTED */}
                    {productForm.category === 'bedding' && (
                      <div
                        style={{
                          padding: '1.25rem',
                          borderRadius: '16px',
                          border: '1.5px solid rgba(212,175,55,0.4)',
                          background: 'linear-gradient(135deg, rgba(212,175,55,0.08), rgba(122,78,45,0.06))',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                          <span style={{ fontSize: '1.1rem' }}>👑</span>
                          <label style={{ ...labelStyle, color: '#d4af37', marginBottom: 0, fontSize: '0.8rem' }}>
                            Bedding Sub-Section / Size (Required)
                          </label>
                        </div>
                        <p style={{ margin: '0 0 0.85rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                          Select which dedicated sub-section this bedding product will be categorized under in the Discovery Page.
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                          {(['king', 'queen', 'single'] as BeddingType[]).map((type) => {
                            const conf = BEDDING_SUB_CONFIG[type];
                            const isSelected = productForm.bedding_type === type;
                            return (
                              <button
                                key={type}
                                type="button"
                                onClick={() => setProductForm((f) => ({ ...f, bedding_type: type }))}
                                style={{
                                  padding: '0.85rem 1rem',
                                  borderRadius: '12px',
                                  border: isSelected ? '1.5px solid #d4af37' : '1px solid rgba(255,255,255,0.08)',
                                  background: isSelected ? 'linear-gradient(135deg, rgba(212,175,55,0.2), rgba(122,78,45,0.15))' : 'rgba(255,255,255,0.03)',
                                  color: isSelected ? 'white' : 'rgba(255,255,255,0.6)',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'flex-start',
                                  gap: '0.25rem',
                                  transition: 'all 200ms ease',
                                  boxShadow: isSelected ? '0 4px 16px rgba(212,175,55,0.25)' : 'none',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                  <span style={{ fontSize: '1.1rem' }}>{conf.icon}</span>
                                  {isSelected && <CheckCircle2 size={15} color="#d4af37" />}
                                </div>
                                <span style={{ fontWeight: 800, fontSize: '0.88rem', color: isSelected ? '#d4af37' : 'white' }}>
                                  {conf.label} Size
                                </span>
                                <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textAlign: 'left', lineHeight: 1.3 }}>
                                  {conf.tagline}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Product Name & Subtitle */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                      <div>
                        <label style={labelStyle}>Product Name *</label>
                        <input
                          type="text"
                          placeholder="e.g. Royal Silk Duvet Set"
                          value={productForm.name}
                          onChange={(e) => setProductForm((f) => ({ ...f, name: e.target.value }))}
                          style={inputStyle}
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>Subtitle / Material</label>
                        <input
                          type="text"
                          placeholder="e.g. 1000 Thread Count Egyptian Cotton"
                          value={productForm.subtitle}
                          onChange={(e) => setProductForm((f) => ({ ...f, subtitle: e.target.value }))}
                          style={inputStyle}
                        />
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label style={labelStyle}>Description</label>
                      <textarea
                        rows={2}
                        placeholder="Detailed luxury product description..."
                        value={productForm.description}
                        onChange={(e) => setProductForm((f) => ({ ...f, description: e.target.value }))}
                        style={{ ...inputStyle, resize: 'vertical' }}
                      />
                    </div>

                    {/* Pricing & Badge */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem' }}>
                      <div>
                        <label style={labelStyle}>Price (₹) *</label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="299"
                          value={productForm.price}
                          onChange={(e) => setProductForm((f) => ({ ...f, price: e.target.value }))}
                          style={inputStyle}
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>Original Price (₹)</label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="399"
                          value={productForm.originalPrice}
                          onChange={(e) => setProductForm((f) => ({ ...f, originalPrice: e.target.value }))}
                          style={inputStyle}
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>Badge</label>
                        <input
                          type="text"
                          placeholder="e.g. Bestseller / Signature"
                          value={productForm.badge}
                          onChange={(e) => setProductForm((f) => ({ ...f, badge: e.target.value }))}
                          style={inputStyle}
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>Rating</label>
                        <input
                          type="number"
                          step="0.1"
                          min="1"
                          max="5"
                          placeholder="4.9"
                          value={productForm.rating}
                          onChange={(e) => setProductForm((f) => ({ ...f, rating: e.target.value }))}
                          style={inputStyle}
                        />
                      </div>
                    </div>

                    {/* Product Image & Extra Gallery Images */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                        <label style={{ ...labelStyle, marginBottom: 0 }}>Primary Product Image *</label>
                        <span style={{ fontSize: '0.72rem', color: '#d4af37' }}>Main display image for catalog</span>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(180px, 1fr) auto', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <label
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.5rem',
                              padding: '0.85rem',
                              borderRadius: '10px',
                              border: '1px dashed rgba(212,175,55,0.4)',
                              background: 'rgba(212,175,55,0.03)',
                              color: 'rgba(255,255,255,0.7)',
                              fontSize: '0.8rem',
                              cursor: 'pointer',
                              transition: 'all 200ms ease',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(212,175,55,0.08)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(212,175,55,0.03)'; }}
                          >
                            <Upload size={15} color="#d4af37" />
                            <span>Upload Main Image File...</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleProductImageFileChange}
                              style={{ display: 'none' }}
                            />
                          </label>
                          <input
                            type="text"
                            placeholder="Or enter image URL/path (e.g. /bed1.png)"
                            value={productForm.image}
                            onChange={(e) => {
                              setProductForm((f) => ({ ...f, image: e.target.value }));
                              if (!productImageFile) setProductImagePreview(e.target.value);
                            }}
                            style={inputStyle}
                          />
                        </div>

                        {/* Image Preview Box */}
                        <div
                          style={{
                            width: '74px',
                            height: '74px',
                            borderRadius: '12px',
                            border: selectedThumbnailSource === 'primary' ? '2px solid #d4af37' : '1px solid rgba(255,255,255,0.1)',
                            background: 'rgba(255,255,255,0.02)',
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            position: 'relative',
                          }}
                        >
                          {productImagePreview || productForm.image ? (
                            <img
                              src={productImagePreview || productForm.image}
                              alt="Preview"
                              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                              onError={(e) => { e.currentTarget.src = '/bed1.png'; }}
                            />
                          ) : (
                            <ImageIcon size={22} color="rgba(255,255,255,0.2)" />
                          )}
                          {selectedThumbnailSource === 'primary' && (
                            <span style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: '#d4af37', color: 'black', fontSize: '0.55rem', fontWeight: 800, textAlign: 'center', padding: '1px 0' }}>
                              ★ MAIN
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Extra Images (Multi-Image Upload & Thumbnail Picker) */}
                    <div style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                        <div>
                          <label style={{ ...labelStyle, marginBottom: '0.1rem', color: '#d4af37' }}>
                            Extra Product Images & Gallery
                          </label>
                          <p style={{ margin: 0, fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>
                            Upload multiple extra photos. Click any image to choose it as the <strong>Main Thumbnail</strong> for users!
                          </p>
                        </div>
                      </div>

                      {/* Add Extra Images Actions */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(180px, 1fr) auto', gap: '0.75rem', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <input
                            type="text"
                            placeholder="Add image URL and click '+ Add'"
                            value={extraImageUrlInput}
                            onChange={(e) => setExtraImageUrlInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddExtraImageUrl(); } }}
                            style={inputStyle}
                          />
                          <button
                            type="button"
                            onClick={handleAddExtraImageUrl}
                            style={{
                              padding: '0 1rem', borderRadius: '10px',
                              border: '1px solid rgba(212,175,55,0.4)',
                              background: 'rgba(212,175,55,0.1)',
                              color: '#d4af37', fontSize: '0.8rem', fontWeight: 700,
                              cursor: 'pointer', whiteSpace: 'nowrap',
                            }}
                          >
                            + Add URL
                          </button>
                        </div>

                        <label
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.45rem',
                            padding: '0.65rem 1rem',
                            borderRadius: '10px',
                            border: '1px solid rgba(212,175,55,0.5)',
                            background: 'rgba(212,175,55,0.08)',
                            color: '#d4af37',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <Upload size={14} color="#d4af37" />
                          <span>+ Upload Files...</span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleExtraImagesFileChange}
                            style={{ display: 'none' }}
                          />
                        </label>
                      </div>

                      {/* Visual Gallery Grid with Thumbnail Selection */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
                        {/* Primary Image Item */}
                        {(productImagePreview || productForm.image) && (
                          <div
                            onClick={() => setSelectedThumbnailSource('primary')}
                            style={{
                              position: 'relative',
                              width: '84px',
                              height: '84px',
                              borderRadius: '12px',
                              border: selectedThumbnailSource === 'primary' ? '2px solid #d4af37' : '1px solid rgba(255,255,255,0.12)',
                              boxShadow: selectedThumbnailSource === 'primary' ? '0 0 12px rgba(212,175,55,0.35)' : 'none',
                              cursor: 'pointer',
                              overflow: 'hidden',
                              background: 'rgba(0,0,0,0.4)',
                              transition: 'all 200ms ease',
                            }}
                            title="Click to set as Main Thumbnail"
                          >
                            <img
                              src={productImagePreview || productForm.image}
                              alt="Primary"
                              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            />
                            <div style={{
                              position: 'absolute', bottom: 0, left: 0, right: 0,
                              background: selectedThumbnailSource === 'primary' ? 'linear-gradient(135deg, #7A4E2D, #d4af37)' : 'rgba(0,0,0,0.7)',
                              color: 'white', fontSize: '0.58rem', fontWeight: 700, textAlign: 'center', padding: '2px 0'
                            }}>
                              {selectedThumbnailSource === 'primary' ? '★ THUMBNAIL' : 'Set Main'}
                            </div>
                          </div>
                        )}

                        {/* Existing Extra Images */}
                        {existingImages.map((url, idx) => {
                          const isThumb = selectedThumbnailSource === `existing:${idx}`;
                          return (
                            <div
                              key={`existing-${idx}`}
                              onClick={() => setSelectedThumbnailSource(`existing:${idx}`)}
                              style={{
                                position: 'relative',
                                width: '84px',
                                height: '84px',
                                borderRadius: '12px',
                                border: isThumb ? '2px solid #d4af37' : '1px solid rgba(255,255,255,0.12)',
                                boxShadow: isThumb ? '0 0 12px rgba(212,175,55,0.35)' : 'none',
                                cursor: 'pointer',
                                overflow: 'hidden',
                                background: 'rgba(0,0,0,0.4)',
                                transition: 'all 200ms ease',
                              }}
                              title="Click to set as Main Thumbnail"
                            >
                              <img src={url} alt={`Gallery ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleRemoveExistingImage(idx); }}
                                style={{
                                  position: 'absolute', top: '3px', right: '3px',
                                  width: '18px', height: '18px', borderRadius: '50%',
                                  background: 'rgba(239,68,68,0.85)', color: 'white',
                                  border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}
                              >
                                <Trash2 size={10} />
                              </button>
                              <div style={{
                                position: 'absolute', bottom: 0, left: 0, right: 0,
                                background: isThumb ? 'linear-gradient(135deg, #7A4E2D, #d4af37)' : 'rgba(0,0,0,0.7)',
                                color: 'white', fontSize: '0.58rem', fontWeight: 700, textAlign: 'center', padding: '2px 0'
                              }}>
                                {isThumb ? '★ THUMBNAIL' : 'Set Main'}
                              </div>
                            </div>
                          );
                        })}

                        {/* Newly Uploaded Extra Image Files */}
                        {extraImagePreviews.map((preview, idx) => {
                          const isThumb = selectedThumbnailSource === `new:${idx}`;
                          return (
                            <div
                              key={`new-${idx}`}
                              onClick={() => setSelectedThumbnailSource(`new:${idx}`)}
                              style={{
                                position: 'relative',
                                width: '84px',
                                height: '84px',
                                borderRadius: '12px',
                                border: isThumb ? '2px solid #d4af37' : '1px solid rgba(255,255,255,0.12)',
                                boxShadow: isThumb ? '0 0 12px rgba(212,175,55,0.35)' : 'none',
                                cursor: 'pointer',
                                overflow: 'hidden',
                                background: 'rgba(0,0,0,0.4)',
                                transition: 'all 200ms ease',
                              }}
                              title="Click to set as Main Thumbnail"
                            >
                              <img src={preview} alt={`Upload ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleRemoveNewExtraFile(idx); }}
                                style={{
                                  position: 'absolute', top: '3px', right: '3px',
                                  width: '18px', height: '18px', borderRadius: '50%',
                                  background: 'rgba(239,68,68,0.85)', color: 'white',
                                  border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}
                              >
                                <Trash2 size={10} />
                              </button>
                              <div style={{
                                position: 'absolute', bottom: 0, left: 0, right: 0,
                                background: isThumb ? 'linear-gradient(135deg, #7A4E2D, #d4af37)' : 'rgba(0,0,0,0.7)',
                                color: 'white', fontSize: '0.58rem', fontWeight: 700, textAlign: 'center', padding: '2px 0'
                              }}>
                                {isThumb ? '★ THUMBNAIL' : 'Set Main'}
                              </div>
                            </div>
                          );
                        })}

                        {existingImages.length === 0 && extraImagePreviews.length === 0 && !productImagePreview && !productForm.image && (
                          <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)', fontStyle: 'italic' }}>
                            No extra images added yet. Click &quot;Upload Files...&quot; or enter a URL above.
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Instagram Reel & Embedded Video Links */}
                    <div style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                        <Film size={15} color="#d4af37" />
                        <label style={{ ...labelStyle, marginBottom: 0, color: '#d4af37' }}>
                          Instagram Reel / Video Embed Links
                        </label>
                      </div>
                      <p style={{ margin: '0 0 0.75rem', fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)' }}>
                        Paste Instagram Reel link (e.g. <code>https://www.instagram.com/reel/Cxxxx/</code>) or YouTube/video embed link. Customers will see it playable in the product details modal!
                      </p>

                      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <input
                          type="text"
                          placeholder="e.g. https://www.instagram.com/reel/C8xxx/ or https://youtu.be/xxx"
                          value={newEmbedInput}
                          onChange={(e) => setNewEmbedInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddEmbedUrl(); } }}
                          style={inputStyle}
                        />
                        <button
                          type="button"
                          onClick={handleAddEmbedUrl}
                          style={{
                            padding: '0 1.25rem', borderRadius: '10px',
                            border: 'none',
                            background: 'linear-gradient(135deg, #E1306C, #FD1D1D, #F56040)',
                            color: 'white', fontSize: '0.8rem', fontWeight: 700,
                            cursor: 'pointer', whiteSpace: 'nowrap',
                            display: 'flex', alignItems: 'center', gap: '0.4rem',
                          }}
                        >
                          <Plus size={14} />
                          <span>Add Reel</span>
                        </button>
                      </div>

                      {embedUrls.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                          {embedUrls.map((url, idx) => (
                            <div
                              key={idx}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '0.5rem 0.85rem',
                                borderRadius: '8px',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                fontSize: '0.78rem',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                                <span style={{ color: '#E1306C', fontWeight: 800 }}>Reel #{idx + 1}</span>
                                <span style={{ color: 'rgba(255,255,255,0.7)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                  {url}
                                </span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ color: '#d4af37', display: 'flex', alignItems: 'center', gap: '0.2rem', textDecoration: 'none', fontSize: '0.72rem' }}
                                >
                                  Test <ExternalLink size={11} />
                                </a>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveEmbedUrl(idx)}
                                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px' }}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Product Customer Reviews */}
                    <div style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                        <MessageSquare size={15} color="#d4af37" />
                        <label style={{ ...labelStyle, marginBottom: 0, color: '#d4af37' }}>
                          Product Customer Reviews
                        </label>
                      </div>

                      {/* Add new review sub-form */}
                      <div style={{ padding: '0.85rem', borderRadius: '10px', background: 'rgba(212,175,55,0.03)', border: '1px solid rgba(212,175,55,0.15)', marginBottom: '0.85rem' }}>
                        <p style={{ margin: '0 0 0.6rem', fontSize: '0.74rem', fontWeight: 700, color: '#d4af37' }}>
                          + Add a Customer Review / Testimonial for this Product:
                        </p>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.6rem', marginBottom: '0.6rem' }}>
                          <div>
                            <input
                              type="text"
                              placeholder="Customer Name (e.g. Sarah K.)"
                              value={productForm.review_customer_name}
                              onChange={(e) => setProductForm((f) => ({ ...f, review_customer_name: e.target.value }))}
                              style={inputStyle}
                            />
                          </div>
                          <div>
                            <select
                              value={productForm.review_rating}
                              onChange={(e) => setProductForm((f) => ({ ...f, review_rating: e.target.value }))}
                              style={{ ...inputStyle, cursor: 'pointer' }}
                            >
                              <option value="5" style={{ background: '#111' }}>★★★★★ (5 Stars - Exceptional)</option>
                              <option value="4" style={{ background: '#111' }}>★★★★☆ (4 Stars - Very Good)</option>
                              <option value="3" style={{ background: '#111' }}>★★★☆☆ (3 Stars - Good)</option>
                              <option value="2" style={{ background: '#111' }}>★★☆☆☆ (2 Stars - Fair)</option>
                              <option value="1" style={{ background: '#111' }}>★☆☆☆☆ (1 Star - Poor)</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <textarea
                            rows={2}
                            placeholder="Review comment (e.g. Unbelievable comfort, silky smooth texture, worth every penny!)..."
                            value={productForm.review_comment}
                            onChange={(e) => setProductForm((f) => ({ ...f, review_comment: e.target.value }))}
                            style={{ ...inputStyle, resize: 'vertical' }}
                          />
                        </div>
                      </div>

                      {/* Existing Reviews List */}
                      {productReviews.length > 0 && (
                        <div>
                          <p style={{ margin: '0 0 0.5rem', fontSize: '0.74rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>
                            Existing Reviews ({productReviews.length}):
                          </p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto' }}>
                            {productReviews.map((rev) => (
                              <div
                                key={rev.id}
                                style={{
                                  padding: '0.6rem 0.85rem',
                                  borderRadius: '8px',
                                  background: 'rgba(255,255,255,0.03)',
                                  border: '1px solid rgba(255,255,255,0.06)',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'flex-start',
                                  gap: '0.5rem',
                                }}
                              >
                                <div style={{ fontSize: '0.78rem' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                                    <strong style={{ color: 'white' }}>{rev.customer_name}</strong>
                                    <span style={{ color: '#d4af37', fontSize: '0.72rem' }}>★ {Number(rev.rating).toFixed(1)}</span>
                                  </div>
                                  <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', lineHeight: 1.4 }}>{rev.comment}</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteReviewItem(rev.id)}
                                  title="Delete review"
                                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px', flexShrink: 0 }}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1rem' }}>
                      <button
                        type="button"
                        onClick={() => setShowProductForm(false)}
                        style={{
                          padding: '0.65rem 1.25rem', borderRadius: '10px',
                          border: '1px solid rgba(255,255,255,0.1)',
                          background: 'rgba(255,255,255,0.03)',
                          color: 'rgba(255,255,255,0.6)',
                          fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        onClick={handleSaveProduct}
                        disabled={productSaving}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.45rem',
                          padding: '0.65rem 1.5rem', borderRadius: '10px',
                          border: 'none',
                          background: 'linear-gradient(135deg, #7A4E2D, #d4af37)',
                          color: 'white', fontSize: '0.82rem', fontWeight: 700,
                          cursor: productSaving ? 'not-allowed' : 'pointer',
                          boxShadow: '0 4px 16px rgba(212,175,55,0.3)',
                        }}
                      >
                        {productSaving ? (
                          <>
                            <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                            <span>Saving Product...</span>
                          </>
                        ) : (
                          <>
                            <Save size={14} />
                            <span>{editingProduct ? 'Update Product' : 'Add Product'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Filters Bar ── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem', borderRadius: '14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                {/* Category filters */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginRight: '0.25rem' }}>
                    Category:
                  </span>
                  {(['all', 'bedding', 'pillows', 'bath'] as const).map((cat) => {
                    const isSelected = productCategoryFilter === cat;
                    const count = cat === 'all' ? products.length : products.filter((p) => p.category === cat).length;
                    return (
                      <button
                        key={cat}
                        onClick={() => {
                          setProductCategoryFilter(cat);
                          if (cat !== 'bedding' && cat !== 'all') setProductBeddingFilter('all');
                        }}
                        style={{
                          padding: '0.4rem 0.85rem',
                          borderRadius: '999px',
                          border: isSelected ? '1px solid #d4af37' : '1px solid rgba(255,255,255,0.08)',
                          background: isSelected ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.02)',
                          color: isSelected ? '#d4af37' : 'rgba(255,255,255,0.5)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          textTransform: 'capitalize',
                          transition: 'all 180ms ease',
                        }}
                      >
                        {cat} ({count})
                      </button>
                    );
                  })}
                </div>

                {/* Bedding Sub-Size Filters */}
                {(productCategoryFilter === 'all' || productCategoryFilter === 'bedding') && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', paddingTop: '0.5rem', borderTop: '1px dashed rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(212,175,55,0.7)', textTransform: 'uppercase', letterSpacing: '0.08em', marginRight: '0.25rem' }}>
                      Bedding Sizes:
                    </span>
                    {(['all', 'king', 'queen', 'single'] as const).map((sub) => {
                      const isSelected = productBeddingFilter === sub;
                      const count = sub === 'all'
                        ? products.filter((p) => p.category === 'bedding').length
                        : products.filter((p) => p.category === 'bedding' && (p.bedding_type ?? 'king') === sub).length;
                      const label = sub === 'all' ? 'All Sizes' : `${BEDDING_SUB_CONFIG[sub].icon} ${BEDDING_SUB_CONFIG[sub].label}`;
                      return (
                        <button
                          key={sub}
                          onClick={() => setProductBeddingFilter(sub)}
                          style={{
                            padding: '0.35rem 0.75rem',
                            borderRadius: '999px',
                            border: isSelected ? '1px solid #d4af37' : '1px solid rgba(255,255,255,0.06)',
                            background: isSelected ? 'linear-gradient(135deg, rgba(212,175,55,0.2), rgba(122,78,45,0.15))' : 'rgba(255,255,255,0.02)',
                            color: isSelected ? '#d4af37' : 'rgba(255,255,255,0.45)',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 180ms ease',
                          }}
                        >
                          {label} ({count})
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ── Products List ── */}
              {productsLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem', gap: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                  <Loader2 size={22} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Loading product catalog...</span>
                </div>
              ) : (() => {
                const filteredProducts = products.filter((p) => {
                  if (productCategoryFilter !== 'all' && p.category !== productCategoryFilter) return false;
                  if (productBeddingFilter !== 'all') {
                    if (p.category !== 'bedding') return false;
                    const pBedding = p.bedding_type ?? 'king';
                    if (pBedding !== productBeddingFilter) return false;
                  }
                  return true;
                });

                if (filteredProducts.length === 0) {
                  return (
                    <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'rgba(255,255,255,0.015)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '16px', color: 'rgba(255,255,255,0.4)' }}>
                      <Package size={36} color="rgba(255,255,255,0.15)" style={{ margin: '0 auto 0.75rem' }} />
                      <p style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem', color: 'white' }}>No products found</p>
                      <p style={{ margin: '0.35rem 0 0', fontSize: '0.8rem' }}>Click &quot;Add Product&quot; to create a new product under this category.</p>
                    </div>
                  );
                }

                return (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
                    {filteredProducts.map((prod) => {
                      const isBedding = prod.category === 'bedding';
                      const beddingType = prod.bedding_type ?? 'king';
                      const subConf = BEDDING_SUB_CONFIG[beddingType as BeddingType];

                      return (
                        <div
                          key={prod.id}
                          style={{
                            background: 'rgba(255,255,255,0.025)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '16px',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            transition: 'all 200ms ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'rgba(212,175,55,0.35)';
                            e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                            e.currentTarget.style.background = 'rgba(255,255,255,0.025)';
                          }}
                        >
                          {/* Image preview & badge */}
                          <div
                            style={{
                              position: 'relative',
                              aspectRatio: '16 / 10',
                              background: 'radial-gradient(circle at 50% 30%, rgba(212,175,55,0.08) 0%, transparent 70%)',
                              borderBottom: '1px solid rgba(255,255,255,0.05)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '0.75rem',
                            }}
                          >
                            {prod.badge && (
                              <span
                                style={{
                                  position: 'absolute',
                                  top: '0.6rem',
                                  left: '0.6rem',
                                  padding: '0.2rem 0.55rem',
                                  borderRadius: '6px',
                                  background: 'linear-gradient(135deg, #7A4E2D, #d4af37)',
                                  color: 'white',
                                  fontSize: '0.62rem',
                                  fontWeight: 800,
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.06em',
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                                }}
                              >
                                {prod.badge}
                              </span>
                            )}

                            <img
                              src={prod.image}
                              alt={prod.name}
                              style={{ maxHeight: '110px', maxWidth: '85%', objectFit: 'contain' }}
                              onError={(e) => { e.currentTarget.src = '/bed1.png'; }}
                            />
                          </div>

                          {/* Info */}
                          <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', flex: 1, gap: '0.5rem' }}>
                            {/* Categories & tags */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                              <span
                                style={{
                                  fontSize: '0.68rem',
                                  fontWeight: 700,
                                  padding: '0.15rem 0.5rem',
                                  borderRadius: '6px',
                                  background: 'rgba(255,255,255,0.06)',
                                  color: 'rgba(255,255,255,0.6)',
                                  textTransform: 'uppercase',
                                }}
                              >
                                {prod.category}
                              </span>

                              {/* PROMINENT BEDDING SIZE BADGE */}
                              {isBedding && subConf && (
                                <span
                                  style={{
                                    fontSize: '0.68rem',
                                    fontWeight: 800,
                                    padding: '0.15rem 0.55rem',
                                    borderRadius: '6px',
                                    background: 'linear-gradient(135deg, rgba(212,175,55,0.25), rgba(122,78,45,0.2))',
                                    border: '1px solid rgba(212,175,55,0.4)',
                                    color: '#d4af37',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                  }}
                                >
                                  <span>{subConf.icon}</span>
                                  <span>{subConf.label} Size</span>
                                </span>
                              )}
                            </div>

                            {/* Name & subtitle */}
                            <div>
                              <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {prod.name}
                              </h4>
                              {prod.subtitle && (
                                <p style={{ margin: '0.15rem 0 0', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {prod.subtitle}
                                </p>
                              )}
                            </div>

                            {/* Price & Rating */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
                                <span style={{ fontSize: '1rem', fontWeight: 800, color: 'white' }}>
                                  ₹{Number(prod.price).toLocaleString('en-IN')}
                                </span>
                                {prod.originalPrice && (
                                  <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', textDecoration: 'line-through' }}>
                                    ₹{Number(prod.originalPrice).toLocaleString('en-IN')}
                                  </span>
                                )}
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                                <Star size={12} fill="#d4af37" color="#d4af37" />
                                <span>{(Number(prod.rating) || 0).toFixed(1)}</span>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.35rem' }}>
                              <button
                                onClick={() => openEditProduct(prod)}
                                style={{
                                  flex: 1,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
                                  padding: '0.45rem',
                                  borderRadius: '8px',
                                  border: '1px solid rgba(255,255,255,0.08)',
                                  background: 'rgba(255,255,255,0.03)',
                                  color: 'rgba(255,255,255,0.7)',
                                  fontSize: '0.75rem', fontWeight: 600,
                                  cursor: 'pointer',
                                  transition: 'all 180ms ease',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(212,175,55,0.12)'; e.currentTarget.style.color = '#d4af37'; e.currentTarget.style.borderColor = 'rgba(212,175,55,0.3)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                              >
                                <Edit3 size={12} />
                                <span>Edit</span>
                              </button>

                              <button
                                onClick={() => handleDeleteProduct(prod.id)}
                                disabled={deletingProductId === prod.id}
                                style={{
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  width: '32px', height: '32px',
                                  borderRadius: '8px',
                                  border: '1px solid rgba(255,255,255,0.08)',
                                  background: 'rgba(255,255,255,0.03)',
                                  color: 'rgba(255,255,255,0.4)',
                                  cursor: deletingProductId === prod.id ? 'not-allowed' : 'pointer',
                                  transition: 'all 180ms ease',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.color = '#f87171'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                              >
                                {deletingProductId === prod.id ? (
                                  <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                                ) : (
                                  <Trash2 size={12} />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {/* Catalog stats banner */}
              {products.length > 0 && (
                <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', padding: '0.875rem 1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  {[
                    { label: 'Total Catalog', value: products.length, color: 'white' },
                    { label: '👑 King Bedding', value: products.filter((p) => p.category === 'bedding' && (p.bedding_type ?? 'king') === 'king').length, color: '#d4af37' },
                    { label: '✨ Queen Bedding', value: products.filter((p) => p.category === 'bedding' && p.bedding_type === 'queen').length, color: '#93c5fd' },
                    { label: '🌙 Single Bedding', value: products.filter((p) => p.category === 'bedding' && p.bedding_type === 'single').length, color: '#c084fc' },
                    { label: 'Pillows', value: products.filter((p) => p.category === 'pillows').length, color: '#86efac' },
                    { label: 'Bath', value: products.filter((p) => p.category === 'bath').length, color: '#67e8f9' },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Zap size={11} color={color} />
                      <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>{label}:</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color }}>{value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
