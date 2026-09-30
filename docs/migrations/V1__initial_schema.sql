-- =====================================================================
-- Media+ DOOH Platform - Flyway Migration V1__initial_schema.sql
-- Database: PostgreSQL 14+ (Hosted on Neon, Supabase, AWS RDS, etc.)
-- Author: Media+ Architecture Team
-- =====================================================================

-- 1. Criação dos Tipos Enumerados (Enums)
CREATE TYPE user_role AS ENUM (
    'ADMIN',
    'PONTO',
    'ANUNCIANTE'
);

CREATE TYPE status_ponto AS ENUM (
    'PENDENTE',
    'ATIVO',
    'INATIVO'
);

CREATE TYPE status_anuncio AS ENUM (
    'PENDENTE',
    'APROVADO',
    'AGUARDANDO_PAGAMENTO',
    'REJEITADO',
    'ATIVO',
    'PAUSADO',
    'EXPIRADO',
    'FILA_ESPERA'
);

CREATE TYPE status_cobranca AS ENUM (
    'PENDENTE',
    'PAGO',
    'CANCELADO',
    'FALHOU'
);

CREATE TYPE tipo_midia AS ENUM (
    'VIDEO',
    'IMAGEM'
);

CREATE TYPE tipo_notificacao AS ENUM (
    'ANUNCIO_PENDENTE',
    'ANUNCIO_APROVADO',
    'ANUNCIO_REJEITADO',
    'PAGAMENTO_CONFIRMADO',
    'NOVO_ANUNCIO_TV',
    'FILA_ESPERA',
    'PONTO_ATIVADO',
    'PONTO_DESATIVADO',
    'ALERTA',
    'COBRANCA',
    'SISTEMA',
    'GERAL'
);

-- =====================================================================
-- 2. Tabela: users (Identidades e OAuth2)
-- =====================================================================
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha VARCHAR(255), -- Nulo se autenticado exclusivamente via OAuth2
    nome VARCHAR(255) NOT NULL,
    whatsapp VARCHAR(30) NOT NULL,
    avatar_url VARCHAR(500),
    role user_role NOT NULL,
    provider VARCHAR(50) DEFAULT 'LOCAL', -- 'LOCAL', 'GOOGLE', 'APPLE'
    provider_id VARCHAR(255),             -- 'sub' do OAuth2/OIDC
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    deletado_em TIMESTAMP WITH TIME ZONE,
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_provider ON users(provider, provider_id);
CREATE INDEX idx_users_email ON users(email);

