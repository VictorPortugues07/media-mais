# SPEC-01: Domínio e Modelo de Dados (Media+)

## 1. Visão Geral
Este documento especifica formalmente a modelagem relacional de dados da plataforma Media+. O banco de dados relacional oficial é o **PostgreSQL Hospedado em Nuvem** (Supabase, Neon, AWS RDS ou similar), versionado através de scripts **Flyway** e mapeado na aplicação através do **Jakarta Persistence (JPA / Hibernate 6)**.

---

## 2. Enums do Domínio

### 2.1 `UserRole`
Papéis de acesso à plataforma:
- `ADMIN`: Administrador geral da rede Media+.
- `PONTO`: Dono do estabelecimento comercial onde a TV está instalada.
- `ANUNCIANTE`: Empresa ou profissional que contrata cotas para veicular anúncios.

### 2.2 `StatusPonto`
Estado operacional do ponto comercial cadastrado:
- `PENDENTE`: Aguardando moderação ou vistoria da equipe Media+.
- `ATIVO`: Aprovado e habilitado para pareamento de TV e veiculação de campanhas.
- `INATIVO`: Desativado temporariamente ou descredenciado.

### 2.3 `StatusAnuncio`
Ciclo de vida e máquina de estados de uma campanha:
- `PENDENTE`: Criada pelo anunciante, aguardando aprovação do moderador.
- `APROVADO`: Conteúdo validado administrativamente.
- `AGUARDANDO_PAGAMENTO`: Fatura Pix gerada via AbacatePay aguardando liquidação.
- `REJEITADO`: Recusado pelo moderador com motivo registrado.
- `ATIVO`: Faturado e veiculando nas telas do ponto no loop contínuo.
- `PAUSADO`: Pausado temporariamente pelo anunciante ou admin.
- `EXPIRADO`: Data de veiculação (`dataFim`) alcançada; campanha encerrada.
- `FILA_ESPERA`: Faturado e aprovado, porém aguardando liberação de espaço na grade de 360s.

### 2.4 `StatusCobranca`
Ciclo de pagamento da fatura no gateway AbacatePay:
- `PENDENTE`: Cobrança Pix/Cartão emitida aguardando liquidação.
- `PAGO`: Pagamento confirmado via webhook com assinatura validada.
- `CANCELADO`: Cancelado por expiração ou ação administrativa.
- `FALHOU`: Falha na liquidação do pagamento.

### 2.5 `TipoMidia`
Formatos de arquivo armazenados no Cloudflare R2 e reproduzidos na TV:
- `VIDEO`: Arquivo de vídeo (MP4 ou WebM).
- `IMAGEM`: Peça estática (PNG, JPG ou WebP) exibida por tempo pré-determinado.

### 2.6 `TipoNotificacao`
Categorias de eventos emitidos aos usuários:
- `ANUNCIO_PENDENTE`, `ANUNCIO_APROVADO`, `ANUNCIO_REJEITADO`, `PAGAMENTO_CONFIRMADO`, `NOVO_ANUNCIO_TV`, `FILA_ESPERA`, `PONTO_ATIVADO`, `PONTO_DESATIVADO`, `ALERTA`, `COBRANCA`, `SISTEMA`, `GERAL`.

---

## 3. Especificação das Tabelas e Entidades

### 3.1 Tabela `users`
Armazena credenciais e identidades federadas via **OAuth2/OIDC**.

