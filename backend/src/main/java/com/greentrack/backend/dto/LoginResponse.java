// src/main/java/com/greentrack/dto/LoginResponse.java
package com.greentrack.backend.dto;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class LoginResponse {
    private String token;
}