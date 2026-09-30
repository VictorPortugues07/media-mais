# Roteiro e Mapeamento da Arquitetura Java 21 (Spring Boot 3.3+)

Este documento estabelece o mapeamento técnico completo para a construção do novo backend da **Media+**, implementado em **Java 21 LTS** e **Spring Boot 3.3+**.

---

## 1. Definição do Gerenciador de Dependências e Build (Maven)

Recomenda-se utilizar o **Apache Maven** com `pom.xml` modularizado ou pacote único robusto sob a pasta `backend-java/` (ou como raiz do backend).

### Principais Dependências do `pom.xml`
```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.3.4</version>
        <relativePath/>
    </parent>
    <groupId>com.mediamais</groupId>
    <artifactId>platform-api</artifactId>
    <version>1.0.0</version>
    <name>Media+ Platform API</name>
    <description>Backend DOOH em Java 21 para a Plataforma Media+</description>

    <properties>
        <java.version>21</java.version>
        <aws.sdk.version>2.25.60</aws.sdk.version>
    </properties>

    <dependencies>
        <!-- Spring Boot Starters -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-oauth2-client</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-oauth2-resource-server</artifactId>
        </dependency>

        <!-- PostgreSQL Driver & Flyway -->
        <dependency>
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>org.flywaydb</groupId>
            <artifactId>flyway-core</artifactId>
        </dependency>
        <dependency>
            <groupId>org.flywaydb</groupId>
            <artifactId>flyway-database-postgresql</artifactId>
        </dependency>

        <!-- Cache em Memória de Alta Performance (Caffeine para Heartbeat da TV) -->
        <dependency>
            <groupId>com.github.ben-manes.caffeine</groupId>
            <artifactId>caffeine</artifactId>
        </dependency>

        <!-- Cloudflare R2 (AWS S3 SDK v2) -->
        <dependency>
            <groupId>software.amazon.awssdk</groupId>
            <artifactId>s3</artifactId>
            <version>${aws.sdk.version}</version>
        </dependency>

        <!-- JWT (auth0) para TV pairTokens e sessions -->
        <dependency>
            <groupId>com.auth0</groupId>
            <artifactId>java-jwt</artifactId>
            <version>4.4.0</version>
        </dependency>

        <!-- Testes -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.springframework.security</groupId>
            <artifactId>spring-security-test</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.testcontainers</groupId>
            <artifactId>postgresql</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
```

---

## 2. Configurações de Ambiente (`application.yml`)

```yaml
server:
  port: 8080
  shutdown: graceful

spring:
  application:
    name: mediamais-platform-api
  threads:
    virtual:
      enabled: true # Java 21 Project Loom para alta concorrência em I/O

  datasource:
    url: ${DATABASE_URL:jdbc:postgresql://localhost:5432/mediamais}
    username: ${DATABASE_USER:postgres}
    password: ${DATABASE_PASSWORD:postgres}
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
      idle-timeout: 300000
      connection-timeout: 20000

  jpa:
    open-in-view: false
    hibernate:
      ddl-auto: validate
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
        format_sql: false

  flyway:
    enabled: true
    locations: classpath:db/migration

  security:
    oauth2:
      client:
        registration:
          google:
            client-id: ${GOOGLE_CLIENT_ID}
            client-secret: ${GOOGLE_CLIENT_SECRET}
            scope: openid, profile, email

# Cloudflare R2 Config
cloudflare:
  r2:
    account-id: ${R2_ACCOUNT_ID}
    access-key: ${R2_ACCESS_KEY}
    secret-key: ${R2_SECRET_KEY}
    bucket-name: ${R2_BUCKET_NAME:mediamais-midias}
    cdn-base-url: ${R2_CDN_URL:https://media.mediamais.com.br}

# AbacatePay Config
abacatepay:
  api-url: https://api.abacatepay.com/v1
  api-key: ${ABACATEPAY_API_KEY}
  webhook-secret: ${ABACATEPAY_WEBHOOK_SECRET}

# Segurança dos Tokens da TV e Sessão
security:
  jwt:
    tv-secret: ${TV_JWT_SECRET:mediamais_super_tv_secret_2026}
    session-secret: ${SESSION_JWT_SECRET:mediamais_super_user_secret_2026}
```

