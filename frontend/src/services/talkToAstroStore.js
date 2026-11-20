/**
 * Talk to Astro Store (User App)
 * Real-time Astrologer Registry, Single Unified "परामर्श" Session Engine,
 * and Per-minute Wallet Deduction Engine (₹5/min).
 */

export const CONSULTATION_TOPICS = [
  'परामर्श (Vedic Consultation)',
];

export const RECHARGE_PACKS = [
  { id: 'p1', amount: 99, bonus: 0, label: 'स्टार्टर पैक', popular: false },
  { id: 'p2', amount: 249, bonus: 25, label: '₹25 अतिरिक्त बोनस', popular: true },
  { id: 'p3', amount: 499, bonus: 75, label: '₹75 अतिरिक्त बोनस', popular: false },
  { id: 'p4', amount: 999, bonus: 200, label: '₹200 अतिरिक्त बोनस (20% Extra)', bestValue: true },
  { id: 'p5', amount: 1999, bonus: 500, label: '₹500 अतिरिक्त बोनस (25% Extra)', popular: false },
];

import socket from './socket.js';

class TalkToAstroStore {
  constructor() {
    // Dynamic astrologers registry — populated exclusively from live sockets & API
    this.astrologers = [];

    // Wallet balances — initialized to ₹0 for new users and synced with backend
    this.wallet = {
      mainBalance: 0,
      bonusBalance: 0,
      transactions: [],
    };

    // Active Session State
    this.activeSession = null;
    this.sessionTimer = null;
    this.listeners = new Set();

    // Listen for live partner status updates over Socket
    if (socket && typeof socket.on === 'function') {
      const handlePartnerPresence = (data) => {
        if (!data) return;
        const partnerId = String(data.id || data.vendorId || '');
        if (!partnerId) return;
        const existingIdx = this.astrologers.findIndex((a) => String(a.id) === partnerId);
        const mapped = {
          id: partnerId,
          name: data.name || 'पंडित जी (Live Partner)',
          nameHi: data.nameHi || data.name || 'पंडित जी (Live Partner)',
          title: data.title || 'सत्यापित वैदिक ज्योतिषी • पार्टनर ऐप लाइव',
          photo: data.photo || data.profileImage || 'pandit_varanasi',
          rating: Number(data.rating || data.averageRating || 0),
          reviewsCount: Number(data.reviewsCount || data.totalReviews || 0),
          experienceYears: Number(data.experienceYears || data.experience || 0),
          skills: Array.isArray(data.skills) && data.skills.length ? data.skills : ['Vedic', 'KP Astrology', 'Kundli'],
          languages: Array.isArray(data.languages) && data.languages.length ? data.languages : ['हिंदी', 'संस्कृत', 'English'],
          chatRate: Number(data.rates?.chat || data.chatRate || 5),
          audioRate: Number(data.rates?.audio || data.audioRate || 5),
          videoRate: Number(data.rates?.video || data.videoRate || 5),
          rates: {
            chat: Number(data.rates?.chat || data.chatRate || 5),
            audio: Number(data.rates?.audio || data.audioRate || 5),
            video: Number(data.rates?.video || data.videoRate || 5),
          },
          presence: data.presence || { chatOnline: true, audioOnline: true, videoOnline: true },
          isOnline: data.isOnline !== false,
          isLiveSocket: data.isOnline !== false,
          socketId: data.socketId || null,
          ordersCompleted: Number(data.ordersCompleted || 0),
          totalMinutes: Number(data.totalMinutes || 0),
          bio: data.bio || data.about || 'वैदिक ज्योतिष, कुंडली मिलान, गृह शांति व वास्तु परामर्श विशेषज्ञ। पार्टनर ऐप से सीधे लाइव कनेक्टेड।',
          about: data.bio || data.about || 'वैदिक ज्योतिष, कुंडली मिलान, गृह शांति व वास्तु परामर्श विशेषज्ञ। पार्टनर ऐप से सीधे लाइव कनेक्टेड।',
        };

        if (existingIdx > -1) {
          this.astrologers[existingIdx] = { ...this.astrologers[existingIdx], ...mapped };
        } else {
          this.astrologers.unshift(mapped);
        }
        this.notify();
      };

      const handlePartnerList = (list) => {
        if (!Array.isArray(list)) return;
        const liveIds = new Set(
          list
            .filter((item) => item && item.isOnline !== false)
            .map((item) => String(item.id || item.vendorId || ''))
            .filter(Boolean)
        );
        // Mark disconnected/non-server entries offline on live sync when server reports live partners
        if (liveIds.size > 0) {
          this.astrologers = this.astrologers.map((entry) =>
            liveIds.has(String(entry.id))
              ? entry
              : { ...entry, isOnline: false, isLiveSocket: false, socketId: null }
          );
        }
        list.forEach((item) => handlePartnerPresence(item));
        if (list.length === 0) {
          this.notify();
        }
      };

      const handlePartnerOffline = (data) => {
        const offId = String(data?.id || data?.vendorId || '');
        if (offId) {
          const idx = this.astrologers.findIndex((a) => String(a.id) === offId);
          if (idx > -1) {
            this.astrologers[idx] = {
              ...this.astrologers[idx],
              isOnline: false,
              isLiveSocket: false,
              socketId: null,
            };
            this.notify();
          }
        }
      };

      socket.on('astro:presence', handlePartnerPresence);
      socket.on('astro:online', handlePartnerPresence);
      socket.on('astro:list', handlePartnerList);
      socket.on('astro:offline', handlePartnerOffline);

      socket.on('open', () => {
        socket.emit('astro:get:online');
      });
      socket.emit('astro:get:online');
    }
  }

