package com.mediamais.platform.modules.establishment.model;

import com.mediamais.platform.common.base.BaseEntity;
import com.mediamais.platform.modules.identity.model.User;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "anunciantes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Anunciante extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "nome_empresa", nullable = false)
    private String nomeEmpresa;

    @Column(nullable = false)
    private String responsavel;

    @Column(nullable = false)
    private String whatsapp;

    @Column(name = "instagram_site")
    private String instagramSite;

    @Column(name = "logo_url")
    private String logoUrl;

    @Column(name = "fotos")
    @Builder.Default
    private List<String> fotos = new ArrayList<>();

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

    @Column(name = "o_que_anunciar", nullable = false, columnDefinition = "TEXT")
    private String oQueAnunciar;

    @Column(name = "descricao_anuncio", nullable = false, columnDefinition = "TEXT")
    private String descricaoAnuncio;

    @Column(name = "preferencia_localizacao", nullable = false)
    private String preferenciaLocalizacao;

    @Column(name = "distancia_maxima")
    private String distanciaMaxima;

    @Column(name = "bairros_especificos")
    private String bairrosEspecificos;

    @Column(name = "categorias_especificas")
    @Builder.Default
    private List<String> categoriasEspecificas = new ArrayList<>();

    @Column(name = "faixa_etaria_alvo")
    @Builder.Default
    private List<String> faixaEtariaAlvo = new ArrayList<>();

    @Column(name = "genero_alvo", nullable = false)
    private String generoAlvo;
}
