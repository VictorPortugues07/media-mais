package com.mediamais.platform.modules.streaming.service;

import com.mediamais.platform.modules.establishment.repository.PontoMidiaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class HeartbeatCacheService {

    private final PontoMidiaRepository pontoMidiaRepository;

    public record TvPresence(
        long timestamp,
        String deviceType,
        String screenResolution,
        boolean online
    ) {}

    // Cache em memória L1 de alta performance
    private final Map<Long, TvPresence> presenceMap = new ConcurrentHashMap<>();

    public void registrarPulso(Long pontoId, String deviceType, String screenResolution) {
        long agora = System.currentTimeMillis();
        boolean eraOffline = !isOnline(pontoId);

        presenceMap.put(pontoId, new TvPresence(agora, deviceType, screenResolution, true));

        // Se a TV estava offline e agora conectou, persiste a transição de estado no banco
        if (eraOffline) {
            log.info("Smart TV conectou (Ao Vivo): pontoId={}", pontoId);
            sincronizarTimestampBanco(pontoId, agora);
        }
    }

    public boolean isOnline(Long pontoId) {
        TvPresence presence = presenceMap.get(pontoId);
        if (presence == null || !presence.online()) {
            return false;
        }
        return (System.currentTimeMillis() - presence.timestamp()) <= 12_000L;
    }

    public void marcarOffline(Long pontoId) {
        TvPresence presence = presenceMap.get(pontoId);
        if (presence != null) {
            presenceMap.put(pontoId, new TvPresence(presence.timestamp(), presence.deviceType(), presence.screenResolution(), false));
            sincronizarTimestampBanco(pontoId, System.currentTimeMillis());
            log.info("Smart TV desconectou (Graceful Shutdown): pontoId={}", pontoId);
        }
    }

    private void sincronizarTimestampBanco(Long pontoId, long timestampMillis) {
        pontoMidiaRepository.findById(pontoId).ifPresent(ponto -> {
            ponto.setUltimaAtividade(OffsetDateTime.now());
            pontoMidiaRepository.save(ponto);
        });
    }

    // A cada 5 minutos sincroniza o timestamp das TVs online para auditoria histórica
    @Scheduled(fixedRate = 300_000)
    public void sincronizacaoPeriodicaHistorica() {
        long agora = System.currentTimeMillis();
        presenceMap.forEach((pontoId, presence) -> {
            if ((agora - presence.timestamp()) <= 12_000L) {
                sincronizarTimestampBanco(pontoId, presence.timestamp());
            }
        });
    }
}
