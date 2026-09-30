package com.mediamais.platform.modules.campaign.service;

import com.mediamais.platform.common.exception.CapacityExceededException;
import com.mediamais.platform.common.exception.ResourceNotFoundException;
import com.mediamais.platform.modules.campaign.model.Anuncio;
import com.mediamais.platform.modules.campaign.model.StatusAnuncio;
import com.mediamais.platform.modules.campaign.repository.AnuncioRepository;
import com.mediamais.platform.modules.establishment.model.PontoMidia;
import com.mediamais.platform.modules.establishment.repository.PontoMidiaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;

@Service
@RequiredArgsConstructor
public class CapacityEngine {

    private final PontoMidiaRepository pontoMidiaRepository;
    private final AnuncioRepository anuncioRepository;

    public record CapacityCheckResult(
        int tempoOcupado,
        int tempoDisponivel,
        int limiteTotal,
        boolean cabe
    ) {}

    @Transactional(readOnly = true)
    public CapacityCheckResult consultarCapacidade(Long pontoId, Long anuncioId, int duracaoSegundos) {
        PontoMidia ponto = pontoMidiaRepository.findById(pontoId)
                .orElseThrow(() -> new ResourceNotFoundException("Ponto de mídia não encontrado: " + pontoId));

        OffsetDateTime agora = OffsetDateTime.now();
        int tempoOcupado = anuncioRepository.calcularTempoOcupadoComSlotHold(pontoId, anuncioId, agora);
        int limiteTotal = ponto.getLimiteTempoSegundos();
        int tempoDisponivel = Math.max(0, limiteTotal - tempoOcupado);
        boolean cabe = (tempoOcupado + duracaoSegundos) <= limiteTotal;

        return new CapacityCheckResult(tempoOcupado, tempoDisponivel, limiteTotal, cabe);
    }

    @Transactional(isolation = Isolation.REPEATABLE_READ)
    public void reservarSlotHold(Anuncio anuncio, int minutosTtl, boolean force) {
        PontoMidia ponto = pontoMidiaRepository.findByIdWithLock(anuncio.getPontoMidia().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Ponto de mídia não encontrado"));

        OffsetDateTime agora = OffsetDateTime.now();
        int tempoOcupado = anuncioRepository.calcularTempoOcupadoComSlotHold(ponto.getId(), anuncio.getId(), agora);
        int limiteTotal = ponto.getLimiteTempoSegundos();
        int tempoDisponivel = Math.max(0, limiteTotal - tempoOcupado);

        if (!force && (tempoOcupado + anuncio.getDuracaoSegundos()) > limiteTotal) {
            throw new CapacityExceededException(tempoOcupado, tempoDisponivel, anuncio.getDuracaoSegundos(), limiteTotal);
        }

        anuncio.setStatus(StatusAnuncio.AGUARDANDO_PAGAMENTO);
        anuncio.setReservaExpiraEm(agora.plusMinutes(minutosTtl));
        anuncioRepository.save(anuncio);
    }

    @Transactional(isolation = Isolation.REPEATABLE_READ)
    public void ativarAnuncio(Anuncio anuncio, boolean force) {
        PontoMidia ponto = pontoMidiaRepository.findByIdWithLock(anuncio.getPontoMidia().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Ponto de mídia não encontrado"));

        OffsetDateTime agora = OffsetDateTime.now();
        int tempoOcupado = anuncioRepository.calcularTempoOcupadoComSlotHold(ponto.getId(), anuncio.getId(), agora);
        int limiteTotal = ponto.getLimiteTempoSegundos();
        int tempoDisponivel = Math.max(0, limiteTotal - tempoOcupado);

        if (!force && (tempoOcupado + anuncio.getDuracaoSegundos()) > limiteTotal) {
            // Se excedeu e não foi forçado, encaminha para a fila de espera
            anuncio.setStatus(StatusAnuncio.FILA_ESPERA);
            anuncio.setReservaExpiraEm(null);
            anuncioRepository.save(anuncio);
            return;
        }

        anuncio.setStatus(StatusAnuncio.ATIVO);
        anuncio.setReservaExpiraEm(null);
        anuncio.setDataInicio(agora);
        anuncio.setDataFim(agora.plusDays(30)); // Cota mensal de 30 dias
        anuncioRepository.save(anuncio);
    }

    @Transactional
    public void liberarSlotHold(Anuncio anuncio) {
        anuncio.setReservaExpiraEm(null);
        anuncio.setStatus(StatusAnuncio.EXPIRADO);
        anuncioRepository.save(anuncio);
    }
}
