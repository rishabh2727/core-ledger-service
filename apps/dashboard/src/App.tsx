import { useEffect, useMemo, useRef, useState } from 'react'
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

type PaymentApi = {
  id: number
  fromAccountId: number
  toAccountId: number
  amount: number | string
  status: 'PENDING' | 'APPROVED' | 'DECLINED' | 'COMPLETED' | 'FAILED'
  fraudScore?: number
  fraudReason?: string
  ledgerTransactionId?: number
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
}

type DepositFormState = {
  accountId: string
  amount: string
}

type ApiStatus = 'unknown' | 'online' | 'offline'

type BackendFlowStep = {
  title: string
  detail: string
  points?: string
  future?: boolean
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
  { name: 'Payment Service', detail: 'Creates payment rows and coordinates Fraud + Ledger' },
  { name: 'Ledger Service', detail: 'Creates ledger entries and outbox events' },
  { name: 'Kafka', detail: 'Moves events between services' },
  { name: 'Fraud Service', detail: 'Runs fraud rules and scoring' },
  { name: 'Redis', detail: 'Tracks transaction velocity' },
  { name: 'Fraud DB', detail: 'Stores fraud decisions' },
]

const learningCards = [
  {
    eyebrow: 'API basics',
    title: 'How does “add money” work?',
    body: 'The dashboard calls Ledger with an account id and amount. Ledger creates a CREDIT entry. Balance is not stored directly; it is calculated from ledger entries.',
    flow: 'Dashboard -> Ledger API -> ledger_entries',
    accent: 'from-amber-300/30 to-orange-500/10',
  },
  {
    eyebrow: 'Transfer flow',
    title: 'What happens when I send money?',
    body: 'Payment creates a PENDING row, asks Fraud for a pre-check, and only calls Ledger if Fraud approves.',
    flow: 'Payment -> Fraud -> Ledger -> completed/declined',
    accent: 'from-cyan-300/30 to-blue-500/10',
  },
  {
    eyebrow: 'Kafka failure',
    title: 'What if Kafka is down?',
    body: 'The transfer and outbox row are still saved together. The event stays PENDING in the outbox table and the publisher retries later.',
    flow: 'Kafka down -> event stays pending -> retry',
    accent: 'from-rose-300/30 to-red-500/10',
  },
  {
    eyebrow: 'Spam clicks',
    title: 'What if I spam send money?',
    body: 'Each payment gets its own row. When Payment calls Ledger, it uses a payment-based idempotency key so Ledger does not process the same payment twice.',
    flow: 'payment id -> ledger idempotency key',
    accent: 'from-fuchsia-300/30 to-purple-500/10',
  },
  {
    eyebrow: 'Fraud rules',
    title: 'How does Fraud decide?',
    body: 'Fraud consumes the Kafka event, runs each rule, adds scores, saves the final decision, and exposes it through the Fraud API.',
    flow: 'Kafka event -> rules -> score -> fraud_decisions',
    accent: 'from-emerald-300/30 to-green-500/10',
  },
  {
    eyebrow: 'Redis velocity',
    title: 'Why is Redis here?',
    body: 'Redis remembers recent transfers per account. If one account sends too many transfers quickly, the velocity rule adds risk points.',
    flow: 'account id -> Redis sorted set -> recent count',
    accent: 'from-violet-300/30 to-indigo-500/10',
  },
]

