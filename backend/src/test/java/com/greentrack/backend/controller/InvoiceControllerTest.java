package com.greentrack.backend.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.bind.annotation.PostMapping;

import com.greentrack.backend.dto.SuggestionsDTO;
import com.greentrack.backend.model.Invoice;
import com.greentrack.backend.model.User;
import com.greentrack.backend.repository.InvoiceRepository;
import com.greentrack.backend.service.InvoiceService;

/**
 * Regression tests: a failed AI analysis must reach the app as an error,
 * never as a 200 with placeholder bill data.
 */
class InvoiceControllerTest {

    private final InvoiceService invoiceService = mock(InvoiceService.class);
    private final InvoiceRepository invoiceRepository = mock(InvoiceRepository.class);
    private final InvoiceController controller = new InvoiceController(invoiceService, invoiceRepository);
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

        ResponseEntity<SuggestionsDTO> response = controller.uploadTest(bill, null);

        assertEquals(HttpStatus.BAD_GATEWAY, response.getStatusCode());
        assertEquals(0.0, response.getBody().getConsumptionKwh());
        assertNull(response.getBody().getPeriod()); // no "Janeiro 2024" placeholder
    }

    @Test
    void invalidAiResponseReturns502() throws Exception {
        when(invoiceService.processInvoice(any())).thenReturn(withStatus("error_ai_invalid_response"));

        assertEquals(HttpStatus.BAD_GATEWAY, controller.uploadTest(bill, null).getStatusCode());
    }

    @Test
    void readabilityWarningStays200SoTheAppCanShowTips() throws Exception {
        when(invoiceService.processInvoice(any())).thenReturn(withStatus("warning_unreadable"));

        assertEquals(HttpStatus.OK, controller.uploadTest(bill, null).getStatusCode());
    }

    @Test
    void successReturns200WithData() throws Exception {
        SuggestionsDTO ok = withStatus("success");
        ok.setConsumptionKwh(245.0);
        when(invoiceService.processInvoice(any())).thenReturn(ok);

        ResponseEntity<SuggestionsDTO> response = controller.uploadTest(bill, null);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(245.0, response.getBody().getConsumptionKwh());
    }

    @Test
    void onlyTheRealUploadEndpointsExist() {
        // The old debug endpoints logged request headers (including the login token).
        Set<String> paths = Arrays.stream(InvoiceController.class.getDeclaredMethods())
                .filter(m -> m.isAnnotationPresent(PostMapping.class))
                .flatMap(m -> Arrays.stream(m.getAnnotation(PostMapping.class).value()))
                .collect(Collectors.toSet());

        assertEquals(Set.of("/upload", "/upload-test"), paths);
    }

    @Test
    void successfulAnalysisIsSavedForTheUser() throws Exception {
        User user = new User();
        user.setEmail("ana@example.pt");
        SuggestionsDTO ok = withStatus("success");
        ok.setPeriod("Janeiro 2026");
        ok.setConsumptionKwh(245.0);
        ok.setTotalAmount(61.3);
        when(invoiceService.processInvoice(any())).thenReturn(ok);

        controller.uploadTest(bill, user);

        verify(invoiceRepository).save(argThat(i -> i.getUser() == user
                && "Janeiro 2026".equals(i.getPeriod())
                && i.getConsumptionKwh() == 245.0
                && i.getTotalAmount() == 61.3
                && i.getUploadedAt() != null));
    }

    @Test
    void failedAnalysisIsNotSaved() throws Exception {
        when(invoiceService.processInvoice(any())).thenReturn(withStatus("error_ai_unavailable"));

        controller.uploadTest(bill, new User());

        verify(invoiceRepository, never()).save(any());
    }

    @Test
    void comparesWithTheUsersPreviousBill() throws Exception {
        User user = new User();
        Invoice previous = new Invoice();
        previous.setConsumptionKwh(200.0);
        previous.setTotalAmount(50.0);
        when(invoiceRepository.findByUserOrderByUploadedAtDesc(user)).thenReturn(List.of(previous));
        SuggestionsDTO ok = withStatus("success");
        ok.setConsumptionKwh(245.0);
        ok.setTotalAmount(45.0);
        when(invoiceService.processInvoice(any())).thenReturn(ok);

        SuggestionsDTO body = controller.uploadTest(bill, user).getBody();

        assertEquals(22.5, body.getComparisonPreviousMonth().consumptionDifference());
        assertEquals(-10.0, body.getComparisonPreviousMonth().amountDifference());
    }

    @Test
    void firstBillHasNoComparison() throws Exception {
        User user = new User();
        when(invoiceRepository.findByUserOrderByUploadedAtDesc(user)).thenReturn(List.of());
        when(invoiceService.processInvoice(any())).thenReturn(withStatus("success"));

        assertNull(controller.uploadTest(bill, user).getBody().getComparisonPreviousMonth());
    }

    @Test
    void percentChangeSkipsAZeroBaseline() {
        assertNull(InvoiceController.percentChange(0, 100));
        assertEquals(0.0, InvoiceController.percentChange(80, 80));
    }
}
