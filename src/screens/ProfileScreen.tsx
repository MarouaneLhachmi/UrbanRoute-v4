import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../hooks';
import { useAppContext } from '../context/AppContext';
import { Card, SectionTitle, EmptyState, Badge } from '../components';
import { COLORS, PRIORITY_CONFIG } from '../constants';
import { computeHistoryStats, formatDate, formatDuration, formatDistance, getInitials } from '../utils';
import { RootStackParamList } from '../types';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Profile'> };

export default function ProfileScreen({ navigation }: Props) {
  const { user, logout } = useAuth();
  const { state } = useAppContext();

  const stats = computeHistoryStats(user?.history ?? []);

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Voulez-vous vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnecter',
          style: 'destructive',
          onPress: () => { logout(); navigation.replace('Login'); },
        },
      ]
    );
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mon Profil</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Avatar + Info */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{getInitials(user?.name ?? '?')}</Text>
          </View>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <Badge
            label={`Priorité: ${PRIORITY_CONFIG[user?.preferences.defaultPriority ?? 'equilibre'].icon} ${PRIORITY_CONFIG[user?.preferences.defaultPriority ?? 'equilibre'].label}`}
            color={COLORS.blue}
            size="md"
            style={{ marginTop: 8 }}
          />
        </View>

        {/* Stats */}
        <SectionTitle>Statistiques</SectionTitle>
        <View style={styles.statsGrid}>
          {[
            { icon: '🗺️', value: stats.totalTrips.toString(),            label: 'Trajets' },
            { icon: '📏', value: `${stats.totalDistance} km`,             label: 'Distance' },
            { icon: '💰', value: `${stats.totalCost} MAD`,               label: 'Dépensé' },
            { icon: '🌍', value: `${stats.co2Saved} kg`,                 label: 'CO₂ économisé' },
          ].map((s, i) => (
            <Card key={i} style={styles.statCard}>
              <Text style={styles.statCardIcon}>{s.icon}</Text>
              <Text style={styles.statCardValue}>{s.value}</Text>
              <Text style={styles.statCardLabel}>{s.label}</Text>
            </Card>
          ))}
        </View>

        {/* Trip History */}
        <SectionTitle>Historique des trajets</SectionTitle>
        {user?.history && user.history.length > 0 ? (
          user.history.slice(0, 10).map(trip => {
            const conf = PRIORITY_CONFIG[trip.priority];
            return (
              <Card key={trip.id} style={styles.historyCard}>
                <View style={styles.historyHeader}>
                  <Text style={styles.historyIcon}>{conf.icon}</Text>
                  <View style={styles.historyInfo}>
                    <Text style={styles.historyRoute} numberOfLines={1}>
                      {trip.departure} → {trip.destination}
                    </Text>
                    <Text style={styles.historyDate}>{formatDate(trip.date)}</Text>
                  </View>
                  <Badge label={conf.label} color={conf.color} />
                </View>
                <View style={styles.historyStats}>
                  <Text style={styles.historyStat}>⏱️ {formatDuration(trip.duration)}</Text>
                  <Text style={styles.historyStat}>💵 {trip.cost} MAD</Text>
                  <Text style={styles.historyStat}>📏 {formatDistance(trip.distance)}</Text>
                </View>
              </Card>
            );
          })
        ) : (
          <EmptyState
            icon="🗺️"
            title="Aucun trajet effectué"
            subtitle="Lancez votre premier calcul d'itinéraire"
          />
        )}

        {/* APIs status */}
        <SectionTitle>APIs intégrées</SectionTitle>
        <Card>
          {[
            { name: 'OpenRouteService', role: 'Calcul d\'itinéraires (pied, vélo, voiture)', status: '🟢', free: '2000 req/j' },
            { name: 'Nominatim (OSM)', role: 'Géocodage & autocomplétion d\'adresses',       status: '🟢', free: 'Illimité' },
            { name: 'Open-Meteo',       role: 'Météo en temps réel (sans clé API)',          status: '🟢', free: 'Illimité' },
            { name: 'Leaflet + CartoDB',role: 'Carte interactive sombre (WebView)',           status: '🟢', free: 'Open source' },
          ].map((api, i, arr) => (
            <View key={i}>
              <View style={styles.apiRow}>
                <Text style={styles.apiStatus}>{api.status}</Text>
                <View style={styles.apiInfo}>
                  <Text style={styles.apiName}>{api.name}</Text>
                  <Text style={styles.apiRole}>{api.role}</Text>
                </View>
                <Text style={styles.apiFree}>{api.free}</Text>
              </View>
              {i < arr.length - 1 && <View style={styles.apiDivider} />}
            </View>
          ))}
        </Card>

        {/* App info */}
        <Card style={styles.appInfoCard}>
          <Text style={styles.appInfoTitle}>UrbanRoute — PFA 4ème Année</Text>
          <Text style={styles.appInfoText}>
            Application mobile de mobilité urbaine avec optimisation multi-critères des trajets.
            Calcul basé sur l'algorithme de scoring pondéré (temps × w₁ + coût × w₂ + distance × w₃).
          </Text>
          <Text style={styles.appInfoVersion}>v1.0.0 · Génie Informatique</Text>
        </Card>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 14,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.surface,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border,
  },
  backIcon: { color: COLORS.textPrimary, fontSize: 20 },
  headerTitle: { color: COLORS.textPrimary, fontSize: 20, fontWeight: '800' },
  scroll: { flex: 1, paddingHorizontal: 16 },
  avatarSection: { alignItems: 'center', paddingVertical: 28 },
  avatarCircle: {
    width: 84, height: 84, borderRadius: 42, backgroundColor: COLORS.blue,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
    borderWidth: 2, borderColor: COLORS.blueLight,
  },
  avatarText:  { color: '#fff', fontSize: 30, fontWeight: '800' },
  userName:    { color: COLORS.textPrimary, fontSize: 22, fontWeight: '800' },
  userEmail:   { color: COLORS.textSecondary, fontSize: 13, marginTop: 4 },
  statsGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  statCard:    { flex: 1, minWidth: '45%', alignItems: 'center', gap: 6, padding: 14 },
  statCardIcon:  { fontSize: 26 },
  statCardValue: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '800' },
  statCardLabel: { color: COLORS.textMuted, fontSize: 11 },
  historyCard: { marginBottom: 10, gap: 10 },
  historyHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  historyIcon:   { fontSize: 20 },
  historyInfo:   { flex: 1 },
  historyRoute:  { color: COLORS.textPrimary, fontSize: 14, fontWeight: '600' },
  historyDate:   { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  historyStats:  { flexDirection: 'row', gap: 14 },
  historyStat:   { color: COLORS.textSecondary, fontSize: 12 },
  apiRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  apiStatus:  { fontSize: 16 },
  apiInfo:    { flex: 1 },
  apiName:    { color: COLORS.textPrimary, fontSize: 14, fontWeight: '600' },
  apiRole:    { color: COLORS.textSecondary, fontSize: 11, marginTop: 2 },
  apiFree:    { color: COLORS.success, fontSize: 11, fontWeight: '600' },
  apiDivider: { height: 1, backgroundColor: COLORS.border },
  appInfoCard: { marginTop: 4, marginBottom: 4, gap: 8 },
  appInfoTitle: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '700' },
  appInfoText:  { color: COLORS.textSecondary, fontSize: 13, lineHeight: 20 },
  appInfoVersion: { color: COLORS.textMuted, fontSize: 11 },
  logoutBtn: {
    backgroundColor: COLORS.danger, borderRadius: 16, padding: 16,
    alignItems: 'center', marginTop: 16, marginBottom: 8,
  },
  logoutText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
