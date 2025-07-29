import React, { useState } from 'react';
import { View, TextInput, Button, Text, Alert, StyleSheet } from 'react-native';

export default function Register({ navigation }: any) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async () => {
    try {
    const response = await fetch('http://localhost:8080/api/auth/register', {
    method: 'POST',
    headers: {
    'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, email, password }),
    });
      if (response.ok) {
        Alert.alert('Registo feito com sucesso');
        navigation.navigate('Login');
      } else {
        const errorData = await response.json();
        Alert.alert('Erro no registo', errorData.message || 'Verifica os dados introduzidos');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível ligar ao servidor');
    }
  };

  return (
  <View style={styles.container}>
  <Text style={styles.label}>Nome:</Text>
  <TextInput style={styles.input} value={name} onChangeText={setName} />
  <Text style={styles.label}>Email:</Text>
  <TextInput style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
  <Text style={styles.label}>Password:</Text>
  <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry />
  <Button title="Registar" onPress={handleRegister} />
  <View style={{ marginTop: 10 }}>
  <Button title="Voltar ao Login" onPress={() => navigation.navigate('Login')} />
  </View>
  </View>
  );
}

const styles = StyleSheet.create({
  container: {
  flex: 1,
  padding: 20,
  justifyContent: 'center',
  },
  label: {
  marginBottom: 4,
  },
  input: {
  borderWidth: 1,
  borderColor: '#ccc',
  padding: 8,
  marginBottom: 12,
  borderRadius: 4,
  },
});