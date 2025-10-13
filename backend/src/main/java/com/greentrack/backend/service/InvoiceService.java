package com.greentrack.backend.service;

import org.springframework.http.HttpHeaders;

import org.springframework.http.MediaType;
import org.springframework.http.HttpEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import com.greentrack.backend.dto.SuggestionsDTO;

import java.util.List;
import java.util.ArrayList;

@Service
public class InvoiceService {

    private final RestTemplate restTemplate = new RestTemplate();

    public SuggestionsDTO processInvoice(MultipartFile file) throws java.io.IOException {
        try {
            System.out.println("=== PROCESSAR FATURA ===");
            System.out.println("Processing invoice file: " + file.getOriginalFilename());
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            org.springframework.util.MultiValueMap<String, Object> body = new org.springframework.util.LinkedMultiValueMap<>();
            org.springframework.core.io.ByteArrayResource fileAsResource = new org.springframework.core.io.ByteArrayResource(
                    file.getBytes()) {
                @Override
                public String getFilename() {
                    return file.getOriginalFilename();
                }
            };
            body.add("file", fileAsResource);

            HttpEntity<org.springframework.util.MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body,
                    headers);

            ResponseEntity<String> response = restTemplate.postForEntity(
                    "http://localhost:5000/ai/suggestions",
                    requestEntity,
                    String.class);
            
            System.out.println("=== RESPOSTA AI AGENT ===");
            System.out.println("Status: " + response.getStatusCode());
            System.out.println("Body: " + response.getBody());
            System.out.println("========================");
            
            // Tentar parsear a resposta JSON do AI Agent
            try {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                com.fasterxml.jackson.databind.JsonNode jsonResponse = mapper.readTree(response.getBody());
                
                SuggestionsDTO suggestionsDTO = new SuggestionsDTO();
                
                // Extrair suggestions
                if (jsonResponse.has("suggestions")) {
                    List<String> suggestions = new ArrayList<>();
                    jsonResponse.get("suggestions").forEach(node -> suggestions.add(node.asText()));
                    suggestionsDTO.setSuggestions(suggestions);
                }
                
                // Extrair analysis_data se existir
                if (jsonResponse.has("analysis_data")) {
                    com.fasterxml.jackson.databind.JsonNode analysisData = jsonResponse.get("analysis_data");
                    
                    if (analysisData.has("period")) {
                        suggestionsDTO.setPeriod(analysisData.get("period").asText());
                    }
                    if (analysisData.has("consumptionKwh")) {
                        suggestionsDTO.setConsumptionKwh(analysisData.get("consumptionKwh").asDouble());
                    }
                    if (analysisData.has("totalAmount")) {
                        suggestionsDTO.setTotalAmount(analysisData.get("totalAmount").asDouble());
                    }
                    if (analysisData.has("averageDaily")) {
                        suggestionsDTO.setAverageDaily(analysisData.get("averageDaily").asDouble());
                    }
                    if (analysisData.has("tariffType")) {
                        suggestionsDTO.setTariffType(analysisData.get("tariffType").asText());
                    }
                    if (analysisData.has("contractedPower")) {
                        suggestionsDTO.setContractedPower(analysisData.get("contractedPower").asDouble());
                    }
                    
                    // Adicionar data de upload e status
                    suggestionsDTO.setUploadDate(java.time.LocalDateTime.now().toString());
                    suggestionsDTO.setProcessingStatus("success");
                    
                    System.out.println("=== DADOS EXTRAIDOS ===");
                    System.out.println("Período: " + suggestionsDTO.getPeriod());
                    System.out.println("Consumo: " + suggestionsDTO.getConsumptionKwh() + " kWh");
                    System.out.println("Valor: €" + suggestionsDTO.getTotalAmount());
                    System.out.println("Tarifa: " + suggestionsDTO.getTariffType());
                    System.out.println("======================");
                }
                
                return suggestionsDTO;
                
            } catch (Exception jsonException) {
                System.err.println("Erro ao parsear JSON do AI Agent: " + jsonException.getMessage());
                // Fallback para formato antigo
                SuggestionsDTO suggestionsDTO = new SuggestionsDTO();
                suggestionsDTO.setSuggestions(List.of(response.getBody()));
                return suggestionsDTO;
            }
            
        } catch (Exception e) {
            System.err.println("Erro geral no processamento: " + e.getMessage());
            e.printStackTrace();
            SuggestionsDTO standardSuggestions = new SuggestionsDTO();
            standardSuggestions.setSuggestions(List.of("Suggestion 1", "Suggestion 2", "Suggestion 3"));
            return standardSuggestions;
        }
    }
}