| Coluna | Tipo SQL | Nulo? | Padrão | Descrição |
|---|---|---|---|---|
| `id` | `BIGSERIAL PRIMARY KEY` | Não | Auto | Identificador único do usuário |
| `email` | `VARCHAR(255)` | Não | - | Email único do usuário |
| `senha` | `VARCHAR(255)` | Sim | NULL | Hash BCrypt (nulo para logins via OAuth2 exclusivo) |
| `nome` | `VARCHAR(255)` | Não | - | Nome completo |
| `whatsapp` | `VARCHAR(30)` | Não | - | Telefone de contato formatado |
| `avatar_url` | `VARCHAR(500)` | Sim | NULL | URL da foto de perfil (gravada no R2 ou via OAuth2) |
| `role` | `VARCHAR(30)` | Não | - | `ADMIN`, `PONTO`, `ANUNCIANTE` |
| `provider` | `VARCHAR(50)` | Sim | `'LOCAL'` | Provedor de autenticação (`GOOGLE`, `LOCAL`, `APPLE`) |
| `provider_id`| `VARCHAR(255)` | Sim | NULL | Identificador único no provedor OAuth2 (`sub`) |
| `ativo` | `BOOLEAN` | Não | `true` | Flag indicando se a conta pode logar |
| `deletado_em` | `TIMESTAMP WITH TIME ZONE` | Sim | NULL | Timestamp para soft delete |
| `criado_em` | `TIMESTAMP WITH TIME ZONE` | Não | `now()` | Data de criação |
| `atualizado_em`| `TIMESTAMP WITH TIME ZONE` | Não | `now()` | Data da última alteração |

**Índices & Constraints:**
- `UNIQUE(email)`
- `INDEX(provider, provider_id)`

---

### 3.2 Tabela `pontos_midia`
Estabelecimentos comerciais parceiros dotados de TVs conectadas.

| Coluna | Tipo SQL | Nulo? | Padrão | Descrição |
|---|---|---|---|---|
| `id` | `BIGSERIAL PRIMARY KEY` | Não | Auto | Identificador único do ponto |
| `user_id` | `BIGINT REFERENCES users(id)` | Não | - | Vínculo 1:1 (`ON DELETE CASCADE`) |
| `codigo_tv` | `VARCHAR(20)` | Sim | NULL | Código mestre fixo alternativo |
| `nome_empresa` | `VARCHAR(255)` | Não | - | Nome fantasia ou razão social |
| `responsavel` | `VARCHAR(255)` | Não | - | Nome do contato no local |
| `whatsapp` | `VARCHAR(30)` | Não | - | WhatsApp de contato |
| `instagram_site`| `VARCHAR(255)` | Sim | NULL | Redes sociais ou site |
| `cep`, `rua`, `numero`| `VARCHAR` | Não | - | Endereço físico do ponto |
| `complemento` | `VARCHAR(100)` | Sim | NULL | Sala, andar, loja |
| `bairro`, `cidade`| `VARCHAR(100)` | Não | - | Localização geográfica |
| `uf` | `CHAR(2)` | Não | - | Unidade federativa (SC, SP, etc.) |
| `categoria` | `VARCHAR(100)` | Não | - | Ramo (Restaurante, Academia, Clínica) |
| `descricao` | `TEXT` | Não | - | Descrição do ambiente e perfil |
| `possui_tv` | `BOOLEAN` | Não | - | Possui TV instalada |
| `quantidade_tvs`| `INTEGER` | Sim | 1 | Quantidade de monitores |
| `local_instalacao`| `VARCHAR(255)`| Sim | NULL | Posição física da TV |
| `fluxo_diario_estimado`| `VARCHAR(100)` | Não | - | Faixa de fluxo diário de clientes |
| `tempo_permanencia`| `VARCHAR(100)` | Não | - | Tempo médio de permanência |
| `faixa_etaria_publico`| `TEXT[]` | Não | `{}` | Faixas etárias atendidas |
| `genero_publico` | `VARCHAR(50)` | Não | - | Todos, Masculino, Feminino |
| `horarios_pico` | `VARCHAR(255)` | Sim | NULL | Horários de maior movimento |
| `horario_abertura` | `VARCHAR(10)` | Sim | `'08:00'` | Horário de abertura (HH:mm) |
| `horario_fechamento`| `VARCHAR(10)` | Sim | `'19:00'` | Horário de fechamento (HH:mm) |
| `dias_funcionamento`| `TEXT[]` | Sim | `['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta']` | Dias de operação |
| `codigo_rotativo` | `VARCHAR(6)` | Sim | NULL | Código de 6 dígitos gerado para a TV |
| `codigo_rotativo_expira`| `TIMESTAMP WITH TIME ZONE` | Sim | NULL | Expiração estrita de 30 segundos |
| `fotos` | `TEXT[]` | Sim | `{}` | URLs das fotos hospedadas no Cloudflare R2 |
| `lat`, `lng` | `DOUBLE PRECISION` | Sim | NULL | Coordenadas GPS para mapas |
| `status` | `VARCHAR(30)` | Não | `'PENDENTE'` | `PENDENTE`, `ATIVO`, `INATIVO` |
| `aceita_novos_anuncios`| `BOOLEAN` | Não | `true` | Dono aceita novas campanhas |
| `limite_tempo_segundos`| `INTEGER` | Não | `360` | Duração do ciclo contínuo (6 min) |
| `max_cotas` | `INTEGER` | Não | `8` | Capacidade recomendada de cotas |
| `nota_fluxo` | `DOUBLE PRECISION` | Sim | NULL | Nota de fluxo (2.5 a 5.0) |
| `nota_tempo` | `DOUBLE PRECISION` | Sim | NULL | Nota de permanência (2.5 a 5.0) |
| `nota_perfil`| `DOUBLE PRECISION` | Sim | NULL | Nota socioeconômica (2.5 a 5.0) |
| `nota_exclusividade`| `DOUBLE PRECISION`| Sim | NULL | Nota de visibilidade (2.5 a 5.0) |
| `score_ponderado`| `DOUBLE PRECISION` | Sim | NULL | Score ponderado calculado |
| `tier` | `VARCHAR(20)` | Sim | NULL | `'Bronze'`, `'Prata'` ou `'Ouro'` |
| `cota_mensal` | `DOUBLE PRECISION` | Sim | NULL | Valor base da cota mensal em R$ |
| `ultima_atividade`| `TIMESTAMP WITH TIME ZONE`| Sim | NULL | Heartbeat recebido da Smart TV |
| `tipo_dispositivo`| `VARCHAR(50)` | Sim | NULL | SMART_TV, DESKTOP, etc. |
| `resolucao_tela` | `VARCHAR(50)` | Sim | NULL | Ex: "1920x1080" |
| `chave_pix` | `VARCHAR(100)` | Sim | NULL | Chave Pix para repasse dos 50% |
| `criado_em` / `atualizado_em` | `TIMESTAMP WITH TIME ZONE` | Não | `now()` | Auditoria |

