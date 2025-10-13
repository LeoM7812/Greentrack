import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

// 💡 Funções auxiliares
const formatKey = (key: string) => {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .replace(/kwh/i, 'kWh')
    .replace(/kVA/i, 'kVA')
    .trim();
};

const formatContractedPower = (value: any) => {
  if (!value) return 'N/A (Não detetado)';
  const valueStr = String(value).replace(/\s+/g, '').trim(); // remove espaços e caracteres invisíveis
  const normalized = valueStr.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // remove acentos

  // já contém unidade
  if (normalized.includes('kva') || normalized.includes('kw')) return valueStr;

  const numValue = parseFloat(valueStr.replace(',', '.'));
  if (!isNaN(numValue) && numValue > 0) {
    return `${numValue.toFixed(2).replace('.', ',')} kVA`;
  }
  return valueStr;
};


export default function InvoiceAnalysisDashboard({ navigation, route }: any) {
  const { analysis } = route.params;
  const data = analysis.analysis_data || analysis; // ✅ CORREÇÃO PRINCIPAL

  console.log('📊 Dados recebidos no dashboard:', JSON.stringify(data, null, 2));


  const EXCLUDED_KEYS = [
    'period', 'consumptionKwh', 'totalAmount', 'tariffType', 'contractedPower',
    'averageDaily', 'suggestions', 'insights', 'comparisonPreviousMonth',
    'processingStatus', 'readabilityCheck', 'uploadDate'
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'alta': return '#F44336';
      case 'media': return '#FF9800';
      case 'baixa': return '#4CAF50';
      default: return '#6C757D';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'tarifa': return '⚡';
      case 'consumo': return '📊';
      case 'sustentabilidade': return '🌱';
      case 'fornecedor': return '🏢';
      default: return '💡';
    }
  };

  const formatCurrency = (value: number) => `€${value.toFixed(2)}`;
  const formatKwh = (value: number) => `${value} kWh`;
  const formatPercentage = (value: number) => `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2E7D32" />

      <View style={styles.backgroundGradient}>
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.headerContainer}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Text style={styles.backIcon}>←</Text>
              <Text style={styles.backText}>Voltar</Text>
            </TouchableOpacity>

            <View style={styles.iconContainer}>
              <Text style={styles.headerIcon}>📈</Text>
            </View>
            <Text style={styles.headerTitle}>Análise da Fatura</Text>
            <Text style={styles.headerSubtitle}>{data.period}</Text>
          </View>

          {/* Warning de legibilidade */}
          {analysis.processingStatus === 'warning_unreadable' && (
            <View style={styles.warningContainer}>
              <View style={styles.warningCard}>
                <Text style={styles.warningIcon}>⚠️</Text>
                <View style={styles.warningContent}>
                  <Text style={styles.warningTitle}>Fatura Difícil de Ler</Text>
                  <Text style={styles.warningText}>
                    {analysis.readabilityCheck || 'A qualidade da imagem pode estar comprometida'}
                  </Text>
                  <Text style={styles.warningAdvice}>
                    💡 Para melhores resultados, use uma imagem com melhor qualidade ou um PDF
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Resumo Principal */}
          <View style={styles.summaryContainer}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{formatCurrency(data.totalAmount)}</Text>
              <Text style={styles.summaryLabel}>Valor Total</Text>
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{formatKwh(data.consumptionKwh)}</Text>
              <Text style={styles.summaryLabel}>Consumo</Text>
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{data.averageDaily?.toFixed(1)}</Text>
              <Text style={styles.summaryLabel}>kWh/dia</Text>
              <Text style={styles.summarySubLabel}>Média diária</Text>
            </View>
          </View>

          {/* Detalhes da Tarifa */}
          <View style={styles.detailsContainer}>
            <Text style={styles.sectionTitle}>Detalhes da Tarifa</Text>
            <View style={styles.detailCard}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Tipo de Tarifa:</Text>
                <Text style={styles.detailValue}>{data.tariffType || 'N/A'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Potência Contratada:</Text>
                <Text style={styles.detailValue}>{formatContractedPower(data.contractedPower)}</Text>
              </View>
            </View>
          </View>

          {/* Outras Informações */}
          {Object.keys(data).some(k => !EXCLUDED_KEYS.includes(k) && (typeof data[k] === 'string' || typeof data[k] === 'number')) && (
            <View style={styles.detailsContainer}>
              <Text style={styles.sectionTitle}>Outras Informações</Text>
              <View style={styles.detailCard}>
                {Object.entries(data).map(([key, value]) => {
                  const isSimpleValue = typeof value === 'string' || typeof value === 'number';
                  if (!EXCLUDED_KEYS.includes(key) && isSimpleValue && value) {
                    return (
                      <View key={key} style={styles.detailRow}>
                        <Text style={styles.detailLabel}>{formatKey(key)}:</Text>
                        <Text style={styles.detailValue}>{String(value)}</Text>
                      </View>
                    );
                  }
                  return null;
                })}
              </View>
            </View>
          )}

          {/* Insights */}
          {data.insights && (
            <View style={styles.insightsContainer}>
              <Text style={styles.sectionTitle}>Insights</Text>
              <View style={styles.insightCard}>
                {Object.entries(data.insights ?? {}).map(([key, value]: [string, any]) => {
                  if (typeof value === 'object') {
                    return (
                      <View key={key} style={{ marginBottom: 10 }}>
                        <Text style={styles.insightTitle}>{formatKey(key)}</Text>
                        {Object.entries(value ?? {}).map(([subKey, subVal]: [string, any]) => (
                          <Text key={subKey} style={styles.insightDescription}>
                            • {formatKey(subKey)}: {String(subVal)}
                          </Text>
                        ))}

                      </View>
                    );
                  }
                  return (
                    <View key={key} style={styles.insightItem}>
                      <Text style={styles.insightIcon}>🔍</Text>
                      <View style={styles.insightContent}>
                        <Text style={styles.insightTitle}>{formatKey(key)}</Text>
                        <Text style={styles.insightDescription}>{String(value)}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Sugestões */}
          {data.suggestions && data.suggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <Text style={styles.sectionTitle}>Sugestões de Poupança</Text>
              {data.suggestions.map((s: any, index: number) => (
                <View key={index} style={styles.suggestionCard}>
                  <Text style={styles.suggestionDescription}>💡 {typeof s === 'string' ? s : s.description}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Ações */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Invoices')}>
              <Text style={styles.actionIcon}>📄</Text>
              <Text style={styles.actionText}>Ver Todas as Faturas</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]} onPress={() => navigation.navigate('Home')}>
              <Text style={styles.actionIcon}>🏠</Text>
              <Text style={styles.actionText}>Voltar ao Início</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

// 🧱 Estilos (os mesmos que já tinhas)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1B5E20' },
  backgroundGradient: { flex: 1, backgroundColor: '#2E7D32' },
  scrollContainer: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  headerContainer: { alignItems: 'center', marginBottom: 32, position: 'relative' },
  backButton: { position: 'absolute', top: 0, left: 0, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  backIcon: { fontSize: 20, color: '#FFFFFF', marginRight: 4 },
  backText: { fontSize: 14, color: '#FFFFFF', fontWeight: '500' },
  iconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 16, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
  headerIcon: { fontSize: 36 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 4 },
  headerSubtitle: { fontSize: 16, color: 'rgba(255,255,255,0.8)' },
  summaryContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 },
  summaryCard: { backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 16, padding: 16, alignItems: 'center', flex: 1, marginHorizontal: 4 },
  summaryValue: { fontSize: 18, fontWeight: 'bold', color: '#2E7D32', marginBottom: 4 },
  summaryLabel: { fontSize: 12, color: '#666' },
  summarySubLabel: { fontSize: 10, color: '#999' },
  detailsContainer: { marginBottom: 32 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 16, textAlign: 'center' },
  detailCard: { backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 16, padding: 20 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  detailLabel: { fontSize: 14, color: '#666' },
  detailValue: { fontSize: 14, fontWeight: '600', color: '#212529' },
  insightCard: { backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 16, padding: 20 },
  insightItem: { flexDirection: 'row', marginBottom: 16 },
  insightIcon: { fontSize: 24, marginRight: 12 },
  insightTitle: { fontSize: 16, fontWeight: '600', color: '#212529' },
  insightDescription: { fontSize: 14, color: '#666', lineHeight: 20 },
  suggestionCard: { backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 16, padding: 16, marginBottom: 16 },
  suggestionDescription: { fontSize: 14, color: '#495057', lineHeight: 20 },
  actionsContainer: { marginTop: 8 },
  actionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(33,150,243,0.9)', borderRadius: 16, padding: 16, marginBottom: 16 },
  secondaryButton: { backgroundColor: 'rgba(108,117,125,0.9)' },
  actionIcon: { fontSize: 18, marginRight: 8 },
  actionText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
    warningContainer: {
    marginTop: 16,
    marginBottom: 16,
  },
  warningCard: {
    backgroundColor: 'rgba(255, 193, 7, 0.95)',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#FF9800',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  warningIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8B4513',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 14,
    color: '#5D4037',
    lineHeight: 18,
    marginBottom: 4,
  },
  warningAdvice: {
    fontSize: 12,
    color: '#6D4C41',
    fontStyle: 'italic',
    lineHeight: 16,
  },
  insightsContainer: {
    marginBottom: 32,
  },
  insightContent: {
    flex: 1,
  },
  suggestionsContainer: {
    marginBottom: 32,
  }
});
