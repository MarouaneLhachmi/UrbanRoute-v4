import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppContext } from '../context/AppContext';
import { useGeocoding, useRoutes, useWeather, useAuth } from '../hooks';
import { useLocation } from './useLocation';
import { PrimaryButton, SectionTitle, Card } from '../components';
import { COLORS, PRIORITY_CONFIG, TRANSPORT_CONFIG } from '../constants';
import { Priority, GeocodingResult, TransportMode, RootStackParamList } from '../types';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Home'> };

export default function HomeScreen({ navigation }: Props) {
  const { state, dispatch } = useAppContext();
  const { user } = useAuth();
  const { weather, traffic } = useWeather();
  const { calculate, error } = useRoutes();
  const depGeo  = useGeocoding();
  const destGeo = useGeocoding();
  const { locateMe, loading: gpsLoading } = useLocation();

  const [depText,  setDepText]  = useState('');
  const [destText, setDestText] = useState('');
  const [activeField, setActive] = useState<'dep'|'dest'|null>(null);

  const onDepChange  = (t: string) => { setDepText(t);  depGeo.search(t);  dispatch({ type:'SET_DEPARTURE',   payload:null }); };
  const onDestChange = (t: string) => { setDestText(t); destGeo.search(t); dispatch({ type:'SET_DESTINATION', payload:null }); };

  const selectDep  = (item: GeocodingResult) => { setDepText(item.shortName);  dispatch({ type:'SET_DEPARTURE',   payload:item }); depGeo.clear();  setActive(null); };
  const selectDest = (item: GeocodingResult) => { setDestText(item.shortName); dispatch({ type:'SET_DESTINATION', payload:null }); destGeo.clear(); setActive(null);
    dispatch({ type:'SET_DESTINATION', payload:item });
  };

  const swap = () => {
    dispatch({ type:'SWAP_LOCATIONS' });
    const tmp = depText; setDepText(destText); setDestText(tmp);
  };

  const handleLocateMe = async () => {
    const result = await locateMe();
    if (result) setDepText(result.shortName);
  };

  // Sync text quand on revient de MapPicker
  React.useEffect(() => {
    if (state.departure?.type === 'map_pick')   setDepText(state.departure.shortName);
    if (state.destination?.type === 'map_pick') setDestText(state.destination.shortName);
  }, [state.departure, state.destination]);

  const handleSearch = async () => {
    if (!state.departure || !state.destination) return;
    await calculate();
    navigation.navigate('Results');
  };

  const canSearch = !!state.departure && !!state.destination && !state.isCalculating;
  const firstName = user?.name?.split(' ')[0] ?? 'vous';

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Bonjour, {firstName} 👋</Text>
          <Text style={styles.subtitle}>Où souhaitez-vous aller ?</Text>
        </View>
        <TouchableOpacity style={styles.avatarBtn} onPress={() => navigation.navigate('Profile')}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase() ?? '?'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Météo + Trafic + Ville */}
        <View style={styles.contextBar}>
          {weather ? (
            <View style={styles.ctxItem}>
              <Text style={styles.ctxIcon}>{weather.icon}</Text>
              <Text style={styles.ctxText}>{weather.temp}°C · {weather.condition}</Text>
            </View>
          ) : (
            <View style={styles.ctxItem}><Text style={styles.ctxIcon}>🌡️</Text><Text style={styles.ctxText}>Maroc</Text></View>
          )}
          {traffic && (
            <View style={styles.ctxItem}>
              <View style={[styles.trafficDot, { backgroundColor:traffic.color }]} />
              <Text style={styles.ctxText}>{traffic.label}</Text>
            </View>
          )}
          <View style={styles.ctxItem}>
            <Text style={styles.ctxIcon}>📍</Text>
            <Text style={[styles.ctxText, { color:COLORS.blue }]}>{state.detectedCity}</Text>
          </View>
        </View>

        {/* Champs départ / destination */}
        <Card style={styles.searchCard}>

          {/* --- DÉPART --- */}
          <View style={styles.inputRow}>
            <View style={[styles.dot, { backgroundColor:COLORS.success }]} />
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input} placeholder="Point de départ"
                placeholderTextColor={COLORS.textMuted} value={depText}
                onChangeText={onDepChange} onFocus={() => setActive('dep')}
              />
              {depGeo.loading && <ActivityIndicator size="small" color={COLORS.blue} />}
              {state.departure && <Text style={styles.confirmed}>✅</Text>}
            </View>
            {/* GPS */}
            <TouchableOpacity style={styles.iconBtn} onPress={handleLocateMe} disabled={gpsLoading}>
              {gpsLoading ? <ActivityIndicator size="small" color={COLORS.blue} /> : <Text style={styles.iconBtnText}>📡</Text>}
            </TouchableOpacity>
            {/* Carte */}
            <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('MapPicker', { mode:'departure' })}>
              <Text style={styles.iconBtnText}>🗺️</Text>
            </TouchableOpacity>
          </View>

          {activeField === 'dep' && depGeo.results.length > 0 && (
            <SuggestionList items={depGeo.results} onSelect={selectDep} />
          )}

          <View style={styles.divRow}>
            <View style={styles.divLine} />
            <TouchableOpacity style={styles.swapBtn} onPress={swap}>
              <Text style={styles.swapIcon}>⇅</Text>
            </TouchableOpacity>
            <View style={styles.divLine} />
          </View>

          {/* --- DESTINATION --- */}
          <View style={styles.inputRow}>
            <View style={[styles.dot, { backgroundColor:COLORS.danger }]} />
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input} placeholder="Destination"
                placeholderTextColor={COLORS.textMuted} value={destText}
                onChangeText={onDestChange} onFocus={() => setActive('dest')}
              />
              {destGeo.loading && <ActivityIndicator size="small" color={COLORS.blue} />}
              {state.destination && <Text style={styles.confirmed}>✅</Text>}
            </View>
            {/* Carte */}
            <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('MapPicker', { mode:'destination' })}>
              <Text style={styles.iconBtnText}>🗺️</Text>
            </TouchableOpacity>
          </View>

          {activeField === 'dest' && destGeo.results.length > 0 && (
            <SuggestionList items={destGeo.results} onSelect={selectDest} />
          )}
        </Card>

        {error && (
          <View style={styles.errorBox}><Text style={styles.errorText}>⚠️ {error}</Text></View>
        )}

        {/* Priorité */}
        <SectionTitle style={styles.sectionTitle}>Priorité du trajet</SectionTitle>
        <View style={styles.priorityRow}>
          {(Object.keys(PRIORITY_CONFIG) as Priority[]).map(key => {
            const conf = PRIORITY_CONFIG[key];
            const active = state.selectedPriority === key;
            return (
              <TouchableOpacity
                key={key}
                style={[styles.priorityCard, active && { borderColor:conf.color, backgroundColor:conf.bgColor }]}
                onPress={() => dispatch({ type:'SET_PRIORITY', payload:key })}
              >
                <Text style={styles.priorityIcon}>{conf.icon}</Text>
                <Text style={[styles.priorityLabel, active && { color:conf.color }]}>{conf.label}</Text>
                <Text style={styles.priorityDesc}>{conf.description}</Text>
                {active && (
                  <View style={[styles.checkBadge, { backgroundColor:conf.color }]}>
                    <Text style={styles.checkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Transports disponibles dans la ville */}
        <View style={styles.transportHeader}>
          <SectionTitle style={styles.sectionTitle}>
            Transports — {state.detectedCity}
          </SectionTitle>
          {state.selectedModes.length > 0 && (
            <TouchableOpacity onPress={() => {
              [...state.selectedModes].forEach(m => dispatch({ type:'TOGGLE_MODE', payload:m }));
            }}>
              <Text style={styles.clearText}>Tout effacer</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.transportGrid}>
          {(state.availableModes as TransportMode[]).map(mode => {
            const conf = TRANSPORT_CONFIG[mode];
            const selected = state.selectedModes.includes(mode);
            return (
              <TouchableOpacity
                key={mode}
                style={[styles.transportChip, selected && { borderColor:conf.color, backgroundColor:conf.color+'20' }]}
                onPress={() => dispatch({ type:'TOGGLE_MODE', payload:mode })}
              >
                <Text style={styles.transportIcon}>{conf.icon}</Text>
                <Text style={[styles.transportLabel, selected && { color:conf.color }]}>{conf.label}</Text>
                {selected && <Text style={[styles.transportCheck, { color:conf.color }]}>✓</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.selectionNote}>
          <Text style={styles.selectionNoteText}>
            {state.selectedModes.length > 0
              ? `🎯 Calcul basé sur : ${state.selectedModes.map(m => TRANSPORT_CONFIG[m].label).join(', ')}`
              : `ℹ️ Tous les transports disponibles à ${state.detectedCity} seront utilisés`
            }
          </Text>
        </View>

        <PrimaryButton
          label={state.isCalculating ? 'Calcul en cours…' : 'Calculer les itinéraires'}
          onPress={handleSearch} loading={state.isCalculating}
          disabled={!canSearch} icon="🔍" style={styles.searchBtn}
        />

        <TouchableOpacity style={styles.mapLink} onPress={() => navigation.navigate('Map', { routeId:'' })}>
          <Text style={styles.mapLinkIcon}>🗺️</Text>
          <Text style={styles.mapLinkText}>Ouvrir la carte des itinéraires</Text>
          <Text style={styles.mapLinkArrow}>→</Text>
        </TouchableOpacity>

        <View style={{ height:32 }} />
      </ScrollView>
    </View>
  );
}

function SuggestionList({ items, onSelect }: { items: GeocodingResult[]; onSelect:(i:GeocodingResult)=>void }) {
  return (
    <View style={sug.container}>
      {items.map((item, i) => (
        <TouchableOpacity key={i} style={[sug.item, i<items.length-1 && sug.border]} onPress={() => onSelect(item)}>
          <Text style={sug.pin}>📍</Text>
          <View style={sug.textWrap}>
            <Text style={sug.name} numberOfLines={1}>{item.shortName}</Text>
            <Text style={sug.full} numberOfLines={1}>{item.displayName}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const sug = StyleSheet.create({
  container:{ backgroundColor:'#0C1523', borderRadius:12, marginTop:6, marginLeft:28, borderWidth:1, borderColor:COLORS.border, overflow:'hidden' },
  item:     { flexDirection:'row', alignItems:'center', padding:12, gap:10 },
  border:   { borderBottomWidth:1, borderBottomColor:COLORS.border },
  pin:      { fontSize:14 },
  textWrap: { flex:1 },
  name:     { color:COLORS.textPrimary, fontSize:14, fontWeight:'600' },
  full:     { color:COLORS.textSecondary, fontSize:11, marginTop:2 },
});

const styles = StyleSheet.create({
  root:    { flex:1, backgroundColor:COLORS.bg },
  header:  { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal:20, paddingTop:58, paddingBottom:16 },
  greeting:{ fontSize:22, fontWeight:'800', color:COLORS.textPrimary },
  subtitle:{ color:COLORS.textSecondary, fontSize:13, marginTop:3 },
  avatarBtn:{ width:44, height:44, borderRadius:22, backgroundColor:COLORS.blue, alignItems:'center', justifyContent:'center' },
  avatarText:{ color:'#fff', fontSize:18, fontWeight:'700' },
  scroll:  { flex:1, paddingHorizontal:16 },
  contextBar:{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', backgroundColor:COLORS.surface, borderRadius:14, padding:12, marginBottom:14, borderWidth:1, borderColor:COLORS.border },
  ctxItem: { flexDirection:'row', alignItems:'center', gap:5 },
  ctxIcon: { fontSize:14 },
  ctxText: { color:COLORS.textSecondary, fontSize:11, fontWeight:'500' },
  trafficDot:{ width:8, height:8, borderRadius:4 },
  searchCard:{ marginBottom:14 },
  inputRow:  { flexDirection:'row', alignItems:'center', gap:8 },
  dot:       { width:12, height:12, borderRadius:6, flexShrink:0 },
  inputWrap: { flex:1, flexDirection:'row', alignItems:'center', gap:8 },
  input:     { flex:1, color:COLORS.textPrimary, fontSize:15, paddingVertical:12, borderBottomWidth:1, borderBottomColor:COLORS.border },
  confirmed: { fontSize:14 },
  iconBtn:   { width:34, height:34, borderRadius:17, backgroundColor:COLORS.surfaceAlt, alignItems:'center', justifyContent:'center', borderWidth:1, borderColor:COLORS.border },
  iconBtnText:{ fontSize:16 },
  divRow:    { flexDirection:'row', alignItems:'center', marginVertical:6, gap:12 },
  divLine:   { flex:1, height:1, backgroundColor:COLORS.border },
  swapBtn:   { width:34, height:34, borderRadius:17, backgroundColor:COLORS.surfaceAlt, alignItems:'center', justifyContent:'center', borderWidth:1, borderColor:COLORS.border },
  swapIcon:  { color:COLORS.textSecondary, fontSize:17 },
  errorBox:  { backgroundColor:'#EF444415', borderRadius:12, padding:12, marginBottom:14, borderWidth:1, borderColor:'#EF444430' },
  errorText: { color:'#EF4444', fontSize:13 },
  sectionTitle:{ marginTop:4 },
  priorityRow: { flexDirection:'row', gap:10, marginBottom:20 },
  priorityCard:{ flex:1, backgroundColor:COLORS.surface, borderRadius:16, padding:12, borderWidth:2, borderColor:COLORS.border, position:'relative', gap:4 },
  priorityIcon:{ fontSize:22 },
  priorityLabel:{ color:COLORS.textPrimary, fontSize:13, fontWeight:'700' },
  priorityDesc: { color:COLORS.textSecondary, fontSize:10, lineHeight:14 },
  checkBadge:   { position:'absolute', top:8, right:8, width:18, height:18, borderRadius:9, alignItems:'center', justifyContent:'center' },
  checkText:    { color:'#fff', fontSize:10, fontWeight:'800' },
  transportHeader:{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:12 },
  clearText:    { color:COLORS.blue, fontSize:12, fontWeight:'600' },
  transportGrid:{ flexDirection:'row', flexWrap:'wrap', gap:10, marginBottom:12 },
  transportChip:{ flexDirection:'row', alignItems:'center', gap:8, backgroundColor:COLORS.surface, borderRadius:14, paddingHorizontal:14, paddingVertical:10, borderWidth:2, borderColor:COLORS.border },
  transportIcon:{ fontSize:20 },
  transportLabel:{ color:COLORS.textSecondary, fontSize:13, fontWeight:'600' },
  transportCheck:{ fontSize:14, fontWeight:'800' },
  selectionNote: { backgroundColor:COLORS.surfaceAlt, borderRadius:12, padding:10, marginBottom:14 },
  selectionNoteText:{ color:COLORS.textSecondary, fontSize:12 },
  searchBtn:    { marginBottom:12 },
  mapLink:      { flexDirection:'row', alignItems:'center', gap:10, backgroundColor:COLORS.surface, borderRadius:16, padding:16, borderWidth:1, borderColor:COLORS.border },
  mapLinkIcon:  { fontSize:20 },
  mapLinkText:  { flex:1, color:COLORS.textSecondary, fontSize:14, fontWeight:'500' },
  mapLinkArrow: { color:COLORS.blue, fontSize:18, fontWeight:'700' },
});
