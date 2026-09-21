# Core Ledger Service

A simplified version of how banks track money internally. Built with Java and Spring Boot to learn backend engineering concepts used in real fintech and banking systems.

## What it does

This service lets you create accounts and move money between them safely. Instead of storing one balance number that gets overwritten, every transfer is recorded as two linked entries — money leaving one account, money arriving in another. **double-entry bookkeeping**, and it's the same principle real banks use, so nothing can silently vanish or get double-counted.

## Key features

- **Accounts** — create and view accounts
- **Transfers** — move money between accounts, with automatic checks for sufficient funds
- **Balance calculation** — balance is never stored directly, it's calculated fresh from full transaction history every time
- **Idempotency protection** — if the same transfer request is sent twice (network retry, duplicate click), it only processes once
- **Transaction history** — full, permanent record of every transaction on an account


## Tech stack

- **Java 21** + **Spring Boot** (Spring Web, Spring Data JPA)
- **PostgreSQL** — running in Docker for local development
- **Maven** — build tool


## Running it locally

**1. Start Postgres in Docker:**
```bash
docker run --name ledger-db -e POSTGRES_PASSWORD=yourpassword -e POSTGRES_DB=ledger -p 5432:5432 -d postgres
```

**2. Update `src/main/resources/application.yaml`** with your database password.

**3. Run the app:**
```bash
./mvnw spring-boot:run
```

The API will be available at `http://localhost:8080`.

See [API.md](./API.md) for all available endpoints and example requests.




