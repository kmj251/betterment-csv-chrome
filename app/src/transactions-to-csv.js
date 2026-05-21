function escapeCsv(field) {
  const value = field == null ? '' : String(field);
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatDate(date) {
  if (!(date instanceof Date)) {
    return String(date ?? '');
  }

  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}

export function convert(transactions) {
  const header = 'Account,Date,Transaction,Portfolio/Fund,Price,Shares,Value';
  const rows = (transactions || []).map((transaction) => {
    return [
      transaction.account,
      formatDate(transaction.date),
      transaction.description,
      transaction.ticker,
      transaction.price,
      transaction.quantity,
      transaction.amount
    ].map(escapeCsv).join(',');
  });

  return [header, ...rows].join('\n');
}

export const TransactionsToCsv = { convert };

if (typeof globalThis !== 'undefined') {
  globalThis.TransactionsToCsv = TransactionsToCsv;
}

export default TransactionsToCsv;