**Índices:**
- `UNIQUE(user_id)`
- `UNIQUE(codigo_tv)`
- `INDEX(cidade)`
- `INDEX(status)`
- `INDEX(codigo_rotativo)`
- `INDEX(ultima_atividade)`

---

### 3.3 Tabela `anunciantes`
Perfil complementar das marcas ou empresas que contratam veiculação.

| Coluna | Tipo SQL | Nulo? | Padrão | Descrição |
|---|---|---|---|---|
| `id` | `BIGSERIAL PRIMARY KEY` | Não | Auto | Identificador do anunciante |
| `user_id` | `BIGINT REFERENCES users(id)` | Não | - | Vínculo 1:1 (`ON DELETE CASCADE`) |
| `nome_empresa` | `VARCHAR(255)` | Não | - | Nome fantasia ou razão social |
| `responsavel` | `VARCHAR(255)` | Não | - | Nome do contato |
| `whatsapp` | `VARCHAR(30)` | Não | - | Telefone de contato |
| `instagram_site`| `VARCHAR(255)` | Sim | NULL | Redes sociais ou site |
| `logo_url` | `VARCHAR(500)` | Sim | NULL | URL da logo no Cloudflare R2 |
| `fotos` | `TEXT[]` | Sim | `{}` | Galeria de fotos |
| `cep`, `rua`, `numero`| `VARCHAR` | Não | - | Endereço |
| `complemento` | `VARCHAR(100)` | Sim | NULL | Complemento |
| `bairro`, `cidade`, `uf`| `VARCHAR` | Não | - | Município e estado |
| `categoria` | `VARCHAR(100)` | Não | - | Setor do anunciante |
| `o_que_anunciar`| `TEXT` | Não | - | Resumo do produto/serviço |
| `descricao_anuncio`| `TEXT` | Não | - | Texto padrão |
| `preferencia_localizacao`| `VARCHAR(255)`| Não | - | Região de interesse |
| `distancia_maxima` | `VARCHAR(50)` | Sim | NULL | Raio de alcance |
| `bairros_especificos`| `VARCHAR(255)`| Sim | NULL | Bairros prioritários |
| `categorias_especificas`| `TEXT[]` | Sim | `{}` | Categorias de pontos desejadas |
| `faixa_etaria_alvo`| `TEXT[]` | Sim | `{}` | Faixas de idade |
| `genero_alvo` | `VARCHAR(50)` | Não | - | Público prioritário |
| `criado_em` / `atualizado_em` | `TIMESTAMP WITH TIME ZONE` | Não | `now()` | Auditoria |

