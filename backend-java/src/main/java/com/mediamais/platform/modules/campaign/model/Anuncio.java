package com.mediamais.platform.modules.campaign.model;

import com.mediamais.platform.common.base.BaseEntity;
import com.mediamais.platform.modules.establishment.model.Anunciante;
import com.mediamais.platform.modules.establishment.model.PontoMidia;
import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

@Entity
@Table(name = "anuncios")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Anuncio extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "anunciante_id", nullable = false)
    private Anunciante anunciante;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ponto_midia_id", nullable = false)
    private PontoMidia pontoMidia;

    @Column(nullable = false)
    private String titulo;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String descricao;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_midia", nullable = false)
    private TipoMidia tipoMidia;

    @Column(name = "midia_url", nullable = false)
    private String midiaUrl;

    @Column(name = "r2_key", nullable = false)
    private String r2Key;

    @Column(name = "duracao_segundos", nullable = false)
    @Builder.Default
    private int duracaoSegundos = 10;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private StatusAnuncio status = StatusAnuncio.PENDENTE;

    @Column(name = "motivo_rejeicao", columnDefinition = "TEXT")
    private String motivoRejeicao;

    @Column(name = "reserva_expira_em")
    private OffsetDateTime reservaExpiraEm;

    @Column(name = "data_inicio")
    private OffsetDateTime dataInicio;

    @Column(name = "data_fim")
    private OffsetDateTime dataFim;

    public boolean isReservaAtiva() {
        return status == StatusAnuncio.AGUARDANDO_PAGAMENTO &&
               reservaExpiraEm != null &&
               reservaExpiraEm.isAfter(OffsetDateTime.now());
    }

    public boolean isAtivoENaoExpirado() {
        if (status != StatusAnuncio.ATIVO) return false;
        return dataFim == null || dataFim.isAfter(OffsetDateTime.now());
    }
}
