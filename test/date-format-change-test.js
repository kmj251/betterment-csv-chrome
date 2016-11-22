var assert = require('assert');
var arrayParser = require('../app/src/betterment-pdf-array-parser');

describe('Betterment PDF Parsing', function() {
  describe('Should Parse 2016-11-11 format PDFs', function() {
    var quarterlyPdf =  [
		[],
		["Page ","1"," of ","2"],
		["Overview (Opened)"],
		["Total Invested"],
		["Total Earned"],
		["Total Balance"],
		["Transaction Confirmation"],
		["Betterment"],
		["Betterment Securities, Broker-Dealer"],
		["61 West 23rd Street, 4th Floor "],
		["New York, NY 10010 "],
		["888.428.9482"],
		["Joint Build Wealth Goal"],
		["Transaction Summary: Deposit from"],
		["Beginning Balance"],
		["Net Change"],
		["Ending Balance"],
		["Transaction Detail"],
		["Change","Balance"],
		["Transaction "],
		["1"],
		["Date "],
		["2"],
		["Fund","Price","Shares","Value","Shares","Value"],
		["Deposit from","Nov 14 2016","VWOB","$76.11","0.058","$4.40","1.854","$141.11"],
		["Nov 14 2016","MUB","$109.00","0.028","$3.03","4.525","$493.18"],
		["Nov 14 2016","LQD","$117.31","0.011","$1.28","0.428","$50.26"],
		["Nov 14 2016","BNDX","$54.31","0.024","$1.29","3.933","$213.60"],
		["1"],
		[" Betterment Securities acted as an agent for you and bought or sold securities on your behalf. "],
		[" Unless otherwise noted, the settlement date is three market days after the transaction date. For Mutual Funds, denoted by an underlined fund symbol, the"],
		["2"],
		["settlement date is one market day after the transaction date. "],
		["Note: If this transaction included a sale of non-covered securities (purchased outside of Betterment and transferred into your account with incomplete lot"],
		["information), the purchase date with respect to those lots may be an estimate."],
		["Please review this document carefully. If details of any transaction are incorrect, you must immediately notify Betterment Securities at"],
		["support@bettermentsecurities.com. Failure to make such notification within three (3) days of notification of this document constitutes your acceptance of the"],
		["transactions."],
		["Please take the opportunity to review the settings and restrictions, if any, on your account. This could include your portfolio allocation settings or your tax loss"],
		["harvesting settings (which you may want to review if you expect to be subject to a substantially lower tax rate) among others. Please contact"],
		["support@betterment.com, your investment adviser, if you wish to impose any reasonable restrictions on the management of your account or reasonably modify"],
		["existing restrictions."],
		["Please contact support@betterment.com, your investment adviser, if you would like to speak with someone knowledgeable about the account."],
		["CUSTODY OF ASSETS: Betterment Securities is the custodian of assets in your Betterment Securities account."],
		["MARKETS: Securities are often traded on multiple markets and we will exercise discretion as to the market or markets in which your order is executed."],
		["AGGREGATION: Your orders with Betterment Securities may be aggregated with the orders of other clients for purposes of execution. If orders are aggregated,"],
		["each client receives the average price of the aggregate group order."],
		["TRANSACTION TYPES: A \"Deposit\" is a purchase of securities made on account of an order that was generated by new money being transferred into your"],
		["account. A \"Withdrawal\" is a sale of securities made on account of an order that was generated by a new withdrawal from your account. \"Dividend\" is a purchase"],
		["of securities made according to an order resulting from dividends that accrue to your account. \"Allocation\" is a purchase or sale of securities made on account of a"],
		["change to your account Allocation. \"Rebalance\" is a purchase or sale of securities made according to an order that was generated by the rebalancing of your"],
		["account assets. \"Advisory Fee\" is a sale of securities liquidated to fund the payment of advisory fees to Betterment. If you are on the Betterment Institutional"],
		["platform and have a separate investment advisor, the \"Advisory Fee\" is a sale of securities liquidated to fund the payment of advisory fees to Betterment and that"],
		["investment advisor. \"Portfolio Update\" is a purchase or sale of securities made on account of a change to your portfolio. \"Position Transfer\" is a transfer of"],
		["securities from one goal to another, either within your account or between different accounts. Note that position transfers may also refer to assets transferred into"],
		["or out of Betterment from / to external providers."],
		["REPRESENTATIONS: Descriptive words in the title of any security are used for identification purposes only and do not constitute representations."],
		["EXECUTION: The time of execution, the name of the buyer or seller, and the commission charged to the other party if we acted as a dual agent, are available"],
		["upon written request."],
		["FRACTIONAL SHARES: Your account holds fractional share interests in securities. Please note that fractional share amounts are typically unrecognized and"],
		["illiquid outside the Betterment platform and fractional shares might not be marketable outside the Betterment platform or transferrable to another brokerage"],
		["account."],
		["REGULATIONS: These transactions are subject to the rules, regulations, and customs of the exchange or market on which they are made and to any and all"],
		["applicable federal, state and/or foreign statutes or regulations."],
		["GOVERNING LAW: The terms and conditions of this confirmation shall be governed by and construed in accordance with the laws of the state of Delaware,"],
		["without giving effect to the conflict of law provision thereof."],
		["IRA CUSTODIAN: Sunwest Trust, Inc., P.O. Box 36371, Albuquerque, NM 87176., is the custodian of IRA accounts."],
		["The products available through Betterment are investment products and as such: (i) are not insured by the Federal Deposit Insurance Corporation (\"FDIC\"); (ii)"],
		["carry no bank or government guarantees, and are not a deposit or other obligation of, or guaranteed by, a bank; and (iii) have associated risks. Client understands"],
		["that investments in securities are subject to investment risks, including possible loss of the principal amount invested. Your uninvested cash balances are subject"],
		["to the terms in the Cash Activity section of your statement."],
		["Page ","2"," of ","2"],
		["If you believe there is an inaccuracy or discrepancy between this statement and your account, you should immediately send written notification to Betterment"],
		["Securities Customer Support at support@bettermentsecurities.com and retain a copy for your records. If you have any oral communications with Betterment"],
		["Securities or its affiliates regarding inaccuracies or discrepancies, such communications should be re-confirmed in writing."],
		["Complaints about your Betterment Securities brokerage account may be directed to Betterment Securities at support@bettermentsecurities.com, via phone by"],
		["calling 212-228-1328, or by mail at 61 West 23rd Street, 4th Floor, New York, NY 10010."],
		["Copies of statements and confirmations are available securely at bettermentsecurities.com."],
    ];

    var parser = new arrayParser.BettermentPdfArrayParser();
    var transactions = parser.parse(quarterlyPdf);

    it('should return the right transactions', function () {
      var expectedTransactions = [      
        createTransaction("11/14/2016","Deposit from","VWOB","76.11","4.40", "Joint Build Wealth Goal"),
        createTransaction("11/14/2016","Deposit from","MUB","109.00","3.03", "Joint Build Wealth Goal"),
        createTransaction("11/14/2016","Deposit from","LQD","117.31","1.28", "Joint Build Wealth Goal"),
        createTransaction("11/14/2016","Deposit from","BNDX","54.31","1.29", "Joint Build Wealth Goal"),
      ];

      assert.deepEqual(transactions, expectedTransactions);
    });
  });
});

function createTransaction(date, description, ticker, price, value, goal) {
  quantity = (value / price).toFixed(6);
  return  {
    ticker: ticker,
    price: price,
    amount: value,
    quantity: quantity,
    account: goal,
    date: new Date(date),
    description: description
  };
}
