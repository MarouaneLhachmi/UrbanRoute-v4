import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { COLORS, TRANSPORT_CONFIG } from '../constants';
import { formatDuration, formatDistance, formatCost } from '../utils';
import { RouteSegment } from '../types';

export function Badge({ label, color, size='sm', style }: { label:string; color:string; size?:'sm'|'md'; style?:ViewStyle }) {
  const p = size==='sm' ? {px:7,py:2,fs:11} : {px:11,py:4,fs:13};
  return (
    <View style={[{backgroundColor:color+'22',borderRadius:6,paddingHorizontal:p.px,paddingVertical:p.py,alignSelf:'flex-start'},style]}>
      <Text style={{color,fontSize:p.fs,fontWeight:'700'}}>{label}</Text>
    </View>
  );
}

export function PrimaryButton({ label, onPress, loading, disabled, icon, color=COLORS.blue, style }: any) {
  return (
    <TouchableOpacity
      style={[{flexDirection:'row',alignItems:'center',justifyContent:'center',borderRadius:14,paddingVertical:15,paddingHorizontal:24,gap:8,backgroundColor:color},(disabled||loading)&&{opacity:0.5},style]}
      onPress={onPress} disabled={disabled||loading} activeOpacity={0.85}
    >
      {loading
        ? <ActivityIndicator color="#fff" size="small"/>
        : <>{icon && <Text style={{fontSize:17}}>{icon}</Text>}<Text style={{color:'#fff',fontSize:15,fontWeight:'700'}}>{label}</Text></>
      }
    </TouchableOpacity>
  );
}

export function SectionTitle({ children, style }: { children:string; style?:TextStyle }) {
  return <Text style={[{color:COLORS.textMuted,fontSize:11,fontWeight:'700',textTransform:'uppercase',letterSpacing:0.8,marginBottom:10},style]}>{children}</Text>;
}

export function RouteStatRow({ duration, cost, distance, color }: { duration:number; cost:number; distance:number; color:string }) {
  return (
    <View style={st.statRow}>
      <StatBox icon="⏱️" value={formatDuration(duration)} label="Durée"    color={color}/>
      <View style={st.statDiv}/>
      <StatBox icon="💵" value={formatCost(cost)}          label="Coût"     color={color}/>
      <View style={st.statDiv}/>
      <StatBox icon="📏" value={formatDistance(distance)}  label="Distance" color={color}/>
    </View>
  );
}

function StatBox({ icon, value, label, color }: any) {
  return (
    <View style={st.statBox}>
      <Text style={{fontSize:16}}>{icon}</Text>
      <Text style={[st.statVal,{color}]}>{value}</Text>
      <Text style={st.statLbl}>{label}</Text>
    </View>
  );
}

export function SegmentTimeline({ segments }: { segments:RouteSegment[] }) {
  return (
    <View style={{gap:0}}>
      {segments.map((seg,i) => {
        const conf = TRANSPORT_CONFIG[seg.mode];
        const last = i===segments.length-1;
        return (
          <View key={i} style={{flexDirection:'row',gap:10}}>
            <View style={{alignItems:'center',width:16,paddingTop:3}}>
              <View style={{width:12,height:12,borderRadius:6,backgroundColor:conf.color}}/>
              {!last && <View style={{width:2,flex:1,marginTop:3,minHeight:20,backgroundColor:conf.color+'40'}}/>}
            </View>
            <View style={{flex:1,paddingBottom:last?0:12}}>
              <View style={{flexDirection:'row',alignItems:'center',flexWrap:'wrap',gap:6,marginBottom:3}}>
                <Text style={{fontSize:13}}>{conf.icon}</Text>
                <Text style={{color:conf.color,fontSize:13,fontWeight:'700'}}>{conf.label}</Text>
                {seg.line && <Badge label={seg.line} color={conf.color}/>}
                <Text style={{color:COLORS.textSecondary,fontSize:12}}>{formatDuration(seg.duration)}</Text>
                {seg.cost>0 && <Text style={{color:COLORS.warning,fontSize:12,fontWeight:'600'}}>{seg.cost} MAD</Text>}
              </View>
              <Text style={{color:COLORS.textPrimary,fontSize:12,lineHeight:17}}>{seg.instruction}</Text>
              <Text style={{color:COLORS.textMuted,fontSize:11,marginTop:2}}>{formatDistance(seg.distance)}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

export function EmptyState({ icon, title, subtitle }: { icon:string; title:string; subtitle?:string }) {
  return (
    <View style={{alignItems:'center',paddingVertical:48,gap:10}}>
      <Text style={{fontSize:44}}>{icon}</Text>
      <Text style={{color:COLORS.textPrimary,fontSize:17,fontWeight:'700'}}>{title}</Text>
      {subtitle && <Text style={{color:COLORS.textSecondary,fontSize:14,textAlign:'center'}}>{subtitle}</Text>}
    </View>
  );
}

export function Card({ children, style }: { children:React.ReactNode; style?:ViewStyle }) {
  return <View style={[{backgroundColor:COLORS.cardBg,borderRadius:16,padding:14,borderWidth:0.5,borderColor:COLORS.border},style]}>{children}</View>;
}

const st = StyleSheet.create({
  statRow:{flexDirection:'row',alignItems:'center',backgroundColor:COLORS.surface,borderRadius:12,padding:12,gap:6},
  statBox:{flex:1,alignItems:'center',gap:3},
  statDiv:{width:0.5,height:28,backgroundColor:COLORS.border},
  statVal:{fontSize:13,fontWeight:'700'},
  statLbl:{color:COLORS.textMuted,fontSize:10},
});
