import React, { useState, useEffect } from 'react';
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

export default function Invoices({ onLogout, navigation }: any) {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock data para demonstração
  const mockInvoices = [
    {
      id: 1,
      date: '2024-12-15',
      amount: 89.47,
      consumption: 245,
      status: 'Paga',
      period: 'Dezembro 2024',
      company: 'EDP Comercial'
    },
    {
      id: 2,
      date: '2024-11-15',
      amount: 92.35,
      consumption: 267,
      status: 'Paga',
      period: 'Novembro 2024',
      company: 'EDP Comercial'
    },
    {
      id: 3,
      date: '2024-10-15',
      amount: 78.92,
      consumption: 198,
      status: 'Paga',
      period: 'Outubro 2024',
      company: 'EDP Comercial'
    },
    {
      id: 4,
      date: '2024-09-15',
      amount: 105.68,
      consumption: 289,
      status: 'Pendente',
      period: 'Setembro 2024',
      company: 'EDP Comercial'
    }
  ];

  useEffect(() => {
    // Simular carregamento
    const loadInvoices = setTimeout(() => {
      setInvoices(mockInvoices);
      setLoading(false);
    }, 1500);

    return () => clearTimeout(loadInvoices);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paga':
        return '#4CAF50';
      case 'Pendente':
        return '#FF9800';
      case 'Vencida':
        return '#F44336';
      default:
        return '#6C757D';
    }
  };

  const handleInvoicePress = (invoice: any) => {
    Alert.alert(
      `Fatura ${invoice.period}`,
      `Valor: €${invoice.amount}\nConsumo: ${invoice.consumption} kWh\nEmpresa: ${invoice.company}\nStatus: ${invoice.status}`,
      [{ text: 'OK' }]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#2E7D32" />
        <View style={styles.backgroundGradient}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Carregando faturas...</Text>
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

            <View style={styles.iconContainer}>
              <Text style={styles.headerIcon}>📄</Text>
            </View>
            <Text style={styles.headerTitle}>Faturas Energéticas</Text>
            <Text style={styles.headerSubtitle}>Histórico de consumo</Text>
          </View>

          {/* Summary Cards */}
          <View style={styles.summaryContainer}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>€366.42</Text>
              <Text style={styles.summaryLabel}>Total Anual</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>999 kWh</Text>
              <Text style={styles.summaryLabel}>Consumo Total</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>€91.61</Text>
              <Text style={styles.summaryLabel}>Média Mensal</Text>
            </View>
          </View>

          {/* Invoices List */}
          <View style={styles.invoicesContainer}>
            <Text style={styles.invoicesTitle}>Faturas Recentes</Text>
            
            {invoices.map((invoice: any) => (
              <TouchableOpacity
                key={invoice.id}
                style={styles.invoiceCard}
                onPress={() => handleInvoicePress(invoice)}
              >
                <View style={styles.invoiceHeader}>
                  <View style={styles.invoiceIconContainer}>
                    <Text style={styles.invoiceIcon}>⚡</Text>
                  </View>
                  <View style={styles.invoiceInfo}>
                    <Text style={styles.invoicePeriod}>{invoice.period}</Text>
                    <Text style={styles.invoiceCompany}>{invoice.company}</Text>
                  </View>
                  <View style={styles.invoiceAmount}>
                    <Text style={styles.invoicePrice}>€{invoice.amount}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(invoice.status) }]}>
                      <Text style={styles.statusText}>{invoice.status}</Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.invoiceDetails}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Consumo:</Text>
                    <Text style={styles.detailValue}>{invoice.consumption} kWh</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Data:</Text>
                    <Text style={styles.detailValue}>{new Date(invoice.date).toLocaleDateString('pt-PT')}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.uploadButton}>
              <Text style={styles.uploadIcon}>📤</Text>
              <Text style={styles.uploadText}>Carregar Nova Fatura</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
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
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerIcon: {
    fontSize: 36,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    paddingHorizontal: 4,
  },
  summaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  invoicesContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  invoicesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 20,
    textAlign: 'center',
  },
  invoiceCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  invoiceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  invoiceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  invoiceIcon: {
    fontSize: 24,
  },
  invoiceInfo: {
    flex: 1,
  },
  invoicePeriod: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 2,
  },
  invoiceCompany: {
    fontSize: 14,
    color: '#6C757D',
  },
  invoiceAmount: {
    alignItems: 'flex-end',
  },
  invoicePrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  invoiceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6C757D',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
  },
  actionsContainer: {
    marginTop: 8,
  },
  uploadButton: {
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
  uploadIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  uploadText: {
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
