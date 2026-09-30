# FLOW-01: Onboarding e Gestão do Ponto de Mídia

## 1. Contexto e Personas
- **Ator Principal:** Dono do Estabelecimento Comercial (`PONTO`).
- **Atores Secundários:** Administrador da Plataforma (`ADMIN`), Sistema de Precificação Automática.
- **Objetivo:** Cadastrar o estabelecimento físico, calcular automaticamente a nota e o tier comercial, configurar horários de funcionamento e preparar a conexão com a Smart TV.

---

## 2. Diagrama de Sequência do Fluxo

```
Estabelecimento                    Media+ Backend                     Banco de Dados
     │                                   │                                  │
     │── 1. POST /cadastro/ponto ───────>│                                  │
     │   (Dados, fotos, fluxo, tempo)    │── 2. Calcular Notas & Tier ─────>│
     │                                   │── 3. Salvar User e Ponto ───────>│
     │<── 4. Conta criada & Sessão JWT ──│                                  │
     │                                   │                                  │
     │── 5. Acessa /ponto/dashboard ────>│                                  │
     │                                   │── 6. Gera Código 6 Dígitos ─────>│
     │<── 7. Retorna Código (30s) + QR ──│   (Expira em 30 segundos)        │
     │                                   │                                  │
     │── 8. TV conecta e envia código ──>│                                  │
     │                                   │── 9. Atualiza ultimaAtividade ──>│
     │<── 10. TV Ao Vivo no Dashboard ───│                                  │
```

---

## 3. Passo a Passo Detalhado

### Passo 1: Cadastro Inicial do Ponto
1. O proprietário acessa `/cadastro/ponto`.
2. Preenche os dados:
   - Razão Social / Nome Fantasia, Responsável, WhatsApp, E-mail, Senha.
   - Endereço completo (com CEP para geocodificação de latitude/longitude).
   - Características do estabelecimento:
     - Possui TV? Quantas TVs?
     - Categoria (ex: Restaurante, Academia, Clínica, Barbearia).
     - Fluxo diário estimado (ex: "80 a 150 pessoas / dia").
     - Tempo médio de permanência (ex: "16 a 30 minutos").
     - Dias de funcionamento e horários de abertura/fechamento.
     - Fotos do espaço.

### Passo 2: Cálculo de Qualificação e Tier (Scoring Automático)
1. O serviço de precificação analisa os dados fornecidos:
   - Mapeia fluxo para nota $[2.5, 5.0]$.
   - Mapeia tempo de permanência para nota $[2.5, 5.0]$.
   - Estipula notas de perfil de público e exclusividade.
2. Aplica a ponderação oficial:
   $$\text{Score} = (N_{\text{fluxo}} \times 0.30) + (N_{\text{tempo}} \times 0.35) + (N_{\text{perfil}} \times 0.20) + (N_{\text{exclusividade}} \times 0.15)$$
3. Define o Tier:
   - Score $\ge 4.21 \rightarrow$ **Ouro** (Cota R$ 249,00; repasse R$ 124,50).
   - Score $3.31$ a $4.20 \rightarrow$ **Prata** (Cota R$ 199,00; repasse R$ 99,50).
   - Score $\le 3.30 \rightarrow$ **Bronze** (Cota R$ 149,00; repasse R$ 74,50).
4. Persiste o ponto com status inicial `PENDENTE` (ou `ATIVO` se política de auto-aprovação estiver habilitada).

### Passo 3: Horários de Funcionamento e Fuso de Brasília
- Todas as validações temporais utilizam o fuso de Brasília (`America/Sao_Paulo`).
- Suporte a múltiplos padrões de turno:
  - **Diurno Regular:** Ex: 08:00 às 19:00.
  - **Turno Noturno que cruza a meia-noite:** Ex: 18:00 às 02:00 (o cálculo reconhece que 01:30 da madrugada ainda pertence ao turno ativo).
  - **Turno 24 Horas:** Ex: 00:00 às 23:59.

### Passo 4: Operação no Dashboard do Ponto
- Ao acessar `/ponto/dashboard`:
  - O painel exibe o código rotativo de 6 dígitos (válido por 30s) e seu respectivo QR code.
  - O monitor de status consulta `/api/auth/me` ou dados do ponto a cada 3 segundos.
  - Quando a TV conecta e envia batimento cardíaco, a interface atualiza instantaneamente para o indicador verde: **AO VIVO**.
