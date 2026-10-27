package com.greentrack.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.util.ReflectionTestUtils;

/** The AI service address comes from AI_SERVICE_URL, so it can run on another machine. */
@SpringBootTest(properties = "AI_SERVICE_URL=http://ai.internal:9000")
@ActiveProfiles("test")
class InvoiceServiceConfigTest {

    @Autowired InvoiceService invoiceService;

    @Test
    void aiServiceUrlComesFromTheEnvironment() {
        assertEquals("http://ai.internal:9000", ReflectionTestUtils.getField(invoiceService, "aiServiceUrl"));
    }
}
