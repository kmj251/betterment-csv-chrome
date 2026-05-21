function parseCurrency(value) {
  const normalized = String(value ?? '').replace(/[$,]/g, '').trim();
  if (!normalized) return null;
  const parsed = Number.parseFloat(normalized);
  return Number.isNaN(parsed) ? null : parsed;
}

function parseNumeric(value) {
  const normalized = String(value ?? '').replace(/,/g, '').trim();
  if (!normalized) return null;
  const parsed = Number.parseFloat(normalized);
  return Number.isNaN(parsed) ? null : parsed;
}

function normalizeAmountString(value) {
  const parsed = parseCurrency(value);
  if (parsed == null) return null;
  return parsed.toFixed(2).replace(/\.00$/, '.00');
}

function parseDateToken(value) {
  const text = String(value ?? '').trim();
  if (!text) return null;

  const mmddyyyy = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mmddyyyy) {
    const month = Number.parseInt(mmddyyyy[1], 10) - 1;
    const day = Number.parseInt(mmddyyyy[2], 10);
    const year = Number.parseInt(mmddyyyy[3], 10);
    return new Date(year, month, day);
  }

  const cleaned = text.replace(/(\d+)(st|nd|rd|th),?/gi, '$1').replace(/,/g, '');
  const parsed = new Date(cleaned);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function toCompactLine(tokens) {
  return (tokens || []).map((part) => String(part ?? '').trim()).filter(Boolean).join(' ');
}

function extractAccount(line) {
  const match = line.match(/^(.+?)\s+-\s+Automated Investing(?:\s+Account)?/i);
  if (match) return match[1].trim();

  if (/401\(k\) Goal$/i.test(line)) return line.trim();
  if (/Goal$/i.test(line) && !line.startsWith('Transfer') && !line.startsWith('Transaction')) return line.trim();
  return null;
}

function normalizeTicker(raw) {
  const match = String(raw ?? '').toUpperCase().match(/\b([A-Z]{2,5})\b/);
  return match ? match[1] : null;
}

function buildTransaction({
  ticker,
  price,
  quantity,
  amount,
  description,
  account,
  date,
  type,
  numericMode
}) {
  if (!ticker || price == null || amount == null) return null;

  if (numericMode) {
    return {
      ticker,
      type: type || description,
      price,
      shares: quantity ?? 0,
      amount,
      quantity: quantity ?? 0,
      account: account || 'Investment Account',
      date: date || new Date(),
      description: description || type || ''
    };
  }

  const signedQuantity = quantity == null ? (amount / price) : Math.sign(amount || 1) * Math.abs(quantity);

  return {
    ticker,
    price: price.toFixed(2),
    amount: amount.toFixed(2),
    quantity: signedQuantity.toFixed(6),
    account: account || 'Investment Account',
    date: date || new Date(),
    description: description || type || ''
  };
}

export class BettermentPdfArrayParser {
  parse(textArray) {
    const rows = Array.isArray(textArray) ? textArray : [];
    const lines = rows.map((tokens) => ({
      tokens: Array.isArray(tokens) ? tokens : [String(tokens ?? '')],
      compact: toCompactLine(Array.isArray(tokens) ? tokens : [String(tokens ?? '')])
    }));

    const numericMode = lines.some((line) => /Ticker\s+Type\s+Price\s+Shares\s+Value/i.test(line.compact));
    const transactions = [];

    let currentAccount = 'Investment Account';
    let currentDescription = '';
    let currentDate = null;

    for (const line of lines) {
      const compact = line.compact;
      if (!compact) continue;

      const account = extractAccount(compact);
      if (account) {
        currentAccount = account;
      }

      if (/^Transaction Summary:/i.test(compact)) {
        currentDescription = compact.replace(/^Transaction Summary:\s*/i, '').trim();
      }

      if (/^(TRADES|POSITION TRANSFERS)$/i.test(compact)) {
        currentDescription = /^POSITION/i.test(compact) ? 'Position Transfer' : currentDescription;
      }

      const dateOnly = parseDateToken(compact);
      if (dateOnly && compact.split(' ').length <= 4) {
        currentDate = dateOnly;
      }

      const tokenRow = line.tokens.map((part) => String(part ?? '').trim()).filter(Boolean);

      if (numericMode && tokenRow.length >= 5) {
        const ticker = normalizeTicker(tokenRow[0]);
        const type = tokenRow[1];
        const price = parseCurrency(tokenRow[2]);
        const quantity = parseNumeric(tokenRow[3]);
        const amount = parseCurrency(tokenRow[4]);

        const tx = buildTransaction({
          ticker,
          price,
          quantity,
          amount,
          description: type === 'Transfer' ? 'Position Transfer' : type,
          account: currentAccount,
          date: currentDate || new Date(),
          type,
          numericMode
        });

        if (tx) transactions.push(tx);
        continue;
      }

      const datedLegacy = compact.match(/^([A-Z][a-z]{2}\s+\d{1,2}(?:st|nd|rd|th)?[,]?\s+\d{4})\s+(.+?)\s+(?:[A-Za-z]+\s*\/\s*)?([A-Z]{2,5})\s+\$([\d,.-]+)\s+(-?[\d,.]+)\s+\$(-?[\d,.-]+)/);
      if (datedLegacy) {
        const date = parseDateToken(datedLegacy[1]);
        const description = datedLegacy[2].trim();
        const ticker = normalizeTicker(datedLegacy[3]);
        const price = parseCurrency(datedLegacy[4]);
        const quantity = parseNumeric(datedLegacy[5]);
        const amount = parseCurrency(datedLegacy[6]);

        const tx = buildTransaction({
          ticker,
          price,
          quantity,
          amount,
          description,
          account: currentAccount,
          date,
          numericMode
        });
        if (tx) transactions.push(tx);
        continue;
      }

      const descFirst = compact.match(/^(.+?)\s+([A-Z][a-z]{2}\s+\d{1,2}(?:st|nd|rd|th)?[,]?\s+\d{4})\s+([A-Z]{2,5})\s+\$([\d,.-]+)\s+(-?[\d,.]+)\s+\$(-?[\d,.-]+)/);
      if (descFirst) {
        const description = descFirst[1].trim();
        const date = parseDateToken(descFirst[2]);
        const ticker = normalizeTicker(descFirst[3]);
        const price = parseCurrency(descFirst[4]);
        const quantity = parseNumeric(descFirst[5]);
        const amount = parseCurrency(descFirst[6]);

        const tx = buildTransaction({
          ticker,
          price,
          quantity,
          amount,
          description,
          account: currentAccount,
          date,
          numericMode
        });
        if (tx) transactions.push(tx);
        continue;
      }

      const continuation = compact.match(/^(?:[A-Za-z]+\s*\/\s*)?([A-Z]{2,5})\s+\$([\d,.-]+)\s+(-?[\d,.]+)\s+\$(-?[\d,.-]+)/);
      if (continuation && currentDate) {
        const ticker = normalizeTicker(continuation[1]);
        const price = parseCurrency(continuation[2]);
        const quantity = parseNumeric(continuation[3]);
        const amount = parseCurrency(continuation[4]);

        const tx = buildTransaction({
          ticker,
          price,
          quantity,
          amount,
          description: currentDescription,
          account: currentAccount,
          date: currentDate,
          numericMode
        });
        if (tx) transactions.push(tx);
      }
    }

    if (!numericMode) {
      return transactions.map((tx) => ({
        ...tx,
        price: normalizeAmountString(tx.price) || tx.price,
        amount: normalizeAmountString(tx.amount) || tx.amount
      }));
    }

    return transactions;
  }
}

export default BettermentPdfArrayParser;
