package com.mediamais.platform.infrastructure.storage.adapter;

import com.mediamais.platform.infrastructure.storage.port.PresignedUploadResult;
import com.mediamais.platform.infrastructure.storage.port.StorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.time.Duration;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CloudflareR2StorageAdapter implements StorageService {

    private final S3Presigner s3Presigner;
    private final S3Client s3Client;

    @Value("${cloudflare.r2.bucket-name}")
    private String bucketName;

    @Value("${cloudflare.r2.cdn-base-url}")
    private String cdnBaseUrl;

    @Override
    public PresignedUploadResult gerarPresignedUploadUrl(String contentType, long tamanhoBytes, String extensao) {
        String cleanExt = extensao.startsWith(".") ? extensao.substring(1) : extensao;
        String r2Key = String.format("midias/%s.%s", UUID.randomUUID(), cleanExt);
        Duration ttl = Duration.ofMinutes(10);

        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(r2Key)
                .contentType(contentType)
                .contentLength(tamanhoBytes)
                .build();

        PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                .signatureDuration(ttl)
                .putObjectRequest(putObjectRequest)
                .build();

        PresignedPutObjectRequest presigned = s3Presigner.presignPutObject(presignRequest);
        String publicUrl = getPublicUrl(r2Key);

        log.info("Presigned URL gerada para Cloudflare R2: key={}, ttl=10min", r2Key);

        return new PresignedUploadResult(
                presigned.url().toString(),
                r2Key,
                publicUrl,
                ttl.toSeconds()
        );
    }

    @Override
    public String getPublicUrl(String r2Key) {
        String base = cdnBaseUrl.endsWith("/") ? cdnBaseUrl.substring(0, cdnBaseUrl.length() - 1) : cdnBaseUrl;
        return String.format("%s/%s", base, r2Key);
    }

    @Override
    public void deletarObjeto(String r2Key) {
        try {
            DeleteObjectRequest deleteRequest = DeleteObjectRequest.builder()
                    .bucket(bucketName)
                    .key(r2Key)
                    .build();
            s3Client.deleteObject(deleteRequest);
            log.info("Objeto deletado do Cloudflare R2: key={}", r2Key);
        } catch (Exception e) {
            log.error("Erro ao deletar objeto do Cloudflare R2: key={}", r2Key, e);
        }
    }
}
