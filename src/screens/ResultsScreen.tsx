import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../hooks';
import { RouteStatRow, SegmentTimeline, Badge, EmptyState } from '../components';
import { COLORS, PRIORITY_CONFIG, TRANSPORT_CONFIG } from '../constants';
import { RouteOption, RootStackParamList } from '../types';
import { formatDuration } from '../utils';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList,'Results'> };

export default function ResultsScreen({ navigation }: Props) {
  const { state, dispatch } = useAppContext();
  const { saveTripToHistory } = useAuth();
  const [expanded, setExpanded] = useState<string|null>(state.selectedPriority);

  const handleSelect = (route: RouteOption) => {
    dispatch({ type:'SET_SELECTED_ROUTE', payload:route });
    saveTripToHistory();
    navigation.navigate('Map', { routeId:route.id });
  };

  if (state.isCalculating) return <CalculatingOverlay />;

  // Sépare les trains des autres routes pour les mettre en évidence
  const trainRoutes  = state.routes.filter(r => r.id === 'train');
  const urbanRoutes  = state.routes.filter(r => r.id !== 'train');

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Itinéraires</Text>
          <Text style={styles.headerSub} numberOfLines={1}>
            {state.departure?.shortName} → {state.destination?.shortName}
          </Text>
        </View>
        <TouchableOpacity style={styles.mapBtn} onPress={() => navigation.navigate('Map',{routeId:state.selectedRoute?.id??''})}>
          <Text style={styles.mapBtnIcon}>🗺️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Contexte trafic + météo */}
        {state.traffic && (
          <View style={styles.contextRow}>
            <View style={[styles.trafficDot,{backgroundColor:state.traffic.color}]}/>
            <Text style={styles.contextText}>{state.traffic.label}</Text>
            {state.weather && (
              <Text style={styles.contextText}> · {state.weather.icon} {state.weather.temp}°C
                {state.weather.isRainy ? ' · ⚠️ Évitez le vélo' : ''}</Text>
            )}
          </View>
        )}

        {/* Train ONCF en premier si disponible */}
        {trainRoutes.length > 0 && (
          <>
            <View style={styles.sectionLabel}>
              <Text style={styles.sectionLabelText}>🚂 Train ONCF disponible</Text>
            </View>
            {trainRoutes.map(r => (
              <RouteCard key={r.id} route={r}
                isExpanded={expanded===r.id}
                onToggle={() => setExpanded(expanded===r.id?null:r.id)}
                onSelect={() => handleSelect(r)}
                selectedPriority={state.selectedPriority}
              />
            ))}
          </>
        )}

        {/* Itinéraires urbains */}
        {urbanRoutes.length > 0 && (
          <>
            {trainRoutes.length > 0 && (
              <View style={styles.sectionLabel}>
                <Text style={styles.sectionLabelText}>🏙️ Itinéraires urbains</Text>
              </View>
            )}
            {urbanRoutes.map(r => (
              <RouteCard key={r.id} route={r}
                isExpanded={expanded===r.id}
                onToggle={() => setExpanded(expanded===r.id?null:r.id)}
                onSelect={() => handleSelect(r)}
                selectedPriority={state.selectedPriority}
              />
            ))}
          </>
        )}

        {state.routes.length === 0 && (
          <EmptyState icon="😕" title="Aucun itinéraire trouvé" subtitle="Vérifiez les points de départ et d'arrivée" />
        )}

        {/* Note score */}
        {state.routes.length > 0 && (
          <View style={styles.scoreNote}>
            <Text style={styles.scoreNoteText}>
              Score calculé avec pondération {PRIORITY_CONFIG[state.selectedPriority].label.toLowerCase()} :
              temps×{PRIORITY_CONFIG[state.selectedPriority].scoreWeights.time} + 
              coût×{PRIORITY_CONFIG[state.selectedPriority].scoreWeights.cost} + 
              distance×{PRIORITY_CONFIG[state.selectedPriority].scoreWeights.distance}
            </Text>
          </View>
        )}
        <View style={{height:40}}/>
      </ScrollView>
    </View>
  );
}

