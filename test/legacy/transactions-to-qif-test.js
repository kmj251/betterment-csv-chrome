import { describe, it, expect } from 'vitest';
import { convert } from '../../app/src/transactions-to-qif.js';

describe('Betterment Transaction to QIF converter', () => {
  it('should convert a transaction to qif', () => {
    const transactions = [{
      account: "A",
      date: new Date(2016, 1, 3),
      description: "foo",
      ticker: "BAR",
      price: "1.00",
      quantity: "2.45",
      amount: "43.03",
    }];

    const qif = convert(transactions);

    expect(qif).toBe(
      '!Account\n' +
      'NA\n' +
      'DA\n' +
      'TInvst\n' +
      '^\n' +
      '!Type:Invst\n' +
      'D2/3/2016\n' +
      'NBuy\n' +
      'YBAR\n' +
      'I1.00\n' +
      'Q2.45\n' +
      'T43.03\n' +
      'Pfoo\n' +
      'O0.00\n' +
      '^'
    );
  });
});
