import { chromium } from 'playwright'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const shots = path.join(root, 'docs/demo/screenshots')
const videoDir = path.join(root, 'docs/demo/video-raw')

fs.mkdirSync(shots, { recursive: true })
fs.mkdirSync(videoDir, { recursive: true })

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fillInput(page, label, value) {
  const input = page.getByLabel(label, { exact: true })
  await input.click({ clickCount: 3 })
  await input.fill(value)
}

async function dismissOverlay(page) {
  await sleep(1800)

  // Insufficient-funds dialog sits above the payment result overlay.
  const fundsBtn = page.getByRole('button', { name: 'Okay, I will add funds' })
  if (await fundsBtn.count()) {
    await fundsBtn.first().click({ force: true })
    await sleep(700)
  }

  const continueBtn = page.getByRole('button', { name: 'Continue' })
  if (await continueBtn.count()) {
    await continueBtn.first().click({ force: true })
    await sleep(700)
  }
}

async function submitTransfer(page, { from, to, amount }) {
  await fillInput(page, 'From account id', from)
  await fillInput(page, 'To account id', to)
  await fillInput(page, 'Amount', amount)
  await page.getByRole('button', { name: 'Create payment and animate flow' }).click()
  await page.waitForSelector('text=/APPROVED|DECLINED|FAILED|Insufficient funds/i', { timeout: 45000 })
  await sleep(1500)
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    recordVideo: {
      dir: videoDir,
      size: { width: 1440, height: 900 },
    },
  })
  const page = await context.newPage()
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
  await sleep(1500)

  // 1) Full landing / overview
  await page.screenshot({ path: path.join(shots, '01-dashboard-overview.png'), fullPage: true })
  await page.locator('text=Learning flashcards').scrollIntoViewIfNeeded()
  await sleep(500)
  await page.screenshot({ path: path.join(shots, '02-learning-flashcards.png') })

  // 2) Deposit / add money
  await page.locator('text=Add money before testing transfers').scrollIntoViewIfNeeded()
  await fillInput(page, 'Account id', '5')
  await fillInput(page, 'Amount to add', '2500.00')
  await page.getByRole('button', { name: 'Add money to account' }).click()
  await sleep(2000)
  await page.screenshot({ path: path.join(shots, '03-add-money-success.png') })

  // 3) Approved small transfer
  await page.locator('text=Try a transfer').scrollIntoViewIfNeeded()
  await submitTransfer(page, { from: '5', to: '6', amount: '45.00' })
  await sleep(2500)
  await page.screenshot({ path: path.join(shots, '04-approved-transfer.png'), fullPage: false })
  await page.locator('text=Backend progress').scrollIntoViewIfNeeded()
  await sleep(800)
  await page.screenshot({ path: path.join(shots, '05-backend-progress-approved.png') })
  await dismissOverlay(page)

  // 4) Declined large amount
  await submitTransfer(page, { from: '5', to: '6', amount: '2500.00' })
  await sleep(2500)
  await page.screenshot({ path: path.join(shots, '06-declined-large-amount.png') })
  await dismissOverlay(page)

  // 5) Round amount (approved but scored) — under decline threshold if only +10
  await submitTransfer(page, { from: '5', to: '6', amount: '200.00' })
  await sleep(2500)
  await page.screenshot({ path: path.join(shots, '07-round-amount-transfer.png') })
  await dismissOverlay(page)

  // 6) Velocity: more than 3 transfers in 5 minutes from account 7
  await submitTransfer(page, { from: '7', to: '6', amount: '11.00' })
  await dismissOverlay(page)
  await submitTransfer(page, { from: '7', to: '6', amount: '12.00' })
  await dismissOverlay(page)
  await submitTransfer(page, { from: '7', to: '6', amount: '13.00' })
  await dismissOverlay(page)
  await submitTransfer(page, { from: '7', to: '6', amount: '14.00' })
  await sleep(2500)
  await page.screenshot({ path: path.join(shots, '08-velocity-declined.png') })
  await dismissOverlay(page)

  // 7) Insufficient funds — Fraud approves a small amount, Ledger rejects low balance.
  // DEMO-LOW-BAL account is seeded with $1 via SQL before the script runs.
  await submitTransfer(page, { from: '15', to: '6', amount: '50.00' })
  await sleep(2500)
  await page.screenshot({ path: path.join(shots, '09-insufficient-funds.png') })
  await dismissOverlay(page)

  // 8) Transaction feed + fraud explanation
  await page.locator('text=Live transaction feed').scrollIntoViewIfNeeded()
  await sleep(1000)
  const rows = page.locator('table tbody tr')
  if (await rows.count()) {
    await rows.first().click()
    await sleep(800)
  }
  await page.screenshot({ path: path.join(shots, '10-fraud-explanation.png') })

  // Hold on hero for a clean end frame
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }))
  await sleep(1500)
  await page.screenshot({ path: path.join(shots, '11-final-overview.png') })

  const videoPath = await page.video().path()
  await context.close()
  await browser.close()

  const finalVideo = path.join(root, 'docs/demo/dashboard-live-demo.webm')
  fs.renameSync(videoPath, finalVideo)
  // clean raw dir leftovers
  for (const file of fs.readdirSync(videoDir)) {
    fs.unlinkSync(path.join(videoDir, file))
  }
  fs.rmdirSync(videoDir)

  console.log(JSON.stringify({ screenshots: shots, video: finalVideo }, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
