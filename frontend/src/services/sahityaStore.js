import AsyncStorage from '@react-native-async-storage/async-storage';
import { SAHITYA_BOOKS } from '../data/sahityaCatalog';

const SAHITYA_USER_KEY = '@vaidic_sahitya_user_v2';
const SAHITYA_SUB_KEY = '@vaidic_sahitya_sub_v2';
const SAHITYA_BOOKS_KEY = '@vaidic_sahitya_mybooks_v2';
const SAHITYA_FAV_KEY = '@vaidic_sahitya_favs_v2';
const SAHITYA_BOOKMARKS_KEY = '@vaidic_sahitya_bookmarks_v2';
const SAHITYA_NOTES_KEY = '@vaidic_sahitya_notes_v2';
const SAHITYA_ORDERS_KEY = '@vaidic_sahitya_orders_v2';

// Configurable Reading Subscription Plans
export const SUBSCRIPTION_PLANS = [
  {
    id: 'monthly',
    name: 'मासिक योजना (Monthly Plan)',
    durationLabel: '1 माह',
    price: 99,
    basePrice: 83.90,
    taxAmount: 15.10,
    currency: '₹',
    billingPeriod: 'प्रति माह',
    badge: 'सर्वाधिक लोकप्रिय',
    features: [
      'सभी प्रीमियम धार्मिक ग्रंथों एवं साहित्यों का असीमित पठन',
      'विशुद्ध देवनागरी लिपि एवं संपूर्ण हिंदी अर्थ सहित',
      'विज्ञापन-रहित शांत एवं सात्विक स्वाध्याय अनुभव',
      'ऑफ़लाइन पठन हेतु पुस्तक एवं श्लोक सहेजें',
      'असीमित बुकमार्क एवं व्यक्तिगत नोट्स सुविधा',
    ],
    trialDays: 7,
  },
  {
    id: 'annual',
    name: 'वार्षिक योजना (Annual Plan)',
    durationLabel: '1 वर्ष',
    price: 799,
    basePrice: 677.12,
    taxAmount: 121.88,
    currency: '₹',
    billingPeriod: 'प्रति वर्ष',
    badge: '35% बचत (Save 35%)',
    features: [
      'सभी प्रीमियम धार्मिक ग्रंथों का 1 वर्ष तक असीमित स्वाध्याय',
      'वेद, उपनिषद, गीता एवं संपूर्ण रामायण का सविस्तार पठन',
      'असीमित ऑफ़लाइन पठन व व्यक्तिगत नोट्स',
      'नवीनतम प्रकाशित साहित्यों का सर्वप्रथम एक्सेस',
      'प्राथमिकता ग्राहक सहायता (VIP Devotee Support)',
    ],
    trialDays: 7,
  },
  {
    id: 'trial',
    name: '7 दिन का निःशुल्क परीक्षण (Free Trial)',
    durationLabel: '7 दिन',
    price: 0,
    basePrice: 0,
    taxAmount: 0,
    currency: '₹',
    billingPeriod: '7 दिन बाद ₹99/माह',
    badge: '100% मुफ़्त ट्रायल',
    features: [
      'सभी धार्मिक साहित्यों का 7 दिनों के लिए निःशुल्क पठन',
      'संपूर्ण अर्थ एवं श्लोक व्याख्या सहित',
      'कभी भी रद्द करें, कोई अग्रिम शुल्क नहीं',
    ],
    trialDays: 7,
  },
];

class SahityaStore {
  constructor() {
    this.user = {
      name: 'सार्थक शर्मा',
      email: 'sarthak@email.com',
      language: 'हिन्दी',
      notificationsEnabled: true,
      fontSize: 18,
      readingTheme: 'sepia', // 'sepia' | 'light' | 'dark'
      offlineDownloadsCount: 2,
    };

    // Monetization System: Standard reading is FREE, Premium scriptures require active membership
    this.subscription = {
      status: 'FREE',
      isPremium: false,
      plan: null,
      activatedAt: null,
      expiresAt: null,
      autoRenew: true,
      provider: null,
      orderId: null,
      history: [],
    };

    this.orders = [
      {
        orderId: 'ORD_SS_20261101',
        planId: 'monthly',
        planName: 'मासिक योजना (Monthly Plan)',
        amount: 99,
        date: '01 Nov, 2026',
        status: 'Successful',
        transactionRef: 'TXN_UPI_9988472910',
        paymentMethod: 'UPI / Google Pay',
        invoiceUrl: 'INV-2026-001',
      },
    ];

    // Reading progress across books/aartis
    this.myBooks = [
      {
        bookId: '17',
        book: SAHITYA_BOOKS.find((b) => b.id === '17') || SAHITYA_BOOKS[0],
        progressPercent: 25,
        statusText: 'पाठ जारी है (1/4)',
        currentChapter: 1,
        currentPage: 1,
        lastReadDate: 'आज (Today)',
        isCompleted: false,
        isDownloaded: true,
      },
      {
        bookId: '1',
        book: SAHITYA_BOOKS[0],
        progressPercent: 100,
        statusText: 'नित्य पाठ पूर्ण',
        currentChapter: 1,
        currentPage: 1,
        lastReadDate: 'आज (Today)',
        isCompleted: true,
        isDownloaded: true,
      },
    ];

    this.favorites = ['17', '1', '2', '4', '7'];
    this.bookmarks = [
      {
        id: 'bm_1',
        bookId: '17',
        chapterNumber: 1,
        text: '॥ श्री गुरु चरन सरोज रज, निज मन मुकुर सुधारि ॥ बरनउँ रघुबर बिमल जसु, जो दायकु फल चारि ॥॥',
        page: 1,
        createdAt: '19 Nov, 2026',
      },
    ];

    this.notes = [
      {
        id: 'note_1',
        bookId: '17',
        text: 'प्रतिदिन प्रातःकाल 11 बार हनुमान चालीसा पाठ का संकल्प।',
        page: 1,
        createdAt: '19 Nov, 2026',
      },
    ];

    this.listeners = new Set();
    this.init();
  }

