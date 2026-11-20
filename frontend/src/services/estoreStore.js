/**
 * E-Store (Pooja Samagri) Core Engine & State Store (User App)
 * Products, multi-angle images, wishlist, cart & order tracking.
 * Synchronized dynamically with live backend API & offline fallbacks.
 */

export const STORE_CATEGORIES = [
  { id: 'all', name: 'All Categories', nameHi: 'सभी श्रेणियां', icon: 'apps' },
  {
    id: 'kits',
    name: 'Pooja Kits',
    nameHi: 'पूजा किट्स',
    icon: '📦',
    image: 'https://images.unsplash.com/photo-1609234656388-0ff363383899?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'diya',
    name: 'Diya & Deepak',
    nameHi: 'दीपक व आरती',
    icon: '🪔',
    image: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'havan',
    name: 'Havan Samagri',
    nameHi: 'हवन सामग्री',
    icon: '🔥',
    image: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'dhoop',
    name: 'Dhoop & Agarbatti',
    nameHi: 'धूप व अगरबत्ती',
    icon: '🌸',
    image: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'murti',
    name: 'Murtis & Idols',
    nameHi: 'मूर्तियां एवं विग्रह',
    icon: '🕉️',
    image: 'https://images.unsplash.com/photo-1567591414240-e2652b7e1781?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'bartan',
    name: 'Brass Utensils',
    nameHi: 'पीतल के बर्तन',
    icon: '🥣',
    image: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'mala',
    name: 'Rudraksha & Mala',
    nameHi: 'रुद्राक्ष एवं माला',
    icon: '📿',
    image: 'https://images.unsplash.com/photo-1620619767323-b95a89183081?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'vastra',
    name: 'Vastra & Aasan',
    nameHi: 'वस्त्र एवं आसन',
    icon: '👘',
    image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'pavitra',
    name: 'Gangajal & Dravya',
    nameHi: 'कलश एवं गंगाजल',
    icon: '💧',
    image: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'yantra',
    name: 'Yantra & Jyotish',
    nameHi: 'यंत्र एवं वास्तु',
    icon: '⭐',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'books',
    name: 'Vedic Books',
    nameHi: 'धार्मिक पुस्तकें',
    icon: '📖',
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'prasad',
    name: 'Prasad & Bhog',
    nameHi: 'प्रसाद एवं भोग',
    icon: '🍯',
    image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&auto=format&fit=crop&q=80',
  },
];

export const PROMO_BANNERS = [
  {
    id: 'b1',
    title: 'Sacred Products for a Better Life',
    subtitle: 'Authentic • Traditional • Trusted',
    code: 'VAIDIC10',
    discount: 'Flat 10% OFF',
    tag: 'FESTIVAL SPECIAL',
    image: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'b2',
    title: 'Pure Brass Pooja Thali Sets',
    subtitle: 'Handcrafted by Master Artisans in Varanasi',
    code: 'SHUBH50',
    discount: 'Save up to 40%',
    tag: 'BESTSELLER',
    image: 'https://images.unsplash.com/photo-1609234656388-0ff363383899?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'b3',
    title: 'Certified 5-Mukhi Rudraksha',
    subtitle: 'Consecrated at Haridwar Ganga Ghat',
    code: 'PRASAD100',
    discount: 'Lab Certified Pure',
    tag: 'SACRED BLESSING',
    image: 'https://images.unsplash.com/photo-1620619767323-b95a89183081?w=800&auto=format&fit=crop&q=80',
  },
];

export const DEMO_STORE_PRODUCTS = [];

export const DEMO_COUPONS = [
  { code: 'VAIDIC10', title: '10% Flat Discount on all orders', minOrder: 499, discountPercent: 10, maxDiscount: 150 },
  { code: 'SHUBH50', title: '₹50 Flat Discount on ₹500+', minOrder: 500, flatDiscount: 50 },
  { code: 'PRASAD100', title: '₹100 Discount on ₹999+', minOrder: 999, flatDiscount: 100 },
];

export const DEFAULT_SHIPPING_ADDRESS = null;

