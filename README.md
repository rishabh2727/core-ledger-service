# Fintech Payments Platform

Monorepo for an event-driven payments platform. The current baseline contains
the Ledger and Fraud bounded services, shared local infrastructure, and one
Maven reactor build. A Payment orchestrator will be added as a later module.

## Repository layout

```text
.
├── contracts/json-schema/
├── docs/
├── infra/compose.yaml
├── observability/
├── services/
│   ├── fraud-service/
│   └── ledger-service/
├── pom.xml
└── mvnw
```

Both services target Java 21 and inherit Spring Boot 4.1.1 from the root Maven
parent. Their original Git histories are retained in this repository.

## Build and test

```bash
./mvnw clean verify
```

The context tests use isolated in-memory databases, so the baseline build does
not require local infrastructure.

## Run the platform

Prerequisites: Docker with Compose support.

```bash
docker compose -f infra/compose.yaml up --build
```

Set `POSTGRES_PASSWORD` before running the command to override the local-only
default password.

- Ledger Service: `http://localhost:8080`
- Fraud Service: `http://localhost:8081`
- Kafka: `localhost:9092`
- Ledger PostgreSQL: `localhost:5432`
- Fraud PostgreSQL: `localhost:5433`
- Payment PostgreSQL (reserved): `localhost:5434`
- Redis: `localhost:6379`

Application configuration is environment-driven in containers and retains
localhost defaults for running either service from the IDE.

## Service documentation

- [Ledger Service](services/ledger-service/README.md)
- [Ledger API](services/ledger-service/API.md)
