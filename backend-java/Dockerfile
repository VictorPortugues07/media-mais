# Multi-stage build para Java 21 LTS
FROM maven:3.9.8-eclipse-temurin-21 AS build
WORKDIR /app

# Copia pom.xml e resolve dependências (cache de layers)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copia o código fonte e compila o jar executável
COPY src ./src
RUN mvn clean package -DskipTests

# Estágio de Produção com imagem leve
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Usuário não-root para segurança
RUN addgroup -S mediamais && adduser -S mediamais -G mediamais
USER mediamais

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-XX:+UseZGC", "-XX:+ZGenerational", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
