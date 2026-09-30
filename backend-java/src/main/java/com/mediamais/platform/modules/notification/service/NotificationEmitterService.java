package com.mediamais.platform.modules.notification.service;

import com.mediamais.platform.modules.notification.model.Notificacao;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
@Slf4j
public class NotificationEmitterService {

    private final Map<Long, List<SseEmitter>> emittersByUserId = new ConcurrentHashMap<>();

    public SseEmitter criarConexao(Long userId) {
        SseEmitter emitter = new SseEmitter(180_000L); // 3 minutos de timeout

        emittersByUserId.computeIfAbsent(userId, k -> new CopyOnWriteArrayList<>()).add(emitter);

        emitter.onCompletion(() -> removerEmitter(userId, emitter));
        emitter.onTimeout(() -> removerEmitter(userId, emitter));
        emitter.onError(e -> removerEmitter(userId, emitter));

        try {
            emitter.send(SseEmitter.event().name("connected").data("Conexão SSE estabelecida com sucesso"));
        } catch (IOException e) {
            removerEmitter(userId, emitter);
        }

        return emitter;
    }

    public void emitirNotificacao(Notificacao notificacao) {
        Long userId = notificacao.getUser().getId();
        List<SseEmitter> emitters = emittersByUserId.get(userId);

        if (emitters == null || emitters.isEmpty()) {
            return;
        }

        Map<String, Object> data = Map.of(
            "id", notificacao.getId(),
            "tipo", notificacao.getTipo().name(),
            "titulo", notificacao.getTitulo(),
            "mensagem", notificacao.getMensagem(),
            "criadoEm", notificacao.getCriadoEm().toString()
        );

        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event().name("notification").data(data));
            } catch (Exception e) {
                removerEmitter(userId, emitter);
            }
        }
    }

    @Scheduled(fixedRate = 25000)
    public void enviarHeartbeatPing() {
        emittersByUserId.forEach((userId, list) -> {
            for (SseEmitter emitter : list) {
                try {
                    emitter.send(SseEmitter.event().comment("ping"));
                } catch (Exception e) {
                    removerEmitter(userId, emitter);
                }
            }
        });
    }

    private void removerEmitter(Long userId, SseEmitter emitter) {
        List<SseEmitter> list = emittersByUserId.get(userId);
        if (list != null) {
            list.remove(emitter);
            if (list.isEmpty()) {
                emittersByUserId.remove(userId);
            }
        }
    }
}
