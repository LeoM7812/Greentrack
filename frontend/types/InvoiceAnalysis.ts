export interface InvoiceAnalysis {
  // Dados extraídos da fatura
  period: string;
  consumptionKwh: number;
  totalAmount: number;
  averageDaily: number;
  tariffType: 'simples' | 'bi-horaria' | 'tri-horaria' | 'desconhecido';
  contractedPower: number;
  
  // Análise comparativa
  comparisonPreviousMonth?: {
    consumptionDifference: number; // % diferença
    amountDifference: number; // % diferença
  };
  
  // Sugestões categorizadas
  suggestions: {
    category: 'tarifa' | 'consumo' | 'sustentabilidade' | 'fornecedor';
    title: string;
    description: string;
    potentialSaving?: number; // euros por mês
    priority: 'alta' | 'media' | 'baixa';
  }[];
  
  // Insights específicos
  insights: {
    peakConsumptionHours?: string;
    highestCosts?: string;
    recommendations?: string[];
  };
  
  // Metadata
  uploadDate: string;
  processingStatus: 'success' | 'partial' | 'error';
}

export interface InvoiceUploadResponse {
  analysis: InvoiceAnalysis;
  rawData?: any; // dados brutos do AI
}