import React from 'react';
import { View, Text, Button } from 'react-native';

export default function SettingsPage({ navigation }) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 20, marginBottom: 20 }}>Página de Definições</Text>
      <Button title="Voltar para Home" onPress={() => navigation.goBack()} />
    </View>
  );
}
