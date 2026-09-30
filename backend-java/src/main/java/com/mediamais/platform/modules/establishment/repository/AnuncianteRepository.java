package com.mediamais.platform.modules.establishment.repository;

import com.mediamais.platform.modules.establishment.model.Anunciante;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AnuncianteRepository extends JpaRepository<Anunciante, Long> {

    Optional<Anunciante> findByUserId(Long userId);
}
