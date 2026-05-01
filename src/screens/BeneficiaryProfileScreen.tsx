import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../navigation/RootNavigator';
import { createBeneficiaryModule, type Beneficiary } from '../modules/beneficiary/BeneficiaryModule';
import { supabase } from '../lib/supabase';

const beneficiaryModule = createBeneficiaryModule(supabase);

type Props = NativeStackScreenProps<AppStackParamList, 'BeneficiaryProfile'> & {
  navigation: NativeStackScreenProps<AppStackParamList, 'BeneficiaryProfile'>['navigation'];
};

export function BeneficiaryProfileScreen({ route, navigation }: Props) {
  const { id } = route.params;
  const [profile, setProfile] = useState<Beneficiary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    beneficiaryModule.getProfile(id)
      .then(setProfile)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <ActivityIndicator style={styles.center} />;
  if (error || !profile) return <Text style={styles.error}>{error || 'Not found.'}</Text>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.name}>{profile.name}</Text>
      <Text style={styles.village}>{profile.village_name}</Text>
      <TouchableOpacity
        style={styles.recordBtn}
        onPress={() => navigation.navigate('Recording', { beneficiaryId: profile.id, beneficiaryName: profile.name })}
      >
        <Text style={styles.recordBtnText}>Record Observation</Text>
      </TouchableOpacity>

      <Section title="Profile">
        <Row label="Age" value={String(profile.age)} />
        <Row label="Family size" value={String(profile.family_size)} />
        <Row label="Phone" value={profile.phone_number} />
        {profile.shg_name && <Row label="SHG" value={profile.shg_name} />}
      </Section>

      <Section title="Baselines">
        <Row label="Income" value={`₹${profile.baseline_income.toLocaleString()}`} />
        <Row label="Savings" value={`₹${profile.baseline_savings.toLocaleString()}`} />
        <Row label="Non-livestock assets" value={`₹${profile.baseline_non_livestock_assets.toLocaleString()}`} />
        <Row label="Goat value per head" value={`₹${profile.goat_value_per_head.toLocaleString()}`} />
      </Section>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16 },
  center: { flex: 1 },
  name: { fontSize: 24, fontWeight: '700' },
  village: { fontSize: 16, color: '#666', marginTop: 4, marginBottom: 24 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#999', textTransform: 'uppercase', marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  label: { fontSize: 15, color: '#333' },
  value: { fontSize: 15, fontWeight: '500' },
  error: { color: '#d00', margin: 16 },
  recordBtn: { marginTop: 24, backgroundColor: '#ef4444', borderRadius: 8, padding: 16, alignItems: 'center' },
  recordBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