---

## 3. Mapeamento de Entidades JPA x Banco Hospedado

| Entidade Java | Tabela PostgreSQL | Repositório Spring Data |
|---|---|---|
| `User.java` | `users` | `UserRepository` |
| `PontoMidia.java` | `pontos_midia` | `PontoMidiaRepository` |
| `Anunciante.java` | `anunciantes` | `AnuncianteRepository` |
| `Anuncio.java` | `anuncios` | `AnuncioRepository` |
| `Cobranca.java` | `cobrancas` | `CobrancaRepository` |
| `RegistroExibicao.java` | `registros_exibicao` | `RegistroExibicaoRepository` |
| `Notificacao.java` | `notificacoes` | `NotificacaoRepository` |

---

## 4. Ordem Recomendada de Implementação Técnica

1. **Sprint 1 — Fundação & Banco de Dados:**
   - Criação da pasta do projeto e `pom.xml`.
   - Script inicial Flyway `V1__init_schema.sql` contendo toda a DDL da `SPEC-01`.
   - Classes de Entidade `@Entity` e Enums.
2. **Sprint 2 — Segurança, OAuth2 e Storage R2:**
   - Configuração do Spring Security 6 com `oauth2Login()`.
   - Serviço S3 para emissão de Presigned URLs do Cloudflare R2 (`R2StorageService`).
   - Filtro JWT para autenticação de sessão e Smart TV.
3. **Sprint 3 — Domínio DOOH, TV Player e Telemetria:**
   - Algoritmo de scoring e determinação de tiers (`PricingService`).
   - Motor de capacidade de 360 segundos (`CapacityEngine`).
   - Endpoints do Smart TV Player (`/api/tv/parear`, `/api/tv/telemetria`).
4. **Sprint 4 — Faturamento com AbacatePay e Campanhas:**
   - Client HTTP da AbacatePay (`AbacatePayClient`).
   - Controlador de Webhook com validação de assinatura HMAC (`WebhookAbacatePayController`).
   - Máquina de estados completa da campanha.
5. **Sprint 5 — Tempo Real (SSE) e Moderação Admin:**
   - Canal de streaming SSE (`/api/notificacoes/stream`).
   - Endpoints de aprovação e rejeição com justificativa obrigatória.

---

## 5. Configuração Canônica do Spring Security 6 (`SecurityConfig.java`)

Para evitar alucinações de métodos obsoletos do Spring Security 5, segue a configuração exata utilizando `authorizeHttpRequests` e lambdas:

```java
package com.mediamais.platform.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final TvTokenAuthenticationFilter tvTokenFilter;
    private final JwtSessionAuthenticationFilter jwtSessionFilter;

    public SecurityConfig(TvTokenAuthenticationFilter tvTokenFilter,
                          JwtSessionAuthenticationFilter jwtSessionFilter) {
        this.tvTokenFilter = tvTokenFilter;
        this.jwtSessionFilter = jwtSessionFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Rotas Públicas
                .requestMatchers("/", "/player", "/api/tv/parear", "/api/auth/**").permitAll()
                // Webhook com validação HMAC própria
                .requestMatchers(HttpMethod.POST, "/api/webhooks/abacatepay").permitAll()
                // Telemetria da TV (requer header x-tv-token validado pelo filtro)
                .requestMatchers(HttpMethod.POST, "/api/tv/telemetria").permitAll()
                // Rotas Administrativas
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                // Rotas Autenticadas
                .anyRequest().authenticated()
            )
            .oauth2Login(oauth2 -> oauth2
                .defaultSuccessUrl("/login/oauth2/success", true)
            )
            .addFilterBefore(tvTokenFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(jwtSessionFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
```