function RouteCard({ route, isExpanded, onToggle, onSelect, selectedPriority }: any) {
  const isTrain = route.id === 'train';
  const conf    = isTrain
    ? { color:TRANSPORT_CONFIG.train.color, bgColor:'#FFEBEE', icon:'🚂' }
    : PRIORITY_CONFIG[route.type];
  const isRec   = route.isRecommended || (!isTrain && route.type === selectedPriority);

  return (
    <View style={[styles.card, {borderColor:isRec?conf.color:COLORS.border}, isRec&&styles.cardRec]}>
      <TouchableOpacity style={styles.cardHeader} onPress={onToggle} activeOpacity={0.8}>
        <View style={[styles.iconWrap,{backgroundColor:conf.color+'22'}]}>
          <Text style={styles.routeIcon}>{conf.icon}</Text>
        </View>
        <View style={styles.cardHeaderText}>
          <View style={styles.cardTitleRow}>
            <Text style={[styles.cardTitle,{color:conf.color}]}>{route.label}</Text>
            {isTrain && <View style={[styles.oncfBadge]}>
              <Text style={styles.oncfBadgeText}>ONCF</Text>
            </View>}
            {isRec && !isTrain && <View style={[styles.recBadge,{backgroundColor:conf.color}]}>
              <Text style={styles.recBadgeText}>Recommandé</Text>
            </View>}
          </View>
          <Text style={styles.cardSub}>
            {formatDuration(route.duration)} · {route.distance} km · {route.cost} MAD
          </Text>
          {isTrain && (
            <Text style={styles.trainNote}>2e classe · Prix officiel ONCF 2026</Text>
          )}
        </View>
        <View style={[styles.scoreWrap,{borderColor:conf.color}]}>
          <Text style={[styles.scoreVal,{color:conf.color}]}>{route.score}</Text>
          <Text style={styles.scoreLbl}>score</Text>
        </View>
        <Text style={[styles.chevron,isExpanded&&styles.chevronOpen]}>›</Text>
      </TouchableOpacity>

      <RouteStatRow duration={route.duration} cost={route.cost} distance={route.distance} color={conf.color}/>

      {isExpanded && (
        <View style={styles.expandedSection}>
          <Text style={styles.expandedTitle}>Détail du trajet</Text>
          <SegmentTimeline segments={route.segments}/>
          {isTrain && (
            <View style={styles.trainInfo}>
              <Text style={styles.trainInfoText}>
                1re classe disponible : {route.cost * 1.6} MAD · Réservation sur oncf-voyages.ma
              </Text>
            </View>
          )}
        </View>
      )}

      <TouchableOpacity style={[styles.ctaBtn,{backgroundColor:conf.color}]} onPress={onSelect} activeOpacity={0.85}>
        <Text style={styles.ctaText}>Voir sur la carte →</Text>
      </TouchableOpacity>
    </View>
  );
}