**Índices:**
- `UNIQUE(user_id)`
- `INDEX(cidade)`

---

### 3.4 Tabela `anuncios`
Campanhas criadas por anunciantes para veiculação em uma TV específica.

| Coluna | Tipo SQL | Nulo? | Padrão | Descrição |
|---|---|---|---|---|
| `id` | `BIGSERIAL PRIMARY KEY` | Não | Auto | Identificador do anúncio |
| `anunciante_id` | `BIGINT REFERENCES anunciantes(id)` | Não | - | Anunciante proprietário (`ON DELETE CASCADE`) |
| `ponto_midia_id`| `BIGINT REFERENCES pontos_midia(id)`| Não | - | TV vinculada (`ON DELETE CASCADE`) |
| `titulo` | `VARCHAR(255)` | Não | - | Nome da campanha |
| `descricao` | `TEXT` | Não | - | Detalhes do anúncio |
| `tipo_midia` | `VARCHAR(20)` | Não | - | `VIDEO` ou `IMAGEM` |
| `midia_url` | `VARCHAR(500)` | Não | - | URL pública da CDN Cloudflare R2 |
| `r2_key` | `VARCHAR(255)` | Não | - | Chave interna do objeto no bucket R2 |
| `duracao_segundos`| `INTEGER` | Não | 10 | Duração de cada veiculação na TV |
| `status` | `VARCHAR(30)` | Não | `'PENDENTE'` | Estado na máquina de estados |
| `motivo_rejeicao`| `TEXT` | Sim | NULL | Justificativa do moderador |
| `reserva_expira_em`| `TIMESTAMP WITH TIME ZONE` | Sim | NULL | TTL da reserva de vaga enquanto aguarda Pix (30 a 60 min) |
| `data_inicio` | `TIMESTAMP WITH TIME ZONE` | Sim | NULL | Início da veiculação |
| `data_fim` | `TIMESTAMP WITH TIME ZONE` | Sim | NULL | Fim da veiculação contratada |
| `deletado_em` | `TIMESTAMP WITH TIME ZONE` | Sim | NULL | Soft delete |
| `criado_em` / `atualizado_em` | `TIMESTAMP WITH TIME ZONE` | Não | `now()` | Auditoria |

**Índices:**
- `INDEX(status)`
- `INDEX(ponto_midia_id)`
- `INDEX(anunciante_id)`
- `INDEX(ponto_midia_id, status)`
- `INDEX(reserva_expira_em)`
- `INDEX(data_fim)`

---

### 3.5 Tabela `cobrancas` (Faturamento AbacatePay)
Registra as faturas emitidas via API AbacatePay e seus webhooks de liquidação.

