package com.greentrack.backend.controller;


import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.greentrack.backend.dto.SuggestionsDTO;
import com.greentrack.backend.service.InvoiceService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.Part;
import java.util.List;



@RestController
@RequestMapping("/api/invoices")
public class InvoiceController {

    private final InvoiceService invoiceService;

    public InvoiceController(InvoiceService invoiceService) {
        this.invoiceService = invoiceService;
    }

    @PostMapping("/upload")
    public ResponseEntity<SuggestionsDTO> uploadInvoice(@RequestParam("file") MultipartFile file) {
        try {
            System.out.println("Recebido arquivo: " + file.getOriginalFilename() + " (" + file.getSize() + " bytes)");
            
            if (file.isEmpty()) {
                System.out.println("Arquivo está vazio!");
                return ResponseEntity.badRequest().build();
            }
            
            SuggestionsDTO suggestions = invoiceService.processInvoice(file);
            System.out.println("Processamento concluído com sucesso");
            return ResponseEntity.ok(suggestions);
        } catch (Exception e) {
            System.err.println("Erro no upload: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/test-upload")
    public ResponseEntity<String> testUpload(@RequestParam("file") MultipartFile file) {
        try {
            System.out.println("=== TESTE DE UPLOAD ===");
            System.out.println("Nome do arquivo: " + file.getOriginalFilename());
            System.out.println("Tamanho: " + file.getSize() + " bytes");
            System.out.println("Tipo de conteúdo: " + file.getContentType());
            System.out.println("=======================");
            
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body("Arquivo vazio");
            }
            
            return ResponseEntity.ok("Upload teste OK! Arquivo: " + file.getOriginalFilename() + " (" + file.getSize() + " bytes)");
        } catch (Exception e) {
            System.err.println("Erro no teste de upload: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erro: " + e.getMessage());
        }
    }

    @PostMapping("/debug-upload")
    public ResponseEntity<String> debugUpload(
            @RequestParam(value = "file", required = false) MultipartFile file,
            HttpServletRequest request) {
        try {
            System.out.println("=== DEBUG UPLOAD ===");
            System.out.println("Content-Type: " + request.getContentType());
            System.out.println("Content-Length: " + request.getContentLength());
            System.out.println("Method: " + request.getMethod());
            
            // Listar todos os headers
            System.out.println("Headers recebidos:");
            request.getHeaderNames().asIterator().forEachRemaining(headerName -> {
                System.out.println("  " + headerName + ": " + request.getHeader(headerName));
            });
            
            if (file == null) {
                System.out.println("Arquivo é null - parâmetro 'file' não encontrado");
                
                // Listar todos os parâmetros recebidos
                System.out.println("Parâmetros recebidos:");
                request.getParameterMap().forEach((key, values) -> {
                    System.out.println("  " + key + ": " + String.join(", ", values));
                });
                
                // Tentar listar parts multipart se existirem
                try {
                    System.out.println("Parts multipart:");
                    for (Part part : request.getParts()) {
                        System.out.println("  Nome: " + part.getName());
                        System.out.println("  Content-Type: " + part.getContentType());
                        System.out.println("  Tamanho: " + part.getSize());
                        System.out.println("  Filename: " + part.getSubmittedFileName());
                        
                        // Tentar ler o conteúdo da part
                        if (part.getName().equals("file")) {
                            try {
                                byte[] content = part.getInputStream().readAllBytes();
                                System.out.println("  Conteúdo (primeiros 50 chars): " + 
                                    new String(content, 0, Math.min(50, content.length)));
                            } catch (Exception e) {
                                System.out.println("  Erro ao ler conteúdo: " + e.getMessage());
                            }
                        }
                    }
                } catch (Exception e) {
                    System.out.println("  Erro ao acessar parts: " + e.getMessage());
                }
                
                return ResponseEntity.badRequest().body("Parâmetro 'file' não encontrado, mas parts multipart detectadas");
            }
            
            System.out.println("Arquivo recebido com sucesso!");
            System.out.println("Nome: " + file.getOriginalFilename());
            System.out.println("Tamanho: " + file.getSize());
            System.out.println("Tipo: " + file.getContentType());
            System.out.println("Vazio?: " + file.isEmpty());
            
            return ResponseEntity.ok("Debug OK! Arquivo: " + file.getOriginalFilename() + " (" + file.getSize() + " bytes)");
        } catch (Exception e) {
            System.err.println("Erro no debug: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erro: " + e.getMessage());
        }
    }

    @PostMapping("/upload-alternative")
    public ResponseEntity<SuggestionsDTO> uploadAlternative(HttpServletRequest request) {
        try {
            System.out.println("=== UPLOAD ALTERNATIVO ===");
            
            // Processar parts multipart manualmente
            for (Part part : request.getParts()) {
                if ("file".equals(part.getName())) {
                    System.out.println("Part 'file' encontrada:");
                    System.out.println("  Filename: " + part.getSubmittedFileName());
                    System.out.println("  Content-Type: " + part.getContentType());
                    System.out.println("  Tamanho: " + part.getSize());
                    
                    if (part.getSize() > 15) { // Só processar se não for o objeto serializado
                        // Converter Part para MultipartFile
                        MultipartFile multipartFile = new MultipartFile() {
                            @Override
                            public String getName() { return part.getName(); }
                            @Override
                            public String getOriginalFilename() { return part.getSubmittedFileName(); }
                            @Override
                            public String getContentType() { return part.getContentType(); }
                            @Override
                            public boolean isEmpty() { return part.getSize() == 0; }
                            @Override
                            public long getSize() { return part.getSize(); }
                            @Override
                            public byte[] getBytes() throws java.io.IOException { 
                                return part.getInputStream().readAllBytes(); 
                            }
                            @Override
                            public java.io.InputStream getInputStream() throws java.io.IOException { 
                                return part.getInputStream(); 
                            }
                            @Override
                            public void transferTo(java.io.File dest) throws java.io.IOException, IllegalStateException {
                                try (java.io.FileOutputStream fos = new java.io.FileOutputStream(dest)) {
                                    part.getInputStream().transferTo(fos);
                                }
                            }
                        };
                        
                        SuggestionsDTO suggestions = invoiceService.processInvoice(multipartFile);
                        return ResponseEntity.ok(suggestions);
                    } else {
                        return ResponseEntity.badRequest().body(null);
                    }
                }
            }
            
            return ResponseEntity.badRequest().body(null);
        } catch (Exception e) {
            System.err.println("Erro no upload alternativo: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @PostMapping("/upload-web")
    public ResponseEntity<SuggestionsDTO> uploadWeb(@RequestParam("file") MultipartFile file) {
        try {
            System.out.println("=== UPLOAD WEB ===");
            System.out.println("Recebido arquivo web: " + file.getOriginalFilename() + " (" + file.getSize() + " bytes)");
            System.out.println("Content-Type: " + file.getContentType());
            
            if (file.isEmpty()) {
                System.out.println("Arquivo está vazio!");
                return ResponseEntity.badRequest().body(null);
            }
            
            // Processar com o serviço normal
            SuggestionsDTO suggestions = invoiceService.processInvoice(file);
            System.out.println("Processamento web concluído com sucesso");
            return ResponseEntity.ok(suggestions);
            
        } catch (Exception e) {
            System.err.println("Erro no upload web: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @PostMapping("/upload-test")
    public ResponseEntity<SuggestionsDTO> uploadTest(@RequestParam("file") MultipartFile file) {
        try {
            System.out.println("=== UPLOAD TESTE - TENTANDO AI AGENT PRIMEIRO ===");
            System.out.println("Arquivo: " + file.getOriginalFilename() + " (" + file.getSize() + " bytes)");
            
            // PRIMEIRO: Tentar processar com AI agent
            try {
                System.out.println("🤖 Tentando processar com AI agent...");
                SuggestionsDTO aiResult = invoiceService.processInvoice(file);
                
                // Verificar se o AI agent retornou dados válidos
                if (aiResult != null) {
                    // Verificar se há warning de legibilidade
                    if ("warning_unreadable".equals(aiResult.getProcessingStatus())) {
                        System.out.println("⚠️ WARNING: Fatura não legível detectada pelo AI agent");
                        System.out.println("Detalhes: " + aiResult.getReadabilityCheck());
                        // Retornar warning mesmo assim para que o frontend possa mostrar
                        return ResponseEntity.ok(aiResult);
                    }
                    
                    // Verificar se há dados válidos de consumo
                    if (aiResult.getConsumptionKwh() > 0) {
                        System.out.println("✅ AI Agent funcionou! Dados extraídos com sucesso");
                        System.out.println("Consumo: " + aiResult.getConsumptionKwh() + " kWh");
                        System.out.println("Valor: €" + aiResult.getTotalAmount());
                        return ResponseEntity.ok(aiResult);
                    } else {
                        System.out.println("⚠️ AI Agent retornou dados vazios/inválidos");
                    }
                } else {
                    System.out.println("⚠️ AI Agent retornou resultado nulo");
                }
                
            } catch (Exception aiError) {
                System.err.println("❌ Erro no AI Agent: " + aiError.getMessage());
            }
            
            // FALLBACK: Se AI agent falhou, usar dados mock
            System.out.println("🔄 Usando dados FALLBACK mock...");
            SuggestionsDTO mockData = new SuggestionsDTO();
            
            // Sugestões formatadas
            mockData.setSuggestions(List.of(
                "[TARIFA] Mude para tarifa bi-horária: Com seu perfil pode poupar €12/mês (Poupança: €12.00/mês)",
                "[CONSUMO] Reduza standby: Desligue aparelhos em standby (Poupança: €8.00/mês)",
                "[SUSTENTABILIDADE] Lâmpadas LED: Substitua por LED para eficiência (Poupança: €5.00/mês)"
            ));
            
            // Dados da análise COMPLETOS
            mockData.setPeriod("Janeiro 2024");
            mockData.setConsumptionKwh(245.5);
            mockData.setTotalAmount(89.47);
            mockData.setAverageDaily(7.9);
            mockData.setTariffType("simples");
            mockData.setContractedPower(6.9);
            mockData.setUploadDate(java.time.LocalDateTime.now().toString());
            mockData.setProcessingStatus("fallback_mock");
            
            System.out.println("✅ Retornando dados mock como fallback");
            return ResponseEntity.ok(mockData);
            
        } catch (Exception e) {
            System.err.println("❌ Erro geral no teste: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
}

