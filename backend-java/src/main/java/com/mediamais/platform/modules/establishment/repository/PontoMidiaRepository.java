package com.mediamais.platform.modules.establishment.repository;

import com.mediamais.platform.modules.establishment.model.PontoMidia;
import com.mediamais.platform.modules.establishment.model.StatusPonto;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PontoMidiaRepository extends JpaRepository<PontoMidia, Long> {

    Optional<PontoMidia> findByUserId(Long userId);

    Optional<PontoMidia> findByCodigoTv(String codigoTv);

    Optional<PontoMidia> findByCodigoRotativoAndCodigoRotativoExpiraAfter(String codigoRotativo, OffsetDateTime agora);

    List<PontoMidia> findByStatus(StatusPonto status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM PontoMidia p WHERE p.id = :id")
    Optional<PontoMidia> findByIdWithLock(@Param("id") Long id);
}
