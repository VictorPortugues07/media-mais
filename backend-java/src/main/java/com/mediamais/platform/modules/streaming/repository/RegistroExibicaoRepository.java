package com.mediamais.platform.modules.streaming.repository;

import com.mediamais.platform.modules.streaming.model.RegistroExibicao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;

@Repository
public interface RegistroExibicaoRepository extends JpaRepository<RegistroExibicao, Long> {

    long countByPontoMidiaId(Long pontoMidiaId);

    long countByAnuncioId(Long anuncioId);

    List<RegistroExibicao> findByPontoMidiaIdAndExibidoEmAfter(Long pontoMidiaId, OffsetDateTime data);
}