  setAstrologers(list) {
    if (!Array.isArray(list)) return;
    const merged = [...this.astrologers];
    for (const item of list) {
      const idx = merged.findIndex((m) => String(m.id) === String(item.id));
      if (idx > -1) {
        merged[idx] = { ...merged[idx], ...item };
      } else {
        merged.push(item);
      }
    }
    this.astrologers = merged;
    this.notify();
  }

  getAstrologers() {
    return this.astrologers;
  }

  getOnlineAstrologers() {
    const online = (this.astrologers || []).filter((a) => a && a.isOnline);
    // Prioritize live WebSocket-verified partners over static seed entries
    return online.sort((a, b) => Number(Boolean(b.isLiveSocket || b.socketId)) - Number(Boolean(a.isLiveSocket || a.socketId)));
  }

  resolveTargetAstrologer(preferredAstroOrId) {
    const preferred =
      typeof preferredAstroOrId === 'string'
        ? this.getAstrologerById(preferredAstroOrId)
        : preferredAstroOrId;
    const onlineList = this.getOnlineAstrologers();
    const liveVerified = onlineList.filter((a) => a.isLiveSocket || a.socketId);

    if (preferred) {
      const preferredInLive = liveVerified.find((a) => String(a.id) === String(preferred.id));
      if (preferredInLive) {
        return { astrologer: preferredInLive, wasFallback: false };
      }
      // If real live partner(s) exist on socket and preferred is NOT among them, route to online live partner
      if (liveVerified.length > 0) {
        return { astrologer: liveVerified[0], wasFallback: true };
      }
      if (preferred.isOnline) {
        return { astrologer: preferred, wasFallback: false };
      }
    }

    if (onlineList.length > 0) {
      return {
        astrologer: onlineList[0],
        wasFallback: Boolean(preferred && String(onlineList[0].id) !== String(preferred.id)),
      };
    }

    return {
      astrologer: preferred || this.astrologers[0] || null,
      wasFallback: false,
    };
  }

  getAstrologerById(id) {
    if (!id) return null;
    return this.astrologers.find((a) => String(a.id) === String(id));
  }

  getWallet() {
    return this.wallet;
  }

  getTotalBalance() {
    return (this.wallet.mainBalance || 0) + (this.wallet.bonusBalance || 0);
  }

  getActiveSession() {
    return this.activeSession;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach((fn) => {
      try {
        fn(this);
      } catch (e) {
        console.error('Error in talkToAstroStore listener:', e);
      }
    });
  }

  // Wallet Sync Helpers (for AppContext / Backend)
  setWalletFromServer(mainBalance = 0, transactions = []) {
    const nextMain = Math.max(0, Number(mainBalance || 0));
    this.wallet.mainBalance = Number.isFinite(nextMain) ? nextMain : 0;
    this.wallet.bonusBalance = 0;
    if (Array.isArray(transactions)) {
      this.wallet.transactions = transactions.map((t, idx) => ({
        id: t.id || `TX-${idx}`,
        type: String(t.type || '').toLowerCase() === 'debit' ? 'DEBIT' : 'RECHARGE',
        amount: Math.abs(Number(t.amount || 0)),
        date: t.at || t.date || t.createdAt || 'आज',
        desc: t.title || t.desc || t.reference || 'Wallet transaction',
      }));
    }
    this.notify();
  }

  resetWallet() {
    this.clearSession();
    this.wallet = {
      mainBalance: 0,
      bonusBalance: 0,
      transactions: [],
    };
    this.notify();
  }

  // Wallet Recharge
  rechargeWallet(pack) {
    this.wallet.mainBalance += pack.amount;
    this.wallet.bonusBalance += pack.bonus || 0;
    this.wallet.transactions.unshift({
      id: `TX-${Date.now().toString().slice(-4)}`,
      type: 'RECHARGE',
      amount: pack.amount,
      bonus: pack.bonus || 0,
      date: 'आज (Today)',
      desc: `वॉलेट रीचार्ज (+₹${pack.bonus || 0} बोनस)`,
    });
    this.notify();
  }

