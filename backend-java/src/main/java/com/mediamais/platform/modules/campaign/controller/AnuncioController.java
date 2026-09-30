package com.mediamais.platform.modules.campaign.controller;

import com.mediamais.platform.common.exception.BusinessException;
import com.mediamais.platform.common.exception.ResourceNotFoundException;
import com.mediamais.platform.common.response.ApiResponse;
import com.mediamais.platform.common.security.SecurityUtils;
import com.mediamais.platform.modules.billing.model.Cobranca;
import com.mediamais.platform.modules.billing.port.BillingCreationCommand;
import com.mediamais.platform.modules.billing.port.BillingCreationResult;
import com.mediamais.platform.modules.billing.port.PaymentGateway;
import com.mediamais.platform.modules.billing.repository.CobrancaRepository;
import com.mediamais.platform.modules.campaign.model.Anuncio;
import com.mediamais.platform.modules.campaign.model.StatusAnuncio;
import com.mediamais.platform.modules.campaign.model.TipoMidia;
import com.mediamais.platform.modules.campaign.repository.AnuncioRepository;
import com.mediamais.platform.modules.campaign.service.CapacityEngine;
import com.mediamais.platform.modules.establishment.model.Anunciante;
import com.mediamais.platform.modules.establishment.model.PontoMidia;
import com.mediamais.platform.modules.establishment.repository.AnuncianteRepository;
import com.mediamais.platform.modules.establishment.repository.PontoMidiaRepository;
import com.mediamais.platform.modules.establishment.service.PricingScoringService;
import com.mediamais.platform.modules.notification.model.Notificacao;
import com.mediamais.platform.modules.notification.model.TipoNotificacao;
import com.mediamais.platform.modules.notification.repository.NotificacaoRepository;
import com.mediamais.platform.modules.notification.service.NotificationEmitterService;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/anuncios")
@RequiredArgsConstructor
@Slf4j
public class AnuncioController {

    private final AnuncioRepository anuncioRepository;
    private final PontoMidiaRepository pontoMidiaRepository;
    private final AnuncianteRepository anuncianteRepository;
    private final CobrancaRepository cobrancaRepository;
    private final CapacityEngine capacityEngine;
    private final PricingScoringService pricingScoringService;
    private final PaymentGateway paymentGateway;
    private final NotificacaoRepository notificacaoRepository;
    private final NotificationEmitterService notificationEmitterService;

    public record AnuncioCreateRequest(
        @NotNull Long pontoMidiaId,
        @NotBlank String titulo,
        @NotBlank String descricao,
        @NotNull TipoMidia tipoMidia,
        @NotBlank String midiaUrl,
        @NotBlank String r2Key,
        int duracaoSegundos
    ) {}

    public record AprovarRequest(
        Boolean force
    ) {}

    public record RejeitarRequest(
        @NotBlank @Size(min = 5, message = "O motivo deve conter no mínimo 5 caracteres") String motivo
    ) {}

