package com.mediamais.platform.modules.streaming.buffer;

import com.mediamais.platform.modules.streaming.model.RegistroExibicao;
import com.mediamais.platform.modules.streaming.repository.RegistroExibicaoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ConcurrentLinkedQueue;

@Component
@RequiredArgsConstructor
@Slf4j
public class ProofOfPlayBatchBuffer {

    private final RegistroExibicaoRepository repository;
    private final ConcurrentLinkedQueue<RegistroExibicao> buffer = new ConcurrentLinkedQueue<>();

    public void enfileirarComprovacao(RegistroExibicao registro) {
        buffer.add(registro);
    }

    @Scheduled(fixedRate = 5000)
    public void flushBatch() {
        if (buffer.isEmpty()) {
            return;
        }

        List<RegistroExibicao> lote = new ArrayList<>();
        RegistroExibicao item;
        while ((item = buffer.poll()) != null && lote.size() < 500) {
            lote.add(item);
        }

        if (!lote.isEmpty()) {
            try {
                repository.saveAll(lote);
                log.debug("Batch de Proof of Play persistido: {} registros", lote.size());
            } catch (Exception e) {
                log.error("Erro ao descarregar lote de Proof of Play: {}", e.getMessage(), e);
                // Reinsere no buffer em caso de erro transitório de rede
                buffer.addAll(lote);
            }
        }
    }
}
