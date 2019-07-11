var pdfToTextArray = require('./pdf-to-text-array');
var TransactionConverter = require('./transaction-converter');
var pdfparser = require('./betterment-pdf-array-parser');
var $ = require('jquery');
var MutationSummary = require('mutation-summary');


/*
 * ElementLocation
 */
const ElementLocation = Object.freeze({'BEFORE': 1, 'REPLACE': 2});


/*
 * OutputFormat
 */
const OutputFormat = Object.freeze({'CSV': 1, 'QIF': 2});


/*
 * DataFile
 */
var DataFile = function(name, format, data) {
  this.name = name;
  this.data = data;

  if (format === OutputFormat.CSV) {
    this.extension = 'csv';
    this.mimetype = 'text/csv';
  } else if (format === OutputFormat.QIF) {
    this.extension = 'qif';
    this.mimetype = 'application/qif';
  } else {
    throw 'Unrecognized extension';
  }
};

DataFile.makeCsv = function(name, data) {
  return new DataFile(name, OutputFormat.CSV, data);
};

DataFile.makeQif = function(name, data) {
  return new DataFile(name, OutputFormat.QIF, data);
};


/*
 * Summary Tracker
 */
var SummaryTracker = function(id) {
  this.id = id;
  this.elementQuery = 'a[href^="/app/activity_transactions.csv"]';
  this.txns = [];
};

SummaryTracker.prototype.appendTxns = function(txns) {
  this.txns.push.apply(this.txns, txns);
  let container = createContainerFromTransactions(this.txns, 'all', this.id);
  let el = $('#' + this.id);
  if (el.length === 0) {
    insertContainer($(this.elementQuery), ElementLocation.BEFORE, container);
  } else {
    insertContainer(el, ElementLocation.REPLACE, container);
  }
};


/*
 * globals
 */

const transactionPdfRe = new RegExp(
    'app/quarterly_statements/\\d+' +
    '|' +
    'app/legacy_quarterly_statements/\\d+' +
    '|' +
    'app/transaction_documents/\\d+');
var transactionParser = new pdfparser.BettermentPdfArrayParser();

// Global variable for options
const OUTPUT_FORMATS = [];
var ADD_COMBINED_OUTPUT = false;

// Async call to get options
chrome.storage.sync.get(
    {
      csvOutputDesired: true,
      qifOutputDesired: false,
      combinedOutputDesired: false,
    },
    function(items) {
      // Store results
      if (items.csvOutputDesired) {
        OUTPUT_FORMATS.push(OutputFormat.CSV);
      } else if (items.qifOutputDesired) {
        OUTPUT_FORMATS.push(OutputFormat.QIF);
      } else {
        throw 'Unrecognized output format';
      }

      ADD_COMBINED_OUTPUT = items.combinedOutputDesired;

      // Create observer for anchor tags
      new MutationSummary(
          {callback: handleNewAnchors, queries: [{element: 'a[href]'}]});
    });

function handleNewAnchors(summaries) {
  // Here we make the assumption that whenever the anchors change on the page
  // that we are free to blow away whatever transactions were being stored
  // before. This means we are assuming that we don't expect anchors to be
  // added, instead when the user selects a new date range, that every PDF
  // shown will be re-added to the DOM.
  let summaryTracker = new SummaryTracker('betterment-csv-chrome-combined');

  var anchorSummaries = summaries[0];

  anchorSummaries.added.forEach(function(anchorEl) {
    var pdfUrl = anchorEl.href;

    if (transactionPdfRe.test(pdfUrl)) {
      pdfToTextArray(pdfUrl).then(function(textArray) {
        var transactions = transactionParser.parse(textArray);

        if (ADD_COMBINED_OUTPUT) {
          summaryTracker.appendTxns(transactions);
        }

        getFilenamePromise(pdfUrl).then(function(filename) {
          let container =
              createContainerFromTransactions(transactions, filename);
          insertContainer($(anchorEl), ElementLocation.BEFORE, container);
        });
      });
    }
  });
}

// Returns a plain DOM element
function createContainerFromTransactions(transactions, filename, id) {
  let files = createDownloadFiles(transactions, filename);
  return createDownloadContainer(files, id);
}

function createDownloadFiles(transactions, filename) {
  let files = [];

  OUTPUT_FORMATS.forEach(function(format) {
    let data;
    if (format === OutputFormat.CSV) {
      let data = TransactionConverter.toCsv(transactions);
      let file = DataFile.makeCsv(filename, data);
      files.push(file);
    } else if (format === OutputFormat.QIF) {
      let data = TransactionConverter.toQif(transactions);
      let file = DataFile.makeQif(filename, data);
      files.push(file);
    }
  });

  return files;
}

// Note: elPos must be a jQuery element, not a plain DOM element.
function insertContainer(elPos, elLoc, container) {
  if (elLoc === ElementLocation.BEFORE) {
    elPos.before(container);
  } else if (elLoc === ElementLocation.REPLACE) {
    elPos.replaceWith(container);
  }
}

// Grab filename (without .pdf at the end) from PDF URL. Is a promise because we
// have to make an ajax call if it is a quarterly 401k PDF.
// https://wwws.betterment.com/document/Betterment_Deposit_2016-02-18.pdf
function getFilenamePromise(pdfUrl) {
  return new Promise(function(resolve) {
    $.ajax({url: pdfUrl}).done(function(data, textStatus, jqXHR) {
      // content-disposition: attachment;
      // filename="Betterment_401k_Quarterly_Statement_2015-12-31.pdf"
      var contentDisposition = jqXHR.getResponseHeader('content-disposition');
      var found = contentDisposition.match(/filename="(.*?)"/);
      resolve(found[1]);
    });
  });
}

// Returns a plain DOM element
function createDataUrl(file, id) {
  let blob = new Blob([file.data], {type: file.mimeType, endings: 'native'});
  let blobUrl = window.URL.createObjectURL(blob);

  let a = document.createElement('a');
  a.href = blobUrl;
  a.download = file.name + '.' + file.extension;
  a.textContent = file.extension;
  a.style = 'font-size: 12px';
  // Hack so that this a tag doesn't make the row disappear.
  a.setAttribute('data-no-toggle', 'true');

  if (typeof id !== 'undefined') {
    a.id = id;
  }

  return a;
}

// Returns a <span> el containing blob download links to the given files. Order
// of the files determines the order of the links.
function createDownloadContainer(files, id) {
  let span = document.createElement('span');

  if (typeof id !== 'undefined') {
    span.id = id;
  }

  files.forEach(function(file) {
    span.appendChild(createDataUrl(file));
  });

  return span;
}