    @GetMapping
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> listarAnuncios() {
        Long userId = SecurityUtils.getCurrentUserId().orElse(null);
        boolean isAdmin = SecurityUtils.hasRole("ADMIN");

        List<Anuncio> anuncios;
        if (isAdmin || userId == null) {
            anuncios = anuncioRepository.findAll();
        } else {
            // Se for anunciante
            anuncios = anuncianteRepository.findByUserId(userId)
                    .map(an -> anuncioRepository.findByAnuncianteId(an.getId()))
                    .orElseGet(() ->
                        // Se for ponto
                        pontoMidiaRepository.findByUserId(userId)
                            .map(p -> anuncioRepository.findByPontoMidiaId(p.getId()))
                            .orElse(List.of())
                    );
        }

        List<Map<String, Object>> response = anuncios.stream().map(a -> Map.of(
            "id", a.getId(),
            "titulo", a.getTitulo(),
            "status", a.getStatus().name(),
            "duracaoSegundos", a.getDuracaoSegundos(),
            "tipoMidia", a.getTipoMidia().name(),
            "midiaUrl", a.getMidiaUrl(),
            "pontoEmpresa", a.getPontoMidia().getNomeEmpresa(),
            "anuncianteEmpresa", a.getAnunciante().getNomeEmpresa()
        )).toList();

        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @Transactional
    public ResponseEntity<ApiResponse<Map<String, Object>>> criarAnuncio(@RequestBody AnuncioCreateRequest req) {
        Long userId = SecurityUtils.getCurrentUserId()
                .orElseThrow(() -> new BusinessException("Usuário não autenticado", HttpStatus.UNAUTHORIZED, "UNAUTHORIZED"));

        Anunciante anunciante = anuncianteRepository.findByUserId(userId)
                .orElseThrow(() -> new BusinessException("Perfil de anunciante não encontrado"));

        PontoMidia ponto = pontoMidiaRepository.findById(req.pontoMidiaId())
                .orElseThrow(() -> new ResourceNotFoundException("Ponto de mídia não encontrado"));

        Anuncio anuncio = Anuncio.builder()
                .anunciante(anunciante)
                .pontoMidia(ponto)
                .titulo(req.titulo())
                .descricao(req.descricao())
                .tipoMidia(req.tipoMidia())
                .midiaUrl(req.midiaUrl())
                .r2Key(req.r2Key())
                .duracaoSegundos(req.duracaoSegundos() > 0 ? req.duracaoSegundos() : 10)
                .status(StatusAnuncio.PENDENTE)
                .build();

        anuncioRepository.save(anuncio);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Campanha submetida para moderação", Map.of("id", anuncio.getId(), "status", "PENDENTE")));
    }

    @PatchMapping("/{id}/aprovar")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ResponseEntity<ApiResponse<Map<String, Object>>> aprovarAnuncio(
        @PathVariable Long id,
        @RequestBody(required = false) AprovarRequest req
    ) {
        Anuncio anuncio = anuncioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Anúncio não encontrado"));

        if (anuncio.getStatus() == StatusAnuncio.REJEITADO) {
            throw new BusinessException("Anúncios rejeitados não podem ser aprovados diretamente. É necessário criar uma nova solicitação.");
        }

        boolean force = req != null && Boolean.TRUE.equals(req.force());
        PontoMidia ponto = anuncio.getPontoMidia();

        // 1. Aplica o Slot Hold (Reserva de vaga de 60 min)
        capacityEngine.reservarSlotHold(anuncio, 60, force);

        // 2. Calcula valor da cota baseado no Tier do ponto
        PricingScoringService.TierInfo tierInfo = pricingScoringService.determinarTier(
            ponto.getScorePonderado() != null ? ponto.getScorePonderado() : 3.5
        );

        // 3. Emite a Cobrança Pix via AbacatePay
        BillingCreationCommand cmd = new BillingCreationCommand(
            anuncio.getId(),
            anuncio.getAnunciante().getId(),
            ponto.getId(),
            anuncio.getTitulo(),
            ponto.getNomeEmpresa(),
            tierInfo.tier(),
            tierInfo.cotaMensalCentavos(),
            anuncio.getAnunciante().getResponsavel(),
            anuncio.getAnunciante().getUser().getEmail(),
            anuncio.getAnunciante().getWhatsapp(),
            "https://mediamais.com.br/anunciante/anuncios/" + anuncio.getId(),
            "https://mediamais.com.br/anunciante/anuncios/" + anuncio.getId() + "?sucesso=true"
        );

        BillingCreationResult billingResult = paymentGateway.criarCobranca(cmd);

        Cobranca cobranca = Cobranca.builder()
                .anuncio(anuncio)
                .anunciante(anuncio.getAnunciante())
                .pontoMidia(ponto)
                .abacateBillingId(billingResult.abacateBillingId())
                .valorCentavos(tierInfo.cotaMensalCentavos())
                .repassePontoCentavos(tierInfo.repassePontoCentavos())
                .urlCheckout(billingResult.urlCheckout())
                .pixQrCode(billingResult.pixQrCode())
                .pixCopiaCola(billingResult.pixCopiaCola())
                .build();

        cobrancaRepository.save(cobranca);

        // 4. Notifica o Anunciante para efetuar o Pix
        Notificacao notif = Notificacao.builder()
                .user(anuncio.getAnunciante().getUser())
                .tipo(TipoNotificacao.ANUNCIO_APROVADO)
                .titulo("Campanha Aprovada - Aguardando Pagamento Pix")
                .mensagem(String.format("Sua campanha \"%s\" foi aprovada! Pague a cota de R$ %.2f em até 60 minutos para veicular na TV.",
                        anuncio.getTitulo(), tierInfo.cotaMensalReais()))
                .build();

        notificacaoRepository.save(notif);
        notificationEmitterService.emitirNotificacao(notif);

        return ResponseEntity.ok(ApiResponse.ok("Campanha aprovada com Slot Hold de 60m", Map.of(
            "anuncioId", anuncio.getId(),
            "status", anuncio.getStatus().name(),
            "reservaExpiraEm", anuncio.getReservaExpiraEm().toString(),
            "pixCopiaCola", billingResult.pixCopiaCola() != null ? billingResult.pixCopiaCola() : "",
            "urlCheckout", billingResult.urlCheckout() != null ? billingResult.urlCheckout() : ""
        )));
    }

    @PatchMapping("/{id}/rejeitar")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ResponseEntity<ApiResponse<Map<String, Object>>> rejeitarAnuncio(
        @PathVariable Long id,
        @RequestBody RejeitarRequest req
    ) {
        Anuncio anuncio = anuncioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Anúncio não encontrado"));

        anuncio.setStatus(StatusAnuncio.REJEITADO);
        anuncio.setMotivoRejeicao(req.motivo());
        anuncio.setReservaExpiraEm(null);
        anuncioRepository.save(anuncio);

        Notificacao notif = Notificacao.builder()
                .user(anuncio.getAnunciante().getUser())
                .tipo(TipoNotificacao.ANUNCIO_REJEITADO)
                .titulo("Campanha Rejeitada pela Moderação")
                .mensagem(String.format("Sua campanha \"%s\" foi rejeitada. Motivo: %s", anuncio.getTitulo(), req.motivo()))
                .build();

        notificacaoRepository.save(notif);
        notificationEmitterService.emitirNotificacao(notif);

        return ResponseEntity.ok(ApiResponse.ok("Anúncio rejeitado com justificativa registrada", Map.of("id", anuncio.getId())));
    }
}
