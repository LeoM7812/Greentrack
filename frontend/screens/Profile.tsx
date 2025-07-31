import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

export default function Profile({ onLogout }: any) {
  const [userData, setUserData] = useState<any>(null);
  const navigation = useNavigation<any>();

  useEffect(() => {
    const fetchUser = async () => {
    const token = await AsyncStorage.getItem('token');
    const userId = await AsyncStorage.getItem('userId');

    console.log('Token:', token);
    console.log('UserID:', userId);

    if (!token || !userId) {
      setUserData(null);
      return;
    }

    try {
      const url = `http://localhost:8080/api/users/${userId}`; // <-- muda aqui
      console.log('URL:', url);

      const response = await fetch(`http://localhost:8080/api/users/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('Status:', response.status);

      const text = await response.text(); // tenta ler o corpo mesmo se não for JSON
      console.log('Resposta (texto):', text);

      if (response.ok) {
        const data = JSON.parse(text);
        setUserData(data);
      } else {
        setUserData(null);
      }
    } catch (error) {
      console.error('Erro ao buscar utilizador:', error);
      setUserData(null);
    }
  };
    fetchUser();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Perfil</Text>
      {userData ? (
        <View>
          <Text>Nome: {userData.name}</Text>
          <Text>Email: {userData.email}</Text>
        </View>
      ) : (
        <Text>Não foi possível carregar os dados.</Text>
      )}
      <Button title="Home" onPress={() => navigation.navigate('Home')} />
      <Button title="Terminar sessão" onPress={onLogout} color="red" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', gap: 10, padding: 20 },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
});
