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
        try {
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
            System.out.println("Response from AI service: " + response.getBody());
            SuggestionsDTO suggestionsDTO = new SuggestionsDTO();
            suggestionsDTO.setSuggestions(List.of(response.getBody()));
            return suggestionsDTO;
        } catch (Exception e) {
            SuggestionsDTO standardSuggestions = new SuggestionsDTO();
            standardSuggestions.setSuggestions(List.of("Suggestion 1", "Suggestion 2", "Suggestion 3"));
            return standardSuggestions;
        }
    }
}
