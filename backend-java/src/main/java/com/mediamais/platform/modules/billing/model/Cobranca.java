package com.mediamais.platform.modules.billing.model;

import com.mediamais.platform.common.base.BaseEntity;
import com.mediamais.platform.modules.campaign.model.Anuncio;
import com.mediamais.platform.modules.establishment.model.Anunciante;
import com.mediamais.platform.modules.establishment.model.PontoMidia;
import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

@Entity
@Table(name = "cobrancas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Cobranca extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "anuncio_id", nullable = false)
    private Anuncio anuncio;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "anunciante_id", nullable = false)
    private Anunciante anunciante;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ponto_midia_id", nullable = false)
    private PontoMidia pontoMidia;

    @Column(name = "abacate_billing_id", nullable = false, unique = true)
    private String abacateBillingId;

    @Column(name = "transacao_id", unique = true)
    private String transacaoId;

    @Column(name = "valor_centavos", nullable = false)
    private int valorCentavos;

    @Column(name = "repasse_ponto_centavos", nullable = false)
    private int repassePontoCentavos;

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String metodo = "PIX";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private StatusCobranca status = StatusCobranca.PENDENTE;

    @Column(name = "pix_qr_code", columnDefinition = "TEXT")
    private String pixQrCode;

    @Column(name = "pix_copia_cola", columnDefinition = "TEXT")
    private String pixCopiaCola;

    @Column(name = "url_checkout")
    private String urlCheckout;

    @Column(name = "pago_em")
    private OffsetDateTime pagoEm;
}
