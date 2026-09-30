package com.mediamais.platform.modules.notification.repository;

import com.mediamais.platform.modules.notification.model.Notificacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificacaoRepository extends JpaRepository<Notificacao, Long> {

    List<Notificacao> findByUserIdOrderByCriadoEmDesc(Long userId);

    List<Notificacao> findByUserIdAndLidaFalseOrderByCriadoEmDesc(Long userId);

    long countByUserIdAndLidaFalse(Long userId);
}
