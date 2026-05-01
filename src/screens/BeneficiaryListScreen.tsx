import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function BeneficiaryListScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Beneficiary List</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 24, fontWeight: '700' },
});
