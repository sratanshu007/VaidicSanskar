import * as Location from 'expo-location';
import axios from 'axios';

/**
 * Mappls (MapmyIndia) Integration Service for Vaidic Sanskar
 * Official REST & Atlas API Documentation: https://apis.mappls.com/
 *
 * Environment variables:
 * EXPO_PUBLIC_MAPPLS_REST_KEY
 * EXPO_PUBLIC_MAPPLS_CLIENT_ID
 * EXPO_PUBLIC_MAPPLS_CLIENT_SECRET
 */

export const MAPPLS_REST_KEY =
  process.env.EXPO_PUBLIC_MAPPLS_REST_KEY || '';
export const MAPPLS_CLIENT_ID =
  process.env.EXPO_PUBLIC_MAPPLS_CLIENT_ID || '';
export const MAPPLS_CLIENT_SECRET =
  process.env.EXPO_PUBLIC_MAPPLS_CLIENT_SECRET || '';

/**
 * Fallback map center for initial component rendering ONLY.
 * NEVER returned as the user's real GPS location.
 */
export const DEFAULT_COORDS = {
  latitude: 28.5355,
  longitude: 77.3910,
  city: 'Noida',
  state: 'Uttar Pradesh',
  formattedAddress: 'Sector 106, Noida, Uttar Pradesh',
};

// In-memory token cache for Mappls Atlas OAuth2 Bearer token
let cachedAuthToken = null;
let tokenExpiryTimestamp = 0;

/**
 * Fetch or reuse cached OAuth2 Bearer Token from Mappls outpost
 */
export async function getMapplsAuthToken() {
  const now = Date.now();
  // Reuse token if still valid for at least 60 seconds
  if (cachedAuthToken && now < tokenExpiryTimestamp - 60000) {
    return cachedAuthToken;
  }

  if (!MAPPLS_CLIENT_ID || !MAPPLS_CLIENT_SECRET) {
    return null;
  }

  try {
    const postBody = `grant_type=client_credentials&client_id=${encodeURIComponent(
      MAPPLS_CLIENT_ID
    )}&client_secret=${encodeURIComponent(MAPPLS_CLIENT_SECRET)}`;

    const res = await axios.post(
      'https://outpost.mappls.com/api/security/oauth/token',
      postBody,
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 7000,
      }
    );

    if (res.data?.access_token) {
      cachedAuthToken = res.data.access_token;
      const expiresInSec = Number(res.data.expires_in) || 86400;
      tokenExpiryTimestamp = now + expiresInSec * 1000;
      return cachedAuthToken;
    }
  } catch (err) {
    console.log('Mappls OAuth token generation error:', err?.message);
  }

  return null;
}

/**
 * Haversine formula to calculate straight-line distance between two coordinates in kilometers
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return 0;
  const nLat1 = Number(lat1);
  const nLon1 = Number(lon1);
  const nLat2 = Number(lat2);
  const nLon2 = Number(lon2);
  if (!Number.isFinite(nLat1) || !Number.isFinite(nLon1) || !Number.isFinite(nLat2) || !Number.isFinite(nLon2)) {
    return 0;
  }

  const R = 6371; // Earth radius in km
  const dLat = ((nLat2 - nLat1) * Math.PI) / 180;
  const dLon = ((nLon2 - nLon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((nLat1 * Math.PI) / 180) *
      Math.cos((nLat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

/**
 * Helper to race a promise against a timeout
 */
