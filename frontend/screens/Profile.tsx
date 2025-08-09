import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

export default function Profile({ navigation }: any) {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          navigation.navigate('Login');
          return;
        }

        // Use the new endpoint to get current user data
        const response = await fetch('http://localhost:8080/api/users/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUserData(data);
        } else {
          Alert.alert('Erro', 'Não foi possível carregar os dados do perfil');
          navigation.navigate('Login');
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        Alert.alert('Erro', 'Problema de conexão');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    Alert.alert(
      'Terminar Sessão',
      'Tem certeza que deseja sair?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Sair',
          onPress: async () => {
            await AsyncStorage.removeItem('token');
            navigation.navigate('Login');
          },
          style: 'destructive',
        },
      ]
    );
  };

  const profileSections = [
    {
      title: 'Informações Pessoais',
      items: [
        { label: 'Nome', value: userData?.name || 'N/A', icon: '👤' },
        { label: 'Email', value: userData?.email || 'N/A', icon: '📧' },
        { label: 'Membro desde', value: 'Janeiro 2024', icon: '📅' },
      ]
    },
    {
      title: 'Sustentabilidade',
      items: [
        { label: 'CO₂ Reduzido', value: '15.7 kg', icon: '🌱' },
        { label: 'Energia Poupada', value: '234 kWh', icon: '⚡' },
        { label: 'Ranking', value: '#47 na região', icon: '🏆' },
      ]
    },
    {
      title: 'Configurações',
      items: [
        { label: 'Notificações', value: 'Ativadas', icon: '🔔' },
        { label: 'Idioma', value: 'Português', icon: '🌍' },
        { label: 'Tema', value: 'Verde', icon: '🎨' },
      ]
    }
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#2E7D32" />
        <View style={styles.backgroundGradient}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Carregando perfil...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2E7D32" />
      
      <View style={styles.backgroundGradient}>
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <View style={styles.headerContainer}>
            {/* Back Button */}
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backIcon}>←</Text>
              <Text style={styles.backText}>Voltar</Text>
            </TouchableOpacity>

            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {userData?.name ? userData.name.charAt(0).toUpperCase() : '?'}
                </Text>
              </View>
            </View>
            <Text style={styles.userName}>{userData?.name || 'Utilizador'}</Text>
            <Text style={styles.userEmail}>{userData?.email || 'email@exemplo.com'}</Text>
          </View>

          {/* Profile Sections */}
          {profileSections.map((section, sectionIndex) => (
            <View key={sectionIndex} style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              {section.items.map((item, itemIndex) => (
                <View key={itemIndex} style={styles.profileItem}>
                  <View style={styles.itemIconContainer}>
                    <Text style={styles.itemIcon}>{item.icon}</Text>
                  </View>
                  <View style={styles.itemTextContainer}>
                    <Text style={styles.itemLabel}>{item.label}</Text>
                    <Text style={styles.itemValue}>{item.value}</Text>
                  </View>
                </View>
              ))}
            </View>
          ))}

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.editButton}>
              <Text style={styles.editIcon}>✏️</Text>
              <Text style={styles.editButtonText}>Editar Perfil</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutIcon}>🚪</Text>
              <Text style={styles.logoutText}>Terminar Sessão</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1B5E20',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#1B5E20',
  },
  backgroundGradient: {
    flex: 1,
    backgroundColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 16,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 32,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 1,
  },
  backIcon: {
    fontSize: 20,
    color: '#FFFFFF',
    marginRight: 4,
  },
  backText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  sectionContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 16,
    textAlign: 'center',
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  itemIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  itemIcon: {
    fontSize: 20,
  },
  itemTextContainer: {
    flex: 1,
  },
  itemLabel: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 2,
  },
  itemValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
  },
  actionsContainer: {
    marginTop: 8,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(33, 150, 243, 0.9)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#2196F3',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  editIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(244, 67, 54, 0.9)',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#F44336',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  logoutIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
