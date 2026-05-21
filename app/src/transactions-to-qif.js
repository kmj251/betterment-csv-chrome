function formatDate(date) {
  if (!(date instanceof Date)) {
    return String(date ?? '');
  }

  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}

function normalizeTransactionType(description) {
  const text = (description || '').toLowerCase();
  if (text.includes('sell')) {
    return 'Sell';
  }
  if (text.includes('dividend')) {
    return 'Div';
  }
  return 'Buy';
}

export function convert(transactions) {
  const items = transactions || [];
  if (items.length === 0) {
    return '';
  }

  const accountName = items[0].account || 'Betterment';
  const lines = [
    '!Account',
    `N${accountName}`,
    `D${accountName}`,
    'TInvst',
    '^',
    '!Type:Invst'
  ];

  for (const transaction of items) {
    lines.push(`D${formatDate(transaction.date)}`);
    lines.push(`N${normalizeTransactionType(transaction.description)}`);
    lines.push(`Y${transaction.ticker ?? ''}`);
    lines.push(`I${transaction.price ?? ''}`);
    lines.push(`Q${transaction.quantity ?? ''}`);
    lines.push(`T${transaction.amount ?? ''}`);
    lines.push(`P${transaction.description ?? ''}`);
    lines.push('O0.00');
    lines.push('^');
  }

  return lines.join('\n');
}

export default { convert };
