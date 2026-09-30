package com.mediamais.platform.common.response;

import java.time.OffsetDateTime;
import java.util.Map;

public record ErrorResponse(
    int status,
    String error,
    String code,
    String message,
    Map<String, Object> details,
    OffsetDateTime timestamp
) {
    public static ErrorResponse of(int status, String error, String code, String message) {
        return new ErrorResponse(status, error, code, message, null, OffsetDateTime.now());
    }

    public static ErrorResponse of(int status, String error, String code, String message, Map<String, Object> details) {
        return new ErrorResponse(status, error, code, message, details, OffsetDateTime.now());
    }
}
