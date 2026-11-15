import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { motion } from 'framer-motion'

type FraudDecision = {
  id: number
  transactionId: number
  accountId: number
  amount: number | string
  reason: string
  score: number
  outcome: 'APPROVE' | 'DECLINE'
  flaggedAt?: string
}

type FraudDecisionPage = {
  content?: FraudDecision[]
}

type DashboardTransaction = {
  transactionId: number
  amount: string
  status: 'APPROVED' | 'DECLINED' | 'PENDING'
  score?: number
  reason?: string
  source: 'sample' | 'backend'
}

type TransferFormState = {
  fromAccountId: string
  toAccountId: string
  amount: string
  idempotencyKey: string
}

const sampleTransactions: DashboardTransaction[] = [
  {
    transactionId: 101,
    amount: '50.00',
    status: 'APPROVED',
    score: 0,
    reason: 'NO_RULE_TRIGGERED',
    source: 'sample',
  },
  {
    transactionId: 102,
    amount: '2000.00',
    status: 'DECLINED',
    score: 80,
    reason: 'LARGE_AMOUNT,ROUND_AMOUNT',
    source: 'sample',
  },
  {
    transactionId: 103,
    amount: '350.00',
    status: 'APPROVED',
    score: 0,
    reason: 'NO_RULE_TRIGGERED',
    source: 'sample',
  },
]

const ruleScores: Record<string, number> = {
  LARGE_AMOUNT: 70,
  ROUND_AMOUNT: 10,
  HIGH_VELOCITY: 50,
}

const ruleLabels: Record<string, string> = {
  LARGE_AMOUNT: 'Large amount',
  ROUND_AMOUNT: 'Round amount',
  HIGH_VELOCITY: 'High transaction velocity',
  NO_RULE_TRIGGERED: 'No rule triggered',
}

const serviceCards = [
  { name: 'Ledger Service', detail: 'Creates ledger entries and outbox events' },
  { name: 'Kafka', detail: 'Moves events between services' },
  { name: 'Fraud Service', detail: 'Runs fraud rules and scoring' },
  { name: 'Redis', detail: 'Tracks transaction velocity' },
  { name: 'Fraud DB', detail: 'Stores fraud decisions' },
  { name: 'Payment Service', detail: 'Coming next: payment lifecycle' },
]

function App() {
  const [transactions, setTransactions] = useState<DashboardTransaction[]>(sampleTransactions)
  const [selectedId, setSelectedId] = useState<number>(102)
  const [animationRun, setAnimationRun] = useState(0)
  const [form, setForm] = useState<TransferFormState>(() => ({
    fromAccountId: '1',
    toAccountId: '2',
    amount: '2000.00',
    idempotencyKey: `demo-${Date.now()}`,
  }))
  const [statusMessage, setStatusMessage] = useState('Start your backend, then submit a transfer to watch the flow.')

  const selectedTransaction = useMemo(
    () => transactions.find((transaction) => transaction.transactionId === selectedId) ?? transactions[0],
    [transactions, selectedId],
  )

  async function refreshFraudDecisions() {
    const response = await fetch('/api/fraud/fraud-decisions?size=20')
    if (!response.ok) {
      throw new Error('Fraud Service did not return decisions.')
    }

    const page = (await response.json()) as FraudDecisionPage
    const backendTransactions = (page.content ?? []).map(toDashboardTransaction)

    if (backendTransactions.length > 0) {
      setTransactions([...backendTransactions, ...sampleTransactions])
    }
  }

  useEffect(() => {
    const firstPoll = window.setTimeout(() => {
      refreshFraudDecisions().catch(() => undefined)
    }, 0)

    const timer = window.setInterval(() => {
      refreshFraudDecisions().catch(() => undefined)
    }, 4000)

    return () => {
      window.clearTimeout(firstPoll)
      window.clearInterval(timer)
    }
  }, [])

  async function submitTransfer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setAnimationRun((current) => current + 1)
    setStatusMessage('Transfer submitted. Watch the event move through the system.')

    try {
      const response = await fetch('/api/ledger/transfers', {
        method: 'POST',
        headers: {
          Authorization: basicAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fromAccountId: Number(form.fromAccountId),
          toAccountId: Number(form.toAccountId),
          amount: form.amount,
          description: 'Dashboard demo transfer',
          idempotencyKey: form.idempotencyKey,
        }),
      })

      const message = await response.text()
      if (!response.ok) {
        throw new Error(message)
      }

      const transactionId = parseTransactionId(message)
      if (transactionId) {
        setSelectedId(transactionId)
        setTransactions((current) => [
          {
            transactionId,
            amount: form.amount,
            status: 'PENDING',
            source: 'backend',
          },
          ...current,
        ])
      }

      setForm((current) => ({
        ...current,
        idempotencyKey: `demo-${Date.now()}`,
      }))
      setStatusMessage('Ledger accepted the transfer. Fraud decision will appear after Kafka delivers the event.')

      window.setTimeout(() => {
        refreshFraudDecisions().catch(() => undefined)
      }, 2500)
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Could not submit transfer.')
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">
              Educational Fintech Dashboard
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-white lg:text-6xl">
              Watch one transfer move through your backend.
            </h1>
            <p className="mt-4 max-w-3xl text-base text-slate-300">
              Submit a transfer, follow the animated event path, then click a transaction to understand the fraud score.
            </p>
          </div>
          <ServiceStatusCard />
        </header>

        <div className="grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
          <SystemMap animationRun={animationRun} />
          <TransferForm form={form} onChange={setForm} onSubmit={submitTransfer} statusMessage={statusMessage} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
          <TransactionFeed
            transactions={transactions}
            selectedId={selectedTransaction.transactionId}
            onSelect={setSelectedId}
          />
          <FraudExplanationPanel transaction={selectedTransaction} />
        </div>
      </section>
    </main>
  )
}

