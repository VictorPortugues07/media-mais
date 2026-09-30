package com.mediamais.platform.modules.streaming.service;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.interfaces.DecodedJWT;
import com.mediamais.platform.common.exception.BusinessException;
import com.mediamais.platform.common.exception.ResourceNotFoundException;
import com.mediamais.platform.modules.establishment.model.PontoMidia;
import com.mediamais.platform.modules.establishment.model.StatusPonto;
import com.mediamais.platform.modules.establishment.repository.PontoMidiaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class TvPairingService {

    private final PontoMidiaRepository pontoMidiaRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${security.jwt.tv-secret}")
    private String tvSecret;

    public record PairingResult(
        PontoMidia ponto,
        String token
    ) {}

    @Transactional
    public String gerarCodigoRotativo(Long pontoId) {
        PontoMidia ponto = pontoMidiaRepository.findById(pontoId)
                .orElseThrow(() -> new ResourceNotFoundException("Ponto não encontrado"));

        int numero = 100_000 + secureRandom.nextInt(900_000);
        String codigo = String.valueOf(numero);

        ponto.setCodigoRotativo(codigo);
        ponto.setCodigoRotativoExpira(OffsetDateTime.now().plusSeconds(30));
        pontoMidiaRepository.save(ponto);

        log.info("Novo código rotativo gerado para ponto #{}: {}", pontoId, codigo);
        return codigo;
    }

    @Transactional
    public PairingResult parearPorCodigo(String codigo) {
        if (codigo == null || codigo.trim().length() != 6) {
            throw new BusinessException("Código inválido. Digite os 6 dígitos numéricos gerados.");
        }

        OffsetDateTime agora = OffsetDateTime.now();

        // 1. Busca por código rotativo ativo
        Optional<PontoMidia> pontoOpt = pontoMidiaRepository.findByCodigoRotativoAndCodigoRotativoExpiraAfter(codigo.trim(), agora);

        // 2. Fallback para código fixo
        if (pontoOpt.isEmpty()) {
            pontoOpt = pontoMidiaRepository.findByCodigoTv(codigo.trim());
        }

        PontoMidia ponto = pontoOpt.orElseThrow(() ->
                new ResourceNotFoundException("Código de TV expirado ou inválido. Gere um novo código no celular."));

        if (ponto.getStatus() != StatusPonto.ATIVO) {
            throw new BusinessException("Este ponto de TV ainda não está com status ATIVO.");
        }

        String pairToken = emitirTokenTV(ponto.getId());
        ponto.setUltimaAtividade(agora);
        pontoMidiaRepository.save(ponto);

        return new PairingResult(ponto, pairToken);
    }

    public String emitirTokenTV(Long pontoId) {
        Algorithm algorithm = Algorithm.HMAC256(tvSecret);
        Instant now = Instant.now();
        Instant exp = now.plus(365, ChronoUnit.DAYS); // Sessão longa na TV

        return JWT.create()
                .withIssuer("MediaMais")
                .withSubject(String.valueOf(pontoId))
                .withClaim("pontoId", pontoId)
                .withClaim("role", "TV_PLAYER")
                .withIssuedAt(Date.from(now))
                .withExpiresAt(Date.from(exp))
                .sign(algorithm);
    }

    public Optional<Long> validarTokenTV(String token) {
        if (token == null || token.isBlank()) {
            return Optional.empty();
        }

        try {
            Algorithm algorithm = Algorithm.HMAC256(tvSecret);
            DecodedJWT jwt = JWT.require(algorithm)
                    .withIssuer("MediaMais")
                    .build()
                    .verify(token);

            Long pontoId = jwt.getClaim("pontoId").asLong();
            return Optional.ofNullable(pontoId);
        } catch (Exception e) {
            log.warn("Token de TV inválido ou expirado: {}", e.getMessage());
            return Optional.empty();
        }
    }
}
