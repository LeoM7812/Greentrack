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

@Service
public class InvoiceService {

    private final RestTemplate restTemplate = new RestTemplate();

    public SuggestionsDTO processInvoice(MultipartFile file) throws java.io.IOException {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);

        HttpEntity<byte[]> requestEntity = new HttpEntity<>(file.getBytes(), headers);

        try {
            ResponseEntity<SuggestionsDTO> response = restTemplate.postForEntity(
                "http://localhost:5000/analyze",  // Substituir pelo URL real do teu AI Agent
                requestEntity,
                SuggestionsDTO.class
            );

            return response.getBody();
        } catch (Exception e) {
            // Return standard suggestions if the AI agent is not available
            SuggestionsDTO standardSuggestions = new SuggestionsDTO();
            standardSuggestions.setSuggestions(List.of("Suggestion 1", "Suggestion 2", "Suggestion 3"));
            return standardSuggestions;
        }
        
    }
}

