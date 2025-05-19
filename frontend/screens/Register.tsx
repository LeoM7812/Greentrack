import React from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';

export default function Register({ navigation }: any) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Registo</Text>
      <TextInput style={styles.input} placeholder="Username" />
      <TextInput style={styles.input} placeholder="Password" secureTextEntry />
      <Button title="Registar" onPress={() => navigation.navigate('Login')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, marginBottom: 20 },
  input: { borderBottomWidth: 1, marginBottom: 10, padding: 8 },
});