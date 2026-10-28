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
    consumptionDifference: number | null; // % diferença (null sem fatura anterior com valor)
    amountDifference: number | null; // % diferença
  };
  
  // Ofertas mais baratas do simulador da ERSE para esta fatura (com taxas e IVA)
  supplierComparison?: {
    offers: {
      supplier: string;
      offer: string;
      estimatedTotal: number; // euros, para o mesmo período da fatura
      saving: number | null; // total pago - estimativa (negativo = mais caro)
      loyaltyMonths: number;
      link: string;
    }[];
    notes?: string[];
    simulator?: string;
    reason?: string; // porque não há comparação
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