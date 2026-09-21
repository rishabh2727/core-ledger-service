FROM maven:3.9.11-eclipse-temurin-21 AS build
WORKDIR /workspace

COPY pom.xml .
COPY services/ledger-service/pom.xml services/ledger-service/pom.xml
COPY services/fraud-service/pom.xml services/fraud-service/pom.xml
RUN mvn -B -ntp -pl services/fraud-service -am dependency:go-offline

COPY services/fraud-service/src services/fraud-service/src
RUN mvn -B -ntp -pl services/fraud-service -am package \
    && cp services/fraud-service/target/fraud-service-*.jar /app.jar

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app.jar app.jar
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar"]
