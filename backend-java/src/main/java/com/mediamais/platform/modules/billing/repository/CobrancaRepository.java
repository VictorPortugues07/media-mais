package com.mediamais.platform.modules.billing.repository;

import com.mediamais.platform.modules.billing.model.Cobranca;
import com.mediamais.platform.modules.billing.model.StatusCobranca;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CobrancaRepository extends JpaRepository<Cobranca, Long> {

    Optional<Cobranca> findByAbacateBillingId(String abacateBillingId);

    Optional<Cobranca> findByTransacaoId(String transacaoId);

    Optional<Cobranca> findByAnuncioIdAndStatus(Long anuncioId, StatusCobranca status);
}
