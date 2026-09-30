---
name: skill-mediamais-cloudflare-r2
description: Arquitetura de armazenamento e distribuição de mídias de vídeo e imagem utilizando Cloudflare R2 com API S3 compatível, URLs pré-assinadas e CDN sem custo de tráfego de saída.
---

# Skill: Armazenamento e CDN com Cloudflare R2 (Media+)

Esta skill descreve o padrão arquitetural para upload, armazenamento e entrega de conteúdos de vídeo e imagem utilizando o **Cloudflare R2**.

---

## 1. Por que Cloudflare R2?
- **Zero Custo de Tráfego de Saída (Zero Egress Fees):** Smart TVs reproduzindo vídeos 12 a 24 horas por dia consomem terabytes de banda por mês. O Cloudflare R2 não cobra taxa de transferência de saída de dados.
- **Compatibilidade com API S3:** Utiliza as bibliotecas padrão da indústria (como AWS SDK for Java v2) com configuração simples de endpoint customizado.
- **Integração com Cloudflare CDN:** Entrega de baixa latência em todo o território nacional, com suporte nativo a HTTP/2, HTTP/3 e Range Requests (HTTP 206) para streaming de vídeo sem engasgos.

---

## 2. Arquitetura de Upload com Presigned URLs

```
Cliente (Web/App)                  Backend Java                   Cloudflare R2 Bucket
       │                                │                                │
       │── 1. POST /api/upload/presign ─>│                                │
       │   (filename, contentType, size)│── 2. Gera URL Assinada S3 ─────>│
       │<── 3. Retorna URL + Key ────────│   (TTL: 10 minutos)            │
       │                                                                 │
       │── 4. PUT direto na Presigned URL ──────────────────────────────>│
       │   (Arquivo binário de vídeo/imagem)                             │
       │<── 5. 200 OK ───────────────────────────────────────────────────│
       │                                                                 │
       │── 6. Salva Campanha com a Key/URL Pública no Backend ──────────>│
```

---

## 3. Configuração do SDK no Java (Spring Boot)

### 3.1 Dependência Maven
```xml
<dependency>
    <groupId>software.amazon.awssdk</groupId>
    <artifactId>s3</artifactId>
    <version>2.25.x</version>
</dependency>
```

### 3.2 Bean de Configuração (`R2StorageConfig.java`)
```java
@Configuration
public class R2StorageConfig {

    @Value("${cloudflare.r2.account-id}")
    private String accountId;

    @Value("${cloudflare.r2.access-key}")
    private String accessKey;

    @Value("${cloudflare.r2.secret-key}")
    private String secretKey;

    @Bean
    public S3Presigner s3Presigner() {
        String endpoint = String.format("https://%s.r2.cloudflarestorage.com", accountId);
        return S3Presigner.builder()
                .endpointOverride(URI.create(endpoint))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(accessKey, secretKey)))
                .region(Region.of("auto"))
                .build();
    }
}
```

### 3.3 Geração de URL Pré-Assinada para Upload
```java
public PresignedUrlResponse gerarUrlUpload(String contentType, long fileSize) {
    String key = "midias/" + UUID.randomUUID() + "-" + System.currentTimeMillis();

    PutObjectRequest objectRequest = PutObjectRequest.builder()
            .bucket(bucketName)
            .key(key)
            .contentType(contentType)
            .contentLength(fileSize)
            .build();

    PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
            .signatureDuration(Duration.ofMinutes(10))
            .putObjectRequest(objectRequest)
            .build();

    PresignedPutObjectRequest presigned = s3Presigner.presignPutObject(presignRequest);

    return new PresignedUrlResponse(
            presigned.url().toString(),
            key,
            publicCdnBaseUrl + "/" + key
    );
}
```

---

## 4. Consumo de Vídeo pelas Smart TVs
- O player web na Smart TV consome a URL pública da CDN:
  `https://media.mediamais.com.br/midias/984b3f...mp4`
- Cabeçalhos recomendados na CDN:
  - `Accept-Ranges: bytes`
  - `Cache-Control: public, max-age=604800, immutable`
  - `Access-Control-Allow-Origin: *`

---

## 5. Padrão Estrito de Normalização de Vídeo para Smart TVs
Para evitar travamentos de decodificação (`MEDIA_ERR_DECODE` ou tela preta) em navegadores Tizen/webOS:
- **Container:** MP4
- **Codec Vídeo:** H.264 / AVC Baseline ou Main Profile, Level 4.1
- **Resolução / Taxa:** 1080p máximo, 30fps fixos
- **Bitrate:** 4.000 a 6.000 kbps
- **Codec Áudio:** AAC-LC Stereo, 48kHz
- **Faststart:** `moov atom` obrigatoriamente no início do arquivo para buffering instantâneo.