const backendFlowSteps: BackendFlowStep[] = [
  {
    title: 'Dashboard sends payment request',
    detail: 'The button press sends POST /payments to Payment Service through the Vite proxy.',
  },
  {
    title: 'Payment saves PENDING row',
    detail: 'Payment Service creates a payment row so the lifecycle is visible in the payment database.',
  },
  {
    title: 'Payment asks Fraud to check',
    detail: 'Payment Service sends the account ids and amount to POST /fraud-checks.',
  },
  {
    title: 'LargeAmountRule runs',
    detail: 'If amount is greater than 1000, Fraud adds 70 risk points.',
    points: '+70',
  },
  {
    title: 'RoundAmountRule runs',
    detail: 'If amount is a round hundred amount, Fraud adds 10 risk points.',
    points: '+10',
  },
  {
    title: 'VelocityRule checks Redis',
    detail: 'Fraud checks Redis to count recent transfers for this account.',
    points: '+0 or +50',
  },
  {
    title: 'Fraud returns decision',
    detail: 'Fraud returns APPROVE or DECLINE with score and reason.',
  },
  {
    title: 'Payment updates fraud result',
    detail: 'Payment saves fraud score and reason on the payment row.',
  },
  {
    title: 'If declined, Payment stops',
    detail: 'Payment marks the row DECLINED and does not call Ledger.',
  },
  {
    title: 'If approved, Payment calls Ledger',
    detail: 'Payment sends POST /transfers to Ledger with a payment-based idempotency key.',
  },
  {
    title: 'Ledger saves DEBIT and CREDIT rows',
    detail: 'Ledger moves money by writing ledger_entries rows for both accounts.',
  },
  {
    title: 'Ledger saves outbox event',
    detail: 'Ledger saves a PENDING outbox event in the same database transaction.',
  },
  {
    title: 'Outbox publisher sends Kafka event',
    detail: 'Ledger publishes transfer-events so the rest of the platform can react.',
  },
  {
    title: 'Payment marks final status',
    detail: 'Payment stores COMPLETED with the Ledger transaction id, or FAILED if Ledger could not move money.',
  },
  {
    title: 'Dashboard shows the payment result',
    detail: 'The UI shows the payment status, fraud score, and backend flow.',
  },
]