function SystemMap({ animationRun }: { animationRun: number }) {
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-cyan-950/30">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-white">System map</h2>
          <p className="mt-1 text-sm text-slate-400">The glowing dot shows where the transfer event is travelling.</p>
        </div>
        <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-200">
          Ledger → Kafka → Fraud → Redis/DB
        </span>
      </div>

      <div className="relative mt-8 min-h-[420px] overflow-hidden rounded-2xl border border-slate-800 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.18),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.18),_transparent_28%)] p-5">
        <div className="absolute left-8 right-8 top-1/2 h-px bg-gradient-to-r from-cyan-400/20 via-cyan-300/70 to-purple-400/20" />
        <motion.div
          key={animationRun}
          className="absolute z-20 h-5 w-5 rounded-full bg-cyan-300 shadow-[0_0_35px_rgba(103,232,249,0.95)]"
          initial={{ left: '4%', top: '48%', opacity: 0 }}
          animate={{
            left: ['4%', '25%', '47%', '67%', '86%'],
            top: ['48%', '48%', '48%', '31%', '63%'],
            opacity: [0, 1, 1, 1, 0],
          }}
          transition={{ duration: 3.4, ease: 'easeInOut' }}
        />

        <div className="grid h-full gap-4 md:grid-cols-3">
          {serviceCards.map((service, index) => (
            <div
              key={service.name}
              className={`rounded-2xl border border-slate-700 bg-slate-950/70 p-4 backdrop-blur ${
                index === 3 ? 'md:col-start-2' : ''
              } ${index === 4 ? 'md:col-start-3' : ''}`}
            >
              <p className="text-sm font-semibold text-cyan-200">{service.name}</p>
              <p className="mt-2 text-sm text-slate-400">{service.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function TransferForm({
  form,
  onChange,
  onSubmit,
  statusMessage,
}: {
  form: TransferFormState
  onChange: (form: TransferFormState) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  statusMessage: string
}) {
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-slate-950/40">
      <h2 className="text-2xl font-semibold text-white">Try a transfer</h2>
      <p className="mt-2 text-sm text-slate-400">
        This calls Ledger. The animation shows the backend path while Fraud writes the decision.
      </p>

      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <Input label="From account id" value={form.fromAccountId} onChange={(value) => onChange({ ...form, fromAccountId: value })} />
        <Input label="To account id" value={form.toAccountId} onChange={(value) => onChange({ ...form, toAccountId: value })} />
        <Input label="Amount" value={form.amount} onChange={(value) => onChange({ ...form, amount: value })} />
        <Input
          label="Idempotency key"
          value={form.idempotencyKey}
          onChange={(value) => onChange({ ...form, idempotencyKey: value })}
        />
        <button className="w-full rounded-2xl bg-cyan-300 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-200">
          Submit transfer and animate flow
        </button>
      </form>

      <p className="mt-5 rounded-2xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-300">{statusMessage}</p>
    </section>
  )
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-300">{label}</span>
      <input
        className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-300"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}

function TransactionFeed({
  transactions,
  selectedId,
  onSelect,
}: {
  transactions: DashboardTransaction[]
  selectedId: number
  onSelect: (transactionId: number) => void
}) {
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">Live transaction feed</h2>
          <p className="mt-1 text-sm text-slate-400">Backend decisions appear here as Fraud saves them.</p>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-950 text-slate-400">
            <tr>
              <th className="px-4 py-3">Transaction</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr
                key={`${transaction.source}-${transaction.transactionId}`}
                className={`cursor-pointer border-t border-slate-800 transition hover:bg-slate-800/70 ${
                  selectedId === transaction.transactionId ? 'bg-cyan-400/10' : 'bg-slate-900'
                }`}
                onClick={() => onSelect(transaction.transactionId)}
              >
                <td className="px-4 py-3 font-medium text-white">TXN-{transaction.transactionId}</td>
                <td className="px-4 py-3 text-slate-300">${formatAmount(transaction.amount)}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={transaction.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function FraudExplanationPanel({ transaction }: { transaction: DashboardTransaction }) {
  const reasons = (transaction.reason ?? 'NO_RULE_TRIGGERED').split(',').filter(Boolean)
  const explanation = buildExplanation(reasons)

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
      <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">Fraud explanation</p>
      <h2 className="mt-3 text-3xl font-bold text-white">Transaction TXN-{transaction.transactionId}</h2>
      <StatusBadge status={transaction.status} />

      <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-5">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-4xl font-bold text-white">{transaction.score ?? 0} / 100</p>
            <p className="mt-1 text-sm text-slate-400">Illustrative fraud risk score</p>
          </div>
          <div className="h-24 w-24 rounded-full border-8 border-cyan-300/80" />
        </div>
      </div>

      <div className="mt-6">
        <h3 className="font-semibold text-white">Triggered rules</h3>
        <div className="mt-3 space-y-3">
          {reasons.map((reason) => (
            <div key={reason} className="flex items-center justify-between rounded-2xl bg-slate-950 px-4 py-3">
              <span className="text-slate-200">{ruleLabels[reason] ?? reason}</span>
              <span className="font-semibold text-cyan-200">+{ruleScores[reason] ?? 0}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-cyan-300/10 p-4 text-sm text-cyan-50">
        <p className="font-semibold">Decision explanation</p>
        <p className="mt-2 text-cyan-100">{explanation}</p>
      </div>
    </section>
  )
}

function ServiceStatusCard() {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 px-5 py-4">
      <p className="text-sm font-semibold text-white">Learning mode</p>
      <p className="mt-1 text-sm text-slate-400">Animated UI + real API calls when services are running.</p>
    </div>
  )
}

function StatusBadge({ status }: { status: DashboardTransaction['status'] }) {
  const styles = {
    APPROVED: 'bg-emerald-400/10 text-emerald-300',
    DECLINED: 'bg-rose-400/10 text-rose-300',
    PENDING: 'bg-amber-400/10 text-amber-300',
  }

  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${styles[status]}`}>{status}</span>
}

function toDashboardTransaction(decision: FraudDecision): DashboardTransaction {
  return {
    transactionId: decision.transactionId,
    amount: String(decision.amount),
    status: decision.outcome === 'DECLINE' ? 'DECLINED' : 'APPROVED',
    score: decision.score,
    reason: decision.reason,
    source: 'backend',
  }
}

function basicAuthHeader() {
  const username = import.meta.env.VITE_LEDGER_USERNAME ?? 'rishabh'
  const password = import.meta.env.VITE_LEDGER_PASSWORD ?? 'password123'
  return `Basic ${window.btoa(`${username}:${password}`)}`
}

function parseTransactionId(message: string) {
  const match = message.match(/Transaction ID:\s*(\d+)/i)
  return match ? Number(match[1]) : undefined
}

function formatAmount(amount: string) {
  return Number(amount).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function buildExplanation(reasons: string[]) {
  if (reasons.includes('LARGE_AMOUNT') && reasons.includes('ROUND_AMOUNT')) {
    return 'Transaction exceeded the configured amount threshold and matched the round amount rule.'
  }

  if (reasons.includes('HIGH_VELOCITY')) {
    return 'This account made multiple transfers in a short time, so Redis velocity detection raised the risk score.'
  }

  if (reasons.includes('LARGE_AMOUNT')) {
    return 'Transaction amount was above the configured large amount threshold.'
  }

  if (reasons.includes('ROUND_AMOUNT')) {
    return 'Transaction amount matched the round amount pattern.'
  }

  return 'No fraud rule was triggered, so this transaction stayed low risk.'
}

export default App
