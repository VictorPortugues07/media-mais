-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('PONTO', 'ANUNCIANTE', 'ADMIN');

-- CreateEnum
CREATE TYPE "StatusPonto" AS ENUM ('PENDENTE', 'ATIVO', 'INATIVO');

-- CreateEnum
CREATE TYPE "StatusAnuncio" AS ENUM ('PENDENTE', 'APROVADO', 'REJEITADO', 'ATIVO', 'PAUSADO', 'EXPIRADO', 'FILA_ESPERA');

-- CreateEnum
CREATE TYPE "TipoMidia" AS ENUM ('VIDEO', 'IMAGEM');

-- CreateEnum
CREATE TYPE "TipoNotificacao" AS ENUM ('ANUNCIO_PENDENTE', 'ANUNCIO_APROVADO', 'ANUNCIO_REJEITADO', 'NOVO_ANUNCIO_TV', 'FILA_ESPERA', 'PONTO_ATIVADO', 'PONTO_DESATIVADO', 'ALERTA', 'COBRANCA', 'SISTEMA', 'GERAL');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "avatar_url" TEXT,
    "role" "UserRole" NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "deletado_em" TIMESTAMP(3),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pontos_midia" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "codigo_tv" TEXT,
    "nome_empresa" TEXT NOT NULL,
    "responsavel" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "instagram_site" TEXT,
    "cep" TEXT NOT NULL,
    "rua" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "complemento" TEXT,
    "bairro" TEXT NOT NULL,
    "cidade" TEXT NOT NULL,
    "uf" CHAR(2) NOT NULL,
    "categoria" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "possui_tv" BOOLEAN NOT NULL,
    "quantidade_tvs" INTEGER,
    "local_instalacao" TEXT,
    "fluxo_diario_estimado" TEXT NOT NULL,
    "tempo_permanencia" TEXT NOT NULL,
    "faixa_etaria_publico" TEXT[],
    "genero_publico" TEXT NOT NULL,
    "horarios_pico" TEXT,
    "horario_abertura" TEXT DEFAULT '08:00',
    "horario_fechamento" TEXT DEFAULT '19:00',
    "dias_funcionamento" TEXT[] DEFAULT ARRAY['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta']::TEXT[],
    "codigo_rotativo" TEXT,
    "codigo_rotativo_expira" TIMESTAMP(3),
    "fotos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "status" "StatusPonto" NOT NULL DEFAULT 'PENDENTE',
    "aceita_novos_anuncios" BOOLEAN NOT NULL DEFAULT true,
    "limite_tempo_segundos" INTEGER NOT NULL DEFAULT 360,
    "ultima_atividade" TIMESTAMP(3),
    "tipo_dispositivo" TEXT,
    "resolucao_tela" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pontos_midia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anunciantes" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "nome_empresa" TEXT NOT NULL,
    "responsavel" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "instagram_site" TEXT,
    "logo_url" TEXT,
    "fotos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "cep" TEXT NOT NULL,
    "rua" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "complemento" TEXT,
    "bairro" TEXT NOT NULL,
    "cidade" TEXT NOT NULL,
    "uf" CHAR(2) NOT NULL,
    "categoria" TEXT NOT NULL,
    "o_que_anunciar" TEXT NOT NULL,
    "descricao_anuncio" TEXT NOT NULL,
    "preferencia_localizacao" TEXT NOT NULL,
    "distancia_maxima" TEXT,
    "bairros_especificos" TEXT,
    "categorias_especificas" TEXT[],
    "faixa_etaria_alvo" TEXT[],
    "genero_alvo" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "anunciantes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anuncios" (
    "id" SERIAL NOT NULL,
    "anunciante_id" INTEGER NOT NULL,
    "ponto_midia_id" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "tipo_midia" "TipoMidia" NOT NULL,
    "midia_url" TEXT NOT NULL,
    "duracao_segundos" INTEGER NOT NULL DEFAULT 10,
    "status" "StatusAnuncio" NOT NULL DEFAULT 'PENDENTE',
    "motivo_rejeicao" TEXT,
    "data_inicio" TIMESTAMP(3),
    "data_fim" TIMESTAMP(3),
    "deletado_em" TIMESTAMP(3),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "anuncios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registros_exibicao" (
    "id" SERIAL NOT NULL,
    "anuncio_id" INTEGER NOT NULL,
    "ponto_midia_id" INTEGER NOT NULL,
    "duracao_segundos" INTEGER NOT NULL DEFAULT 10,
    "tipo_midia" "TipoMidia" NOT NULL,
    "exibido_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registros_exibicao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificacoes" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "tipo" "TipoNotificacao" NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificacoes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "pontos_midia_user_id_key" ON "pontos_midia"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "pontos_midia_codigo_tv_key" ON "pontos_midia"("codigo_tv");

-- CreateIndex
CREATE INDEX "pontos_midia_cidade_idx" ON "pontos_midia"("cidade");

-- CreateIndex
CREATE INDEX "pontos_midia_status_idx" ON "pontos_midia"("status");

-- CreateIndex
CREATE INDEX "pontos_midia_codigo_tv_idx" ON "pontos_midia"("codigo_tv");

-- CreateIndex
CREATE INDEX "pontos_midia_codigo_rotativo_idx" ON "pontos_midia"("codigo_rotativo");

-- CreateIndex
CREATE INDEX "pontos_midia_ultima_atividade_idx" ON "pontos_midia"("ultima_atividade");

-- CreateIndex
CREATE UNIQUE INDEX "anunciantes_user_id_key" ON "anunciantes"("user_id");

-- CreateIndex
CREATE INDEX "anunciantes_cidade_idx" ON "anunciantes"("cidade");

-- CreateIndex
CREATE INDEX "anuncios_status_idx" ON "anuncios"("status");

-- CreateIndex
CREATE INDEX "anuncios_ponto_midia_id_idx" ON "anuncios"("ponto_midia_id");

-- CreateIndex
CREATE INDEX "anuncios_anunciante_id_idx" ON "anuncios"("anunciante_id");

-- CreateIndex
CREATE INDEX "anuncios_ponto_midia_id_status_idx" ON "anuncios"("ponto_midia_id", "status");

-- CreateIndex
CREATE INDEX "anuncios_data_fim_idx" ON "anuncios"("data_fim");

-- CreateIndex
CREATE INDEX "registros_exibicao_anuncio_id_idx" ON "registros_exibicao"("anuncio_id");

-- CreateIndex
CREATE INDEX "registros_exibicao_ponto_midia_id_idx" ON "registros_exibicao"("ponto_midia_id");

-- CreateIndex
CREATE INDEX "registros_exibicao_exibido_em_idx" ON "registros_exibicao"("exibido_em");

-- CreateIndex
CREATE INDEX "registros_exibicao_ponto_midia_id_exibido_em_idx" ON "registros_exibicao"("ponto_midia_id", "exibido_em");

-- CreateIndex
CREATE INDEX "notificacoes_user_id_lida_idx" ON "notificacoes"("user_id", "lida");

-- AddForeignKey
ALTER TABLE "pontos_midia" ADD CONSTRAINT "pontos_midia_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anunciantes" ADD CONSTRAINT "anunciantes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anuncios" ADD CONSTRAINT "anuncios_anunciante_id_fkey" FOREIGN KEY ("anunciante_id") REFERENCES "anunciantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anuncios" ADD CONSTRAINT "anuncios_ponto_midia_id_fkey" FOREIGN KEY ("ponto_midia_id") REFERENCES "pontos_midia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_exibicao" ADD CONSTRAINT "registros_exibicao_anuncio_id_fkey" FOREIGN KEY ("anuncio_id") REFERENCES "anuncios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_exibicao" ADD CONSTRAINT "registros_exibicao_ponto_midia_id_fkey" FOREIGN KEY ("ponto_midia_id") REFERENCES "pontos_midia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacoes" ADD CONSTRAINT "notificacoes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
