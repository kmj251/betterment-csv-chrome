import { BettermentPdfArrayParser } from '../app/src/betterment-pdf-array-parser.js';
import { describe, it, expect, beforeEach } from 'vitest';

describe('BettermentPdfArrayParser - Real Data Tests', () => {
  let parser;

  beforeEach(() => {
    parser = new BettermentPdfArrayParser();
  });

  describe('Clean Transaction Format Parsing', () => {
    it('should parse clean transaction format correctly', () => {
      const testData = [
        ['Ticker', 'Type', 'Price', 'Shares', 'Value'],
        ['STIP', 'Buy', '$102.40', '0.159977', '$16.40'],
        ['MUB', 'Buy', '$107.00', '0.336449', '$36.00'],
        ['JPST', 'Buy', '$50.75', '0.408473', '$20.75'],
        ['GBIL', 'Buy', '$100.25', '0.258480', '$25.90']
      ];

      const result = parser.parse(testData);
      
      expect(result).toHaveLength(4);
      
      // Test first transaction
      expect(result[0]).toEqual(
        expect.objectContaining({
          ticker: 'STIP',
          type: 'Buy',
          price: 102.40,
          shares: 0.159977,
          amount: 16.40
        })
      );
      
      // Test second transaction
      expect(result[1]).toEqual(
        expect.objectContaining({
          ticker: 'MUB',
          type: 'Buy',
          price: 107.00,
          shares: 0.336449,
          amount: 36.00
        })
      );
    });

    it('should handle account extraction from clean format', () => {
      const testData = [
        ['Safety', 'Net', '-', 'Automated', 'Investing', 'Account', '#123456789123452'],
        ['TRADES'],
        ['Ticker', 'Type', 'Price', 'Shares', 'Value'],
        ['JPST', 'Buy', '$50.75', '0.085714', '$4.35']
      ];

      const result = parser.parse(testData);
      
      expect(result).toHaveLength(1);
      expect(result[0].account).toBe('Safety Net');
    });

    it('should handle multiple account sections', () => {
      const testData = [
        ['Vacation', '1', '-', 'Automated', 'Investing', 'Account', '#123456789123457'],
        ['TRADES'],
        ['Ticker', 'Type', 'Price', 'Shares', 'Value'],
        ['GBIL', 'Buy', '$100.25', '0.058160', '$5.85'],
        ['General', 'Investing', '-', 'Automated', 'Investing', 'Account', '#123456789123455'],
        ['TRADES'],
        ['Ticker', 'Type', 'Price', 'Shares', 'Value'],
        ['JPST', 'Buy', '$50.75', '0.129458', '$6.55']
      ];

      const result = parser.parse(testData);
      
      expect(result).toHaveLength(2);
      expect(result[0].account).toBe('Vacation 1');
      expect(result[1].account).toBe('General Investing');
    });

    it('should parse position transfers correctly', () => {
      const testData = [
        ['Safety', 'Net', '-', 'Automated', 'Investing', 'Account', '#123456789123452'],
        ['POSITION', 'TRANSFERS'],
        ['Ticker', 'Type', 'Price', 'Shares', 'Value'],
        ['STIP', 'Transfer', '$102.40', '0.159977', '$16.40']
      ];

      const result = parser.parse(testData);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(
        expect.objectContaining({
          ticker: 'STIP',
          type: 'Transfer',
          description: 'Position Transfer'
        })
      );
    });

    it('should handle various ticker symbols from real data', () => {
      const realTickers = [
        ['STIP', 'Buy', '$102.40', '0.159977', '$16.40'],
        ['MUB', 'Buy', '$107.00', '0.336449', '$36.00'],
        ['JPST', 'Buy', '$50.75', '0.408473', '$20.75'],
        ['GBIL', 'Buy', '$100.25', '0.258480', '$25.90'],
        ['VWOB', 'Buy', '$67.65', '0.003548', '$0.25'],
        ['SPYM', 'Buy', '$81.20', '0.000739', '$0.05'],
        ['SPSM', 'Buy', '$47.90', '0.001462', '$0.05'],
        ['SPMD', 'Buy', '$59.00', '0.001186', '$0.05'],
        ['BNDX', 'Buy', '$48.45', '0.004747', '$0.25'],
        ['AGG', 'Buy', '$100.15', '0.001698', '$0.15'],
        ['VEA', 'Buy', '$62.75', '1.192541', '$74.80']
      ];

      const testData = [
        ['TRADES'],
        ['Ticker', 'Type', 'Price', 'Shares', 'Value'],
        ...realTickers
      ];

      const result = parser.parse(testData);
      
      expect(result).toHaveLength(11);
      
      // Verify all tickers are parsed correctly
      const expectedTickers = ['STIP', 'MUB', 'JPST', 'GBIL', 'VWOB', 'SPYM', 'SPSM', 'SPMD', 'BNDX', 'AGG', 'VEA'];
      result.forEach((transaction, index) => {
        expect(transaction.ticker).toBe(expectedTickers[index]);
      });
    });

    it('should handle small dollar amounts correctly', () => {
      const testData = [
        ['TRADES'],
        ['Ticker', 'Type', 'Price', 'Shares', 'Value'],
        ['SPYM', 'Buy', '$81.20', '0.000739', '$0.05'],
        ['SPSM', 'Buy', '$47.90', '0.001462', '$0.05'],
        ['AGG', 'Buy', '$100.15', '0.001698', '$0.15']
      ];

      const result = parser.parse(testData);
      
      expect(result).toHaveLength(3);
      expect(result[0].amount).toBe(0.05);
      expect(result[1].amount).toBe(0.05);
      expect(result[2].amount).toBe(0.15);
    });
  });

  describe('Backward Compatibility with Spaced Format', () => {
    it('should still handle spaced transaction format as fallback', () => {
      const testData = [
        ['TR', 'AD', 'ES'],
        ['Tic', 'ker', 'Typ', 'e', 'Pri', 'ce', 'Sha', 'res', 'Val', 'ue'],
        ['STI', 'P', 'Buy', '$10', '2.4', '0', '0.15', '997', '7', '$1', '6.4', '0']
      ];

      const result = parser.parse(testData);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(
        expect.objectContaining({
          ticker: 'STIP',
          type: 'Buy',
          price: 102.40,
          shares: 0.159977,
          amount: 16.40
        })
      );
    });

    it('should handle spaced account names as fallback', () => {
      const testData = [
        ['Sa', 'fet', 'y', 'Ne', 't', '-', 'Au', 'tom', 'ate', 'd', 'In', 'vest', 'ing'],
        ['TR', 'AD', 'ES'],
        ['Tic', 'ker', 'Typ', 'e', 'Pri', 'ce', 'Sha', 'res', 'Val', 'ue'],
        ['JPM', 'ST', 'Buy', '$5', '0.7', '5', '0.08', '571', '4', '$4', '.3', '5']
      ];

      const result = parser.parse(testData);
      
      expect(result).toHaveLength(1);
      expect(result[0].account).toBe('Safety Net');
    });
  });

  describe('Edge Cases from Real Data', () => {
    it('should ignore non-transaction lines', () => {
      const testData = [
        ['Page', '2', 'of', '8'],
        ['No', 'activity'],
        ['TRADES'],
        ['Ticker', 'Type', 'Price', 'Shares', 'Value'],
        ['STIP', 'Buy', '$102.40', '0.159977', '$16.40'],
        ['Page', '3', 'of', '8']
      ];

      const result = parser.parse(testData);
      
      expect(result).toHaveLength(1);
      expect(result[0].ticker).toBe('STIP');
    });

    it('should reset section parsing at page boundaries', () => {
      const testData = [
        ['TRADES'],
        ['Ticker', 'Type', 'Price', 'Shares', 'Value'],
        ['STIP', 'Buy', '$102.40', '0.159977', '$16.40'],
        ['Page', '3', 'of', '8'],
        ['Some', 'other', 'content'],
        ['TRADES'],
        ['Ticker', 'Type', 'Price', 'Shares', 'Value'],
        ['MUB', 'Buy', '$107.00', '0.336449', '$36.00']
      ];

      const result = parser.parse(testData);
      
      expect(result).toHaveLength(2);
      expect(result[0].ticker).toBe('STIP');
      expect(result[1].ticker).toBe('MUB');
    });

    it('should handle decimal precision correctly', () => {
      const testData = [
        ['TRADES'],
        ['Ticker', 'Type', 'Price', 'Shares', 'Value'],
        ['VEA', 'Buy', '$62.75', '1.192541', '$74.80'],
        ['SPYM', 'Buy', '$81.20', '1.109127', '$90.05']
      ];

      const result = parser.parse(testData);
      
      expect(result).toHaveLength(2);
      expect(result[0].shares).toBe(1.192541);
      expect(result[0].price).toBe(62.75);
      expect(result[1].shares).toBe(1.109127);
      expect(result[1].price).toBe(81.20);
    });
  });

  describe('Data Validation', () => {
    it('should convert string numbers to actual numbers', () => {
      const testData = [
        ['TRADES'],
        ['Ticker', 'Type', 'Price', 'Shares', 'Value'],
        ['STIP', 'Buy', '$102.40', '0.159977', '$16.40']
      ];

      const result = parser.parse(testData);
      
      expect(result).toHaveLength(1);
      expect(typeof result[0].price).toBe('number');
      expect(typeof result[0].shares).toBe('number');
      expect(typeof result[0].amount).toBe('number');
    });

    it('should handle commas in numbers', () => {
      const testData = [
        ['TRADES'],
        ['Ticker', 'Type', 'Price', 'Shares', 'Value'],
        ['TEST', 'Buy', '$1,234.56', '1,000.123', '$1,234,567.89']
      ];

      const result = parser.parse(testData);
      
      expect(result).toHaveLength(1);
      expect(result[0].price).toBe(1234.56);
      expect(result[0].shares).toBe(1000.123);
      expect(result[0].amount).toBe(1234567.89);
    });
  });
});