function CalculatingOverlay() {
  return (
    <View style={styles.calcOverlay}>
      <View style={styles.calcBox}>
        <Text style={styles.calcIcon}>⏳</Text>
      </View>
      <Text style={styles.calcTitle}>Calcul en cours</Text>
      <Text style={styles.calcSub}>Optimisation multi-critères</Text>
      <View style={styles.calcSteps}>
        {['🗺️ OpenRouteService…','🌤️ Open-Meteo…','🚂 ONCF…','⚡ Calcul des scores…'].map((s,i) => (
          <Text key={i} style={styles.calcStep}>{s}</Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:   {flex:1,backgroundColor:COLORS.bg},
  header: {flexDirection:'row',alignItems:'center',gap:10,paddingHorizontal:16,paddingTop:56,paddingBottom:14,backgroundColor:COLORS.bg,borderBottomWidth:0.5,borderBottomColor:COLORS.border},
  backBtn:{width:40,height:40,borderRadius:20,backgroundColor:COLORS.surface,alignItems:'center',justifyContent:'center',borderWidth:0.5,borderColor:COLORS.border},
  backIcon:{color:COLORS.textPrimary,fontSize:20,fontWeight:'600'},
  headerCenter:{flex:1},
  headerTitle:{color:COLORS.textPrimary,fontSize:20,fontWeight:'800'},
  headerSub:{color:COLORS.textSecondary,fontSize:12,marginTop:2},
  mapBtn:{width:40,height:40,borderRadius:20,backgroundColor:COLORS.surface,alignItems:'center',justifyContent:'center',borderWidth:0.5,borderColor:COLORS.border},
  mapBtnIcon:{fontSize:20},
  scroll:{flex:1,paddingHorizontal:16},
  contextRow:{flexDirection:'row',alignItems:'center',flexWrap:'wrap',gap:6,backgroundColor:COLORS.surface,borderRadius:10,padding:10,marginTop:12,marginBottom:4,borderWidth:0.5,borderColor:COLORS.border},
  trafficDot:{width:8,height:8,borderRadius:4},
  contextText:{color:COLORS.textSecondary,fontSize:12,fontWeight:'500'},
  sectionLabel:{flexDirection:'row',alignItems:'center',marginTop:14,marginBottom:8},
  sectionLabelText:{color:COLORS.textSecondary,fontSize:12,fontWeight:'600',textTransform:'uppercase',letterSpacing:0.5},
  card:{backgroundColor:COLORS.cardBg,borderRadius:16,padding:14,marginBottom:12,borderWidth:1.5,gap:10},
  cardRec:{shadowColor:'#1A73E8',shadowOpacity:0.1,shadowRadius:12,elevation:4},
  cardHeader:{flexDirection:'row',alignItems:'center',gap:10},
  iconWrap:{width:44,height:44,borderRadius:22,alignItems:'center',justifyContent:'center'},
  routeIcon:{fontSize:22},
  cardHeaderText:{flex:1},
  cardTitleRow:{flexDirection:'row',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:3},
  cardTitle:{fontSize:15,fontWeight:'700'},
  cardSub:{color:COLORS.textSecondary,fontSize:12},
  trainNote:{color:COLORS.textMuted,fontSize:10,marginTop:2},
  oncfBadge:{backgroundColor:'#FFEBEE',borderRadius:5,paddingHorizontal:6,paddingVertical:2},
  oncfBadgeText:{color:'#C62828',fontSize:10,fontWeight:'700'},
  recBadge:{borderRadius:5,paddingHorizontal:6,paddingVertical:2},
  recBadgeText:{color:'#fff',fontSize:10,fontWeight:'700'},
  scoreWrap:{width:44,height:44,borderRadius:22,borderWidth:1.5,alignItems:'center',justifyContent:'center'},
  scoreVal:{fontSize:13,fontWeight:'800'},
  scoreLbl:{color:COLORS.textMuted,fontSize:9},
  chevron:{color:COLORS.textMuted,fontSize:24,transform:[{rotate:'90deg'}]},
  chevronOpen:{transform:[{rotate:'-90deg'}]},
  expandedSection:{backgroundColor:COLORS.surface,borderRadius:12,padding:12,gap:10},
  expandedTitle:{color:COLORS.textSecondary,fontSize:11,fontWeight:'700',textTransform:'uppercase',letterSpacing:0.8},
  trainInfo:{backgroundColor:'#FFF8E1',borderRadius:8,padding:10,borderWidth:0.5,borderColor:'#F9A825'},
  trainInfoText:{color:'#7B6108',fontSize:12},
  ctaBtn:{borderRadius:12,padding:13,alignItems:'center'},
  ctaText:{color:'#fff',fontWeight:'700',fontSize:14},
  scoreNote:{backgroundColor:COLORS.surface,borderRadius:10,padding:10,marginBottom:8,borderWidth:0.5,borderColor:COLORS.border},
  scoreNoteText:{color:COLORS.textMuted,fontSize:11,lineHeight:16},
  calcOverlay:{flex:1,backgroundColor:COLORS.bg,alignItems:'center',justifyContent:'center',padding:32,gap:8},
  calcBox:{width:70,height:70,borderRadius:35,backgroundColor:COLORS.surface,alignItems:'center',justifyContent:'center',marginBottom:12,borderWidth:0.5,borderColor:COLORS.border},
  calcIcon:{fontSize:32},
  calcTitle:{color:COLORS.textPrimary,fontSize:20,fontWeight:'800'},
  calcSub:{color:COLORS.textSecondary,fontSize:14},
  calcSteps:{gap:6,marginTop:12},
  calcStep:{color:COLORS.textMuted,fontSize:13,textAlign:'center'},
});
