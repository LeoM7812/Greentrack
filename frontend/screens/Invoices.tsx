import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useNavigation } from '@react-navigation/native';

export default function Invoices({ onLogout }: any) {
  const [uploading, setUploading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const navigation = useNavigation<any>();

  const handlePickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets?.length) return;

    const file = result.assets[0];
    await uploadFile(file);
  };

  const uploadFile = async (file: any) => {
    setUploading(true);
    setSummary(null);

    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.mimeType || 'application/pdf',
    } as any);

    try {
      const response = await fetch('http://localhost:8080/api/invoices/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSummary(data.summary); // Supõe que o backend devolve { summary: '...' }
      } else {
        Alert.alert('Erro', 'Falha ao enviar a fatura');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível ligar ao servidor');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Faturas</Text>

      <Button title="Carregar Fatura" onPress={handlePickFile} />

      {uploading && <ActivityIndicator style={{ marginTop: 20 }} />}

      {summary && (
        <View style={{ marginTop: 20 }}>
          <Text style={styles.subtitle}>Resumo:</Text>
          <Text>{summary}</Text>
        </View>
      )}
      <View style={{ marginTop: 30 }}>
        <Button title="Home" onPress={() => navigation.navigate('Home')} />
      </View>
      <View style={{ marginTop: 30 }}>
        <Button title="Terminar sessão" onPress={onLogout} color="red" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 20, marginBottom: 20 },
  subtitle: { fontWeight: 'bold', marginBottom: 10 },
});
