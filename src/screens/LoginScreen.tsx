import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../hooks';
import { PrimaryButton } from '../components';
import { COLORS } from '../constants';
import { RootStackParamList } from '../types';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList,'Login'> };

export default function LoginScreen({ navigation }: Props) {
  const { login, register, loginAsGuest, loading, error } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async () => {
    const ok = isLogin ? await login(email, password) : await register(name, email, password);
    if (ok) navigation.replace('Home');
  };

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS==='ios'?'padding':'height'}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Logo */}
        <View style={s.logoWrap}>
          <View style={s.logoCircle}>
            <Text style={s.logoEmoji}>🗺️</Text>
          </View>
          <Text style={s.logoText}>UrbanRoute</Text>
          <Text style={s.logoTag}>Mobilité urbaine — Maroc</Text>
        </View>

        {/* Card */}
        <View style={s.card}>
          <View style={s.tabs}>
            {(['Connexion','Inscription'] as const).map((tab,i) => {
              const active = (tab==='Connexion')===isLogin;
              return (
                <TouchableOpacity key={tab} style={[s.tab,active&&s.tabActive]} onPress={() => setIsLogin(i===0)}>
                  <Text style={[s.tabText,active&&s.tabTextActive]}>{tab}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {!isLogin && <Field label="Nom complet" placeholder="ex: Ahmed Benali" value={name} onChange={setName} />}
          <Field label="Adresse email" placeholder="exemple@email.com" value={email} onChange={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <Field label="Mot de passe" placeholder="••••••••" value={password} onChange={setPassword} secure />

          {error && <View style={s.errorBox}><Text style={s.errorText}>⚠️ {error}</Text></View>}

          <PrimaryButton label={isLogin?'Se connecter':'Créer mon compte'} onPress={handleSubmit}
            loading={loading} icon={isLogin?'🔑':'✨'} style={s.submitBtn} />

          <View style={s.divRow}>
            <View style={s.divLine}/><Text style={s.divText}>ou</Text><View style={s.divLine}/>
          </View>

          <TouchableOpacity style={s.guestBtn} onPress={() => { loginAsGuest(); navigation.replace('Home'); }}>
            <Text style={s.guestText}>Continuer sans compte →</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.footer}>PFA Génie Informatique 4ème Année — 2026</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, placeholder, value, onChange, keyboardType, autoCapitalize, secure }: any) {
  return (
    <View style={fi.wrap}>
      <Text style={fi.label}>{label}</Text>
      <TextInput style={fi.input} placeholder={placeholder} placeholderTextColor={COLORS.textMuted}
        value={value} onChangeText={onChange} keyboardType={keyboardType}
        autoCapitalize={autoCapitalize??'sentences'} secureTextEntry={secure}/>
    </View>
  );
}

const fi = StyleSheet.create({
  wrap:  {marginBottom:14},
  label: {color:COLORS.textSecondary,fontSize:12,fontWeight:'600',marginBottom:6},
  input: {backgroundColor:COLORS.surface,borderRadius:10,padding:13,color:COLORS.textPrimary,fontSize:15,borderWidth:0.5,borderColor:COLORS.border},
});

const s = StyleSheet.create({
  root:    {flex:1,backgroundColor:COLORS.bg},
  scroll:  {flexGrow:1,justifyContent:'center',paddingHorizontal:24,paddingVertical:40},
  logoWrap:{alignItems:'center',marginBottom:32},
  logoCircle:{width:76,height:76,borderRadius:38,backgroundColor:COLORS.blueBg,alignItems:'center',justifyContent:'center',marginBottom:12,borderWidth:1,borderColor:COLORS.blue+'44'},
  logoEmoji: {fontSize:38},
  logoText:  {fontSize:28,fontWeight:'800',color:COLORS.textPrimary},
  logoTag:   {color:COLORS.textSecondary,fontSize:13,marginTop:5},
  card:      {backgroundColor:COLORS.cardBg,borderRadius:20,padding:20,borderWidth:0.5,borderColor:COLORS.border},
  tabs:      {flexDirection:'row',backgroundColor:COLORS.surface,borderRadius:12,padding:3,marginBottom:18},
  tab:       {flex:1,paddingVertical:9,alignItems:'center',borderRadius:10},
  tabActive: {backgroundColor:COLORS.blue},
  tabText:   {color:COLORS.textSecondary,fontWeight:'600',fontSize:14},
  tabTextActive:{color:'#fff'},
  errorBox:  {backgroundColor:'#FFEBEE',borderRadius:10,padding:10,marginBottom:10},
  errorText: {color:COLORS.danger,fontSize:13},
  submitBtn: {marginTop:4,marginBottom:4},
  divRow:    {flexDirection:'row',alignItems:'center',marginVertical:14,gap:10},
  divLine:   {flex:1,height:0.5,backgroundColor:COLORS.border},
  divText:   {color:COLORS.textMuted,fontSize:13},
  guestBtn:  {alignItems:'center',paddingVertical:8},
  guestText: {color:COLORS.blue,fontSize:14,fontWeight:'600'},
  footer:    {color:COLORS.textMuted,fontSize:11,textAlign:'center',marginTop:20},
});
