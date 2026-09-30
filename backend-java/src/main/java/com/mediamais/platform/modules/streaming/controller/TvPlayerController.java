package com.mediamais.platform.modules.streaming.controller;

import com.mediamais.platform.common.exception.BusinessException;
import com.mediamais.platform.common.response.ApiResponse;
import com.mediamais.platform.modules.campaign.model.Anuncio;
import com.mediamais.platform.modules.campaign.repository.AnuncioRepository;
import com.mediamais.platform.modules.establishment.model.PontoMidia;
import com.mediamais.platform.modules.establishment.repository.PontoMidiaRepository;
import com.mediamais.platform.modules.streaming.buffer.ProofOfPlayBatchBuffer;
import com.mediamais.platform.modules.streaming.model.RegistroExibicao;
import com.mediamais.platform.modules.streaming.service.HeartbeatCacheService;
import com.mediamais.platform.modules.streaming.service.TvPairingService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tv")
@RequiredArgsConstructor
@Slf4j
public class TvPlayerController {

    private final TvPairingService pairingService;
    private final HeartbeatCacheService heartbeatCacheService;
    private final ProofOfPlayBatchBuffer batchBuffer;
    private final PontoMidiaRepository pontoMidiaRepository;
    private final AnuncioRepository anuncioRepository;

    public record TelemetriaRequest(
        Long pontoId,
        String token,
        Long anuncioId,
        @Min(5) @Max(60) Integer duracaoSegundos,
        String tipoMidia,
        Boolean heartbeatOnly,
        Boolean offline,
        String deviceType,
        String screenResolution
    ) {}

    @GetMapping("/parear")
    public ResponseEntity<?> parearOuSincronizar(
        @RequestParam(required = false) String codigo,
        @RequestParam(required = false) Long pontoId,
        @RequestHeader(value = "x-tv-token", required = false) String tvTokenHeader,
        @RequestParam(value = "token", required = false) String tvTokenParam
    ) {
        String token = tvTokenHeader != null ? tvTokenHeader : tvTokenParam;

        // Caso 1: Sincronização periódica da playlist
        if (pontoId != null) {
            Long tokenPontoId = pairingService.validarTokenTV(token)
                    .orElseThrow(() -> new BusinessException("Acesso negado. Token de TV inválido ou expirado."));

            if (!tokenPontoId.equals(pontoId)) {
                throw new BusinessException("Token de TV não corresponde ao ponto solicitado.");
            }

            PontoMidia ponto = pontoMidiaRepository.findById(pontoId)
                    .orElseThrow(() -> new BusinessException("Ponto não encontrado."));

            List<Anuncio> playlist = anuncioRepository.findPlaylistAtiva(pontoId, OffsetDateTime.now());

            return ResponseEntity.ok(Map.of(
                "ponto", Map.of(
                    "id", ponto.getId(),
                    "nomeEmpresa", ponto.getNomeEmpresa(),
                    "status", ponto.getStatus().name()
                ),
                "anuncios", playlist.stream().map(a -> Map.of(
                    "id", a.getId(),
                    "titulo", a.getTitulo(),
                    "tipoMidia", a.getTipoMidia().name(),
                    "midiaUrl", a.getMidiaUrl(),
                    "duracaoSegundos", a.getDuracaoSegundos()
                )).toList()
            ));
        }

        // Caso 2: Pareamento inicial com código de 6 dígitos
        TvPairingService.PairingResult result = pairingService.parearPorCodigo(codigo);
        List<Anuncio> playlist = anuncioRepository.findPlaylistAtiva(result.ponto().getId(), OffsetDateTime.now());

        return ResponseEntity.ok(Map.of(
            "ponto", Map.of(
                "id", result.ponto().getId(),
                "nomeEmpresa", result.ponto().getNomeEmpresa(),
                "status", result.ponto().getStatus().name()
            ),
            "anuncios", playlist.stream().map(a -> Map.of(
                "id", a.getId(),
                "titulo", a.getTitulo(),
                "tipoMidia", a.getTipoMidia().name(),
                "midiaUrl", a.getMidiaUrl(),
                "duracaoSegundos", a.getDuracaoSegundos()
            )).toList(),
            "token", result.token()
        ));
    }

    @PostMapping("/telemetria")
    public ResponseEntity<ApiResponse<Map<String, Object>>> receberTelemetria(
        @RequestBody TelemetriaRequest request,
        @RequestHeader(value = "x-tv-token", required = false) String tvTokenHeader
    ) {
        String token = tvTokenHeader != null ? tvTokenHeader : request.token();
        Long tokenPontoId = pairingService.validarTokenTV(token)
                .orElseThrow(() -> new BusinessException("Token de TV inválido para telemetria."));

        if (!tokenPontoId.equals(request.pontoId())) {
            throw new BusinessException("Ponto de mídia não coincide com o token da TV.");
        }

        // 1. Sinal de Desconexão Graciosa (TV sendo desligada/fechada)
        if (Boolean.TRUE.equals(request.offline())) {
            heartbeatCacheService.marcarOffline(request.pontoId());
            return ResponseEntity.ok(ApiResponse.ok(Map.of("offline", true)));
        }

        // 2. Heartbeat de presença (L1 Cache em memória)
        heartbeatCacheService.registrarPulso(request.pontoId(), request.deviceType(), request.screenResolution());

        // 3. Prova de Veiculação (Proof of Play) em buffer
        if (!Boolean.TRUE.equals(request.heartbeatOnly()) && request.anuncioId() != null) {
            if ("MOBILE".equalsIgnoreCase(request.deviceType())) {
                throw new BusinessException("Telemetria não é aceita para dispositivos móveis.");
            }

            anuncioRepository.findById(request.anuncioId()).ifPresent(anuncio -> {
                RegistroExibicao registro = RegistroExibicao.builder()
                        .anuncio(anuncio)
                        .pontoMidia(anuncio.getPontoMidia())
                        .duracaoSegundos(request.duracaoSegundos() != null ? request.duracaoSegundos() : anuncio.getDuracaoSegundos())
                        .tipoMidia(anuncio.getTipoMidia())
                        .build();

                batchBuffer.enfileirarComprovacao(registro);
            });
        }

        return ResponseEntity.ok(ApiResponse.ok(Map.of("received", true)));
    }
}
