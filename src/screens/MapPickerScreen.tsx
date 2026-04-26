/**
 * MapPickerScreen.tsx
 * Permet à l'utilisateur de choisir un point (départ ou destination)
 * directement sur la carte Leaflet en appuyant dessus.
 */
import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useAppContext } from '../context/AppContext';
import { reverseGeocode } from '../services/api';
import { COLORS, DEFAULT_CITY } from '../constants';
import { RootStackParamList, Coordinates } from '../types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'MapPicker'>;
  route: RouteProp<RootStackParamList, 'MapPicker'>;
};

export default function MapPickerScreen({ navigation, route }: Props) {
  const { mode } = route.params;
  const { state, dispatch } = useAppContext();
  const webViewRef = useRef<WebView>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState<Coordinates | null>(null);
  const [selectedName, setSelectedName] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const isDepature = mode === 'departure';
  const color      = isDepature ? COLORS.success : COLORS.danger;
  const label      = isDepature ? 'Point de départ' : 'Destination';

  // Centre initial = départ connu OU ville par défaut
  const center = state.departure?.coords ?? DEFAULT_CITY.coords;

  // Reçoit les coords cliquées depuis Leaflet via postMessage
  const handleMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'MAP_CLICK') {
        const coords: Coordinates = { lat: data.lat, lon: data.lon };
        setSelectedCoords(coords);
        setSelectedName('Chargement...');
        setLoading(true);
        const name = await reverseGeocode(coords);
        const shortName = name.split(',').slice(0, 2).join(',');
        setSelectedName(shortName);
        setLoading(false);
      }
    } catch {}
  };

  const handleConfirm = () => {
    if (!selectedCoords || !selectedName) return;
    const result = {
      displayName: selectedName,
      shortName:   selectedName,
      coords:      selectedCoords,
      type:        'map_pick',
    };
    if (isDepature) {
      dispatch({ type: 'SET_DEPARTURE', payload: result });
    } else {
      dispatch({ type: 'SET_DESTINATION', payload: result });
    }
    navigation.goBack();
  };

  const html = buildPickerHTML(center, selectedCoords, color);

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{label}</Text>
          <Text style={styles.headerSub}>Appuyez sur la carte pour choisir</Text>
        </View>
      </View>

      {/* Carte */}
      {!mapLoaded && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.blue} />
          <Text style={styles.loadingText}>Chargement de la carte…</Text>
        </View>
      )}
      <WebView
        ref={webViewRef}
        source={{ html }}
        style={[styles.webview, !mapLoaded && { opacity: 0 }]}
        onLoadEnd={() => setMapLoaded(true)}
        onMessage={handleMessage}
        javaScriptEnabled domStorageEnabled
        originWhitelist={['*']} mixedContentMode="always"
      />

      {/* Barre de confirmation */}
      <View style={styles.bottomBar}>
        {selectedCoords ? (
          <>
            <View style={styles.selectedInfo}>
              <View style={[styles.dot, { backgroundColor: color }]} />
              <View style={{ flex: 1 }}>
                {loading
                  ? <ActivityIndicator size="small" color={color} />
                  : <Text style={styles.selectedName} numberOfLines={2}>{selectedName}</Text>
                }
                <Text style={styles.selectedCoords}>
                  {selectedCoords.lat.toFixed(5)}, {selectedCoords.lon.toFixed(5)}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: color }]}
              onPress={handleConfirm}
              disabled={loading}
            >
              <Text style={styles.confirmText}>✓ Confirmer</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text style={styles.hintText}>
            👆 Appuyez sur la carte pour placer le {label.toLowerCase()}
          </Text>
        )}
      </View>
    </View>
  );
}

