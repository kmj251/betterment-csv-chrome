var assert = require('assert');
var arrayParser = require('../src/betterment-pdf-array-parser');

describe('Betterment PDF Parsing', function() {
	describe('Quarterly 401(k) PDFs', function() {
		var quarterlyPdf = 	[
			[],
			["Betterment"],
			["Quarterly Statement"],
			["October 1st, 2015 - December 31st, 2015"],
			["Betterment Securities, Broker-Dealer"],
			["61 West 23rd Street 5th Floor"],
			["New York, NY 10010"],
			["1-888-428-9482"],
			["Summary"],
			["Portfolio"],
			["Prior"],
			["Balance"],
			["Change"],
			["Current"],
			["Balance"],
			["Balance"],
			["Composition"],
			["Stocks","$1.44","$11,333.22","$11,333.22","100%"],
			["Bonds","$1.44","$1.44","$1.44","0%"],
			["Total","$1.44","$11,333.22","$11,333.22","100%"],
			["401(k) Investment Activity"],
			["Source"],
			["1"],
			["Amount "],
			["2"],
			["Beginning Balance (2015-10-01)","$1.44"],
			["Employee Traditional 401(k) Rollover","$11,333.22"],
			["Employee Traditional 401(k) Contribution","$11,333.22"],
			["Fees","$1.44"],
			["Market Changes","-$333.66"],
			["Ending Balance (2015-12-31)","$11,333.22"],
			["1"],
			[" ","All sources are 100% vested."],
			["2"],
			[" ","Amounts include conversion funds received from prior recordkeeper."],
			["Holdings"],
			["Prior","Change"],
			["Current"],
			["1"],
			["Description","Fund","Shares","Value","Shares","Value","Shares","Value"],
			["Stocks"],
			["US Total Stock Market","VTI","1.440","$1.44","22.557","$1,444.66","22.557","$1,444.66"],
			["Developed Markets","VEA","1.440","$1.44","333.662","$11,333.22","333.662","$11,333.22"],
			["Emerging Markets","VWO","1.440","$1.44","333.663","$1,444.66","333.663","$1,444.66"],
			["US Large-Cap Value","VTV","1.440","$1.44","333.660","$1,444.66","333.660","$1,444.66"],
			["US Mid-Cap Value","VOE","1.440","$1.44","22.556","$1,444.66","22.556","$1,444.66"],
			["US Small-Cap Value","VBR","1.440","$1.44","22.556","$1,444.66","22.556","$1,444.66"],
			["All Accounts"],
			["Table of Contents"],
			["i",". ","Traditional 401(k)"],
			["Holdings"],
			["Prior","Change"],
			["Current"],
			["1"],
			["Description","Fund","Shares","Value","Shares","Value","Shares","Value"],
			["Stocks"],
			["US Total Stock Market","VTI","1.440","$1.44","22.557","$1,444.66","22.557","$1,444.66"],
			["Developed Markets","VEA","1.440","$1.44","333.662","$11,333.22","333.662","$11,333.22"],
			["Emerging Markets","VWO","1.440","$1.44","333.663","$1,444.66","333.663","$1,444.66"],
			["US Large-Cap Value","VTV","1.440","$1.44","333.660","$1,444.66","333.660","$1,444.66"],
			["US Mid-Cap Value","VOE","1.440","$1.44","22.556","$1,444.66","22.556","$1,444.66"],
			["US Small-Cap Value","VBR","1.440","$1.44","22.556","$1,444.66","22.556","$1,444.66"],
			["Dividend Payment Detail"],
			["Payment Date","Fund","Description","Amount"],
			["Dec 30th, 2015","VTI","US Total Stock Market","$22.55"],
			["Dec 30th, 2015","VEA","Developed Markets","$333.66"],
			["Dec 30th, 2015","VWO","Emerging Markets","$22.55"],
			["Dec 30th, 2015","VTV","US Large-Cap Value","$22.55"],
			["Total","$333.66"],
			["Quarterly Activity Detail"],
			["Change","Balance"],
			["Date"],
			["2"],
			["Transaction"],
			["3"],
			["Portfolio/Fund","Price","Shares","Value","Shares","Value"],
			["Nov 4th, 2015","10/30/2015 Payroll Contribution","stocks / VTI","$333.66","1.446","$333.66","1.446","$333.66"],
			["Nov 4th, 2015","10/30/2015 Payroll Contribution","stocks / VEA","$22.55","22.559","$333.66","22.559","$333.66"],
			["Nov 4th, 2015","10/30/2015 Payroll Contribution","stocks / VWO","$22.55","1.441","$333.66","1.441","$333.66"],
			["Nov 4th, 2015","10/30/2015 Payroll Contribution","stocks / VTV","$22.55","1.442","$333.66","1.442","$333.66"],
			["Nov 4th, 2015","10/30/2015 Payroll Contribution","stocks / VOE","$22.55","1.442","$22.55","1.442","$22.55"],
			["Nov 4th, 2015","10/30/2015 Payroll Contribution","stocks / VBR","$333.66","1.441","$22.55","1.441","$22.55"],
			["Nov 17th, 2015","Wire for 401(k) Plan Conversion","stocks / VWO","$22.55","333.661","$1,444.66","333.662","$1,444.66"],
			["Nov 17th, 2015","Wire for 401(k) Plan Conversion","stocks / VTI","$333.66","22.554","$1,444.66","22.551","$1,444.66"],
			["Traditional 401(k)"],
			["Nov 17th, 2015","Wire for 401(k) Plan Conversion","stocks / VEA","$22.55","333.667","$11,333.22","333.666","$11,333.22"],
			["Nov 17th, 2015","Wire for 401(k) Plan Conversion","stocks / VBR","$333.66","22.559","$1,444.66","22.550","$1,444.66"],
			["Nov 17th, 2015","Wire for 401(k) Plan Conversion","stocks / VTV","$22.55","333.662","$1,444.66","333.664","$1,444.66"],
			["Nov 17th, 2015","Wire for 401(k) Plan Conversion","stocks / VOE","$22.55","22.555","$1,444.66","22.557","$1,444.66"],
			["Nov 18th, 2015","11/13/2015 Payroll Contribution","stocks / VEA","$22.55","1.445","$333.66","333.661","$11,333.22"],
			["Nov 18th, 2015","11/13/2015 Payroll Contribution","stocks / VTI","$333.66","1.447","$22.55","22.557","$11,333.22"],
			["Nov 18th, 2015","11/13/2015 Payroll Contribution","stocks / VWO","$22.55","1.446","$22.55","333.668","$1,444.66"],
			["Nov 18th, 2015","11/13/2015 Payroll Contribution","stocks / VBR","$333.66","1.446","$22.55","22.556","$1,444.66"],
			["Nov 18th, 2015","11/13/2015 Payroll Contribution","stocks / VOE","$22.55","1.449","$22.55","22.556","$1,444.66"],
			["Nov 18th, 2015","11/13/2015 Payroll Contribution","stocks / VTV","$22.55","1.447","$22.55","333.660","$11,333.22"],
			["Dec 30th, 2015","Dividend","stocks / VWO","$22.55","1.445","$333.66","333.663","$1,444.66"],
			["Dec 30th, 2015","Dividend","stocks / VEA","$22.55","1.441","$22.55","333.662","$11,333.22"],
			["Cash Activity (401(k) Securities Account)"],
			["Subject to the terms of the sweep program, outlined in your customer agreement, your uninvested cash balances"],
			["are held in a sweep account at The Bancorp Bank, and are FDIC insured. These balances include deposits"],
			["waiting for trade settlement and withdrawals in transit. Cash balances such as dividends waiting for reinvestment"],
			["may also be held in your securities account. Such credit balances in your securities account are protected by"],
			["SIPC."],
			["4"],
			[" Below is the quarterly cash activity for your securities account, including end of quarter balances."],
			["Date","Goal","Description","Transaction","Balance"],
			["Nov 9th, 2015","Traditional 401(k)","Settlement of Securities Purchase","-$1,444.66","-$1,444.66"],
			["Nov 9th, 2015","Traditional 401(k)","Transfer from Sweep Account","$1,444.66","$1.44"],
			["Nov 20th, 2015","Traditional 401(k)","Settlement of Securities Purchase","-$11,333.22","-$11,333.22"],
			["Nov 20th, 2015","Traditional 401(k)","Transfer from Sweep Account","$11,333.22","$1.44"],
			["Nov 23rd, 2015","Traditional 401(k)","Settlement of Securities Purchase","-$333.66","-$333.66"],
			["Nov 23rd, 2015","Traditional 401(k)","Transfer from Sweep Account","$333.66","$1.44"],
			["Dec 29th, 2015","Traditional 401(k)","Payment of Dividends","$333.66","$333.66"],
			["Cash Activity (401(k) Sweep Account)"],
			["Subject to the terms of the sweep program, outlined in your customer agreement, your uninvested cash balances"],
			["are held in a sweep account at The Bancorp Bank, and are FDIC insured. These balances include deposits"],
			["waiting for trade settlement and withdrawals in transit. Cash balances such as dividends waiting for reinvestment"],
			["may also be held in your securities account. Such credit balances in your securities account are protected by"],
			["SIPC."],
			["4"],
			[" Below is the quarterly cash activity for your sweep account, including end of quarter balances."],
			["Date","Goal","Description","Transaction","Balance"],
			["Nov 2nd, 2015","Traditional 401(k)","Transfer to Sweep Account","$1,444.66","$1,444.66"],
			["Nov 9th, 2015","Traditional 401(k)","Transfer to Securities Account","-$1,444.66","$1.44"],
			["Nov 16th, 2015","Traditional 401(k)","Transfer to Sweep Account","$333.66","$333.66"],
			["Nov 17th, 2015","Traditional 401(k)","Transfer to Sweep Account","$11,333.22","$11,333.22"],
			["Nov 20th, 2015","Traditional 401(k)","Transfer to Securities Account","-$11,333.22","$333.66"],
			["Nov 23rd, 2015","Traditional 401(k)","Transfer to Securities Account","-$333.66","$1.44"],
			["Fee Disclosure"],
		];

		var parser = new arrayParser.BettermentPdfArrayParser();
		var transactions = parser.parse(quarterlyPdf);

		it('should return the right transactions', function () {
			var expectedTransactions = [			
				createTransaction("11/04/2015","10/30/2015 Payroll Contribution","VTI","333.66","333.66", "Traditional 401(k)"),
				createTransaction("11/04/2015","10/30/2015 Payroll Contribution","VEA","22.55","333.66", "Traditional 401(k)"),
				createTransaction("11/04/2015","10/30/2015 Payroll Contribution","VWO","22.55","333.66", "Traditional 401(k)"),
				createTransaction("11/04/2015","10/30/2015 Payroll Contribution","VTV","22.55","333.66", "Traditional 401(k)"),
				createTransaction("11/04/2015","10/30/2015 Payroll Contribution","VOE","22.55","22.55", "Traditional 401(k)"),
				createTransaction("11/04/2015","10/30/2015 Payroll Contribution","VBR","333.66","22.55", "Traditional 401(k)"),
				createTransaction("11/17/2015","Wire for 401(k) Plan Conversion","VWO","22.55","1444.66", "Traditional 401(k)"),
				createTransaction("11/17/2015","Wire for 401(k) Plan Conversion","VTI","333.66","1444.66", "Traditional 401(k)"),
				createTransaction("11/17/2015","Wire for 401(k) Plan Conversion","VEA","22.55","11333.22", "Traditional 401(k)"),
				createTransaction("11/17/2015","Wire for 401(k) Plan Conversion","VBR","333.66","1444.66", "Traditional 401(k)"),
				createTransaction("11/17/2015","Wire for 401(k) Plan Conversion","VTV","22.55","1444.66", "Traditional 401(k)"),
				createTransaction("11/17/2015","Wire for 401(k) Plan Conversion","VOE","22.55","1444.66", "Traditional 401(k)"),
				createTransaction("11/18/2015","11/13/2015 Payroll Contribution","VEA","22.55","333.66", "Traditional 401(k)"),
				createTransaction("11/18/2015","11/13/2015 Payroll Contribution","VTI","333.66","22.55", "Traditional 401(k)"),
				createTransaction("11/18/2015","11/13/2015 Payroll Contribution","VWO","22.55","22.55", "Traditional 401(k)"),
				createTransaction("11/18/2015","11/13/2015 Payroll Contribution","VBR","333.66","22.55", "Traditional 401(k)"),
				createTransaction("11/18/2015","11/13/2015 Payroll Contribution","VOE","22.55","22.55", "Traditional 401(k)"),
				createTransaction("11/18/2015","11/13/2015 Payroll Contribution","VTV","22.55","22.55", "Traditional 401(k)"),
				createTransaction("12/30/2015","Dividend","VWO","22.55","333.66", "Traditional 401(k)"),
				createTransaction("12/30/2015","Dividend","VEA","22.55","22.55", "Traditional 401(k)"),
			];

			assert.deepEqual(expectedTransactions, transactions);
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