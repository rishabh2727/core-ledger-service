FROM maven:3.9.11-eclipse-temurin-21 AS build
WORKDIR /workspace

COPY pom.xml .
COPY services/ledger-service/pom.xml services/ledger-service/pom.xml
COPY services/fraud-service/pom.xml services/fraud-service/pom.xml
RUN mvn -B -ntp -pl services/ledger-service -am dependency:go-offline

COPY services/ledger-service/src services/ledger-service/src
RUN mvn -B -ntp -pl services/ledger-service -am package \
    && cp services/ledger-service/target/ledger-service-*.jar /app.jar

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
