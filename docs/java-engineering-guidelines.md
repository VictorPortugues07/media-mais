# Diretrizes de Engenharia Java: Arquitetura, SOLID, Design Patterns e Segurança (Media+)

Este documento estabelece o padrão canônico de engenharia de software para o desenvolvimento do backend da **Media+** em **Java 21 LTS** e **Spring Boot 3.3+**. Todas as classes, serviços, entidades e controladores devem aderir rigorosamente a estas diretrizes.

---

## 1. 🏛️ Arquitetura em Camadas e Portas & Adaptadores (Hexagonal)

Para garantir desacoplamento total de provedores de infraestrutura (Cloudflare R2, AbacatePay, etc.), o sistema adota o padrão **Ports & Adapters**:

```
                       ┌──────────────────────────────┐
                       │       CAMADA DE DOMÍNIO      │
                       │   Entidades, Enums, Regras   │
                       └──────────────┬───────────────┘
                                      │
                       ┌──────────────▼───────────────┐
                       │     CAMADA DE APLICAÇÃO      │
                       │     Casos de Uso / Serviços  │
                       │  (CapacityEngine, Campaign)  │
                       └──────┬───────────────┬───────┘
           Porta (Interface)  │               │ Porta (Interface)
           PaymentGateway     │               │ StorageService
                              │               │
       ┌──────────────────────▼───┐       ┌───▼──────────────────────┐
       │   ADAPTADOR DE PAGAMENTO │       │   ADAPTADOR DE STORAGE   │
       │    AbacatePayGateway     │       │    CloudflareR2Storage   │
       │    (Infraestrutura)      │       │      (Infraestrutura)    │
       └──────────────────────────┘       └──────────────────────────┘
```

### Regras Arquiteturais
1. **Regras de Negócio Puras:** O domínio nunca importa pacotes da AWS SDK ou bibliotecas específicas da AbacatePay.
2. **Inversão de Dependência:** O domínio define a interface (Porta); a camada de infraestrutura implementa a interface (Adaptador).
3. **Substituibilidade:** Se a plataforma mudar de gateway de pagamento (ex: para Asaas ou Stripe) ou de storage (para AWS S3 nativo ou MinIO), **nenhuma linha** do domínio de negócio será alterada.

---

## 2. 📐 Princípios SOLID Aplicados

### S — Single Responsibility Principle (SRP)
- Cada classe possui uma responsabilidade única e coesa:
  - `CapacityEngine`: Calcula matematicamente a ocupação de 360s e gerencia o Slot Hold de 60m.
  - `PricingService`: Aplica os pesos oficiais (30/35/20/15) e determina o Tier (Bronze, Prata, Ouro).
  - `TvPairingService`: Orquestra o ciclo de vida do código temporário de 30s e gera o `pairToken`.
  - `TelemetryService`: Gerencia o buffer em memória e o fluxo assíncrono de telemetria.

### O — Open/Closed Principle (OCP)
- As regras de negócio são abertas para extensão, mas fechadas para modificação:
  - Novas formas de faturamento ou novos tiers podem ser adicionados criando implementações de interfaces sem modificar os serviços existentes.

### L — Liskov Substitution Principle (LSP)
- Todas as implementações de `PaymentGateway` ou `StorageService` honram estritamente o contrato da interface sem lançar exceções inesperadas para fluxos válidos.

### I — Interface Segregation Principle (ISP)
- Interfaces são específicas e enxutas:
  - `PresignedUrlGenerator` (apenas gera URLs de upload).
  - `StorageObjectReader` (apenas consulta metadados ou existência).
  - `BillingProcessor` (apenas emite cobranças Pix).
  - `WebhookSignatureVerifier` (apenas valida assinaturas criptográficas).

### D — Dependency Inversion Principle (DIP)
- A injeção de dependências no Spring Boot é feita obrigatoriamente via construtor (sem `@Autowired` em campos privados), permitindo testes unitários limpos com Mockito.

---

## 3. 🧩 Design Patterns Canônicos do Sistema

### 3.1 State Pattern (Máquina de Estados de Campanhas)
Substitui estruturas condicionais complexas (`if/else` e `switch`) por classes de estado desacopladas:
```java
public interface AnuncioState {
    void aprovar(AnuncioContext context, boolean cabeNaGrade);
    void rejeitar(AnuncioContext context, String motivo);
    void confirmarPagamento(AnuncioContext context);
    void expirar(AnuncioContext context);
}
```
- Estados implementados: `PendenteState`, `AguardandoPagamentoState`, `AtivoState`, `FilaEsperaState`, `RejeitadoState`, `ExpiradoState`.
- Tentativas de transições proibidas (ex: aprovar anúncio que está em `RejeitadoState`) lançam `IllegalStateTransitionException` instantaneamente.

### 3.2 Strategy Pattern (Matriz de Precificação)
Encapsula o algoritmo de pesos e cálculos de cotas:
```java
public interface PricingStrategy {
    ScoreResult calcular(PontoMidia ponto);
}

@Component
public class StandardDoohPricingStrategy implements PricingStrategy {
    private static final double PESO_FLUXO = 0.30;
    private static final double PESO_TEMPO = 0.35;
    private static final double PESO_PERFIL = 0.20;
    private static final double PESO_EXCLUSIVIDADE = 0.15;
    // ...
}
```

