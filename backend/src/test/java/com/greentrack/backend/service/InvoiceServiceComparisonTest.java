package com.greentrack.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;

import com.greentrack.backend.dto.SuggestionsDTO;

/** As ofertas da ERSE passam do serviço de IA para a app sem mudar. */
class InvoiceServiceComparisonTest {

    private SuggestionsDTO process(String aiReply) throws Exception {
        InvoiceService service = new InvoiceService();
        ReflectionTestUtils.setField(service, "aiServiceUrl", "http://ai");
        RestTemplate rest = (RestTemplate) ReflectionTestUtils.getField(service, "restTemplate");
        MockRestServiceServer.bindTo(rest).build()
                .expect(requestTo("http://ai/ai/suggestions"))
                .andRespond(withSuccess(aiReply, MediaType.APPLICATION_JSON));
        return service.processInvoice(new MockMultipartFile("file", "f.pdf", "application/pdf", new byte[] {1}));
    }

    @Test
    void supplierComparisonIsPassedThrough() throws Exception {
        SuggestionsDTO dto = process("""
                {"processingStatus":"success","suggestions":[],"analysis_data":{"period":"Jan","consumptionKwh":245,
                "totalAmount":61.3,"tariffType":"simples","contractedPower":6.9,
                "supplierComparison":{"offers":[{"supplier":"EDPC","estimatedTotal":59.09,"saving":2.21}]}}}""");
        assertEquals("EDPC", dto.getSupplierComparison().path("offers").get(0).path("supplier").asText());
        assertEquals(2.21, dto.getSupplierComparison().path("offers").get(0).path("saving").asDouble());
    }

    @Test
    void noComparisonWhenTheAiServiceSendsNone() throws Exception {
        SuggestionsDTO dto = process("""
                {"processingStatus":"success","suggestions":[],"analysis_data":{"period":"Jan","consumptionKwh":245,
                "totalAmount":61.3,"tariffType":"simples","contractedPower":6.9}}""");
        assertNull(dto.getSupplierComparison());
    }
}
