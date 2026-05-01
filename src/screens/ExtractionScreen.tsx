import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { createLLMExtractionModule } from '../modules/extraction/LLMExtractionModule';
import type {
  ExtractionResult, IncomeEntry, GoatEvent, PopProgress, SavingsEntry,
} from '../modules/extraction/extractionSchema';
import { EMPTY_RESULT } from '../modules/extraction/extractionSchema';
import { anthropic } from '../lib/anthropic';
import type { AppStackParamList } from '../navigation/RootNavigator';

type Nav = NativeStackNavigationProp<AppStackParamList>;
type Route = RouteProp<AppStackParamList, 'Extraction'>;

const TRACK_LABELS: Record<string, string> = {
  vegetable_cultivation: 'vegetable cultivation',
  goat_rearing: 'goat rearing',
  nano_enterprise: 'nano enterprise',
};

export function ExtractionScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { beneficiaryId, transcript, audioUri } = route.params;

  const extractor = useMemo(() => createLLMExtractionModule(anthropic), []);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<ExtractionResult>(EMPTY_RESULT);

  useEffect(() => {
    extractor.extract(transcript)
      .then(setResult)
      .finally(() => setLoading(false));
  }, [transcript]);

  const updateIncome = (i: number, field: keyof IncomeEntry, value: string) =>
    setResult((r) => {
      const entries = [...r.income_entries];
      entries[i] = { ...entries[i], [field]: field === 'amount' ? Number(value) : value };
      return { ...r, income_entries: entries };
    });

  const updateSavings = (i: number, field: keyof SavingsEntry, value: string) =>
    setResult((r) => {
      const entries = [...r.savings_entries];
      entries[i] = { ...entries[i], [field]: field === 'amount' ? Number(value) : value };
      return { ...r, savings_entries: entries };
    });

  const updateGoat = (i: number, field: keyof GoatEvent, value: string) =>
    setResult((r) => {
      const events = [...r.goat_events];
      events[i] = { ...events[i], [field]: field === 'count' ? Number(value) : value };
      return { ...r, goat_events: events };
    });

  const updatePop = (i: number, field: keyof PopProgress, value: string) =>
    setResult((r) => {
      const entries = [...r.pop_progress];
      entries[i] = { ...entries[i], [field]: field === 'step_number' ? Number(value) : value };
      return { ...r, pop_progress: entries };
    });

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator testID="extraction-loading" size="large" />
        <Text style={styles.hint}>Extracting data…</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Review extracted data</Text>

      {result.income_entries.length > 0 && (
        <Section title="Income / Expense">
          {result.income_entries.map((entry, i) => (
            <View key={i} style={styles.card}>
              <Text style={styles.cardLabel}>{entry.livelihood_source} · {entry.type}</Text>
              <TextInput
                style={styles.numInput}
                keyboardType="numeric"
                value={String(entry.amount)}
                onChangeText={(v) => updateIncome(i, 'amount', v)}
              />
            </View>
          ))}
        </Section>
      )}

      {result.savings_entries.length > 0 && (
        <Section title="Savings">
          {result.savings_entries.map((entry, i) => (
            <View key={i} style={styles.card}>
              <Text style={styles.cardLabel}>{entry.type}</Text>
              <TextInput
                style={styles.numInput}
                keyboardType="numeric"
                value={String(entry.amount)}
                onChangeText={(v) => updateSavings(i, 'amount', v)}
              />
            </View>
          ))}
        </Section>
      )}

      {result.goat_events.length > 0 && (
        <Section title="Goat Events">
          {result.goat_events.map((event, i) => (
            <View key={i} style={styles.card}>
              <Text style={styles.cardLabel}>{event.event_type}</Text>
              <TextInput
                style={styles.numInput}
                keyboardType="numeric"
                value={String(event.count)}
                onChangeText={(v) => updateGoat(i, 'count', v)}
              />
            </View>
          ))}
        </Section>
      )}

      {result.pop_progress.length > 0 && (
        <Section title="Package of Practice">
          {result.pop_progress.map((entry, i) => (
            <View key={i} style={styles.card}>
              <Text style={styles.cardLabel}>{TRACK_LABELS[entry.livelihood_track] ?? entry.livelihood_track}</Text>
              <TextInput
                style={styles.numInput}
                keyboardType="numeric"
                value={String(entry.step_number)}
                onChangeText={(v) => updatePop(i, 'step_number', v)}
              />
            </View>
          ))}
        </Section>
      )}

      <View style={styles.actions}>
        <TouchableOpacity
          testID="discard-button"
          style={styles.discardBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.discardBtnText}>Discard</Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="confirm-button"
          style={styles.confirmBtn}
          onPress={() => navigation.navigate('Confirmation', { beneficiaryId, transcript, audioUri, extractionResult: result })}
        >
          <Text style={styles.confirmBtnText}>Confirm</Text>
        </TouchableOpacity>
      </View>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  heading: { fontSize: 20, fontWeight: '700', marginBottom: 24 },
  hint: { color: '#666', fontSize: 14 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#999', textTransform: 'uppercase', marginBottom: 8 },
  card: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 12, marginBottom: 8 },
  cardLabel: { fontSize: 15, color: '#374151', flex: 1 },
  numInput: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 6, padding: 8, fontSize: 16, width: 80, textAlign: 'right' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  discardBtn: { flex: 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 14, alignItems: 'center' },
  discardBtnText: { fontSize: 15, color: '#6b7280' },
  confirmBtn: { flex: 2, backgroundColor: '#2563eb', borderRadius: 8, padding: 14, alignItems: 'center' },
  confirmBtnText: { fontSize: 15, color: '#fff', fontWeight: '600' },
});
