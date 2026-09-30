package com.mediamais.platform.modules.billing.adapter;

import com.mediamais.platform.common.exception.BusinessException;
import com.mediamais.platform.modules.billing.port.BillingCreationCommand;
import com.mediamais.platform.modules.billing.port.BillingCreationResult;
import com.mediamais.platform.modules.billing.port.PaymentGateway;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AbacatePayGatewayAdapter implements PaymentGateway {

    private final RestClient abacatePayRestClient;

    @Value("${abacatepay.webhook-secret}")
    private String webhookSecret;

    @Override
    public BillingCreationResult criarCobranca(BillingCreationCommand cmd) {
        log.info("Criando cobrança Pix na AbacatePay para anúncio #{}", cmd.anuncioId());

        Map<String, Object> produto = Map.of(
            "externalId", "ANUNCIO-" + cmd.anuncioId(),
            "name", String.format("Cota Mensal DOOH - %s (%s)", cmd.nomePonto(), cmd.tier()),
            "quantity", 1,
            "price", cmd.valorCentavos()
        );

        Map<String, Object> metadata = Map.of(
            "anuncioId", cmd.anuncioId(),
            "pontoMidiaId", cmd.pontoMidiaId(),
            "anuncianteId", cmd.anuncianteId()
        );

        Map<String, Object> requestBody = Map.of(
            "frequency", "ONE_TIME",
            "methods", List.of("PIX"),
            "products", List.of(produto),
            "returnUrl", cmd.returnUrl(),
            "completionUrl", cmd.completionUrl(),
            "metadata", metadata
        );

        try {
            Map<String, Object> response = abacatePayRestClient.post()
                    .uri("/billing/create")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestBody)
                    .retrieve()
                    .body(new ParameterizedTypeReference<>() {});

            if (response == null || !response.containsKey("data")) {
                throw new BusinessException("Resposta inválida do gateway de pagamentos");
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> data = (Map<String, Object>) response.get("data");

            String billingId = (String) data.get("id");
            String url = (String) data.get("url");

            @SuppressWarnings("unchecked")
            Map<String, Object> pixData = (Map<String, Object>) data.get("pix");
            String qrCode = pixData != null ? (String) pixData.get("qrCode") : null;
            String copiaCola = pixData != null ? (String) pixData.get("code") : null;

            log.info("Fatura AbacatePay criada com sucesso: billingId={}", billingId);

            return new BillingCreationResult(
                billingId,
                url,
                qrCode,
                copiaCola,
                cmd.valorCentavos(),
                "PENDENTE"
            );
        } catch (Exception e) {
            log.error("Erro ao chamar API AbacatePay: {}", e.getMessage(), e);
            throw new BusinessException("Falha na comunicação com o gateway de pagamento: " + e.getMessage());
        }
    }

    @Override
    public boolean validarAssinaturaWebhook(String rawPayload, String signatureHeader) {
        if (signatureHeader == null || signatureHeader.isBlank() || webhookSecret == null) {
            return false;
        }

        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(webhookSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] expectedBytes = mac.doFinal(rawPayload.getBytes(StandardCharsets.UTF_8));
            String expectedSignature = HexFormat.of().formatHex(expectedBytes);

            return MessageDigest.isEqual(
                expectedSignature.getBytes(StandardCharsets.UTF_8),
                signatureHeader.trim().getBytes(StandardCharsets.UTF_8)
            );
        } catch (Exception e) {
            log.error("Erro na verificação de assinatura HMAC: {}", e.getMessage());
            return false;
        }
    }
}
