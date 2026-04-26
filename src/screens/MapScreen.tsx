import React, { useRef, useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Linking, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useAppContext } from '../context/AppContext';
import { COLORS, PRIORITY_CONFIG, DEFAULT_CITY, MAP_TILES, TRANSPORT_CONFIG } from '../constants';
import { formatDuration, formatDistance, formatCost } from '../utils';
import { RootStackParamList } from '../types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList,'Map'>;
  route:      RouteProp<RootStackParamList,'Map'>;
};

export default function MapScreen({ navigation }: Props) {
  const { state, dispatch } = useAppContext();
  const webViewRef   = useRef<WebView>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const center       = state.departure?.coords ?? DEFAULT_CITY.coords;
  const selectedRoute = state.selectedRoute;

  const mapData = useMemo(() => ({
    center:      [center.lat, center.lon],
    departure:   state.departure   ? { lat:state.departure.coords.lat,   lon:state.departure.coords.lon,   name:state.departure.shortName   } : null,
    destination: state.destination ? { lat:state.destination.coords.lat, lon:state.destination.coords.lon, name:state.destination.shortName } : null,
    routes: state.routes.map(r => ({
      id:r.id, color:r.accentColor, label:r.label,
      coords:r.geometry.map(c => [c.lat,c.lon]),
      active:r.id===(selectedRoute?.id??''),
    })),
    // Tuiles claires CartoDB Positron
    tileUrl: MAP_TILES.light,
  }), [state.departure, state.destination, state.routes, selectedRoute]);

  const handleStart = () => {
    if (!state.departure||!state.destination) return;
    const { lat:sLat,lon:sLon } = state.departure.coords;
    const { lat:dLat,lon:dLon } = state.destination.coords;
    const mode = selectedRoute?.primaryMode;
    const gmMode = mode==='walk'?'walking':mode==='velo'?'bicycling':'driving';
    const url = `https://www.google.com/maps/dir/?api=1&origin=${sLat},${sLon}&destination=${dLat},${dLon}&travelmode=${gmMode}`;
    Linking.canOpenURL(url).then(ok => ok
      ? Linking.openURL(url)
      : Alert.alert('Google Maps non disponible'));
  };

  const html = buildMapHTML(mapData);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.iconBtnText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {state.departure?.shortName??'Départ'} → {state.destination?.shortName??'Destination'}
          </Text>
          {selectedRoute && (
            <Text style={[styles.headerSub, {color:selectedRoute.accentColor}]}>
              {PRIORITY_CONFIG[selectedRoute.type]?.icon??'🚂'} {selectedRoute.label}
            </Text>
          )}
        </View>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Results')}>
          <Text style={styles.iconBtnText}>☰</Text>
        </TouchableOpacity>
      </View>

      {!mapLoaded && (
        <View style={styles.loadingMap}>
          <ActivityIndicator size="large" color={COLORS.blue} />
          <Text style={styles.loadingText}>Chargement de la carte…</Text>
        </View>
      )}

      <WebView
        ref={webViewRef} source={{ html }}
        style={[styles.webview, !mapLoaded && {opacity:0}]}
        onLoadEnd={() => setMapLoaded(true)}
        javaScriptEnabled domStorageEnabled originWhitelist={['*']} mixedContentMode="always"
      />

      {state.routes.length > 0 && (
        <View style={styles.pills}>
          {state.routes.map(r => {
            const active = r.id === selectedRoute?.id;
            return (
              <TouchableOpacity key={r.id}
                style={[styles.pill, active && {backgroundColor:r.accentColor}]}
                onPress={() => dispatch({type:'SET_SELECTED_ROUTE',payload:r})}
              >
                <Text style={styles.pillIcon}>{r.id==='train'?'🚂':PRIORITY_CONFIG[r.type]?.icon??'⚖️'}</Text>
                <Text style={[styles.pillText, active && {color:'#fff'}]}>{formatDuration(r.duration)}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {selectedRoute && (
        <View style={styles.bottomBar}>
          <StatItem label="Durée"    value={formatDuration(selectedRoute.duration)} />
          <View style={styles.barDiv} />
          <StatItem label="Coût"     value={formatCost(selectedRoute.cost)} />
          <View style={styles.barDiv} />
          <StatItem label="Distance" value={formatDistance(selectedRoute.distance)} />
          <TouchableOpacity style={[styles.startBtn,{backgroundColor:selectedRoute.accentColor}]} onPress={handleStart}>
            <Text style={styles.startIcon}>▶</Text>
            <Text style={styles.startText}>Démarrer</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function StatItem({ label, value }: { label:string; value:string }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function buildMapHTML(data: any): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    html,body{height:100%;background:#F8F9FA}
    #map{height:100vh;width:100%}
    .leaflet-popup-content-wrapper{background:#fff;color:#1A1A2E;border:1px solid #E8EAED;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.15)}
    .leaflet-popup-tip{background:#fff}
    .leaflet-popup-content{margin:10px 14px;font-family:sans-serif;font-size:13px}
    .pop-title{font-weight:600;font-size:14px;margin-bottom:3px;color:#1A1A2E}
    .pop-sub{color:#5F6368;font-size:12px}
  </style>
</head>
<body>
<div id="map"></div>
<script>
const D=${JSON.stringify(data)};
const map=L.map('map',{zoomControl:false}).setView(D.center,13);

// Carte claire CartoDB Positron (style Google Maps)
L.tileLayer(D.tileUrl,{
  attribution:'©OpenStreetMap ©CARTO',subdomains:'abcd',maxZoom:20
}).addTo(map);

L.control.zoom({position:'bottomright'}).addTo(map);

const allB=[];
D.routes.filter(r=>!r.active).forEach(r=>{
  if(!r.coords||r.coords.length<2)return;
  L.polyline(r.coords,{color:r.color,weight:3,opacity:0.35,lineCap:'round'}).addTo(map);
  r.coords.forEach(c=>allB.push(c));
});
D.routes.filter(r=>r.active).forEach(r=>{
  if(!r.coords||r.coords.length<2)return;
  const line=L.polyline(r.coords,{color:r.color,weight:6,opacity:0.95,lineCap:'round',lineJoin:'round'}).addTo(map);
  line.bindPopup('<div class="pop-title" style="color:'+r.color+'">'+r.label+'</div><div class="pop-sub">Trajet sélectionné</div>');
  r.coords.forEach(c=>allB.push(c));
});

if(allB.length>1)map.fitBounds(L.latLngBounds(allB),{padding:[70,70]});

function mkMarker(lat,lon,color,label,sub){
  const icon=L.divIcon({
    html:'<div style="width:18px;height:18px;border-radius:50%;background:'+color+';border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>',
    iconSize:[18,18],iconAnchor:[9,9],className:''
  });
  L.marker([lat,lon],{icon}).addTo(map).bindPopup('<div class="pop-title">'+label+'</div>'+(sub?'<div class="pop-sub">'+sub+'</div>':''));
}
if(D.departure)   mkMarker(D.departure.lat,   D.departure.lon,   '#2E7D32','Départ',   D.departure.name);
if(D.destination) mkMarker(D.destination.lat, D.destination.lon, '#E53935','Destination',D.destination.name);
</script>
</body>
</html>`;
}

const styles = StyleSheet.create({
  root:    {flex:1, backgroundColor:COLORS.bg},
  webview: {flex:1},
  header:  {
    position:'absolute',top:0,left:0,right:0,zIndex:10,
    flexDirection:'row',alignItems:'center',gap:10,
    paddingHorizontal:12,paddingTop:52,paddingBottom:12,
    backgroundColor:COLORS.bg+'F0',
    borderBottomWidth:0.5,borderBottomColor:COLORS.border,
  },
  iconBtn:     {width:38,height:38,borderRadius:19,backgroundColor:COLORS.surface,alignItems:'center',justifyContent:'center',borderWidth:0.5,borderColor:COLORS.border},
  iconBtnText: {color:COLORS.textPrimary,fontSize:18},
  headerInfo:  {flex:1},
  headerTitle: {color:COLORS.textPrimary,fontSize:14,fontWeight:'700'},
  headerSub:   {fontSize:12,fontWeight:'600',marginTop:2},
  loadingMap:  {position:'absolute',inset:0,zIndex:5,backgroundColor:COLORS.bg,alignItems:'center',justifyContent:'center',gap:10},
  loadingText: {color:COLORS.textPrimary,fontSize:16,fontWeight:'600'},
  pills: {
    position:'absolute',bottom:88,left:0,right:0,zIndex:10,
    flexDirection:'row',justifyContent:'center',gap:8,paddingHorizontal:16,
  },
  pill:      {flexDirection:'row',alignItems:'center',gap:6,backgroundColor:COLORS.cardBg+'EE',borderRadius:20,paddingHorizontal:14,paddingVertical:8,borderWidth:0.5,borderColor:COLORS.border},
  pillIcon:  {fontSize:14},
  pillText:  {color:COLORS.textSecondary,fontSize:13,fontWeight:'600'},
  bottomBar: {
    flexDirection:'row',alignItems:'center',backgroundColor:COLORS.cardBg,
    paddingHorizontal:14,paddingVertical:14,
    borderTopWidth:0.5,borderTopColor:COLORS.border,gap:8,
  },
  statItem:  {flex:1,alignItems:'center'},
  statValue: {color:COLORS.textPrimary,fontSize:13,fontWeight:'700'},
  statLabel: {color:COLORS.textMuted,fontSize:10,marginTop:2},
  barDiv:    {width:0.5,height:30,backgroundColor:COLORS.border},
  startBtn:  {flexDirection:'row',alignItems:'center',gap:6,borderRadius:12,paddingHorizontal:14,paddingVertical:12},
  startIcon: {color:'#fff',fontSize:12},
  startText: {color:'#fff',fontWeight:'700',fontSize:13},
});
