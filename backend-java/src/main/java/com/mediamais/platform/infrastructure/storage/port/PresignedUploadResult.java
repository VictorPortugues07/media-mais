package com.mediamais.platform.infrastructure.storage.port;

public record PresignedUploadResult(
    String uploadUrl,
    String r2Key,
    String publicUrl,
    long expiraEmSegundos
) {}
