import React, { useEffect, useState, useMemo } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../navigation/RootNavigator';
import { createBeneficiaryModule, type Beneficiary } from '../modules/beneficiary/BeneficiaryModule';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export function BeneficiaryListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { session } = useAuth();
  const beneficiaryModule = useMemo(() => createBeneficiaryModule(supabase), []);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!session) return;
    beneficiaryModule.getAssigned(session.user.id)
      .then(setBeneficiaries)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [session]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return beneficiaries;
    return beneficiaries.filter(
      (b) => b.name.toLowerCase().includes(q) || b.village_name.toLowerCase().includes(q)
    );
  }, [beneficiaries, search]);

  if (loading) return <ActivityIndicator style={styles.center} />;
  if (error) return <Text style={styles.error}>{error}</Text>;

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder="Search by name or village"
        value={search}
        onChangeText={setSearch}
        clearButtonMode="while-editing"
      />
      <FlatList
        data={filtered}
        keyExtractor={(b) => b.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate('BeneficiaryProfile', { id: item.id })}
          >
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.village}>{item.village_name}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No beneficiaries found.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1 },
  search: {
    margin: 16, borderWidth: 1, borderColor: '#ccc',
    borderRadius: 8, padding: 12, fontSize: 16,
  },
  row: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  name: { fontSize: 16, fontWeight: '600' },
  village: { fontSize: 14, color: '#666', marginTop: 2 },
  empty: { textAlign: 'center', color: '#999', marginTop: 32 },
  error: { color: '#d00', margin: 16 },
});
