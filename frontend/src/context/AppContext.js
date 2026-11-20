import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';

/**
 * Central app state (Provider pattern — the lightweight choice from
 * Redux / Provider / Bloc). Split into logical slices: auth, wallet, cart.
 * Convenience hooks: useApp(), useAuth(), useWallet(), useCart().
 *
 * Developer: for larger teams this maps 1:1 onto Redux slices or Bloc cubits.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAuthToken, WalletService } from '../services/api';
import panditBookingStore from '../services/panditBookingStore';
import talkToAstroStore from '../services/talkToAstroStore';
import socket from '../services/socket';

const USER_STORAGE_KEY = '@vaidic_sanskar_user_profile';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  /* ---------------- AUTH / PROFILE ---------------- */
  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState(0);
  const [ledger, setLedger] = useState([]);

  const refreshWallet = useCallback(async () => {
    try {
      const res = await WalletService.get();
      const rawBal = Number(res?.balance ?? res?.walletBalance ?? res?.data?.balance ?? 0);
      const nextBal = Number.isFinite(rawBal) ? Math.max(0, rawBal) : 0;
      const nextLedger = Array.isArray(res?.ledger)
        ? res.ledger
        : Array.isArray(res?.transactions)
        ? res.transactions
        : [];
      setBalance(nextBal);
      setLedger(nextLedger);
      talkToAstroStore.setWalletFromServer(nextBal, nextLedger);
      return nextBal;
    } catch (_) {
      return null;
    }
  }, []);

  // Restore user from storage on mount
  React.useEffect(() => {
    AsyncStorage.getItem(USER_STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            setUser(parsed);
            if (parsed?.token) setAuthToken(parsed.token);
            const uid = parsed?.id || parsed?._id || parsed?.phone || parsed?.email;
            if (uid) socket.setActiveUser(uid);
            if (parsed) refreshWallet();
          } catch (e) { }
        }
      })
      .catch(() => { });
  }, [refreshWallet]);

  const login = useCallback((u) => {
    setUser((prev) => {
      const prevId = String(prev?.id || prev?._id || prev?.email || prev?.phone || '');
      const nextId = String(u?.id || u?._id || u?.email || u?.phone || '');
      if (!prevId || !nextId || prevId !== nextId) {
        setBalance(0);
        setLedger([]);
        setCart([]);
        panditBookingStore.clearLocalCache();
        talkToAstroStore.resetWallet();
      }
      return u;
    });
    if (u) {
      AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(u)).catch(() => { });
      const uid = u?.id || u?._id || u?.phone || u?.email;
      if (uid) socket.setActiveUser(uid);
    }
    if (u?.token) setAuthToken(u.token);
    if (u) refreshWallet();
  }, [refreshWallet]);

  const logout = useCallback(() => {
    setUser(null);
    setBalance(0);
    setLedger([]);
    setCart([]);
    AsyncStorage.removeItem(USER_STORAGE_KEY).catch(() => { });
    setAuthToken(null);
    socket.setActiveUser(null);
    panditBookingStore.clearLocalCache();
    talkToAstroStore.resetWallet();
  }, []);

  const updateProfile = useCallback((patch) => {
    setUser((prev) => {
      const updated = { ...(prev || {}), ...patch };
      AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated)).catch(() => { });
      return updated;
    });
  }, []);

  const addAddress = useCallback((addr) => {
    setUser((prev) => {
      const addresses = [...(prev?.addresses || []), { id: Date.now().toString(), ...addr }];
      const updated = { ...(prev || {}), addresses };
      AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated)).catch(() => { });
      return updated;
    });
  }, []);

  const updateAddress = useCallback((addrId, updatedFields) => {
    setUser((prev) => {
      const addresses = (prev?.addresses || []).map((a) => (a.id === addrId ? { ...a, ...updatedFields } : a));
      const updated = { ...(prev || {}), addresses };
      AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated)).catch(() => { });
      return updated;
    });
  }, []);

  const deleteAddress = useCallback((addrId) => {
    setUser((prev) => {
      const addresses = (prev?.addresses || []).filter((a) => a.id !== addrId);
      const updated = { ...(prev || {}), addresses };
      AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated)).catch(() => { });
      return updated;
    });
  }, []);

  const addMoney = useCallback((amount, method = 'UPI') => {
    const numAmt = Number(amount || 0);
    if (!Number.isFinite(numAmt) || numAmt <= 0) return;
    setBalance((b) => b + numAmt);
    setLedger((l) => [{ id: Date.now().toString(), type: 'credit', title: `Added via ${method}`, amount: numAmt, at: today() }, ...l]);
    talkToAstroStore.rechargeWallet({ amount: numAmt, bonus: 0 });
    WalletService.credit(numAmt, method)
      .then((res) => {
        if (typeof res?.balance === 'number') {
          setBalance(res.balance);
          talkToAstroStore.setWalletFromServer(res.balance, res.ledger);
        }
        if (Array.isArray(res?.ledger)) setLedger(res.ledger);
      })
      .catch(() => {});
  }, []);

  const deduct = useCallback((amount, title) => {
    const numAmt = Number(amount || 0);
    if (!Number.isFinite(numAmt) || numAmt <= 0) return false;
    let ok = false;
    setBalance((b) => { if (b >= numAmt) { ok = true; return b - numAmt; } return b; });
    if (ok !== false) {
      setLedger((l) => [{ id: Date.now().toString(), type: 'debit', title, amount: numAmt, at: today() }, ...l]);
      talkToAstroStore.deductMoney(numAmt, title, false);
      WalletService.debit(numAmt, title)
        .then((res) => {
          if (typeof res?.balance === 'number') {
            setBalance(res.balance);
            talkToAstroStore.setWalletFromServer(res.balance, res.ledger);
          }
          if (Array.isArray(res?.ledger)) setLedger(res.ledger);
        })
        .catch(() => {});
    }
    return ok;
  }, []);

  /* ---------------- CART ---------------- */
  const [cart, setCart] = useState([]);
  const addToCart = useCallback((item) => {
    setCart((prev) => {
      const ex = prev.find((p) => p.id === item.id);
      if (ex) return prev.map((p) => (p.id === item.id ? { ...p, qty: p.qty + (item.qty || 1) } : p));
      return [...prev, { ...item, qty: item.qty || 1 }];
    });
  }, []);
  const removeFromCart = useCallback((id) => setCart((p) => p.filter((x) => x.id !== id)), []);
  const updateQty = useCallback((id, qty) =>
    setCart((p) => p.map((x) => (x.id === id ? { ...x, qty: Math.max(0, qty) } : x)).filter((x) => x.qty > 0)), []);
  const clearCart = useCallback(() => setCart([]), []);
  const cartTotal = useMemo(() => cart.reduce((s, p) => s + p.price * p.qty, 0), [cart]);

  const value = {
    // auth
    user, setUser, login, logout, updateProfile, addAddress, updateAddress, deleteAddress,
    // wallet
    balance, ledger, addMoney, deduct,
    // cart
    cart, addToCart, removeFromCart, updateQty, clearCart, cartTotal,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

function today() {
  return new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
export const useAuth = () => {
  const c = useApp();
  return {
    user: c.user,
    login: c.login,
    logout: c.logout,
    updateProfile: c.updateProfile,
    addAddress: c.addAddress,
    updateAddress: c.updateAddress,
    deleteAddress: c.deleteAddress,
    addresses: c.user?.addresses || [],
  };
};
export const useWallet = () => { const c = useApp(); return { balance: c.balance, ledger: c.ledger, addMoney: c.addMoney, deduct: c.deduct }; };
export const useCart = () => { const c = useApp(); return { cart: c.cart, addToCart: c.addToCart, removeFromCart: c.removeFromCart, updateQty: c.updateQty, clearCart: c.clearCart, cartTotal: c.cartTotal }; };
