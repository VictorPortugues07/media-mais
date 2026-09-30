package com.mediamais.platform.modules.establishment.model;

import com.mediamais.platform.common.base.BaseEntity;
import com.mediamais.platform.modules.identity.model.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "pontos_midia")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PontoMidia extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "codigo_tv", unique = true)
    private String codigoTv;

    @Column(name = "nome_empresa", nullable = false)
    private String nomeEmpresa;

    @Column(nullable = false)
    private String responsavel;

    @Column(nullable = false)
    private String whatsapp;

    @Column(name = "instagram_site")
    private String instagramSite;

    @Column(nullable = false)
    private String cep;

    @Column(nullable = false)
    private String rua;

    @Column(nullable = false)
    private String numero;

    @Column
    private String complemento;

    @Column(nullable = false)
    private String bairro;

    @Column(nullable = false)
    private String cidade;

    @Column(nullable = false, length = 2)
    private String uf;

    @Column(nullable = false)
    private String categoria;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String descricao;

    @Column(name = "possui_tv", nullable = false)
    @Builder.Default
    private boolean possuiTv = true;

    @Column(name = "quantidade_tvs")
    @Builder.Default
    private Integer quantidadeTvs = 1;

    @Column(name = "local_instalacao")
    private String localInstalacao;

    @Column(name = "fluxo_diario_estimado", nullable = false)
    private String fluxoDiarioEstimado;

    @Column(name = "tempo_permanencia", nullable = false)
    private String tempoPermanencia;

    @Column(name = "faixa_etaria_publico")
    @Builder.Default
    private List<String> faixaEtariaPublico = new ArrayList<>();

    @Column(name = "genero_publico", nullable = false)
    private String generoPublico;

    @Column(name = "horarios_pico")
    private String horariosPico;

    @Column(name = "horario_abertura")
    @Builder.Default
    private String horarioAbertura = "08:00";

    @Column(name = "horario_fechamento")
    @Builder.Default
    private String horarioFechamento = "19:00";

    @Column(name = "dias_funcionamento")
    @Builder.Default
    private List<String> diasFuncionamento = List.of("Segunda", "Terça", "Quarta", "Quinta", "Sexta");

    @Column(name = "codigo_rotativo", length = 6)
    private String codigoRotativo;

    @Column(name = "codigo_rotativo_expira")
    private OffsetDateTime codigoRotativoExpira;

    @Column(name = "fotos")
    @Builder.Default
    private List<String> fotos = new ArrayList<>();

    @Column
    private Double lat;

    @Column
    private Double lng;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private StatusPonto status = StatusPonto.PENDENTE;

    @Column(name = "aceita_novos_anuncios", nullable = false)
    @Builder.Default
    private boolean aceitaNovosAnuncios = true;

    @Column(name = "limite_tempo_segundos", nullable = false)
    @Builder.Default
    private int limiteTempoSegundos = 360;

    @Column(name = "max_cotas", nullable = false)
    @Builder.Default
    private int maxCotas = 8;

    @Column(name = "nota_fluxo")
    private Double notaFluxo;

    @Column(name = "nota_tempo")
    private Double notaTempo;

    @Column(name = "nota_perfil")
    private Double notaPerfil;

    @Column(name = "nota_exclusividade")
    private Double notaExclusividade;

    @Column(name = "score_ponderado")
    private Double scorePonderado;

    @Column(length = 20)
    private String tier;

    @Column(name = "cota_mensal")
    private Double cotaMensal;

    @Column(name = "ultima_atividade")
    private OffsetDateTime ultimaAtividade;

    @Column(name = "tipo_dispositivo", length = 50)
    private String tipoDispositivo;

    @Column(name = "resolucao_tela", length = 50)
    private String resolucaoTela;

    @Column(name = "chave_pix", length = 100)
    private String chavePix;
}
