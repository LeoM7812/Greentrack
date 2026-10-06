package com.greentrack.backend.service;

import org.springframework.http.HttpHeaders;

import org.springframework.http.MediaType;
import org.springframework.http.HttpEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestClientException;
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

            ResponseEntity<String> response;
            try {
                response = restTemplate.postForEntity(
                        "http://localhost:5000/ai/suggestions",
                        requestEntity,
                        String.class);
            } catch (HttpStatusCodeException httpError) {
                // AI agent answered with an error status (e.g. 502): pass its status through.
                System.err.println("AI agent devolveu " + httpError.getStatusCode());
                return errorFromAgentBody(httpError.getResponseBodyAsString());
            } catch (RestClientException connectionError) {
                // AI agent unreachable (down, timeout...).
                System.err.println("AI agent inacessível: " + connectionError.getMessage());
                return error("error_ai_unavailable", "O serviço de análise não está disponível. Tente novamente mais tarde.");
            }

            System.out.println("=== RESPOSTA AI AGENT ===");
            System.out.println("Status: " + response.getStatusCode());

            com.fasterxml.jackson.databind.JsonNode jsonResponse;
            try {
                jsonResponse = MAPPER.readTree(response.getBody());
            } catch (Exception jsonException) {
                System.err.println("Erro ao parsear JSON do AI Agent: " + jsonException.getMessage());
                return error("error_ai_invalid_response", "Não foi possível analisar esta fatura.");
            }

            SuggestionsDTO suggestionsDTO = new SuggestionsDTO();
            suggestionsDTO.setUploadDate(java.time.LocalDateTime.now().toString());
            // Trust only the status the AI agent reports; a missing status is not a success.
            suggestionsDTO.setProcessingStatus(jsonResponse.path("processingStatus").asText("error_ai_invalid_response"));
            if (jsonResponse.has("readabilityCheck")) {
                suggestionsDTO.setReadabilityCheck(jsonResponse.get("readabilityCheck").asText());
            }

            List<String> suggestions = new ArrayList<>();
            jsonResponse.path("suggestions").forEach(node -> suggestions.add(node.asText()));
            suggestionsDTO.setSuggestions(suggestions);

            // Only copy bill data when the analysis actually succeeded.
            if ("success".equals(suggestionsDTO.getProcessingStatus()) && jsonResponse.has("analysis_data")) {
                com.fasterxml.jackson.databind.JsonNode analysisData = jsonResponse.get("analysis_data");
                suggestionsDTO.setPeriod(analysisData.path("period").asText());
                suggestionsDTO.setConsumptionKwh(analysisData.path("consumptionKwh").asDouble());
                suggestionsDTO.setTotalAmount(analysisData.path("totalAmount").asDouble());
                suggestionsDTO.setAverageDaily(analysisData.path("averageDaily").asDouble());
                suggestionsDTO.setTariffType(analysisData.path("tariffType").asText());
                suggestionsDTO.setContractedPower(analysisData.path("contractedPower").asDouble());
            }

            return suggestionsDTO;

        } catch (java.io.IOException readError) {
            throw readError;
        } catch (Exception e) {
            System.err.println("Erro geral no processamento: " + e.getMessage());
            e.printStackTrace();
            return error("error_internal", "Erro interno ao processar a fatura.");
        }
    }

    private static final com.fasterxml.jackson.databind.ObjectMapper MAPPER =
            new com.fasterxml.jackson.databind.ObjectMapper();

    private static SuggestionsDTO error(String status, String message) {
        SuggestionsDTO dto = new SuggestionsDTO();
        dto.setProcessingStatus(status);
        dto.setError(message);
        dto.setSuggestions(List.of());
        dto.setUploadDate(java.time.LocalDateTime.now().toString());
        return dto;
    }

    private static SuggestionsDTO errorFromAgentBody(String body) {
        try {
            com.fasterxml.jackson.databind.JsonNode json = MAPPER.readTree(body);
            return error(
                    json.path("processingStatus").asText("error_ai_unavailable"),
                    json.path("error").asText("O serviço de análise falhou."));
        } catch (Exception parseError) {
            return error("error_ai_unavailable", "O serviço de análise falhou.");
        }
    }
}
