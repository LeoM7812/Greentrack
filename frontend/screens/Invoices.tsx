import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

export default function Invoices({ onLogout }: any) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Faturas</Text>
      <Button title="Terminar sessão" onPress={onLogout} color="red" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 20, marginBottom: 20 },
});