### 3.3 Observer / Domain Events (Eventos de Domínio Assíncronos)
Ao confirmar o pagamento de uma cota Pix, o serviço publica um evento:
```java
applicationEventPublisher.publishEvent(new PaymentConfirmedEvent(anuncioId, pontoId, valorCentavos));
```
Três listeners independentes e desacoplados reagem:
1. `TvPlaylistUpdaterListener`: Atualiza a playlist ativa da Smart TV.
2. `RealtimeNotificationListener`: Dispara evento via Server-Sent Events (`SseEmitter`).
3. `FinancialLedgerListener`: Registra os créditos para o repasse de 50% ao dono da TV.

### 3.4 Producer-Consumer / Batch Buffer (Ingestão do Proof of Play)
A telemetria da TV coloca o registro de veiculação em uma `BlockingQueue` concorrente em memória. Um worker em Virtual Thread descarrega em lotes (`saveAll()`) a cada 5 segundos no PostgreSQL, reduzindo a contenção de conexões JDBC em 90%.

---

## 4. ⚡ Desempenho e Escalabilidade em Java 21

1. **Virtual Threads (Project Loom):**
   - Configuração: `spring.threads.virtual.enabled: true`.
   - Todas as requisições de I/O bloqueante (PostgreSQL, chamadas HTTP à AbacatePay, streaming de notificações SSE) rodam em Virtual Threads leves, suportando dezenas de milhares de clientes simultâneos sem overhead de threads do sistema operacional.
2. **Caffeine Cache para Heartbeat da TV:**
   - O pulso de 4s da TV atualiza exclusivamente o cache L1 em memória com expiração de 12 segundos.
   - O banco de dados só recebe gravação em transições de conectividade ou em batch a cada 5 minutos, eliminando o gargalo de escrita de WAL e dead tuples no PostgreSQL.
3. **Hibernate JDBC Batching:**
   - Inserções de registros em lote configuradas no `application.yml`:
     ```yaml
     spring.jpa.properties.hibernate.jdbc.batch_size: 100
     spring.jpa.properties.hibernate.order_inserts: true
     ```

---

## 5. 🔒 SEGURANÇA MÁXIMA (Defesa em 7 Camadas)

### Camada 1: Proteção Anti-Força Bruta no Pareamento da TV
- O código de 6 dígitos expira em 30 segundos.
- **Implementação:** Filtro de Rate Limiting por endereço IP via **Bucket4j/Caffeine**:
  - Máximo de 5 tentativas de pareamento por minuto por IP.
  - Bloqueio progressivo de 5 minutos caso o limite seja ultrapassado.

### Camada 2: Comparação em Tempo Constante (Anti-Timing Attacks)
- Na validação da assinatura HMAC do webhook do AbacatePay (`abacate-signature`), é obrigatório o uso de tempo constante:
  ```java
  byte[] expected = hmacSha256(rawBody, webhookSecret);
  byte[] received = HexFormat.of().parseHex(signatureHeader);
  if (!MessageDigest.isEqual(expected, received)) {
      throw new InvalidWebhookSignatureException("Assinatura HMAC inválida");
  }
  ```
  Isso neutraliza ataques estatísticos de latência por byte.

### Camada 3: Controle Estrito Anti-IDOR (Isolamento de Inquilinos)
- Nenhum registro pode ser acessado com base apenas no ID da URL.
- Métodos protegidos via anotações de segurança declarativa:
  ```java
  @PreAuthorize("hasRole('ADMIN') or @securityService.isAnuncioOwner(#id, authentication)")
  @GetMapping("/api/anuncios/{id}")
  public AnuncioResponse getAnuncio(@PathVariable Long id) { ... }
  ```

### Camada 4: Upload Zero-Trust via Cloudflare R2
- O backend nunca faz upload de binários pesados por intermédio da sua própria memória.
- As Presigned URLs S3 são geradas com:
  - Chave interna UUIDv4 pura (`midias/{uuid}.mp4`), impedindo Path Traversal (`../`).
  - Restrição de `Content-Type` criptograficamente vinculada à assinatura (rejeitando scripts maliciosos ou binários executáveis).
  - TTL rígido de 10 minutos.

### Camada 5: Imutabilidade e Integridade do Proof of Play
- A tabela `registros_exibicao` possui `ON DELETE RESTRICT` nas chaves estrangeiras.
- A aplicação não expõe nenhum método de remoção ou modificação de veiculações comprovadas.

### Camada 6: Sessões e Cookies Blindados
- Cookie `mm_session`: `HttpOnly = true`, `Secure = true`, `SameSite = Lax`, `Path = /`.
- Token da Smart TV (`pairToken`): Assinado com chave privada exclusiva para TVs e validado no cabeçalho `x-tv-token`.

### Camada 7: Sanitização de Logs e Conformidade com a LGPD
- Mascaramento automático de dados sensíveis nas saídas do Logback (números de telefone, tokens e chaves Pix).