function App() {
  const [transactions, setTransactions] = useState<DashboardTransaction[]>(sampleTransactions)
  const [selectedId, setSelectedId] = useState<number>(102)
  const [animationRun, setAnimationRun] = useState(0)
  const [flowStep, setFlowStep] = useState(-1)
  const flowTimer = useRef<number | undefined>(undefined)
  const [form, setForm] = useState<TransferFormState>(() => ({
    fromAccountId: '1',
    toAccountId: '2',
    amount: '2000.00',
  }))
  const [depositForm, setDepositForm] = useState<DepositFormState>({
    accountId: '1',
    amount: '5000.00',
  })
  const [ledgerStatus, setLedgerStatus] = useState<ApiStatus>('unknown')
  const [fraudStatus, setFraudStatus] = useState<ApiStatus>('unknown')
  const [paymentStatus, setPaymentStatus] = useState<ApiStatus>('unknown')
  const [statusMessage, setStatusMessage] = useState('Start your backend, then submit a transfer to watch the flow.')

  const selectedTransaction = useMemo(
    () => transactions.find((transaction) => transaction.transactionId === selectedId) ?? transactions[0],
    [transactions, selectedId],
  )

  useEffect(() => {
    return () => {
      if (flowTimer.current) {
        window.clearInterval(flowTimer.current)
      }
    }
  }, [])

  function playBackendTimeline() {
    if (flowTimer.current) {
      window.clearInterval(flowTimer.current)
    }

    setFlowStep(0)
    flowTimer.current = window.setInterval(() => {
      setFlowStep((current) => {
        if (current >= backendFlowSteps.length - 1) {
          if (flowTimer.current) {
            window.clearInterval(flowTimer.current)
          }
          return current
        }

        return current + 1
      })
    }, 750)
  }

  async function refreshFraudDecisions() {
    const response = await fetch('/api/fraud/fraud-decisions?size=20')
    if (!response.ok) {
      throw new Error('Fraud Service did not return decisions.')
    }

    const page = (await response.json()) as FraudDecisionPage
    const backendTransactions = (page.content ?? []).map(toDashboardTransaction)
    setFraudStatus('online')

    if (backendTransactions.length > 0) {
      setTransactions((current) => {
        const decidedTransactionIds = new Set(backendTransactions.map((transaction) => transaction.transactionId))
        const stillPending = current.filter(
          (transaction) => transaction.source === 'backend'
            && transaction.status === 'PENDING'
            && !decidedTransactionIds.has(transaction.transactionId),
        )

        return [...stillPending, ...backendTransactions]
      })
    }
  }

  useEffect(() => {
    const firstPoll = window.setTimeout(() => {
      refreshFraudDecisions().catch(() => setFraudStatus('offline'))
    }, 0)

    const timer = window.setInterval(() => {
      refreshFraudDecisions().catch(() => setFraudStatus('offline'))
    }, 4000)

    return () => {
      window.clearTimeout(firstPoll)
      window.clearInterval(timer)
    }
  }, [])

  async function submitTransfer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setAnimationRun((current) => current + 1)
    playBackendTimeline()
    setStatusMessage('Transfer submitted. Watch the event move through the system.')

    try {
      const response = await fetch('/api/payment/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fromAccountId: Number(form.fromAccountId),
          toAccountId: Number(form.toAccountId),
          amount: form.amount,
        }),
      })

      if (!response.ok) {
        const message = await response.text()
        throw new Error(message)
      }

      const payment = (await response.json()) as PaymentApi
      setPaymentStatus('online')
      setLedgerStatus(payment.status === 'COMPLETED' ? 'online' : ledgerStatus)
      setFraudStatus('online')

      const transaction = toDashboardTransactionFromPayment(payment)
      setSelectedId(transaction.transactionId)
      setTransactions((current) => [transaction, ...current])
      setStatusMessage(`Payment ${payment.id} finished with status ${payment.status}.`)

      window.setTimeout(() => {
        refreshFraudDecisions().catch(() => undefined)
      }, 2500)
    } catch (error) {
      setPaymentStatus('offline')
      setStatusMessage(error instanceof Error ? error.message : 'Could not submit transfer.')
    }
  }

  async function submitDeposit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatusMessage('Adding money to the account through Ledger Service.')

    try {
      const response = await fetch(`/api/ledger/accounts/${depositForm.accountId}/deposits`, {
        method: 'POST',
        headers: {
          Authorization: basicAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: depositForm.amount,
        }),
      })

      const message = await response.text()
      if (!response.ok) {
        throw new Error(message || 'Could not add money to account.')
      }

      setLedgerStatus('online')
      setStatusMessage(message)
    } catch (error) {
      setLedgerStatus('offline')
      setStatusMessage(error instanceof Error ? error.message : 'Could not add money to account.')
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(217,70,239,0.18),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(251,191,36,0.12),_transparent_25%),#020617] text-slate-100">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8">
        <header className="flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 shadow-2xl shadow-fuchsia-950/20 backdrop-blur lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-200">
              Educational Fintech Dashboard
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-white lg:text-6xl">
              Watch money move through your backend.
            </h1>
            <p className="mt-4 max-w-3xl text-base text-slate-300">
              Submit a transfer, follow the animated event path, then click a transaction to understand the fraud score.
            </p>
          </div>
          <ServiceStatusCard paymentStatus={paymentStatus} ledgerStatus={ledgerStatus} fraudStatus={fraudStatus} />
        </header>

        <LearningFlashcards />

        <div className="grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
          <SystemMap animationRun={animationRun} />
          <div className="space-y-6">
            <DepositForm form={depositForm} onChange={setDepositForm} onSubmit={submitDeposit} />
            <TransferForm form={form} onChange={setForm} onSubmit={submitTransfer} statusMessage={statusMessage} />
          </div>
        </div>

        <BackendProgressTimeline currentStep={flowStep} />

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

