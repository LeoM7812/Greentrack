import React from 'react';
import { View, Text, Button } from 'react-native';

export default function Home({ navigation }) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 20, marginBottom: 20 }}>Bem-vindo à Home</Text>
      <Button title="Ir para Perfil" onPress={() => navigation.navigate('Profile')} />
      <Button title="Ir para Definições" onPress={() => navigation.navigate('Settings')} />
    </View>
  );
}
