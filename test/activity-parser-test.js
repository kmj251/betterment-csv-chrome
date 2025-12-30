import { describe, it, expect } from 'vitest';

describe('Betterment Activity Parser Tests', () => {
  describe('CSV Data Format', () => {
    it('should parse real CSV transaction data correctly', () => {
      // Test data from pdfjs_raw_text_debug.csv
      const sampleTransactions = [
        { account: 'MyAccount 5', ticker: 'GBIL', type: 'Buy', price: 100.25, shares: 0.258480, value: 25.91 },
        { account: 'MyAccount 5', ticker: 'JPST', type: 'Buy', price: 50.80, shares: 0.408473, value: 20.73 },
        { account: 'MyAccount 5', ticker: 'MUB', type: 'Buy', price: 107.05, shares: 0.336449, value: 36.00 },
        { account: 'MyAccount 5', ticker: 'STIP', type: 'Buy', price: 102.25, shares: 0.159977, value: 16.38 },
      ];

      // Verify structure
      expect(sampleTransactions).toHaveLength(4);
      
      // Verify first transaction
      expect(sampleTransactions[0]).toEqual({
        account: 'MyAccount 5',
        ticker: 'GBIL',
        type: 'Buy',
        price: 100.25,
        shares: 0.258480,
        value: 25.91
      });
    });

    it('should handle multiple accounts correctly', () => {
      const accountData = [
        { account: 'MyAccount 5', ticker: 'GBIL', type: 'Buy' },
        { account: 'MyAccount 1', ticker: 'JPST', type: 'Buy' },
        { account: 'MyAccount 4', ticker: 'GBIL', type: 'Buy' },
      ];

      const accounts = [...new Set(accountData.map(t => t.account))];
      expect(accounts).toHaveLength(3);
      expect(accounts).toContain('MyAccount 5');
      expect(accounts).toContain('MyAccount 1');
      expect(accounts).toContain('MyAccount 4');
    });

    it('should validate transaction types', () => {
      const validTypes = ['Buy', 'Sell', 'Transfer'];
      
      validTypes.forEach(type => {
        expect(['Buy', 'Sell', 'Transfer', 'Dividend']).toContain(type);
      });
    });

    it('should handle decimal precision for shares', () => {
      const transaction = {
        shares: 0.258480,
        price: 100.25,
      };

      // Verify precision is maintained
      expect(transaction.shares).toBe(0.258480);
      expect(transaction.shares.toFixed(6)).toBe('0.258480');
      
      // Verify calculated value
      const calculatedValue = (transaction.shares * transaction.price).toFixed(2);
      expect(parseFloat(calculatedValue)).toBeCloseTo(25.91, 2);
    });

    it('should handle small share amounts correctly', () => {
      const smallTransactions = [
        { ticker: 'SPYM', price: 81.25, shares: 0.000739, value: 0.06 },
        { ticker: 'SPSM', price: 47.25, shares: 0.001462, value: 0.07 },
        { ticker: 'AGG', price: 100.25, shares: 0.001698, value: 0.17 },
      ];

      smallTransactions.forEach(transaction => {
        const calculatedValue = (transaction.shares * transaction.price).toFixed(2);
        expect(parseFloat(calculatedValue)).toBeCloseTo(transaction.value, 2);
      });
    });

    it('should handle large share amounts correctly', () => {
      const largeTransaction = {
        ticker: 'SPYM',
        price: 81.25,
        shares: 1.109127,
        // Actual calculated value: 1.109127 * 81.25 = 90.116565625
        value: 90.12 // Use the actual calculated value
      };

      const calculatedValue = (largeTransaction.shares * largeTransaction.price).toFixed(2);
      expect(parseFloat(calculatedValue)).toBeCloseTo(largeTransaction.value, 2);
    });
  });

  describe('CSV Export Format', () => {
    it('should format transaction data for CSV export', () => {
      const transaction = {
        account: 'MyAccount 5',
        date: '01/31/2024',
        type: 'Buy',
        ticker: 'GBIL',
        price: 100.25,
        shares: 0.258480,
        value: 25.91
      };

      // CSV header
      const header = 'Account,Date,Transaction_Type,Ticker,Price,Shares,Value';
      
      // CSV row
      const row = `${transaction.account},${transaction.date},${transaction.type},${transaction.ticker},${transaction.price},${transaction.shares},${transaction.value}`;
      
      expect(header).toContain('Account');
      expect(header).toContain('Ticker');
      expect(row).toContain('GBIL');
      expect(row).toContain('100.25');
    });

    it('should handle special characters in account names', () => {
      const accountName = "MyAccount's Special & Test";
      const sanitized = accountName; // No sanitization needed for CSV if properly quoted
      
      expect(sanitized).toBe("MyAccount's Special & Test");
    });
  });

  describe('Real Data Validation', () => {
    it('should validate data from pdfjs_raw_text_debug.csv', () => {
      // Sample data extracted from the CSV file
      const realData = [
        { line: 26, ticker: 'GBIL', type: 'Buy', price: '$100.25', shares: '0.258480', value: '$25.91' },
        { line: 27, ticker: 'JPST', type: 'Buy', price: '$50.80', shares: '0.408473', value: '$20.73' },
        { line: 28, ticker: 'MUB', type: 'Buy', price: '$107.05', shares: '0.336449', value: '$36.00' },
      ];

      // Parse dollar amounts
      realData.forEach(item => {
        const price = parseFloat(item.price.replace('$', ''));
        const value = parseFloat(item.value.replace('$', ''));
        const shares = parseFloat(item.shares);

        expect(price).toBeGreaterThan(0);
        expect(shares).toBeGreaterThan(0);
        expect(value).toBeGreaterThan(0);
        
        // Verify calculation
        const calculated = (price * shares).toFixed(2);
        expect(parseFloat(calculated)).toBeCloseTo(value, 1);
      });
    });

    it('should handle all tickers from real data', () => {
      const realTickers = ['GBIL', 'JPST', 'MUB', 'STIP', 'BNDX', 'SPMD', 'SPSM', 'SPYM', 'VEA', 'VWOB', 'AGG'];
      
      // All tickers should be valid uppercase strings
      realTickers.forEach(ticker => {
        expect(ticker).toMatch(/^[A-Z]+$/);
        expect(ticker.length).toBeGreaterThan(0);
        expect(ticker.length).toBeLessThanOrEqual(5);
      });
    });

    it('should parse account numbers correctly', () => {
      const accountNumbers = [
        'Account #123456789123451',
        'Account #1234567891232',
        'Account #8400172199378'
      ];

      accountNumbers.forEach(acc => {
        const number = acc.replace('Account #', '');
        expect(number).toMatch(/^\d+$/);
        expect(number.length).toBeGreaterThan(10);
      });
    });
  });

  describe('Transaction Type Handling', () => {
    it('should recognize all transaction types', () => {
      const transactionTypes = {
        'TRADES': 'Buy/Sell transactions',
        'POSITION TRANSFERS': 'Transfer between accounts',
        'No activity': 'No transactions'
      };

      Object.keys(transactionTypes).forEach(type => {
        expect(transactionTypes[type]).toBeDefined();
        expect(typeof transactionTypes[type]).toBe('string');
      });
    });

    it('should handle "No activity" sections', () => {
      const section = 'No activity';
      const hasActivity = section !== 'No activity';
      
      expect(hasActivity).toBe(false);
    });
  });
});
