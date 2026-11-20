import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { getCurrentUserLocation, DEFAULT_COORDS } from '../services/mapplsService';
import colors from '../theme/colors';

export default function LocationPickerModal({
  visible,
  onClose,
  initialCoords = { lat: 28.5355, lng: 77.3910 },
  onConfirm,
}) {
  const [selectedCoords, setSelectedCoords] = useState(initialCoords);
  const [locating, setLocating] = useState(false);
  const [addressPreview, setAddressPreview] = useState('Fetching address...');
  const webViewRef = useRef(null);

  useEffect(() => {
    if (visible && initialCoords) {
      setSelectedCoords(initialCoords);
      reverseGeocode(initialCoords.lat, initialCoords.lng);
    }
  }, [visible, initialCoords?.lat, initialCoords?.lng]);

  const reverseGeocode = async (lat, lng) => {
    try {
      setAddressPreview(`Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`);
      // Try OpenStreetMap reverse geocoding
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { 'User-Agent': 'VaidicSanskarApp/2.0' } }
      );
      const data = await resp.json();
      if (data && data.display_name) {
        setAddressPreview(data.display_name);
      }
    } catch (_) {
      setAddressPreview(`Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    }
  };

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'PIN_MOVED') {
        setSelectedCoords({ lat: data.lat, lng: data.lng });
        reverseGeocode(data.lat, data.lng);
      }
    } catch (_) {}
  };

  const handleUseCurrentLocation = async () => {
    try {
      setLocating(true);
      const res = await getCurrentUserLocation();
      if (res?.success && res?.coords) {
        const newCoords = {
          lat: res.coords.latitude,
          lng: res.coords.longitude,
        };
        setSelectedCoords(newCoords);
        reverseGeocode(newCoords.lat, newCoords.lng);
        if (webViewRef.current) {
          webViewRef.current.injectJavaScript(`
            if (window.setPin) {
              window.setPin(${newCoords.lat}, ${newCoords.lng});
            }
          `);
        }
      } else {
        Alert.alert(
          'जीपीएस लोकेशन',
          res?.message || 'डिवाइस से लाइव जीपीएस प्राप्त नहीं हो सका। कृपया मैप पर सीधे पिन सेट करें।'
        );
      }
    } catch (e) {
      console.log('Location error:', e);
      Alert.alert('त्रुटि', 'लोकेशन प्राप्त नहीं हो सकी।');
    } finally {
      setLocating(false);
    }
  };

  const pickerHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body, html, #map { margin: 0; padding: 0; width: 100%; height: 100%; background: #FAF5EE; }
        .picker-pin {
          background: #67101F; color: white; border: 3px solid #FFFFFF;
          border-radius: 50%; width: 44px; height: 44px; display: flex;
          align-items: center; justify-content: center; font-size: 22px;
          box-shadow: 0 4px 14px rgba(103, 16, 31, 0.5);
          cursor: grab;
        }
        .instruction-box {
          position: absolute; top: 12px; left: 50%; transform: translateX(-50%);
          background: rgba(255, 255, 255, 0.95); padding: 8px 16px; border-radius: 20px;
          font-family: -apple-system, sans-serif; font-size: 12px; font-weight: 700;
          color: #67101F; box-shadow: 0 2px 8px rgba(0,0,0,0.15); z-index: 1000;
          pointer-events: none;
        }
      </style>
    </head>
    <body>
      <div class="instruction-box">📍 Tap or drag marker to set exact location</div>
      <div id="map"></div>
      <script>
        var map = L.map('map', { zoomControl: false }).setView([${selectedCoords.lat}, ${selectedCoords.lng}], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap'
        }).addTo(map);

        var pinIcon = L.divIcon({
          className: 'custom-pin',
          html: '<div class="picker-pin">🪔</div>',
          iconSize: [44, 44],
          iconAnchor: [22, 22]
        });

        var marker = L.marker([${selectedCoords.lat}, ${selectedCoords.lng}], {
          icon: pinIcon,
          draggable: true
        }).addTo(map);

        function notifyReactNative(lat, lng) {
          var payload = JSON.stringify({ type: 'PIN_MOVED', lat: lat, lng: lng });
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(payload);
          }
        }

        marker.on('dragend', function(e) {
          var pos = e.target.getLatLng();
          notifyReactNative(pos.lat, pos.lng);
        });

        map.on('click', function(e) {
          marker.setLatLng(e.latlng);
          notifyReactNative(e.latlng.lat, e.latlng.lng);
        });

        window.setPin = function(lat, lng) {
          map.setView([lat, lng], 16);
          marker.setLatLng([lat, lng]);
        };
      </script>
    </body>
    </html>
  `;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={10}>
            <Ionicons name="close" size={24} color="#67101F" />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Select Location on Map</Text>
            <Text style={styles.headerSub}>मानचित्र पर सही स्थान चुनें</Text>
          </View>
          <TouchableOpacity
            onPress={handleUseCurrentLocation}
            style={styles.gpsBtn}
            disabled={locating}
            hitSlop={10}
          >
            {locating ? (
              <ActivityIndicator size="small" color="#67101F" />
            ) : (
              <MaterialCommunityIcons name="crosshairs-gps" size={22} color="#67101F" />
            )}
          </TouchableOpacity>
        </View>

        {/* Map View */}
        <View style={styles.mapContainer}>
          <WebView
            ref={webViewRef}
            originWhitelist={['*']}
            source={{ html: pickerHtml }}
            onMessage={handleMessage}
            style={styles.map}
            javaScriptEnabled={true}
            domStorageEnabled={true}
          />
        </View>

        {/* Bottom Confirmation Bar */}
        <View style={styles.bottomBar}>
          <View style={styles.addressBox}>
            <View style={styles.addressIconCircle}>
              <Ionicons name="location-sharp" size={20} color="#67101F" />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.addressLabel}>Selected Location</Text>
              <Text style={styles.addressText} numberOfLines={2}>
                {addressPreview}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => {
              onConfirm?.({
                lat: selectedCoords.lat,
                lng: selectedCoords.lng,
                formattedAddress: addressPreview,
              });
              onClose?.();
            }}
            style={styles.confirmBtn}
          >
            <Text style={styles.confirmBtnText}>Confirm This Location (स्थान सुनिश्चित करें)</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF5EE',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 48 : 16,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EDE4DA',
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F7EFE2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#67101F',
  },
  headerSub: {
    fontSize: 11,
    color: '#8A7577',
    fontWeight: '600',
    marginTop: 2,
  },
  gpsBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F7EFE2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  bottomBar: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderTopWidth: 1,
    borderTopColor: '#EDE4DA',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  addressBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FBF8F2',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EDE4DA',
    marginBottom: 14,
  },
  addressIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F7EFE2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8A7577',
    textTransform: 'uppercase',
  },
  addressText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2E1418',
    marginTop: 2,
  },
  confirmBtn: {
    backgroundColor: '#67101F',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});

