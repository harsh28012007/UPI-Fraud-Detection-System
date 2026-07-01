/**
 * ruleEngine.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Pure rule-based fraud scoring engine for UPI transactions.
 * Each rule is a separate function that returns { triggered, weight, code }.
 *
 * Weights sum to produce a score 0–100.
 * Risk levels:
 *   Low    → 0–29
 *   Medium → 30–59
 *   High   → 60–100
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * Rule 1 — High-value transaction within a short time window
 * Trigger: Amount > ₹10,000 AND another ₹10,000+ txn exists within last 60 seconds
 * Weight : 35
 * Reason : Rapid large transfers are a key signal for account takeover fraud
 */
function ruleHighValueShortWindow(tx, userHistory) {
  if (tx.amount <= 10000) return { triggered: false };

  const ONE_MINUTE = 60 * 1000;
  const recentHighValue = userHistory.filter(t =>
    t.amount > 10000 &&
    (tx.timestamp - t.timestamp) < ONE_MINUTE &&
    (tx.timestamp - t.timestamp) >= 0
  );

  if (recentHighValue.length > 0) {
    return {
      triggered: true,
      weight: 35,
      code: 'R1:HIGH_VAL_SHORT_WINDOW',
    };
  }
  return { triggered: false };
}

/**
 * Rule 2 — First-time transaction with a new merchant
 * FIX: Amount-based tiered weight.
 *   - Amount ≤ ₹5,000  → NOT triggered (small first-time txn is normal)
 *   - Amount ₹5,001–₹49,999  → weight 25 (medium concern)
 *   - Amount ₹50,000–₹1,99,999 → weight 45 (high concern)
 *   - Amount ≥ ₹2,00,000       → weight 65 (very high — auto High risk)
 * Reason : Scammers lure victims to transact large amounts with new accounts.
 *          But small first-time payments are completely normal behaviour.
 */
function ruleNewMerchantHighAmount(tx, beneficiaryHistory) {
  const key = `${tx.payer_id}_${tx.payee_id}`;
  const isFirstTime = !beneficiaryHistory[key];

  if (!isFirstTime) return { triggered: false };
  if (tx.amount <= 5000) return { triggered: false }; // small first-time → totally fine

  let weight;
  let code;

  if (tx.amount <= 49999) {
    weight = 25;
    code = 'R2:NEW_MERCHANT_HIGH_AMT';
  } else if (tx.amount <= 199999) {
    weight = 45;
    code = 'R2:NEW_MERCHANT_VERY_HIGH_AMT';
  } else {
    // ₹2 lakh+  → treat as critical signal by itself
    weight = 65;
    code = 'R2:NEW_MERCHANT_CRITICAL_AMT';
  }

  return { triggered: true, weight, code };
}

/**
 * Rule 3 — High transaction velocity
 * Trigger: More than 10 transactions from the same user within 5 minutes
 * Weight : 40
 * Reason : Automated bots and credential-stuffing attacks show high frequency
 */
function ruleHighVelocity(tx, userHistory) {
  const FIVE_MINUTES = 5 * 60 * 1000;
  const windowStart = tx.timestamp - FIVE_MINUTES;

  const recentCount = userHistory.filter(t => t.timestamp >= windowStart).length;

  if (recentCount >= 10) {
    return {
      triggered: true,
      weight: 40,
      code: 'R3:HIGH_VELOCITY',
    };
  }
  return { triggered: false };
}

/**
 * Rule 4 — Transaction during unusual hours
 * Trigger: Hour is between 12 AM (0) and 5 AM (4), inclusive
 * Weight : 20
 * Reason : Legitimate users rarely transact at night; fraud likelihood is higher
 */
function ruleUnusualHours(tx) {
  const hour = tx.hour;
  if (hour >= 0 && hour < 5) {
    return {
      triggered: true,
      weight: 20,
      code: 'R4:UNUSUAL_HOURS',
    };
  }
  return { triggered: false };
}

/**
 * Rule 5 — Device change combined with a new beneficiary
 * Trigger: Current device_id ≠ last known device_id AND payee is first-time
 * Weight : 30
 * Reason : A stolen device + redirected payment is a compound fraud pattern
 */
function ruleDeviceChangeNewBeneficiary(tx, deviceHistory, beneficiaryHistory) {
  const lastDevice = deviceHistory[tx.payer_id];
  const isNewDevice = lastDevice && lastDevice !== tx.device_id;
  const key = `${tx.payer_id}_${tx.payee_id}`;
  const isNewBeneficiary = !beneficiaryHistory[key];

  if (isNewDevice && isNewBeneficiary) {
    return {
      triggered: true,
      weight: 30,
      code: 'R5:DEVICE_CHANGE+NEW_BENEF',
    };
  }
  return { triggered: false };
}

/**
 * Rule 6 — Extremely large single transaction (NEW RULE)
 * Trigger: Amount ≥ ₹1,00,000 regardless of history
 * Weight : 30
 * Reason : Any transaction above ₹1 lakh warrants scrutiny irrespective of other signals.
 *          Adds to score but alone doesn't make it High — needs another signal too.
 */
function ruleLargeAmountFlag(tx) {
  if (tx.amount >= 100000) {
    return {
      triggered: true,
      weight: 30,
      code: 'R6:LARGE_AMOUNT_FLAG',
    };
  }
  return { triggered: false };
}

// ─── MAIN EVALUATOR ───────────────────────────────────────────────────────────

/**
 * evaluateTransaction(tx, store)
 * Runs all rules against the transaction and the current in-memory store.
 * Returns { score, risk, reasons }
 *
 * @param {Object} tx    - Transaction object
 * @param {Object} store - In-memory store (userHistory, deviceHistory, beneficiaryHistory)
 * @returns {{ score: number, risk: string, reasons: string[] }}
 */
function evaluateTransaction(tx, store) {
  const userHistory = store.userHistory[tx.payer_id] || [];
  const { deviceHistory, beneficiaryHistory } = store;

  const rules = [
    ruleHighValueShortWindow(tx, userHistory),
    ruleNewMerchantHighAmount(tx, beneficiaryHistory),
    ruleHighVelocity(tx, userHistory),
    ruleUnusualHours(tx),
    ruleDeviceChangeNewBeneficiary(tx, deviceHistory, beneficiaryHistory),
    ruleLargeAmountFlag(tx),
  ];

  const triggeredRules = rules.filter(r => r.triggered);
  const rawScore = triggeredRules.reduce((sum, r) => sum + r.weight, 0);
  const score = Math.min(rawScore, 100);
  const reasons = triggeredRules.map(r => r.code);

  let risk = 'low';
  if (score >= 60) risk = 'high';
  else if (score >= 30) risk = 'medium';

  return { score, risk, reasons };
}

module.exports = { evaluateTransaction };