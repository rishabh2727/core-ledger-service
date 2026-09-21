# API Documentation

Base URL: `http://localhost:8080`

All requests and responses use JSON.

---

## Accounts

### Create an account

`POST /accounts`

**Request body:**
```json
{
  "accountNumber": "1001",
  "accountType": "CHECKING"
}
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "accountNumber": "1001",
  "accountType": "CHECKING",
  "interestRate": null,
  "status": "ACTIVE",
  "createdAt": "2026-08-02T01:59:19.808534"
}
```

**Example:**
```bash
curl -X POST http://localhost:8080/accounts \
  -H "Content-Type: application/json" \
  -d '{"accountNumber": "1001", "accountType": "CHECKING"}'
```

---

### Get account details

`GET /accounts/{id}`

**Response:** `200 OK` with the account, or `404 Not Found` if it doesn't exist.

**Example:**
```bash
curl http://localhost:8080/accounts/1
```

---

### Get account balance

`GET /accounts/{id}/balance`

Balance is calculated live from all transactions on the account — it is never stored as a fixed number.

**Response:** `200 OK`
```json
450.00
```

**Example:**
```bash
curl http://localhost:8080/accounts/1/balance
```

---

### Get transaction history

`GET /accounts/{id}/transactions`

Returns every ledger entry (debit or credit) ever posted to this account, oldest to newest.

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "accountId": 1,
    "transactionId": 999999,
    "type": "CREDIT",
    "amount": 500.00,
    "postedAt": "2026-08-02T08:00:30.791886"
  },
  {
    "id": 2,
    "accountId": 1,
    "transactionId": 6183085488655874159,
    "type": "DEBIT",
    "amount": 50.00,
    "postedAt": "2026-08-02T02:01:10.925855"
  }
]
```

**Example:**
```bash
curl http://localhost:8080/accounts/1/transactions
```

---

## Transfers

### Create a transfer

`POST /transfers`

Moves money from one account to another. Creates two linked ledger entries (a debit and a credit) as one atomic operation — either both succeed, or neither does.

**Request body:**
```json
{
  "fromAccountId": 1,
  "toAccountId": 2,
  "amount": 50.00,
  "idempotencyKey": "unique-key-per-request"
}
```

| Field | Required | Notes |
|---|---|---|
| `fromAccountId` | Yes | Must be an existing account with enough balance |
| `toAccountId` | Yes | Must be an existing account |
| `amount` | Yes | Amount to transfer |
| `idempotencyKey` | Yes | A unique string per transfer attempt — sending the same key twice will not double-process the transfer |

**Responses:**
- `200 OK` — `"Transfer completed. Transaction ID: <id>"`
- `200 OK` — `"Transfer already processed. Transaction ID: <id>"` (if the idempotency key was already used)
- `400 Bad Request` — `"One or Both Accounts do not exist"`
- `400 Bad Request` — `"Insufficient funds."`

**Example:**
```bash
curl -X POST http://localhost:8080/transfers \
  -H "Content-Type: application/json" \
  -d '{"fromAccountId": 1, "toAccountId": 2, "amount": 50.00, "idempotencyKey": "test-key-1"}'
```

---

## Notes on design

- **No endpoint adds money into the system from nothing.** All transfers move money between two existing accounts. In this project, a starting balance was seeded directly into the database for testing purposes.
- **Balance is always derived, never stored.** This guarantees it can never drift out of sync with the actual transaction history.
- **Every transfer is atomic.** If any part of a transfer fails, nothing is saved — there is no possibility of money leaving one account without arriving at another.