| Coluna | Tipo SQL | Nulo? | Padrão | Descrição |
|---|---|---|---|---|
| `id` | `BIGSERIAL PRIMARY KEY` | Não | Auto | Identificador da fatura |
| `anuncio_id` | `BIGINT REFERENCES anuncios(id)` | Não | - | Campanha faturada (`ON DELETE CASCADE`) |
| `anunciante_id` | `BIGINT REFERENCES anunciantes(id)` | Não | - | Pagador (`ON DELETE RESTRICT`) |
| `ponto_midia_id`| `BIGINT REFERENCES pontos_midia(id)`| Não | - | Estabelecimento beneficiário do repasse |
| `abacate_billing_id`| `VARCHAR(100)` | Não | - | ID da cobrança retornado pela AbacatePay |
| `transacao_id` | `VARCHAR(100)` | Sim | NULL | ID da transação única confirmada via webhook |
| `valor_centavos`| `INTEGER` | Não | - | Valor da cota (ex: 24900 para R$ 249,00) |
| `repasse_ponto_centavos`| `INTEGER` | Não | - | 50% destinado ao dono do ponto (ex: 12450) |
| `metodo` | `VARCHAR(30)` | Não | `'PIX'` | `PIX` ou `CREDIT_CARD` |
| `status` | `VARCHAR(30)` | Não | `'PENDENTE'` | `PENDENTE`, `PAGO`, `CANCELADO`, `FALHOU` |
| `pix_qr_code` | `TEXT` | Sim | NULL | Base64 ou URL da imagem do QR Code Pix |
| `pix_copia_cola`| `TEXT` | Sim | NULL | Linha digitável Pix Copia e Cola |
| `url_checkout` | `VARCHAR(500)` | Sim | NULL | Link de pagamento da AbacatePay |
| `pago_em` | `TIMESTAMP WITH TIME ZONE` | Sim | NULL | Timestamp exato da liquidação |
| `criado_em` / `atualizado_em` | `TIMESTAMP WITH TIME ZONE` | Não | `now()` | Auditoria |

**Índices:**
- `UNIQUE(abacate_billing_id)`
- `UNIQUE(transacao_id)`
- `INDEX(anuncio_id)`
- `INDEX(status)`

---

### 3.6 Tabela `registros_exibicao` (*Proof of Play*)
Comprovação física de veiculação na Smart TV.

| Coluna | Tipo SQL | Nulo? | Padrão | Descrição |
|---|---|---|---|---|
| `id` | `BIGSERIAL PRIMARY KEY` | Não | Auto | Identificador do registro |
| `anuncio_id` | `BIGINT REFERENCES anuncios(id)` | Não | - | Campanha (`ON DELETE RESTRICT`) |
| `ponto_midia_id`| `BIGINT REFERENCES pontos_midia(id)`| Não | - | TV física (`ON DELETE RESTRICT`) |
| `duracao_segundos`| `INTEGER` | Não | 10 | Tempo comprovado de tela |
| `tipo_midia` | `VARCHAR(20)` | Não | - | `VIDEO` ou `IMAGEM` |
| `exibido_em` | `TIMESTAMP WITH TIME ZONE` | Não | `now()` | Timestamp da exibição |

**Índices:**
- `INDEX(anuncio_id)`
- `INDEX(ponto_midia_id)`
- `INDEX(exibido_em)`
- `INDEX(ponto_midia_id, exibido_em)`

---

### 3.7 Tabela `notificacoes`
Mensageria interna e avisos de sistema.

| Coluna | Tipo SQL | Nulo? | Padrão | Descrição |
|---|---|---|---|---|
| `id` | `BIGSERIAL PRIMARY KEY` | Não | Auto | Identificador da mensagem |
| `user_id` | `BIGINT REFERENCES users(id)` | Não | - | Destinatário (`ON DELETE CASCADE`) |
| `tipo` | `VARCHAR(50)` | Não | - | Categoria do evento |
| `titulo` | `VARCHAR(255)` | Não | - | Título resumido |
| `mensagem` | `TEXT` | Não | - | Conteúdo explicativo |
| `lida` | `BOOLEAN` | Não | `false` | Status de visualização |
| `criado_em` | `TIMESTAMP WITH TIME ZONE` | Não | `now()` | Timestamp de envio |

**Índices:**
- `INDEX(user_id, lida)`
