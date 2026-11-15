# Educational Fintech Dashboard

This React dashboard is a learning layer for the backend system.

Screenshots and a ~1 minute live demo video live in
[`docs/demo/`](../../docs/demo/) (linked from the root README).

It shows:

- Ledger Service
- Kafka
- Fraud Service
- Redis
- Fraud DB
- Payment Service

## What It Does

When you submit a transfer, the dashboard:

1. Calls Payment Service through the Vite proxy.
2. Payment Service creates a `PENDING` payment row.
3. Payment Service asks Fraud Service for a pre-check.
4. If Fraud approves, Payment Service calls Ledger.
5. Ledger moves money and publishes the Kafka event through the outbox.
6. The dashboard shows status, fraud score, triggered rules, and plain-English explanation.

## Run Locally

From this folder:

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

## Backend Assumption

The dashboard expects:

- Ledger Service on `http://localhost:8080`
- Fraud Service on `http://localhost:8081`
- Payment Service on `http://localhost:8082`

The Vite proxy maps:

- `/api/ledger/*` to Ledger
- `/api/fraud/*` to Fraud
- `/api/payment/*` to Payment

## Docker Compose

From the repo root:

```bash
docker compose -f infra/compose.yaml up --build
```

Then open:

```text
http://localhost:5173
```