  async init() {
    try {
      const [u, sub, mb, fav, bm, nt, ord] = await Promise.all([
        AsyncStorage.getItem(SAHITYA_USER_KEY),
        AsyncStorage.getItem(SAHITYA_SUB_KEY),
        AsyncStorage.getItem(SAHITYA_BOOKS_KEY),
        AsyncStorage.getItem(SAHITYA_FAV_KEY),
        AsyncStorage.getItem(SAHITYA_BOOKMARKS_KEY),
        AsyncStorage.getItem(SAHITYA_NOTES_KEY),
        AsyncStorage.getItem(SAHITYA_ORDERS_KEY),
      ]);
      if (u) this.user = { ...this.user, ...JSON.parse(u) };
      if (sub) {
        this.subscription = { ...this.subscription, ...JSON.parse(sub) };
        this.checkEntitlementExpiry();
      }
      if (mb) this.myBooks = JSON.parse(mb);
      if (fav) this.favorites = JSON.parse(fav);
      if (bm) this.bookmarks = JSON.parse(bm);
      if (nt) this.notes = JSON.parse(nt);
      if (ord) this.orders = JSON.parse(ord);
      this.notify();
    } catch (_) {}
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  notify() {
    this.listeners.forEach((fn) => fn());
  }

  // --- Reading Subscription & Entitlement Logic ---
  isPremiumUser() {
    this.checkEntitlementExpiry();
    return (
      this.subscription.status === 'PREMIUM_ACTIVE' ||
      (this.subscription.status === 'PREMIUM_CANCELLED' && this.hasActiveEntitlement())
    );
  }

  hasActiveEntitlement() {
    if (!this.subscription.expiresAt) return false;
    const now = new Date();
    const expiry = new Date(this.subscription.expiresAt);
    return now <= expiry;
  }

  checkEntitlementExpiry() {
    if (this.subscription.status === 'PREMIUM_ACTIVE' || this.subscription.status === 'PREMIUM_CANCELLED') {
      if (!this.hasActiveEntitlement() && this.subscription.expiresAt) {
        this.subscription.status = 'PREMIUM_EXPIRED';
        this.subscription.isPremium = false;
        AsyncStorage.setItem(SAHITYA_SUB_KEY, JSON.stringify(this.subscription)).catch(() => {});
      }
    }
  }

  getPlans() {
    return SUBSCRIPTION_PLANS;
  }

  async initiatePurchase(planId, paymentMethod = 'UPI / Google Pay') {
    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId) || SUBSCRIPTION_PLANS[0];
    const activatedAt = new Date().toISOString();
    const expiryDate = new Date();

    if (plan.id === 'annual') {
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    } else if (plan.id === 'trial') {
      expiryDate.setDate(expiryDate.getDate() + 7);
    } else {
      expiryDate.setMonth(expiryDate.getMonth() + 1);
    }

    const newSub = {
      status: 'PREMIUM_ACTIVE',
      isPremium: true,
      plan: plan.id,
      activatedAt,
      expiresAt: expiryDate.toISOString(),
      autoRenew: true,
      provider: paymentMethod.includes('UPI') ? 'upi' : 'card',
      orderId: `ORD_SS_${Date.now()}`,
      history: [
        ...(this.subscription.history || []),
        { date: activatedAt, action: 'ACTIVATED', planId: plan.id },
      ],
    };

    const newOrder = {
      orderId: newSub.orderId,
      planId: plan.id,
      planName: plan.name,
      amount: plan.price,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: 'Successful',
      transactionRef: `TXN_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`,
      paymentMethod,
      invoiceUrl: `INV-${Date.now()}`,
    };

    this.subscription = newSub;
    this.orders.unshift(newOrder);

    await Promise.all([
      AsyncStorage.setItem(SAHITYA_SUB_KEY, JSON.stringify(this.subscription)),
      AsyncStorage.setItem(SAHITYA_ORDERS_KEY, JSON.stringify(this.orders)),
    ]);

    this.notify();
    return { success: true, subscription: this.subscription, order: newOrder };
  }

