# Educational Fintech Dashboard

This React dashboard is a learning layer for the backend system.

It shows:

- Ledger Service
- Kafka
- Fraud Service
- Redis
- Fraud DB
- Payment Service placeholder

## What It Does

When you submit a transfer, the dashboard:

1. Calls Ledger Service through the Vite proxy.
2. Animates the event path from Ledger to Kafka to Fraud.
3. Polls Fraud Service for saved fraud decisions.
4. Shows the fraud score, triggered rules, and plain-English explanation.

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

The Vite proxy maps:

- `/api/ledger/*` to Ledger
- `/api/fraud/*` to Fraud

## Docker Compose

From the repo root:

```bash
docker compose -f infra/compose.yaml up --build
```

Then open:

```text
http://localhost:5173
```
# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
