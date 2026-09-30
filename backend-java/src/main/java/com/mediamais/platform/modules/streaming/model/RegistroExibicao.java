package com.mediamais.platform.modules.streaming.model;

import com.mediamais.platform.modules.campaign.model.Anuncio;
import com.mediamais.platform.modules.campaign.model.TipoMidia;
import com.mediamais.platform.modules.establishment.model.PontoMidia;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;

@Entity
@Table(name = "registros_exibicao")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegistroExibicao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "anuncio_id", nullable = false)
    private Anuncio anuncio;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ponto_midia_id", nullable = false)
    private PontoMidia pontoMidia;

    @Column(name = "duracao_segundos", nullable = false)
    private int duracaoSegundos;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_midia", nullable = false)
    private TipoMidia tipoMidia;

    @CreationTimestamp
    @Column(name = "exibido_em", nullable = false, updatable = false)
    private OffsetDateTime exibidoEm;
}
