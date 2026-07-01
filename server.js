/**
 * UPI Fraud Detection System - Backend Server
 * Stack: Node.js + Express
 * No database - pure in-memory data structures
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

const { evaluateTransaction } = require('./ruleEngine');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── IN-MEMORY STORES ────────────────────────────────────────────────────────
const store = {
  transactions: [],          // All transactions ever submitted
  userHistory: {},           // { userId: [ {amount, timestamp, payee, device, ...} ] }
  deviceHistory: {},         // { userId: "last_device_id" }
  beneficiaryHistory: {},    // { "userId_payeeId": true }
};

// ─── ROUTES ───────────────────────────────────────────────────────────────────

/**
 * POST /api/transaction
 * Accepts a new transaction, runs rule engine, stores result
 */
app.post('/api/transaction', (req, res) => {
  const { payer_id, payee_id, amount, location, device_id, hour_override } = req.body;

  if (!payer_id || !payee_id || !amount) {
    return res.status(400).json({ error: 'payer_id, payee_id, amount are required' });
  }

  const tx = {
    payer_id: String(payer_id).trim(),
    payee_id: String(payee_id).trim(),
    amount: parseFloat(amount),
    location: String(location || 'Unknown').trim(),
    device_id: String(device_id || 'dev_default').trim(),
    timestamp: Date.now(),
    hour: hour_override !== undefined ? parseInt(hour_override) : new Date().getHours(),
  };

  // Run rule engine
  const result = evaluateTransaction(tx, store);

  // Update in-memory store
  const userId = tx.payer_id;
  if (!store.userHistory[userId]) store.userHistory[userId] = [];
  store.userHistory[userId].push({ ...tx, ...result });

  store.deviceHistory[userId] = tx.device_id;
  store.beneficiaryHistory[`${userId}_${tx.payee_id}`] = true;

  const entry = {
    id: store.transactions.length + 1,
    ...tx,
    ...result,
  };
  store.transactions.unshift(entry);

  res.json(entry);
});

/**
 * GET /api/transactions
 * Returns all stored transactions (latest first)
 * Optional query: ?filter=flagged
 */
app.get('/api/transactions', (req, res) => {
  let txns = store.transactions;
  if (req.query.filter === 'flagged') {
    txns = txns.filter(t => t.risk !== 'low');
  }
  res.json(txns);
});

/**
 * GET /api/profile/:userId
 * Returns risk profile summary for a specific user
 */
app.get('/api/profile/:userId', (req, res) => {
  const userId = req.params.userId;
  const hist = store.userHistory[userId];

  if (!hist || hist.length === 0) {
    return res.json({ found: false });
  }

  const total = hist.length;
  const highCount = hist.filter(t => t.risk === 'high').length;
  const avgScore = Math.round(hist.reduce((s, t) => s + t.score, 0) / total);

  let riskLevel = 'LOW';
  if (highCount >= 3 || avgScore >= 60) riskLevel = 'HIGH';
  else if (highCount >= 1 || avgScore >= 30) riskLevel = 'MEDIUM';

  res.json({
    found: true,
    userId,
    total,
    highCount,
    avgScore,
    riskLevel,
    lastDevice: store.deviceHistory[userId] || null,
    last5: hist.slice(-5).reverse(),
  });
});

/**
 * POST /api/burst
 * Simulates 15 rapid transactions from a given payer
 */
app.post('/api/burst', (req, res) => {
  const { payer_id, device_id } = req.body;
  const results = [];
  const baseTime = Date.now();

  for (let i = 0; i < 15; i++) {
    const tx = {
      payer_id: payer_id || 'user_001',
      payee_id: `merchant_${Math.floor(Math.random() * 5) + 1}`,
      amount: Math.floor(Math.random() * 20000) + 500,
      location: ['Mumbai', 'Delhi', 'Pune', 'Hyderabad'][Math.floor(Math.random() * 4)],
      device_id: Math.random() > 0.7 ? `dev_new_${i}` : (device_id || 'dev_burst'),
      timestamp: baseTime + i * 15000,
      hour: new Date(baseTime + i * 15000).getHours(),
    };

    const result = evaluateTransaction(tx, store);
    const userId = tx.payer_id;
    if (!store.userHistory[userId]) store.userHistory[userId] = [];
    store.userHistory[userId].push({ ...tx, ...result });
    store.deviceHistory[userId] = tx.device_id;
    store.beneficiaryHistory[`${userId}_${tx.payee_id}`] = true;

    const entry = { id: store.transactions.length + 1, ...tx, ...result };
    store.transactions.unshift(entry);
    results.push(entry);
  }

  res.json(results);
});

/**
 * GET /api/export
 * Returns suspicious transactions as CSV text
 */
app.get('/api/export', (req, res) => {
  const flagged = store.transactions.filter(t => t.risk !== 'low');
  const header = 'ID,Time,Payer,Payee,Amount,Location,Device,Score,Risk,Reasons\n';
  const rows = flagged.map(t =>
    `${t.id},${new Date(t.timestamp).toISOString()},${t.payer_id},${t.payee_id},${t.amount},${t.location},${t.device_id},${t.score},${t.risk},"${t.reasons.join('; ')}"`
  ).join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="suspicious_transactions.csv"');
  res.send(header + rows);
});

// ─── START ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🛡️  UPI Fraud Sentinel running at http://localhost:${PORT}\n`);
});
