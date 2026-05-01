import React, { useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { createBeneficiaryUpdateModule } from '../modules/update/BeneficiaryUpdateModule';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import type { AppStackParamList } from '../navigation/RootNavigator';

type Nav = NativeStackNavigationProp<AppStackParamList>;
type Route = RouteProp<AppStackParamList, 'Confirmation'>;

const TRACK_LABELS: Record<string, string> = {
  vegetable_cultivation: 'vegetable cultivation',
  goat_rearing: 'goat rearing',
  nano_enterprise: 'nano enterprise',
};

export function ConfirmationScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { beneficiaryId, transcript, audioUri, extractionResult } = route.params;
  const { session } = useAuth();
  const updater = useMemo(() => createBeneficiaryUpdateModule(supabase), []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!session) return;
    setSaving(true);
    setError('');
    try {
      await updater.applyUpdate({
        beneficiaryId,
        workerId: session.user.id,
        result: extractionResult,
        transcript,
        audioUri,
      });
      navigation.navigate('BeneficiaryProfile', { id: beneficiaryId });
    } catch (e: any) {
      setError(e.message ?? 'Failed to save. Please try again.');
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Confirm and save</Text>
      <Text style={styles.subheading}>This will update the beneficiary record.</Text>

      {extractionResult.income_entries.map((e, i) => (
        <Text key={i} style={styles.row}>
          {`${e.livelihood_source} · ${e.type} · ₹${e.amount}`}
        </Text>
      ))}

      {extractionResult.savings_entries.map((e, i) => (
        <Text key={i} style={styles.row}>
          {`savings ${e.type} · ₹${e.amount}`}
        </Text>
      ))}

      {extractionResult.goat_events.map((e, i) => (
        <Text key={i} style={styles.row}>
          {`${e.event_type} · ${e.count} goat${e.count !== 1 ? 's' : ''}`}
        </Text>
      ))}

      {extractionResult.pop_progress.map((e, i) => (
        <Text key={i} style={styles.row}>
          {`${TRACK_LABELS[e.livelihood_track] ?? e.livelihood_track} · step ${e.step_number}`}
        </Text>
      ))}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.actions}>
        <TouchableOpacity
          testID="cancel-button"
          style={styles.cancelBtn}
          onPress={() => navigation.goBack()}
          disabled={saving}
        >
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="save-button"
          style={styles.saveBtn}
          onPress={handleSave}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.saveBtnText}>Save</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, paddingBottom: 40 },
  heading: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  subheading: { fontSize: 14, color: '#6b7280', marginBottom: 24 },
  row: { fontSize: 15, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  error: { color: '#dc2626', marginTop: 12 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 32 },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 14, alignItems: 'center' },
  cancelBtnText: { fontSize: 15, color: '#6b7280' },
  saveBtn: { flex: 2, backgroundColor: '#16a34a', borderRadius: 8, padding: 14, alignItems: 'center' },
  saveBtnText: { fontSize: 15, color: '#fff', fontWeight: '700' },
});