class EStoreStore {
  constructor() {
    this.products = [];
    this.cart = [];
    this.wishlist = [];
    this.appliedCoupon = null;
    this.selectedAddress = null;
    this.orders = [];
    this.listeners = new Set();
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  notify() {
    this.listeners.forEach((fn) => fn());
  }

  getCart() {
    return this.cart;
  }

  getProducts() {
    return this.products;
  }

  setProducts(products) {
    if (Array.isArray(products) && products.length > 0) {
      this.products = products;
    }
    this.notify();
  }

  // --- WISHLIST MANAGEMENT ---
  getWishlist() {
    return this.wishlist;
  }

  isInWishlist(productId) {
    const pId = String(productId);
    return this.wishlist.some((item) => String(item.id || item._id) === pId);
  }

  toggleWishlist(product) {
    if (!product) return;
    const pId = String(product.id || product._id);
    const index = this.wishlist.findIndex((item) => String(item.id || item._id) === pId);
    if (index > -1) {
      this.wishlist.splice(index, 1);
    } else {
      this.wishlist.push(product);
    }
    this.notify();
  }

  removeFromWishlist(productId) {
    const pId = String(productId);
    this.wishlist = this.wishlist.filter((item) => String(item.id || item._id) !== pId);
    this.notify();
  }

  // --- CART MANAGEMENT ---
  addToCart(product, variant, qty = 1) {
    if (!product) return;
    const v = variant || (Array.isArray(product.variants) && product.variants[0]) || {
      id: `v-${product.id || Date.now()}`,
      name: 'Standard Pack',
      price: Number(product.price || 0),
      mrp: Number(product.mrp || product.price || 0),
      stock: Number(product.stock != null ? product.stock : 25),
    };
    const vId = v.id || `v-${product.id}`;
    const pId = String(product.id || product._id);

    const existingIndex = this.cart.findIndex(
      (item) => String(item.product?.id || item.product?._id) === pId && (item.variant?.id === vId || !item.variant?.id)
    );

    if (existingIndex > -1) {
      this.cart[existingIndex].qty += qty;
    } else {
      this.cart.push({ product, variant: { ...v, id: vId }, qty });
    }
    this.notify();
  }

  updateQty(productId, variantId, qty) {
    const pId = String(productId);
    if (qty <= 0) {
      this.cart = this.cart.filter(
        (item) => !(String(item.product?.id || item.product?._id) === pId && (item.variant?.id === variantId || !variantId))
      );
    } else {
      const item = this.cart.find(
        (i) => String(i.product?.id || i.product?._id) === pId && (i.variant?.id === variantId || !variantId)
      );
      if (item) item.qty = Math.min(qty, 10);
    }
    this.notify();
  }

  removeFromCart(productId, variantId) {
    const pId = String(productId);
    this.cart = this.cart.filter(
      (item) => !(String(item.product?.id || item.product?._id) === pId && (item.variant?.id === variantId || !variantId))
    );
    this.notify();
  }

  clearCart() {
    this.cart = [];
    this.appliedCoupon = null;
    this.notify();
  }

  applyCoupon(couponCode) {
    const coupon = DEMO_COUPONS.find(
      (c) => c.code.toUpperCase() === couponCode.trim().toUpperCase()
    );
    if (!coupon) return { success: false, message: 'अमान्य कूपन कोड' };

    const subtotal = this.getCartSubtotal();
    if (subtotal < coupon.minOrder) {
      return {
        success: false,
        message: `यह कूपन न्यूनतम ₹${coupon.minOrder} के ऑर्डर पर लागू होता है।`,
      };
    }

    this.appliedCoupon = coupon;
    this.notify();
    return { success: true, message: `कूपन "${coupon.code}" सफलतापूर्वक लागू हुआ!` };
  }

  removeCoupon() {
    this.appliedCoupon = null;
    this.notify();
  }

  getCartSubtotal() {
    return this.cart.reduce((sum, item) => {
      const price = Number(item.variant?.price || item.product?.price || 0);
      return sum + price * (item.qty || 1);
    }, 0);
  }

  getCartMrpTotal() {
    return this.cart.reduce((sum, item) => {
      const mrp = Number(item.variant?.mrp || item.variant?.price || item.product?.mrp || item.product?.price || 0);
      return sum + mrp * (item.qty || 1);
    }, 0);
  }

  getCalculations() {
    const mrpTotal = this.getCartMrpTotal();
    const subtotal = this.getCartSubtotal();
    const catalogDiscount = mrpTotal - subtotal;

    let couponDiscount = 0;
    if (this.appliedCoupon) {
      if (this.appliedCoupon.flatDiscount) {
        couponDiscount = this.appliedCoupon.flatDiscount;
      } else if (this.appliedCoupon.discountPercent) {
        couponDiscount = Math.min(
          Math.round((subtotal * this.appliedCoupon.discountPercent) / 100),
          this.appliedCoupon.maxDiscount || 9999
        );
      }
    }

    const deliveryFee = 0; // Free delivery in theme
    const finalTotal = Math.max(0, subtotal - couponDiscount + deliveryFee);

    return {
      mrpTotal,
      subtotal,
      catalogDiscount,
      couponDiscount,
      deliveryFee,
      itemCount: this.cart.reduce((sum, i) => sum + i.qty, 0),
      finalTotal,
    };
  }

  createOrder({ paymentMethod = 'UPI', address = this.selectedAddress, bookingId = null }) {
    const calcs = this.getCalculations();
    const orderNumber = '#VS' + Math.floor(100000 + Math.random() * 900000);
    const orderId = 'OD-' + Math.floor(10000 + Math.random() * 90000);

    const now = new Date();
    const placedDateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const placedTimeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const newOrder = {
      id: orderId,
      orderNumber,
      bookingId,
      placedAt: `${placedDateStr}, ${placedTimeStr}`,
      dateDisplay: `Placed on ${placedDateStr}`,
      expectedDelivery: '3 - 5 Working Days',
      status: 'PROCESSING',
      statusLabel: 'Processing',
      items: this.cart.map((item) => ({
        name: item.product?.name || 'Vaidic Item',
        price: item.variant?.price || item.product?.price || 0,
        qty: item.qty,
        image: item.product?.images?.[0] || item.product?.image || item.product?.imageUrl,
      })),
      address: address ? { ...address } : DEFAULT_SHIPPING_ADDRESS,
      subtotal: calcs.subtotal,
      mrpTotal: calcs.mrpTotal,
      discount: calcs.catalogDiscount + calcs.couponDiscount,
      couponCode: this.appliedCoupon?.code || null,
      deliveryFee: calcs.deliveryFee,
      total: calcs.finalTotal,
      paymentMethod,
      trackingEvents: [
        { status: 'Order Placed', time: `${placedDateStr}, ${placedTimeStr}`, completed: true },
        { status: 'Processing', time: 'In Progress', completed: true },
        { status: 'Shipped', time: 'Expected within 24 hrs', completed: false },
        { status: 'Out for Delivery', time: 'Pending', completed: false },
        { status: 'Delivered', time: '3 - 5 Days', completed: false },
      ],
    };

    this.orders.unshift(newOrder);
    this.clearCart();
    this.notify();
    return newOrder;
  }
}

export const estoreStore = new EStoreStore();
export default estoreStore;