  async cancelAutoRenew() {
    this.subscription.autoRenew = false;
    this.subscription.status = 'PREMIUM_CANCELLED';
    this.subscription.history.push({
      date: new Date().toISOString(),
      action: 'CANCELLED_AUTO_RENEW',
    });
    await AsyncStorage.setItem(SAHITYA_SUB_KEY, JSON.stringify(this.subscription));
    this.notify();
    return { success: true, message: 'सदस्यता नवीनीकरण सफलतापूर्वक बंद कर दिया गया।' };
  }

  async restorePurchases() {
    this.checkEntitlementExpiry();
    if (this.subscription.expiresAt && new Date(this.subscription.expiresAt) > new Date()) {
      this.subscription.status = 'PREMIUM_ACTIVE';
      this.subscription.isPremium = true;
      await AsyncStorage.setItem(SAHITYA_SUB_KEY, JSON.stringify(this.subscription));
      this.notify();
      return { success: true, restored: true, message: 'आपकी प्रीमियम सदस्यता पुनः बहाल कर दी गई है।' };
    }
    return { success: false, restored: false, message: 'कोई सक्रिय सदस्यता नहीं मिली।' };
  }

  canAccessContent(book) {
    if (!book) return false;
    if (book.accessType === 'free' || !book.isPremium) return true;
    return this.isPremiumUser();
  }

  // --- Reading Progress & Library ---
  getMyBooks() {
    return this.myBooks;
  }

  updateProgress(book, chapterIndex, page, totalPages = 4) {
    if (!book) return;
    const bookId = String(book.id);
    const validPages = Math.max(1, totalPages || 4);
    const validPage = Math.min(validPages, Math.max(1, page || 1));
    const percent = Math.min(100, Math.round((validPage / validPages) * 100));
    const statusText = percent >= 100 ? 'सम्पूर्ण पाठ पूर्ण' : `पाठ जारी है (${validPage}/${validPages})`;

    const existingIdx = this.myBooks.findIndex((b) => String(b.bookId) === bookId);
    if (existingIdx >= 0) {
      this.myBooks[existingIdx] = {
        ...this.myBooks[existingIdx],
        progressPercent: percent,
        statusText,
        currentChapter: chapterIndex + 1,
        currentPage: validPage,
        lastReadDate: 'आज (Today)',
        isCompleted: percent >= 100,
      };
    } else {
      this.myBooks.unshift({
        bookId,
        book,
        progressPercent: percent,
        statusText,
        currentChapter: chapterIndex + 1,
        currentPage: validPage,
        lastReadDate: 'आज (Today)',
        isCompleted: percent >= 100,
        isDownloaded: false,
      });
    }

    AsyncStorage.setItem(SAHITYA_BOOKS_KEY, JSON.stringify(this.myBooks)).catch(() => {});
    this.notify();
  }

  removeBookFromMyBooks(bookId) {
    this.myBooks = this.myBooks.filter((b) => String(b.bookId) !== String(bookId));
    AsyncStorage.setItem(SAHITYA_BOOKS_KEY, JSON.stringify(this.myBooks)).catch(() => {});
    this.notify();
  }

  // Favorites
  isFavorite(bookId) {
    return this.favorites.includes(String(bookId));
  }

  toggleFavorite(bookId) {
    const id = String(bookId);
    if (this.favorites.includes(id)) {
      this.favorites = this.favorites.filter((i) => i !== id);
    } else {
      this.favorites = [...this.favorites, id];
    }
    AsyncStorage.setItem(SAHITYA_FAV_KEY, JSON.stringify(this.favorites)).catch(() => {});
    this.notify();
  }

  // Bookmarks
  addBookmark(bookId, text, chapterNumber = 1, page = 1) {
    const newBm = {
      id: `BM_${Date.now()}`,
      bookId: String(bookId),
      text,
      chapterNumber,
      page,
      createdAt: new Date().toLocaleDateString('hi-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    };
    this.bookmarks = [newBm, ...this.bookmarks];
    AsyncStorage.setItem(SAHITYA_BOOKMARKS_KEY, JSON.stringify(this.bookmarks)).catch(() => {});
    this.notify();
    return newBm;
  }

  removeBookmark(bmId) {
    this.bookmarks = this.bookmarks.filter((b) => b.id !== bmId);
    AsyncStorage.setItem(SAHITYA_BOOKMARKS_KEY, JSON.stringify(this.bookmarks)).catch(() => {});
    this.notify();
  }

  // Personal Reading Notes
  addNote(bookId, text, page = 1) {
    const newNote = {
      id: `NT_${Date.now()}`,
      bookId: String(bookId),
      text,
      page,
      createdAt: new Date().toLocaleDateString('hi-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    };
    this.notes = [newNote, ...this.notes];
    AsyncStorage.setItem(SAHITYA_NOTES_KEY, JSON.stringify(this.notes)).catch(() => {});
    this.notify();
    return newNote;
  }

  removeNote(noteId) {
    this.notes = this.notes.filter((n) => n.id !== noteId);
    AsyncStorage.setItem(SAHITYA_NOTES_KEY, JSON.stringify(this.notes)).catch(() => {});
    this.notify();
  }
}

export const sahityaStore = new SahityaStore();
export default sahityaStore;