function buildPickerHTML(
  center: Coordinates,
  selected: Coordinates | null,
  markerColor: string
): string {
  const markerJS = selected
    ? `
      L.marker([${selected.lat}, ${selected.lon}], {
        icon: L.divIcon({
          html: '<div style="width:20px;height:20px;border-radius:50%;background:${markerColor};border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.5)"></div>',
          iconSize:[20,20], iconAnchor:[10,10], className:''
        })
      }).addTo(map);
    ` : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    html,body{height:100%;background:#07090F}
    #map{height:100vh;width:100%}
    #crosshair{
      position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
      pointer-events:none;z-index:1000;opacity:0.5;
    }
    #crosshair::before,#crosshair::after{
      content:'';position:absolute;background:${markerColor};
    }
    #crosshair::before{width:2px;height:24px;left:11px;top:0}
    #crosshair::after{width:24px;height:2px;left:0;top:11px}
  </style>
</head>
<body>
<div id="crosshair"></div>
<div id="map"></div>
<script>
const map = L.map('map',{zoomControl:false}).setView([${center.lat},${center.lon}],13);
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{
  attribution:'©OpenStreetMap ©CARTO',subdomains:'abcd',maxZoom:20
}).addTo(map);
L.control.zoom({position:'bottomright'}).addTo(map);

let marker = null;
${markerJS}

map.on('click', function(e){
  const lat = e.latlng.lat;
  const lon = e.latlng.lng;

  // Supprimer ancien marqueur
  if(marker) map.removeLayer(marker);

  // Poser nouveau marqueur
  marker = L.marker([lat,lon],{
    icon: L.divIcon({
      html: '<div style="width:20px;height:20px;border-radius:50%;background:${markerColor};border:3px solid #fff;box-shadow:0 3px 10px rgba(0,0,0,0.6);animation:pulse 0.3s ease"></div>',
      iconSize:[20,20], iconAnchor:[10,10], className:''
    })
  }).addTo(map);

  // Envoyer coords à React Native
  window.ReactNativeWebView.postMessage(JSON.stringify({
    type:'MAP_CLICK', lat:lat, lon:lon
  }));
});
</script>
</body>
</html>`;
}

const styles = StyleSheet.create({
  root:    { flex:1, backgroundColor:COLORS.bg },
  webview: { flex:1 },
  header:  {
    flexDirection:'row', alignItems:'center', gap:12,
    paddingHorizontal:16, paddingTop:52, paddingBottom:12,
    backgroundColor:COLORS.bg+'EE', zIndex:10,
  },
  backBtn:     { width:40, height:40, borderRadius:20, backgroundColor:COLORS.surface, alignItems:'center', justifyContent:'center', borderWidth:1, borderColor:COLORS.border },
  backIcon:    { color:COLORS.textPrimary, fontSize:20 },
  headerInfo:  { flex:1 },
  headerTitle: { color:COLORS.textPrimary, fontSize:18, fontWeight:'800' },
  headerSub:   { color:COLORS.textSecondary, fontSize:12, marginTop:2 },
  loadingOverlay:{ position:'absolute', inset:0, zIndex:5, backgroundColor:COLORS.bg, alignItems:'center', justifyContent:'center', gap:12 },
  loadingText: { color:COLORS.textPrimary, fontSize:15, fontWeight:'600' },
  bottomBar: {
    flexDirection:'row', alignItems:'center', gap:12,
    backgroundColor:COLORS.surface, paddingHorizontal:16, paddingVertical:14,
    borderTopWidth:1, borderTopColor:COLORS.border, minHeight:72,
  },
  selectedInfo:  { flex:1, flexDirection:'row', alignItems:'center', gap:10 },
  dot:           { width:14, height:14, borderRadius:7, flexShrink:0 },
  selectedName:  { color:COLORS.textPrimary, fontSize:13, fontWeight:'600', lineHeight:18 },
  selectedCoords:{ color:COLORS.textMuted, fontSize:10, marginTop:2 },
  confirmBtn:    { borderRadius:13, paddingHorizontal:16, paddingVertical:12 },
  confirmText:   { color:'#fff', fontWeight:'800', fontSize:14 },
  hintText:      { flex:1, color:COLORS.textSecondary, fontSize:13, textAlign:'center' },
});