function LearningFlashcards() {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-slate-900/60 p-6 shadow-2xl shadow-amber-950/10 backdrop-blur">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-fuchsia-200">Learning flashcards</p>
          <h2 className="mt-2 text-3xl font-bold text-white">Tap into the system design behind each click.</h2>
        </div>
        <p className="max-w-xl text-sm text-slate-300">
          These cards explain the backend behavior in interview-friendly language while you interact with the app.
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {learningCards.map((card, index) => (
          <motion.article
            key={card.title}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            whileHover={{ y: -8, rotateX: 2, rotateY: -2 }}
            className={`group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br ${card.accent} p-5 shadow-xl shadow-slate-950/30`}
          >
            <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/10 blur-2xl transition group-hover:bg-white/20" />
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/70">{card.eyebrow}</p>
            <h3 className="mt-3 text-xl font-bold text-white">{card.title}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-100/85">{card.body}</p>
            <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm font-semibold text-cyan-100">
              {card.flow}
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  )
}

function BackendProgressTimeline({ currentStep }: { currentStep: number }) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6 shadow-2xl shadow-cyan-950/20 backdrop-blur">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-200">Backend progress</p>
          <h2 className="mt-2 text-3xl font-bold text-white">What one button press does behind the scenes</h2>
        </div>
        <p className="max-w-xl text-sm text-slate-300">
          Press “Submit transfer” to watch each backend step turn active, complete, and move to the next service.
        </p>
      </div>

      <div className="mt-6 grid gap-3 lg:grid-cols-2">
        {backendFlowSteps.map((step, index) => {
          const isComplete = currentStep > index
          const isActive = currentStep === index
          const isWaiting = currentStep < index

          return (
            <motion.div
              key={step.title}
              animate={{
                scale: isActive ? 1.02 : 1,
                borderColor: isActive ? 'rgba(251, 191, 36, 0.8)' : 'rgba(51, 65, 85, 1)',
              }}
              className={`relative overflow-hidden rounded-3xl border bg-slate-950/70 p-4 transition ${
                isActive ? 'shadow-2xl shadow-amber-500/20' : ''
              } ${step.future ? 'opacity-80' : ''}`}
            >
              {isActive && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-amber-300/10 via-cyan-300/10 to-fuchsia-300/10"
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
              )}

              <div className="relative flex gap-4">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-black ${
                    isComplete
                      ? 'border-emerald-300 bg-emerald-300 text-slate-950'
                      : isActive
                        ? 'border-amber-200 bg-amber-200 text-slate-950'
                        : 'border-slate-700 bg-slate-900 text-slate-500'
                  }`}
                >
                  {isComplete ? '✓' : index + 1}
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className={`font-bold ${isWaiting ? 'text-slate-400' : 'text-white'}`}>{step.title}</h3>
                    {step.points && (
                      <motion.span
                        animate={isActive ? { scale: [1, 1.25, 1], rotate: [0, -3, 3, 0] } : {}}
                        transition={{ duration: 0.8, repeat: isActive ? Infinity : 0 }}
                        className="rounded-full bg-fuchsia-300 px-3 py-1 text-xs font-black text-slate-950 shadow-lg shadow-fuchsia-500/30"
                      >
                        {step.points} pts
                      </motion.span>
                    )}
                    {step.future && (
                      <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-bold text-slate-300">
                        coming next
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{step.detail}</p>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}

function SystemMap({ animationRun }: { animationRun: number }) {
  const eventTrail = [0, 0.35, 0.7]

  return (
    <section className="rounded-3xl border border-fuchsia-400/20 bg-slate-900/80 p-6 shadow-2xl shadow-fuchsia-950/30">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-white">System map</h2>
          <p className="mt-1 text-sm text-slate-400">The glowing dot shows where the transfer event is travelling.</p>
        </div>
        <span className="rounded-full bg-amber-300/10 px-3 py-1 text-xs font-semibold text-amber-200">
          Ledger → Kafka → Fraud → Redis/DB
        </span>
      </div>

      <div className="relative mt-8 min-h-[420px] overflow-hidden rounded-2xl border border-slate-800 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.20),_transparent_30%),radial-gradient(circle_at_center,_rgba(251,191,36,0.10),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(217,70,239,0.22),_transparent_30%)] p-5">
        <div className="absolute left-8 right-8 top-1/2 h-px bg-gradient-to-r from-cyan-400/20 via-amber-300/80 to-fuchsia-400/25" />
        {eventTrail.map((delay) => (
          <motion.div
            key={`${animationRun}-${delay}`}
            className="absolute z-20 h-5 w-5 rounded-full bg-amber-200 shadow-[0_0_35px_rgba(251,191,36,0.95)]"
            initial={{ left: '4%', top: '48%', opacity: 0, scale: 0.7 }}
            animate={{
              left: ['4%', '25%', '47%', '67%', '86%'],
              top: ['48%', '48%', '48%', '31%', '63%'],
              opacity: [0, 1, 1, 1, 0],
              scale: [0.7, 1.2, 1, 1.35, 0.5],
            }}
            transition={{ duration: 3.4, delay, ease: 'easeInOut' }}
          />
        ))}

        <div className="grid h-full gap-4 md:grid-cols-3">
          {serviceCards.map((service, index) => (
            <motion.div
              key={service.name}
              whileHover={{ y: -4, scale: 1.02 }}
              className={`rounded-2xl border border-slate-700 bg-slate-950/75 p-4 shadow-lg shadow-slate-950/30 backdrop-blur ${
                index === 3 ? 'md:col-start-2' : ''
              } ${index === 4 ? 'md:col-start-3' : ''}`}
            >
              <p className="text-sm font-semibold text-cyan-200">{service.name}</p>
              <p className="mt-2 text-sm text-slate-400">{service.detail}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function DepositForm({
  form,
  onChange,
  onSubmit,
}: {
  form: DepositFormState
  onChange: (form: DepositFormState) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  return (
    <section className="rounded-3xl border border-amber-300/20 bg-gradient-to-br from-amber-400/15 via-slate-900 to-fuchsia-500/10 p-6 shadow-2xl shadow-amber-950/20">
      <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-200">Fund an account</p>
      <h2 className="mt-2 text-2xl font-semibold text-white">Add money before testing transfers</h2>
      <p className="mt-2 text-sm text-slate-300">
        This calls Ledger and creates a CREDIT entry, so the account has balance available.
      </p>

      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <Input label="Account id" value={form.accountId} onChange={(value) => onChange({ ...form, accountId: value })} />
        <Input label="Amount to add" value={form.amount} onChange={(value) => onChange({ ...form, amount: value })} />
        <button className="w-full rounded-2xl bg-amber-300 px-4 py-3 font-semibold text-slate-950 shadow-lg shadow-amber-500/20 transition hover:bg-amber-200">
          Add money to account
        </button>
      </form>
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
        This calls Payment Service. Payment asks Fraud first, then tells Ledger to move money only if approved.
      </p>

      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <Input label="From account id" value={form.fromAccountId} onChange={(value) => onChange({ ...form, fromAccountId: value })} />
        <Input label="To account id" value={form.toAccountId} onChange={(value) => onChange({ ...form, toAccountId: value })} />
        <Input label="Amount" value={form.amount} onChange={(value) => onChange({ ...form, amount: value })} />
        <button className="w-full rounded-2xl bg-cyan-300 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-200">
          Create payment and animate flow
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
              <th className="px-4 py-3">Source</th>
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
                <td className="px-4 py-3">
                  <span className="rounded-full bg-slate-800 px-2 py-1 text-xs uppercase text-slate-300">
                    {transaction.source}
                  </span>
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

function ServiceStatusCard({
  paymentStatus,
  ledgerStatus,
  fraudStatus,
}: {
  paymentStatus: ApiStatus
  ledgerStatus: ApiStatus
  fraudStatus: ApiStatus
}) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 px-5 py-4">
      <p className="text-sm font-semibold text-white">Backend API status</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <ApiStatusBadge label="Payment" status={paymentStatus} />
        <ApiStatusBadge label="Ledger" status={ledgerStatus} />
        <ApiStatusBadge label="Fraud" status={fraudStatus} />
      </div>
      <p className="mt-3 text-sm text-slate-400">The UI uses sample rows only until backend data is available.</p>
    </div>
  )
}

function ApiStatusBadge({ label, status }: { label: string; status: ApiStatus }) {
  const styles = {
    unknown: 'bg-slate-700 text-slate-200',
    online: 'bg-emerald-400/10 text-emerald-300',
    offline: 'bg-rose-400/10 text-rose-300',
  }

  return <span className={`rounded-full px-3 py-1 text-xs font-bold ${styles[status]}`}>{label}: {status}</span>
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

function toDashboardTransactionFromPayment(payment: PaymentApi): DashboardTransaction {
  return {
    transactionId: payment.ledgerTransactionId ?? payment.id,
    amount: String(payment.amount),
    status: toDashboardStatus(payment.status),
    score: payment.fraudScore,
    reason: payment.fraudReason,
    source: 'backend',
  }
}

function toDashboardStatus(status: PaymentApi['status']): DashboardTransaction['status'] {
  if (status === 'DECLINED' || status === 'FAILED') {
    return 'DECLINED'
  }

  if (status === 'COMPLETED' || status === 'APPROVED') {
    return 'APPROVED'
  }

  return 'PENDING'
}

function basicAuthHeader() {
  const username = import.meta.env.VITE_LEDGER_USERNAME ?? 'rishabh'
  const password = import.meta.env.VITE_LEDGER_PASSWORD ?? 'password123'
  return `Basic ${window.btoa(`${username}:${password}`)}`
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
