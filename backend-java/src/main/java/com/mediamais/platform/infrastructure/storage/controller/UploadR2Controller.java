package com.mediamais.platform.infrastructure.storage.controller;

import com.mediamais.platform.common.exception.BusinessException;
import com.mediamais.platform.common.response.ApiResponse;
import com.mediamais.platform.infrastructure.storage.port.PresignedUploadResult;
import com.mediamais.platform.infrastructure.storage.port.StorageService;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/upload")
@RequiredArgsConstructor
public class UploadR2Controller {

    private final StorageService storageService;

    private static final List<String> MIME_TYPES_PERMITIDOS = List.of(
        "video/mp4",
        "video/webm",
        "image/jpeg",
        "image/png",
        "image/webp"
    );

    public record PresignRequest(
        @NotBlank String nomeOriginal,
        @NotBlank String contentType,
        @NotNull Long tamanhoBytes
    ) {}

    @PostMapping("/presign")
    public ResponseEntity<ApiResponse<PresignedUploadResult>> gerarPresignedUrl(@RequestBody PresignRequest req) {
        if (!MIME_TYPES_PERMITIDOS.contains(req.contentType().toLowerCase())) {
            throw new BusinessException("Formato de arquivo não suportado. Utilize MP4, WebM, PNG, JPG ou WebP.");
        }

        long limiteMaximo = req.contentType().startsWith("video/") ? 100 * 1024 * 1024L : 10 * 1024 * 1024L;
        if (req.tamanhoBytes() > limiteMaximo) {
            throw new BusinessException("Arquivo excede o tamanho limite permitido.");
        }

        String extensao = "";
        int dotIndex = req.nomeOriginal().lastIndexOf('.');
        if (dotIndex > 0) {
            extensao = req.nomeOriginal().substring(dotIndex + 1);
        }

        PresignedUploadResult result = storageService.gerarPresignedUploadUrl(
            req.contentType(),
            req.tamanhoBytes(),
            extensao
        );

        return ResponseEntity.ok(ApiResponse.ok("URL pré-assinada gerada com sucesso", result));
    }
}
