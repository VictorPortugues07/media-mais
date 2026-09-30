package com.mediamais.platform.modules.billing.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mediamais.platform.common.exception.BusinessException;
import com.mediamais.platform.common.response.ApiResponse;
import com.mediamais.platform.modules.billing.model.Cobranca;
import com.mediamais.platform.modules.billing.model.StatusCobranca;
import com.mediamais.platform.modules.billing.port.PaymentGateway;
import com.mediamais.platform.modules.billing.repository.CobrancaRepository;
import com.mediamais.platform.modules.campaign.model.Anuncio;
import com.mediamais.platform.modules.campaign.repository.AnuncioRepository;
import com.mediamais.platform.modules.campaign.service.CapacityEngine;
import com.mediamais.platform.modules.notification.model.Notificacao;
import com.mediamais.platform.modules.notification.model.TipoNotificacao;
import com.mediamais.platform.modules.notification.repository.NotificacaoRepository;
import com.mediamais.platform.modules.notification.service.NotificationEmitterService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/webhooks")
@RequiredArgsConstructor
@Slf4j
public class WebhookAbacatePayController {

    private final PaymentGateway paymentGateway;
    private final CobrancaRepository cobrancaRepository;
    private final AnuncioRepository anuncioRepository;
    private final CapacityEngine capacityEngine;
    private final NotificacaoRepository notificacaoRepository;
    private final NotificationEmitterService notificationEmitterService;
    private final ObjectMapper objectMapper;

    @PostMapping("/abacatepay")
    @Transactional
    public ResponseEntity<?> receberWebhook(
        @RequestBody String rawPayload,
        @RequestHeader(value = "abacate-signature", required = false) String signature
    ) {
        log.info("Webhook recebido da AbacatePay");

        // 1. Validação de Assinatura Criptográfica HMAC-SHA256
        if (!paymentGateway.validarAssinaturaWebhook(rawPayload, signature)) {
            log.warn("Tentativa de webhook com assinatura HMAC inválida!");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Assinatura inválida"));
        }

        try {
            JsonNode root = objectMapper.readTree(rawPayload);
            String event = root.path("event").asText("");

            if ("billing.paid".equalsIgnoreCase(event)) {
                JsonNode data = root.path("data");
                String billingId = data.path("id").asText();
                String transactionId = data.path("transactionId").asText();

                Cobranca cobranca = cobrancaRepository.findByAbacateBillingId(billingId)
                        .orElseThrow(() -> new BusinessException("Cobrança não encontrada: " + billingId));

                // Idempotência
                if (cobranca.getStatus() == StatusCobranca.PAGO) {
                    log.info("Cobrança já processada anteriormente: {}", billingId);
                    return ResponseEntity.ok(ApiResponse.ok("Cobrança já processada", Map.of("id", billingId)));
                }

                cobranca.setStatus(StatusCobranca.PAGO);
                cobranca.setTransacaoId(transactionId);
                cobranca.setPagoEm(OffsetDateTime.now());
                cobrancaRepository.save(cobranca);

                // Ativar o Anúncio na Grade
                Anuncio anuncio = cobranca.getAnuncio();
                capacityEngine.ativarAnuncio(anuncio, false);

                // Emitir Notificação ao Anunciante
                Notificacao notif = Notificacao.builder()
                        .user(anuncio.getAnunciante().getUser())
                        .tipo(TipoNotificacao.PAGAMENTO_CONFIRMADO)
                        .titulo("Pagamento Confirmado")
                        .mensagem(String.format("Sua campanha \"%s\" foi confirmada e está ativa na tela da %s!",
                                anuncio.getTitulo(), anuncio.getPontoMidia().getNomeEmpresa()))
                        .build();

                notificacaoRepository.save(notif);
                notificationEmitterService.emitirNotificacao(notif);

                log.info("Campanha #{} ativada com sucesso após liquidação Pix!", anuncio.getId());
            }

            return ResponseEntity.ok(ApiResponse.ok("Webhook processado com sucesso", Map.of("received", true)));
        } catch (Exception e) {
            log.error("Erro ao processar payload do webhook: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }
}
