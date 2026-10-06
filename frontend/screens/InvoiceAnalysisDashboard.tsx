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
import { InvoiceAnalysis } from '../types/InvoiceAnalysis';

const { width } = Dimensions.get('window');

export default function InvoiceAnalysisDashboard({ navigation, route }: any) {
  const { analysis } = route.params;

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
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.headerContainer}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backIcon}>←</Text>
              <Text style={styles.backText}>Voltar</Text>
            </TouchableOpacity>

            <View style={styles.iconContainer}>
              <Text style={styles.headerIcon}>📈</Text>
            </View>
            <Text style={styles.headerTitle}>Análise da Fatura</Text>
            <Text style={styles.headerSubtitle}>{analysis.period}</Text>
          </View>

          {/* Warning de Legibilidade (se aplicável) */}
          {(analysis as any).processingStatus === 'warning_unreadable' && (
            <View style={styles.warningContainer}>
              <View style={styles.warningCard}>
                <Text style={styles.warningIcon}>⚠️</Text>
                <View style={styles.warningContent}>
                  <Text style={styles.warningTitle}>Fatura Difícil de Ler</Text>
                  <Text style={styles.warningText}>
                    {(analysis as any).readabilityCheck || 'A qualidade da imagem pode estar comprometida'}
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
              <Text style={styles.summaryValue}>{formatCurrency(analysis.totalAmount)}</Text>
              <Text style={styles.summaryLabel}>Valor Total</Text>
              {analysis.comparisonPreviousMonth?.amountDifference && (
                <Text style={[
                  styles.summaryChange,
                  { color: analysis.comparisonPreviousMonth.amountDifference > 0 ? '#F44336' : '#4CAF50' }
                ]}>
                  {formatPercentage(analysis.comparisonPreviousMonth.amountDifference)}
                </Text>
              )}
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{formatKwh(analysis.consumptionKwh)}</Text>
              <Text style={styles.summaryLabel}>Consumo</Text>
              {analysis.comparisonPreviousMonth?.consumptionDifference && (
                <Text style={[
                  styles.summaryChange,
                  { color: analysis.comparisonPreviousMonth.consumptionDifference > 0 ? '#F44336' : '#4CAF50' }
                ]}>
                  {formatPercentage(analysis.comparisonPreviousMonth.consumptionDifference)}
                </Text>
              )}
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{analysis.averageDaily.toFixed(1)}</Text>
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
                <Text style={styles.detailValue}>{analysis.tariffType.charAt(0).toUpperCase() + analysis.tariffType.slice(1)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Potência Contratada:</Text>
                <Text style={styles.detailValue}>{analysis.contractedPower} kVA</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Data de Processamento:</Text>
                <Text style={styles.detailValue}>{new Date(analysis.uploadDate).toLocaleDateString('pt-PT')}</Text>
              </View>
            </View>
          </View>

          {/* Insights */}
          {analysis.insights && (
            <View style={styles.insightsContainer}>
              <Text style={styles.sectionTitle}>Insights</Text>
              
              <View style={styles.insightCard}>
                {analysis.insights.peakConsumptionHours && (
                  <View style={styles.insightItem}>
                    <Text style={styles.insightIcon}>⏰</Text>
                    <View style={styles.insightContent}>
                      <Text style={styles.insightTitle}>Pico de Consumo</Text>
                      <Text style={styles.insightDescription}>{analysis.insights.peakConsumptionHours}</Text>
                    </View>
                  </View>
                )}

                {analysis.insights.highestCosts && (
                  <View style={styles.insightItem}>
                    <Text style={styles.insightIcon}>💰</Text>
                    <View style={styles.insightContent}>
                      <Text style={styles.insightTitle}>Maior Custo</Text>
                      <Text style={styles.insightDescription}>{analysis.insights.highestCosts}</Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Sugestões */}
          <View style={styles.suggestionsContainer}>
            <Text style={styles.sectionTitle}>Sugestões de Poupança</Text>
            
            {analysis.suggestions.map((suggestion: any, index: number) => (
              <View key={index} style={styles.suggestionCard}>
                <View style={styles.suggestionHeader}>
                  <View style={styles.suggestionIconContainer}>
                    <Text style={styles.suggestionIcon}>{getCategoryIcon(suggestion.category)}</Text>
                  </View>
                  <View style={styles.suggestionInfo}>
                    <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
                    <Text style={styles.suggestionCategory}>{suggestion.category.toUpperCase()}</Text>
                  </View>
                  <View style={styles.suggestionPriority}>
                    {suggestion.potentialSaving && (
                      <Text style={styles.suggestionSaving}>
                        {formatCurrency(suggestion.potentialSaving)}/mês
                      </Text>
                    )}
                    <View style={[
                      styles.priorityBadge,
                      { backgroundColor: getPriorityColor(suggestion.priority) }
                    ]}>
                      <Text style={styles.priorityText}>{suggestion.priority.toUpperCase()}</Text>
                    </View>
                  </View>
                </View>
                
                <Text style={styles.suggestionDescription}>{suggestion.description}</Text>
              </View>
            ))}
          </View>

          {/* Ações */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('Invoices')}
            >
              <Text style={styles.actionIcon}>📄</Text>
              <Text style={styles.actionText}>Ver Todas as Faturas</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={() => navigation.navigate('Home')}
            >
              <Text style={styles.actionIcon}>🏠</Text>
              <Text style={styles.actionText}>Voltar ao Início</Text>
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
  backgroundGradient: {
    flex: 1,
    backgroundColor: '#2E7D32',
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
  },
  summaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
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
  summarySubLabel: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
    marginTop: 2,
  },
  summaryChange: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  detailsContainer: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  detailCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
    flex: 1,
    textAlign: 'right',
  },
  insightsContainer: {
    marginBottom: 32,
  },
  insightCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  insightIcon: {
    fontSize: 24,
    marginRight: 12,
    marginTop: 2,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  insightDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  suggestionsContainer: {
    marginBottom: 32,
  },
  suggestionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  suggestionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  suggestionIcon: {
    fontSize: 20,
  },
  suggestionInfo: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 2,
  },
  suggestionCategory: {
    fontSize: 12,
    color: '#6C757D',
    fontWeight: '500',
  },
  suggestionPriority: {
    alignItems: 'flex-end',
  },
  suggestionSaving: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    marginBottom: 4,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  suggestionDescription: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 20,
  },
  actionsContainer: {
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(33, 150, 243, 0.9)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  secondaryButton: {
    backgroundColor: 'rgba(108, 117, 125, 0.9)',
    shadowColor: '#6C757D',
  },
  actionIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Estilos para Warning de Legibilidade
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
});