-- =====================================================================
-- 3. Tabela: pontos_midia (Estabelecimentos com Smart TV)
-- =====================================================================
CREATE TABLE pontos_midia (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    codigo_tv VARCHAR(20) UNIQUE,
    nome_empresa VARCHAR(255) NOT NULL,
    responsavel VARCHAR(255) NOT NULL,
    whatsapp VARCHAR(30) NOT NULL,
    instagram_site VARCHAR(255),
    cep VARCHAR(10) NOT NULL,
    rua VARCHAR(255) NOT NULL,
    numero VARCHAR(50) NOT NULL,
    complemento VARCHAR(100),
    bairro VARCHAR(100) NOT NULL,
    cidade VARCHAR(100) NOT NULL,
    uf CHAR(2) NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    descricao TEXT NOT NULL,
    possui_tv BOOLEAN NOT NULL DEFAULT TRUE,
    quantidade_tvs INTEGER DEFAULT 1,
    local_instalacao VARCHAR(255),
    fluxo_diario_estimado VARCHAR(100) NOT NULL,
    tempo_permanencia VARCHAR(100) NOT NULL,
    faixa_etaria_publico TEXT[] NOT NULL DEFAULT '{}',
    genero_publico VARCHAR(50) NOT NULL,
    horarios_pico VARCHAR(255),
    horario_abertura VARCHAR(10) DEFAULT '08:00',
    horario_fechamento VARCHAR(10) DEFAULT '19:00',
    dias_funcionamento TEXT[] DEFAULT ARRAY['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'],
    codigo_rotativo VARCHAR(6),
    codigo_rotativo_expira TIMESTAMP WITH TIME ZONE,
    fotos TEXT[] DEFAULT '{}',
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    status status_ponto NOT NULL DEFAULT 'PENDENTE',
    aceita_novos_anuncios BOOLEAN NOT NULL DEFAULT TRUE,
    limite_tempo_segundos INTEGER NOT NULL DEFAULT 360,
    max_cotas INTEGER NOT NULL DEFAULT 8,
    nota_fluxo DOUBLE PRECISION,
    nota_tempo DOUBLE PRECISION,
    nota_perfil DOUBLE PRECISION,
    nota_exclusividade DOUBLE PRECISION,
    score_ponderado DOUBLE PRECISION,
    tier VARCHAR(20),
    cota_mensal DOUBLE PRECISION,
    ultima_atividade TIMESTAMP WITH TIME ZONE,
    tipo_dispositivo VARCHAR(50),
    resolucao_tela VARCHAR(50),
    chave_pix VARCHAR(100),
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pontos_cidade ON pontos_midia(cidade);
CREATE INDEX idx_pontos_status ON pontos_midia(status);
CREATE INDEX idx_pontos_codigo_tv ON pontos_midia(codigo_tv);
CREATE INDEX idx_pontos_codigo_rotativo ON pontos_midia(codigo_rotativo);
CREATE INDEX idx_pontos_ultima_atividade ON pontos_midia(ultima_atividade);

-- =====================================================================
-- 4. Tabela: anunciantes (Marcas e Empresas Contratantes)
-- =====================================================================
CREATE TABLE anunciantes (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    nome_empresa VARCHAR(255) NOT NULL,
    responsavel VARCHAR(255) NOT NULL,
    whatsapp VARCHAR(30) NOT NULL,
    instagram_site VARCHAR(255),
    logo_url VARCHAR(500),
    fotos TEXT[] DEFAULT '{}',
    cep VARCHAR(10) NOT NULL,
    rua VARCHAR(255) NOT NULL,
    numero VARCHAR(50) NOT NULL,
    complemento VARCHAR(100),
    bairro VARCHAR(100) NOT NULL,
    cidade VARCHAR(100) NOT NULL,
    uf CHAR(2) NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    o_que_anunciar TEXT NOT NULL,
    descricao_anuncio TEXT NOT NULL,
    preferencia_localizacao VARCHAR(255) NOT NULL,
    distancia_maxima VARCHAR(50),
    bairros_especificos VARCHAR(255),
    categorias_especificas TEXT[] DEFAULT '{}',
    faixa_etaria_alvo TEXT[] DEFAULT '{}',
    genero_alvo VARCHAR(50) NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_anunciantes_cidade ON anunciantes(cidade);

-- =====================================================================
-- 5. Tabela: anuncios (Campanhas com Slot Hold e Cloudflare R2)
-- =====================================================================
CREATE TABLE anuncios (
    id BIGSERIAL PRIMARY KEY,
    anunciante_id BIGINT NOT NULL REFERENCES anunciantes(id) ON DELETE CASCADE,
    ponto_midia_id BIGINT NOT NULL REFERENCES pontos_midia(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT NOT NULL,
    tipo_midia tipo_midia NOT NULL,
    midia_url VARCHAR(500) NOT NULL, -- URL pública da CDN Cloudflare R2
    r2_key VARCHAR(255) NOT NULL,    -- Chave interna no bucket S3/R2
    duracao_segundos INTEGER NOT NULL DEFAULT 10,
    status status_anuncio NOT NULL DEFAULT 'PENDENTE',
    motivo_rejeicao TEXT,
    reserva_expira_em TIMESTAMP WITH TIME ZONE, -- Slot Hold (60 min)
    data_inicio TIMESTAMP WITH TIME ZONE,
    data_fim TIMESTAMP WITH TIME ZONE,
    deletado_em TIMESTAMP WITH TIME ZONE,
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_anuncios_status ON anuncios(status);
CREATE INDEX idx_anuncios_ponto_midia_id ON anuncios(ponto_midia_id);
CREATE INDEX idx_anuncios_anunciante_id ON anuncios(anunciante_id);
CREATE INDEX idx_anuncios_ponto_status ON anuncios(ponto_midia_id, status);
CREATE INDEX idx_anuncios_reserva_expira ON anuncios(reserva_expira_em);
CREATE INDEX idx_anuncios_data_fim ON anuncios(data_fim);

-- =====================================================================
-- 6. Tabela: cobrancas (Integração AbacatePay Pix/Cartão)
-- =====================================================================
CREATE TABLE cobrancas (
    id BIGSERIAL PRIMARY KEY,
    anuncio_id BIGINT NOT NULL REFERENCES anuncios(id) ON DELETE CASCADE,
    anunciante_id BIGINT NOT NULL REFERENCES anunciantes(id) ON DELETE RESTRICT,
    ponto_midia_id BIGINT NOT NULL REFERENCES pontos_midia(id) ON DELETE RESTRICT,
    abacate_billing_id VARCHAR(100) NOT NULL UNIQUE,
    transacao_id VARCHAR(100) UNIQUE,
    valor_centavos INTEGER NOT NULL,
    repasse_ponto_centavos INTEGER NOT NULL,
    metodo VARCHAR(30) NOT NULL DEFAULT 'PIX',
    status status_cobranca NOT NULL DEFAULT 'PENDENTE',
    pix_qr_code TEXT,
    pix_copia_cola TEXT,
    url_checkout VARCHAR(500),
    pago_em TIMESTAMP WITH TIME ZONE,
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cobrancas_anuncio_id ON cobrancas(anuncio_id);
CREATE INDEX idx_cobrancas_status ON cobrancas(status);

-- =====================================================================
-- 7. Tabela: registros_exibicao (Proof of Play Auditável e Imutável)
-- =====================================================================
CREATE TABLE registros_exibicao (
    id BIGSERIAL PRIMARY KEY,
    anuncio_id BIGINT NOT NULL REFERENCES anuncios(id) ON DELETE RESTRICT,
    ponto_midia_id BIGINT NOT NULL REFERENCES pontos_midia(id) ON DELETE RESTRICT,
    duracao_segundos INTEGER NOT NULL DEFAULT 10,
    tipo_midia tipo_midia NOT NULL,
    exibido_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_registros_anuncio_id ON registros_exibicao(anuncio_id);
CREATE INDEX idx_registros_ponto_midia_id ON registros_exibicao(ponto_midia_id);
CREATE INDEX idx_registros_exibido_em ON registros_exibicao(exibido_em);
CREATE INDEX idx_registros_ponto_exibido ON registros_exibicao(ponto_midia_id, exibido_em);

-- =====================================================================
-- 8. Tabela: notificacoes (Mensageria e SSE)
-- =====================================================================
CREATE TABLE notificacoes (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tipo tipo_notificacao NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    mensagem TEXT NOT NULL,
    lida BOOLEAN NOT NULL DEFAULT FALSE,
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notificacoes_user_lida ON notificacoes(user_id, lida);
