package com.mediamais.platform.modules.campaign.repository;

import com.mediamais.platform.modules.campaign.model.Anuncio;
import com.mediamais.platform.modules.campaign.model.StatusAnuncio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;

@Repository
public interface AnuncioRepository extends JpaRepository<Anuncio, Long> {

    List<Anuncio> findByPontoMidiaId(Long pontoMidiaId);

    List<Anuncio> findByAnuncianteId(Long anuncianteId);

    List<Anuncio> findByPontoMidiaIdAndStatus(Long pontoMidiaId, StatusAnuncio status);

    @Query("""
        SELECT a FROM Anuncio a
        WHERE a.pontoMidia.id = :pontoId
          AND a.status = 'ATIVO'
          AND (a.dataFim IS NULL OR a.dataFim >= :agora)
        ORDER BY a.criadoEm ASC
    """)
    List<Anuncio> findPlaylistAtiva(@Param("pontoId") Long pontoId, @Param("agora") OffsetDateTime agora);

    @Query("""
        SELECT COALESCE(SUM(a.duracaoSegundos), 0) FROM Anuncio a
        WHERE a.pontoMidia.id = :pontoId
          AND (a.id != :anuncioId OR :anuncioId IS NULL)
          AND (
            (a.status = 'ATIVO' AND (a.dataFim IS NULL OR a.dataFim >= :agora))
            OR
            (a.status = 'AGUARDANDO_PAGAMENTO' AND a.reservaExpiraEm > :agora)
          )
    """)
    int calcularTempoOcupadoComSlotHold(
        @Param("pontoId") Long pontoId,
        @Param("anuncioId") Long anuncioId,
        @Param("agora") OffsetDateTime agora
    );

    @Query("""
        SELECT a FROM Anuncio a
        WHERE a.status = 'ATIVO'
          AND a.dataFim IS NOT NULL
          AND a.dataFim < :agora
    """)
    List<Anuncio> findAnunciosExpirados(@Param("agora") OffsetDateTime agora);

    @Query("""
        SELECT a FROM Anuncio a
        WHERE a.status = 'AGUARDANDO_PAGAMENTO'
          AND a.reservaExpiraEm IS NOT NULL
          AND a.reservaExpiraEm < :agora
    """)
    List<Anuncio> findReservasPixExpiradas(@Param("agora") OffsetDateTime agora);

    @Query("""
        SELECT a FROM Anuncio a
        WHERE a.pontoMidia.id = :pontoId
          AND a.status = 'FILA_ESPERA'
        ORDER BY a.criadoEm ASC
    """)
    List<Anuncio> findFilaEsperaPorPonto(@Param("pontoId") Long pontoId);
}
