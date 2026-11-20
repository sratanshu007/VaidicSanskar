import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { getMapplsRoute, DEFAULT_COORDS } from '../services/mapplsService';

/**
 * Uber/Rapido-Style Live Tracking Map for VaidicSanskar
 * - Pandit GPS Location marker with saffron pulse halo
 * - Devotee destination address pin
 * - Real Mappls road route polyline connecting both
 * - Live bounds fitting & road distance/ETA updates
 */
export default function LiveTrackingMapView({
  userLocation = DEFAULT_COORDS,
  panditLocation = { latitude: 28.5520, longitude: 77.3780 },
  distanceKm = '2.4',
  etaMinutes = '12',
  isStale = false,
  style,
}) {
  const webViewRef = useRef(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const lastFetchedRouteRef = useRef('');

  const uLat = Number(userLocation?.latitude) || DEFAULT_COORDS.latitude;
  const uLng = Number(userLocation?.longitude) || DEFAULT_COORDS.longitude;
  const pLat = Number(panditLocation?.latitude) || 28.5520;
  const pLng = Number(panditLocation?.longitude) || 77.3780;

  // Fetch real road route from Mappls Direction API
  useEffect(() => {
    const key = `${pLat.toFixed(3)},${pLng.toFixed(3)}->${uLat.toFixed(3)},${uLng.toFixed(3)}`;
    if (lastFetchedRouteRef.current === key) return;
    lastFetchedRouteRef.current = key;

    let isMounted = true;
    getMapplsRoute({ latitude: pLat, longitude: pLng }, { latitude: uLat, longitude: uLng })
      .then((res) => {
        if (isMounted && res?.coordinates && res.coordinates.length > 0) {
          setRouteCoordinates(res.coordinates);
        }
      })
      .catch((err) => {
        console.log('Error fetching Mappls route:', err?.message);
      });

    return () => {
      isMounted = false;
    };
  }, [pLat, pLng, uLat, uLng]);

  // Push updated location coordinates to WebView without reloading page
  useEffect(() => {
    if (webViewRef.current) {
      const coordsJson = JSON.stringify(routeCoordinates);
      const script = `
        if (window.updatePanditPosition) {
          window.updatePanditPosition(${pLat}, ${pLng}, "${distanceKm}", "${etaMinutes}", ${coordsJson});
        }
      `;
      webViewRef.current.injectJavaScript(script);
    }
  }, [pLat, pLng, distanceKm, etaMinutes, routeCoordinates]);

  const initialRouteJson = JSON.stringify(
    routeCoordinates.length > 0
      ? routeCoordinates
      : [
          [pLat, pLng],
          [uLat, uLng],
        ]
  );

  const mapHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body, html, #map { margin: 0; padding: 0; width: 100%; height: 100%; background: #FAF5EE; }
        
        /* Yajman Destination Pin */
        .home-marker {
          background: #67101F; color: white; border: 2.5px solid #FFFFFF;
          border-radius: 50%; width: 36px; height: 36px; display: flex;
          align-items: center; justify-content: center; font-size: 17px;
          box-shadow: 0 4px 12px rgba(103, 16, 31, 0.45);
        }

        /* Pandit Live Vehicle Pin */
        .pandit-vehicle-marker {
          background: #D48B28; color: white; border: 2.5px solid #FFFFFF;
          border-radius: 50%; width: 42px; height: 42px; display: flex;
          align-items: center; justify-content: center; font-size: 20px;
          box-shadow: 0 4px 14px rgba(212, 139, 40, 0.55);
          animation: pulseHalo 2s infinite;
        }

        @keyframes pulseHalo {
          0% { box-shadow: 0 0 0 0 rgba(212, 139, 40, 0.7); }
          70% { box-shadow: 0 0 0 16px rgba(212, 139, 40, 0); }
          100% { box-shadow: 0 0 0 0 rgba(212, 139, 40, 0); }
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map', { zoomControl: false });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© Mappls / OSM'
        }).addTo(map);

        // Yajman Home Pin
        var homeIcon = L.divIcon({
          className: '',
          html: '<div class="home-marker">🏠</div>',
          iconSize: [36, 36],
          iconAnchor: [18, 18]
        });
        var homeMarker = L.marker([${uLat}, ${uLng}], { icon: homeIcon }).addTo(map);

        // Pandit Live Pin
        var panditIcon = L.divIcon({
          className: '',
          html: '<div class="pandit-vehicle-marker">🕉️</div>',
          iconSize: [42, 42],
          iconAnchor: [21, 21]
        });
        var panditMarker = L.marker([${pLat}, ${pLng}], { icon: panditIcon }).addTo(map);

        // Initial Route Polyline
        var routePoints = ${initialRouteJson};
        var routeLine = L.polyline(routePoints, {
          color: '#67101F',
          weight: 4.5,
          opacity: 0.85,
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(map);

        // Fit Bounds
        function fitMap() {
          var group = new L.featureGroup([homeMarker, panditMarker]);
          map.fitBounds(group.getBounds().pad(0.35));
        }
        fitMap();

        // Dynamic update function called from React Native without reloading
        window.updatePanditPosition = function(newLat, newLng, dist, eta, newCoords) {
          panditMarker.setLatLng([newLat, newLng]);
          if (newCoords && Array.isArray(newCoords) && newCoords.length > 0) {
            routeLine.setLatLngs(newCoords);
          } else {
            routeLine.setLatLngs([
              [newLat, newLng],
              [${uLat}, ${uLng}]
            ]);
          }
          fitMap();
        };
      </script>
    </body>
    </html>
  `;

  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: mapHtml }}
        style={styles.webView}
        scrollEnabled={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#67101F" />
          </View>
        )}
      />
      {isStale && (
        <View style={styles.staleBanner}>
          <Text style={styles.staleText}>⚠️ GPS सिग्नल प्रतीक्षारत (Reconnecting...)</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 250,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#FAF5EE',
    position: 'relative',
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAF5EE',
  },
  staleBanner: {
    position: 'absolute',
    top: 10,
    alignSelf: 'center',
    backgroundColor: 'rgba(103, 16, 31, 0.88)',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  staleText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