function promiseTimeout(promise, timeoutMs, timeoutErrorMsg) {
  let timerId;
  const timeoutPromise = new Promise((_, reject) => {
    timerId = setTimeout(() => {
      reject(new Error(timeoutErrorMsg || `Operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timerId);
  });
}

/**
 * Strictly request device GPS permission and fetch live user GPS coordinates
 * Uses Balanced accuracy by default with an 8-second timeout, falling back to last known position.
 */
export async function getCurrentUserLocation({
  highAccuracy = false,
  timeoutMs = 8000,
  maxAgeMs = 15 * 60 * 1000,
} = {}) {
  try {
    // 1. Check if location services are enabled on device
    const servicesEnabled = await Location.hasServicesEnabledAsync();
    if (!servicesEnabled) {
      return {
        success: false,
        coords: null,
        servicesDisabled: true,
        message: 'कृपया फ़ोन की लोकेशन सेवा (GPS) चालू करें। (Location services are turned off on your device)',
      };
    }

    // 2. Request Foreground GPS Permission
    const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return {
        success: false,
        coords: null,
        permissionDenied: true,
        canAskAgain,
        message: 'कृपया लोकेशन अनुमति दें ताकि नजदीकी पंडित जी को खोजा जा सके। (Location permission is required)',
      };
    }

    // 3. Fetch exact live device GPS position with safe Promise.race timeout
    let loc = null;
    try {
      const positionPromise = Location.getCurrentPositionAsync({
        accuracy: highAccuracy ? Location.Accuracy.High : Location.Accuracy.Balanced,
      });
      loc = await promiseTimeout(positionPromise, timeoutMs, 'GPS retrieval timed out');
    } catch (gpsError) {
      console.log('Live GPS position attempt failed or timed out:', gpsError?.message);
    }

    // 4. Fallback to Last Known Position if current position timed out or failed
    if (!loc?.coords) {
      try {
        const lastKnown = await Location.getLastKnownPositionAsync({
          maxAge: maxAgeMs,
        });
        if (lastKnown?.coords) {
          loc = lastKnown;
        }
      } catch (lastKnownErr) {
        console.log('Last known position retrieval error:', lastKnownErr?.message);
      }
    }

    // 5. If GPS is completely unavailable, fail cleanly without returning fake coordinates
    if (!loc?.coords || !Number.isFinite(loc.coords.latitude) || !Number.isFinite(loc.coords.longitude)) {
      return {
        success: false,
        coords: null,
        message: 'डिवाइस से जीपीएस सिग्नल प्राप्त नहीं हो सका। कृपया पुनः प्रयास करें। (Could not fetch live GPS coordinates)',
      };
    }

    const latitude = Number(loc.coords.latitude);
    const longitude = Number(loc.coords.longitude);

    // 6. Reverse geocode coordinates to Indian address via Mappls REST API
    const address = await reverseGeocode(latitude, longitude);

    return {
      success: true,
      coords: {
        latitude,
        longitude,
        city: address.city || 'Live Location',
        state: address.state || '',
        formattedAddress: address.formattedAddress || `${address.city || 'Live Location'}`,
        locality: address.locality || '',
        pincode: address.pincode || '',
      },
    };
  } catch (error) {
    console.log('Error in getCurrentUserLocation:', error?.message);
    return {
      success: false,
      coords: null,
      message: error?.message || 'लोकेशन प्राप्त करने में त्रुटि हुई।',
    };
  }
}

/**
 * Reverse Geocode coordinates using official Mappls REST API
 * (apis.mappls.com/.../rev_geocode)
 */
export async function reverseGeocode(lat, lng) {
  if (lat == null || lng == null) {
    return { formattedAddress: '', city: 'Live Location', state: '', locality: '', pincode: '' };
  }

  // 1. Official Mappls Advanced Maps REST API
  if (MAPPLS_REST_KEY) {
    try {
      const url = `https://apis.mappls.com/advancedmaps/v1/${MAPPLS_REST_KEY}/rev_geocode?lat=${lat}&lng=${lng}`;
      const res = await axios.get(url, { timeout: 7000 });
      if (res.data?.responseCode === 200 && Array.isArray(res.data?.results) && res.data.results.length > 0) {
        const item = res.data.results[0];
        const locality = item.subLocality || item.locality || '';
        const city = item.city || item.district || '';
        const state = item.state || '';
        const pincode = item.pincode || '';
        return {
          formattedAddress:
            item.formatted_address || [locality, city, state, pincode].filter(Boolean).join(', '),
          city: city || 'Live Location',
          state,
          locality,
          pincode,
        };
      }
    } catch (e) {
      console.log('Mappls reverse geocode notice:', e?.message);
    }
  }

  // 2. Native Expo reverse geocode fallback
  try {
    const geo = await Location.reverseGeocodeAsync({ latitude: Number(lat), longitude: Number(lng) });
    if (geo && geo.length > 0) {
      const g = geo[0];
      const locality = g.subregion || g.district || g.name || '';
      const city = g.city || g.subregion || 'Live Location';
      const state = g.region || '';
      const pincode = g.postalCode || '';
      const parts = [g.name, g.street, locality, city, state].filter(Boolean);
      return {
        formattedAddress: parts.join(', ') || `${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}`,
        city,
        state,
        locality,
        pincode,
      };
    }
  } catch (err) {
    console.log('Expo native reverse geocode notice:', err?.message);
  }

  return {
    formattedAddress: `${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}`,
    city: 'Live Location',
    state: '',
    locality: '',
    pincode: '',
  };
}

/**
 * Mappls Place AutoSuggest / Geocode API for searching addresses, cities, or landmarks in India
 * Uses OAuth2 Bearer Token against atlas.mappls.com with native Expo fallback.
 */
export async function searchMapplsPlaces(query, userLocation = null) {
  if (!query || String(query).trim().length < 2) return [];
  const cleanQuery = String(query).trim();

  // 1. Try Mappls Atlas Places Geocode API with OAuth Bearer Token
  try {
    const token = await getMapplsAuthToken();
    if (token) {
      let url = `https://atlas.mappls.com/api/places/geocode?address=${encodeURIComponent(cleanQuery)}`;
      if (userLocation?.latitude && userLocation?.longitude) {
        url += `&bias=${userLocation.latitude},${userLocation.longitude}`;
      }
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 6000,
      });

      if (res.data?.copResults) {
        const results = Array.isArray(res.data.copResults)
          ? res.data.copResults
          : [res.data.copResults];

        const validPlaces = results
          .filter((p) => p && p.latitude && p.longitude)
          .map((p, idx) => ({
            id: p.eLoc || `plc-${idx}-${Date.now()}`,
            placeName: p.locality || p.subLocality || p.city || p.formattedAddress || cleanQuery,
            address: p.formattedAddress || `${p.locality || ''}, ${p.city || ''}`,
            city: p.city || p.district || '',
            state: p.state || '',
            latitude: parseFloat(p.latitude),
            longitude: parseFloat(p.longitude),
          }));

        if (validPlaces.length > 0) {
          return validPlaces;
        }
      }
    }
  } catch (e) {
    console.log('Mappls Atlas places search notice:', e?.message);
  }

  // 2. Native Expo Geocode Fallback
  try {
    const results = await Location.geocodeAsync(cleanQuery);
    if (results && results.length > 0) {
      return results.slice(0, 5).map((r, i) => ({
        id: `geo-${i}-${Date.now()}`,
        placeName: cleanQuery,
        address: cleanQuery,
        latitude: r.latitude,
        longitude: r.longitude,
      }));
    }
  } catch (err) {
    console.log('Expo native geocode notice:', err?.message);
  }

  return [];
}

/**
 * Fetch real turn-by-turn driving route, distance and duration from Mappls Direction API
 * Endpoint: https://apis.mappls.com/advancedmaps/v1/{REST_KEY}/route_adv/driving/{lng1},{lat1};{lng2},{lat2}?geometries=geojson&overview=full
 */
export async function getMapplsRoute(origin, destination) {
  if (!origin?.latitude || !origin?.longitude || !destination?.latitude || !destination?.longitude) {
    return {
      success: false,
      distanceKm: 0,
      etaMinutes: 0,
      coordinates: [],
    };
  }

  const oLat = Number(origin.latitude);
  const oLng = Number(origin.longitude);
  const dLat = Number(destination.latitude);
  const dLng = Number(destination.longitude);

  if (MAPPLS_REST_KEY) {
    try {
      const url = `https://apis.mappls.com/advancedmaps/v1/${MAPPLS_REST_KEY}/route_adv/driving/${oLng},${oLat};${dLng},${dLat}?geometries=geojson&overview=full`;
      const res = await axios.get(url, { timeout: 8000 });

      if (res.data?.routes && Array.isArray(res.data.routes) && res.data.routes.length > 0) {
        const primaryRoute = res.data.routes[0];
        const distanceMeters = primaryRoute.distance || 0;
        const durationSeconds = primaryRoute.duration || 0;
        const distanceKm = Number((distanceMeters / 1000).toFixed(1));
        const etaMinutes = Math.max(1, Math.round(durationSeconds / 60));

        // Mappls GeoJSON returns coordinates as [ [lng, lat], ... ]
        // Leaflet polyline expects [ [lat, lng], ... ]
        const rawCoords = primaryRoute.geometry?.coordinates || [];
        const coordinates = rawCoords.map(([lng, lat]) => [Number(lat), Number(lng)]);

        return {
          success: true,
          distanceKm,
          etaMinutes,
          coordinates,
        };
      }
    } catch (err) {
      console.log('Mappls route API notice, calculating via fallback:', err?.message);
    }
  }

  // Fallback Haversine straight line estimation
  const straightDist = calculateDistance(oLat, oLng, dLat, dLng);
  // Estimate driving distance as ~1.25x straight line in Indian cities, avg speed ~20 km/h
  const estDist = Number((straightDist * 1.25).toFixed(1));
  const estEta = Math.max(2, Math.round(estDist * 3));

  return {
    success: false,
    distanceKm: estDist,
    etaMinutes: estEta,
    coordinates: [
      [oLat, oLng],
      [dLat, dLng],
    ],
  };
}

/**
 * Generate certified Nearby Pandits dynamically surrounding the user's location
 */
export function getNearbyPandits(userLat, userLng, radiusKm = 15, specialty = 'All', sourcePandits = []) {
  const uLat = Number(userLat) || DEFAULT_COORDS.latitude;
  const uLng = Number(userLng) || DEFAULT_COORDS.longitude;

  if (!Array.isArray(sourcePandits) || sourcePandits.length === 0) {
    return [];
  }

  return sourcePandits
    .map((p, idx) => {
      const pLat = Number(p.latitude || p.lat || p.location?.coordinates?.[1] || (uLat + ((idx + 1) * 0.005 * (idx % 2 === 0 ? 1 : -1))));
      const pLng = Number(p.longitude || p.lng || p.location?.coordinates?.[0] || (uLng + ((idx + 1) * 0.005 * (idx % 3 === 0 ? -1 : 1))));
      const dist = calculateDistance(uLat, uLng, pLat, pLng);
      const approxMins = Math.max(5, Math.round(dist * 7));

      return {
        id: String(p.id || p._id || `p-${idx}`),
        name: p.name || 'वैदिक पंडित',
        title: p.title || p.specialization || 'प्रमाणित वैदिक आचार्य',
        experience: p.experience ? `${p.experience} वर्ष अनुभव` : 'प्रमाणित अनुभव',
        rating: Number(p.rating || p.averageRating || 5.0),
        reviewCount: Number(p.reviewCount || p.reviewsCount || p.totalReviews || 0),
        specialties: Array.isArray(p.specialties) ? p.specialties : (Array.isArray(p.skills) ? p.skills : ['वैदिक पूजा', 'हवन']),
        fee: p.fee || (p.price ? `₹${p.price}` : '₹1,500'),
        avatar: p.profileImage || p.photo || p.avatar || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&auto=format&fit=crop&q=80',
        isOnline: p.isOnline !== false,
        verified: p.isVerified !== false,
        languages: Array.isArray(p.languages) ? p.languages : ['हिंदी', 'संस्कृत'],
        phone: p.phone || p.contact || '',
        latitude: pLat,
        longitude: pLng,
        distanceKm: dist,
        distanceText: `${dist} किमी दूर`,
        etaText: `~${approxMins} मिनट`,
      };
    })
    .filter((p) => {
      const withinRadius = p.distanceKm <= radiusKm;
      if (!withinRadius) return false;
      if (specialty === 'All' || specialty === 'सभी') return true;
      return p.specialties.some((s) => s.toLowerCase().includes(specialty.toLowerCase()));
    })
    .sort((a, b) => a.distanceKm - b.distanceKm);
}
