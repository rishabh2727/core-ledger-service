FROM maven:3.9.11-eclipse-temurin-21 AS build
WORKDIR /workspace

COPY pom.xml .
COPY services/ledger-service/pom.xml services/ledger-service/pom.xml
COPY services/fraud-service/pom.xml services/fraud-service/pom.xml
COPY services/payment-service/pom.xml services/payment-service/pom.xml
RUN mvn -B -ntp -pl services/payment-service -am dependency:go-offline

COPY services/payment-service/src services/payment-service/src
RUN mvn -B -ntp -pl services/payment-service -am package \
    && cp services/payment-service/target/payment-service-*.jar /app.jar

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app.jar app.jar
EXPOSE 8082
ENTRYPOINT ["java", "-jar", "app.jar"]
