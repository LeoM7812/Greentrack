package com.greentrack.backend.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;

import com.greentrack.backend.dto.SuggestionsDTO;
import com.greentrack.backend.service.InvoiceService;

/**
 * Regression tests: a failed AI analysis must reach the app as an error,
 * never as a 200 with placeholder bill data.
 */
class InvoiceControllerTest {

    private final InvoiceService invoiceService = mock(InvoiceService.class);
    private final InvoiceController controller = new InvoiceController(invoiceService);
    private final MockMultipartFile bill =
            new MockMultipartFile("file", "fatura.pdf", "application/pdf", "%PDF-1.4 dummy".getBytes());

    private static SuggestionsDTO withStatus(String status) {
        SuggestionsDTO dto = new SuggestionsDTO();
        dto.setProcessingStatus(status);
        dto.setSuggestions(List.of());
        return dto;
    }

    @Test
    void aiUnavailableReturns502WithoutBillData() throws Exception {
        when(invoiceService.processInvoice(any())).thenReturn(withStatus("error_ai_unavailable"));

        ResponseEntity<SuggestionsDTO> response = controller.uploadTest(bill);

        assertEquals(HttpStatus.BAD_GATEWAY, response.getStatusCode());
        assertEquals(0.0, response.getBody().getConsumptionKwh());
        assertNull(response.getBody().getPeriod()); // no "Janeiro 2024" placeholder
    }

    @Test
    void invalidAiResponseReturns502() throws Exception {
        when(invoiceService.processInvoice(any())).thenReturn(withStatus("error_ai_invalid_response"));

        assertEquals(HttpStatus.BAD_GATEWAY, controller.uploadTest(bill).getStatusCode());
    }

    @Test
    void readabilityWarningStays200SoTheAppCanShowTips() throws Exception {
        when(invoiceService.processInvoice(any())).thenReturn(withStatus("warning_unreadable"));

        assertEquals(HttpStatus.OK, controller.uploadTest(bill).getStatusCode());
    }

    @Test
    void successReturns200WithData() throws Exception {
        SuggestionsDTO ok = withStatus("success");
        ok.setConsumptionKwh(245.0);
        when(invoiceService.processInvoice(any())).thenReturn(ok);

        ResponseEntity<SuggestionsDTO> response = controller.uploadTest(bill);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(245.0, response.getBody().getConsumptionKwh());
    }
}
