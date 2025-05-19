import React from 'react';
import { View, Button, StyleSheet } from 'react-native';

export default function Home({ navigation, onLogout }: any) {
  return (
    <View style={styles.container}>
      <Button title="Ir para o Perfil" onPress={() => navigation.navigate('Profile')} />
      <Button title="Ir para Faturas" onPress={() => navigation.navigate('Invoices')} />
      <Button title="Terminar sessão" onPress={onLogout} color="red" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', gap: 10, padding: 20 },
});