  // Deduct money per minute (default ₹5/min)
  deductMoney(amount = 5, reason = 'Astro Consultation (1 min)', syncBackend = true) {
    if (this.wallet.mainBalance >= amount) {
      this.wallet.mainBalance -= amount;
    } else {
      this.wallet.mainBalance = 0;
    }
    this.wallet.transactions.unshift({
      id: `TX-${Date.now().toString().slice(-4)}`,
      type: 'DEBIT',
      amount,
      date: 'आज (Today)',
      desc: reason,
    });
    if (syncBackend) {
      import('./api')
        .then(({ WalletService }) => WalletService?.debit?.(amount, reason))
        .catch(() => {});
    }
    this.notify();
    return this.wallet.mainBalance;
  }

  // Check if balance suffices for at least 1 minute (₹5)
  checkSufficientBalance(ratePerMin = 5) {
    const minRequired = ratePerMin;
    const total = this.getTotalBalance();
    return {
      isSufficient: total >= minRequired,
      minRequired,
      totalBalance: total,
      shortfall: Math.max(0, minRequired - total),
      availableMinutes: Math.floor(total / ratePerMin),
    };
  }

  // Initiate Single Unified "परामर्श" Session (Chat / Audio / Video)
  initiateSession({ astrologerId, astrologer, mode = 'chat', topic = 'परामर्श', rate = 5 }) {
    const requested = astrologer || this.getAstrologerById(astrologerId);
    const { astrologer: resolvedAstro } = this.resolveTargetAstrologer(requested || astrologerId);
    const astro = resolvedAstro || requested;
    if (!astro) throw new Error('ज्योतिषी नहीं मिले');

    const totalBal = this.getTotalBalance();
    if (totalBal < rate) {
      throw new Error(`परामर्श शुरू करने के लिए न्यूनतम ₹${rate} का वॉलेट बैलेंस आवश्यक है।`);
    }

    this.activeSession = {
      id: `SESS-${Date.now().toString().slice(-4)}`,
      astrologerId: astro.id,
      astrologer: astro,
      mode, // chat | audio | video
      rate,
      topic: 'परामर्श',
      status: 'ACTIVE',
      elapsedSeconds: 0,
      billedMinutes: 1,
      amountDeducted: rate,
      chatMessages: [
        {
          id: 'M-1',
          sender: 'astrologer',
          text: `प्रणाम! 🙏 वैदिक संस्कार परामर्श में आपका स्वागत है। आप जिस भी विषय (विवाह, करियर, कुंडली, स्वास्थ्य, परिवार या कोई समस्या) पर मार्गदर्शन चाहते हैं, कृपया यहाँ विस्तार से लिखें।`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ],
      lowBalanceWarning: false,
    };

    this.startSessionTimer();
    this.notify();
    return this.activeSession;
  }

  // Timer: advances seconds & per-minute billing ticks
  startSessionTimer() {
    if (this.sessionTimer) clearInterval(this.sessionTimer);

    this.sessionTimer = setInterval(() => {
      if (!this.activeSession || this.activeSession.status !== 'ACTIVE') {
        clearInterval(this.sessionTimer);
        return;
      }

      this.activeSession.elapsedSeconds += 1;
      const sec = this.activeSession.elapsedSeconds;

      // Deduct ₹5 every 60 seconds
      if (sec > 0 && sec % 60 === 0) {
        const rate = this.activeSession.rate || 5;
        this.activeSession.billedMinutes += 1;
        this.activeSession.amountDeducted += rate;
        this.deductMoney(rate, `${this.activeSession.astrologer.name} से परामर्श (${this.activeSession.billedMinutes} मिनट)`);
      }

      // Check remaining minutes
      const remainingBalance = this.getTotalBalance();
      const minsLeft = Math.floor(remainingBalance / this.activeSession.rate);

      if (minsLeft <= 2 && minsLeft > 0) {
        this.activeSession.lowBalanceWarning = true;
      } else {
        this.activeSession.lowBalanceWarning = false;
      }

      // Auto end if balance exhausted
      if (remainingBalance < this.activeSession.rate) {
        this.endSession('BALANCE_EXHAUSTED');
      }

      this.notify();
    }, 1000);
  }

  sendMessage(text) {
    if (!this.activeSession) return;
    const msg = {
      id: `M-${Date.now()}`,
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    this.activeSession.chatMessages.push(msg);
    this.notify();
    return msg;
  }

  receiveMessage(text) {
    if (!this.activeSession) return;
    const msg = {
      id: `M-${Date.now()}`,
      sender: 'astrologer',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    this.activeSession.chatMessages.push(msg);
    this.notify();
    return msg;
  }

  endSession(reason = 'USER_ENDED') {
    if (this.sessionTimer) clearInterval(this.sessionTimer);
    if (this.activeSession) {
      this.activeSession.status = 'ENDED';
      this.activeSession.endedReason = reason;
      this.notify();
    }
  }

  clearSession() {
    this.activeSession = null;
    this.notify();
  }

  submitSessionReview({ rating, tags, text, anonymous }) {
    if (this.activeSession) {
      this.activeSession.reviewSubmitted = true;
      this.activeSession.review = { rating, tags, text, anonymous };
      this.notify();
    }
  }
}

const talkToAstroStore = new TalkToAstroStore();
export default talkToAstroStore;
