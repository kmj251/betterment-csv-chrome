// Debug flag - set to false to disable console logging
const DEBUG = true;

// Debug logging wrapper
function debugLog(...args) {
  if (DEBUG) {
    debugLog(...args);
  }
}

debugLog('🎯 PDF.JS VERSION: 2025-12-29-16:55 - WITH REAL PDF PROCESSING!');

// Configure PDF.js when it loads
if (typeof window !== 'undefined' && window.pdfjsLib) {
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('pdf.worker.js');
  debugLog('✅ PDF.js configured with worker');
}

// PDF processing functions (from original code)
async function pdfToTextArray(pdfUrl) {
  const pdfjsLib = window.pdfjsLib;
  
  if (!pdfjsLib) {
    throw new Error('PDF.js library not loaded');
  }

  debugLog('📖 Loading PDF document:', pdfUrl);
  
  const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
  debugLog('📄 PDF loaded, pages:', pdf.numPages);
  
  let lineOffset = 0;
  const textArray = [[]];

  const pages = [];
  for (let i = 0; i < pdf.numPages; i++) {
    pages.push(i);
  }

  await Promise.all(pages.map(async (pageNumber) => {
    const page = await pdf.getPage(pageNumber + 1);
    const textContent = await page.getTextContent();
    
    let lastOffset = 0;
    textContent.items.forEach((item) => {
      const offset = item.transform[5];

      if (offset !== lastOffset) {
        lineOffset++;
        textArray.push([]);
      }

      textArray[lineOffset].push(item.str);
      lastOffset = item.transform[5];
    });
  }));

  debugLog('✅ PDF text extracted, lines:', textArray.length);
  return textArray;
}

// Transaction parsing (simplified from original)
// Transaction parsing based on actual PDF.js structure
function parseBettermentTransactions(textArray) {
  debugLog('🔍 Parsing transactions from', textArray.length, 'lines');
  
  const transactions = [];
  let currentAccount = null;
  let reportDate = new Date();
  let dateFound = false;
  
  debugLog('🔍 DEBUG: Starting date search in textArray with', textArray.length, 'elements');
  
  // Find the report date - look near "Daily Activity Report"
  for (let i = 0; i < Math.min(textArray.length, 30); i++) {
    if (!textArray[i] || !Array.isArray(textArray[i])) {
      debugLog(`🔍 DEBUG: Line ${i} is not an array:`, typeof textArray[i], textArray[i]);
      continue;
    }
    const lineText = textArray[i].join(' ').trim();
    debugLog(`🔍 DEBUG: Line ${i}: "${lineText}"`);
    
    // If we find "Daily Activity Report", check this line and the next few lines for date
    if (lineText.includes('Daily Activity Report')) {
      debugLog(`Found Daily Activity Report at line ${i}, searching nearby lines for date`);
      
      // Check the current line first (in case date is on same line)
      const sameLine = lineText.match(/Daily Activity Report.*?(\d{4}-\d{2}-\d{2})/);
      if (sameLine) {
        const dateStr = sameLine[1];
        const [year, month, day] = dateStr.split('-');
        reportDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        debugLog('✅ Found report date on same line:', reportDate);
        dateFound = true;
        break;
      }
      
      // Check the next few lines for the date
      for (let j = i + 1; j <= Math.min(textArray.length - 1, i + 5); j++) {
        if (!textArray[j] || !Array.isArray(textArray[j])) {
          debugLog(`🔍 DEBUG: Line ${j} after Daily Activity Report is not an array:`, typeof textArray[j], textArray[j]);
          continue;
        }
        const nextLineText = textArray[j].join(' ').trim();
        debugLog(`🔍 DEBUG: Checking line ${j} after Daily Activity Report: "${nextLineText}"`);
        
        // Look for date in YYYY-MM-DD format
        const dateMatch = nextLineText.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (dateMatch) {
          const [, year, month, day] = dateMatch;
          reportDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          debugLog('✅ Found report date after Daily Activity Report:', reportDate);
          dateFound = true;
          break;
        } else {
          debugLog(`🔍 DEBUG: Line ${j} "${nextLineText}" did not match date pattern`);
        }
      }
      if (dateFound) break;
    }
    
    // Also try to match date pattern on every line as we go
    const dateMatch = lineText.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dateMatch) {
      const [, year, month, day] = dateMatch;
      reportDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      debugLog('✅ Found report date on line', i, ':', reportDate);
      dateFound = true;
      break;
    }
  }
  
  if (!dateFound) {
    debugLog('⚠️ No date found, using current date');
  }
  
  let inTransactionSection = false;
  let awaitingTransactions = false;
  
  debugLog('🔍 Starting transaction parsing...');
  
  textArray.forEach((line, index) => {
    if (!Array.isArray(line)) return;
    
    const lineText = line.join(' ').trim();
    if (!lineText) return;
    
    debugLog(`🔍 Line ${index}: "${lineText}" | inTransactionSection: ${inTransactionSection}, awaitingTransactions: ${awaitingTransactions}, currentAccount: ${currentAccount}`);
    
    // Look for account names (lines ending with "- Automated Investing" OR containing "Investing")
    if (lineText.endsWith('- Automated Investing')) {
      let friendlyName = lineText.replace(/\s*-\s*Automated Investing$/, '').trim();
      currentAccount = friendlyName;
      debugLog('🏦 Found automated investing account:', currentAccount);
      inTransactionSection = false;
      awaitingTransactions = false;
    }
    // Handle Self-Directed Investing accounts
    else if (lineText === 'Self-Directed Investing' || lineText.endsWith('Self-Directed Investing')) {
      currentAccount = lineText.trim();
      debugLog('🏦 Found self-directed investing account:', currentAccount);
      inTransactionSection = false;
      awaitingTransactions = false;
    }
    
    // Look for TRADES section marker
    else if (lineText === 'TRADES') {
      debugLog('📊 Entering TRADES section for account:', currentAccount);
      inTransactionSection = true;
      awaitingTransactions = false;
    }
    
    // Look for transaction header (but don't change account!)
    else if (inTransactionSection && lineText.includes('Ticker') && lineText.includes('Type') && lineText.includes('Price') && lineText.includes('Shares') && lineText.includes('Value')) {
      debugLog('📋 Found transaction header, ready for transactions');
      awaitingTransactions = true;
    }
    
    // Parse transaction lines
    else if (awaitingTransactions && currentAccount) {
      debugLog(`🔍 Trying to parse transaction line: "${lineText}"`);
      
      // Stop if we hit POSITION TRANSFERS or other section markers
      if (lineText === 'POSITION TRANSFERS' || lineText === 'No activity' || lineText.startsWith('Account #')) {
        debugLog('🚫 End of transactions section:', lineText);
        awaitingTransactions = false;
        inTransactionSection = false;
        return;
      }
      
      // Parse transaction: "GBIL   Buy   $100.25   0.258480   $25.91"
      const transactionMatch = lineText.match(/^([A-Z]{2,5})\s+(Buy|Sell)\s+\$(\S+)\s+(\S+)\s+\$(\S+)$/);
      if (transactionMatch) {
        const [, ticker, action, price, shares, value] = transactionMatch;
        debugLog('✅ Matched transaction pattern:', transactionMatch);
        
        transactions.push({
          account: currentAccount,
          date: reportDate,
          description: action,
          ticker: ticker,
          price: parseFloat(price.replace(/,/g, '')),
          quantity: parseFloat(shares.replace(/,/g, '')),
          amount: parseFloat(value.replace(/,/g, ''))
        });
        
        debugLog('📊 Added transaction:', ticker, action, '$' + value, 'for', currentAccount);
      } else {
        debugLog('❌ Line did not match transaction pattern');
      }
    }
  });
  
  debugLog('✅ Parsed', transactions.length, 'transactions across', new Set(transactions.map(t => t.account)).size, 'accounts');
  return { transactions, reportDate };
}

// Convert to CSV
function transactionsToCsv(transactions) {
  debugLog('📊 Converting transactions to CSV:', transactions.length, 'items');
  
  const headers = ['Account', 'Date', 'Transaction_Type', 'Ticker', 'Price', 'Shares', 'Value'];
  const rows = transactions.map((t, index) => {
    debugLog(`📊 Processing transaction ${index}:`, {
      account: t.account,
      date: t.date,
      dateType: typeof t.date,
      dateString: t.date ? t.date.toLocaleDateString('en-US') : 'INVALID DATE',
      description: t.description,
      ticker: t.ticker,
      amount: t.amount
    });
    
    return [
      t.account,
      t.date ? t.date.toLocaleDateString('en-US') : 'INVALID DATE',
      t.description, // Use description property
      t.ticker,      // Use ticker property
      t.price.toFixed(2),
      t.quantity.toFixed(6), // Use quantity property
      t.amount.toFixed(2)    // Use amount property
    ];
  });
  
  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');
  
  debugLog('📊 Generated CSV content length:', csvContent.length);
  debugLog('📊 First few lines of CSV:', csvContent.split('\n').slice(0, 3));
  
  return csvContent;
}

// Helper function to load all activities by clicking "Load more" button repeatedly
async function loadAllActivities() {
  debugLog('📋 Loading all activities...');
  let clickCount = 0;
  const maxClicks = 100; // Safety limit
  
  while (clickCount < maxClicks) {
    // Look for the "Load more" button
    const buttons = Array.from(document.querySelectorAll('button[data-samba-component="true"]'));
    const loadMoreButton = buttons.find(btn => btn.textContent?.trim() === 'Load more');
    
    if (loadMoreButton && loadMoreButton.offsetParent !== null) { // Check if visible
      debugLog(`📋 Clicking "Load more" button (click ${clickCount + 1})...`);
      loadMoreButton.click();
      clickCount++;
      
      // Wait for new content to load
      await new Promise(resolve => setTimeout(resolve, 500));
    } else {
      debugLog(`📋 No more "Load more" button found. Total clicks: ${clickCount}`);
      break;
    }
  }
  
  if (clickCount >= maxClicks) {
    debugLog(`⚠️ Reached maximum "Load more" clicks (${maxClicks}). Proceeding with available activities.`);
  }
  
  // Wait a bit more for final content to settle
  await new Promise(resolve => setTimeout(resolve, 500));
  debugLog('✅ All activities loaded');
}

// Unified activity parsing - processes all activity rows sequentially
function parseAllBettermentActivities() {
  return new Promise(async (resolve) => {
    debugLog('🎯 Starting unified activity parsing...');
    
    // First, load all activities
    await loadAllActivities();
    
    const allTransactions = [];
    
    // Get all activity rows
    const activityRows = Array.from(document.querySelectorAll('[data-testid="activity-row"]'));
    debugLog(`🎯 Found ${activityRows.length} total activity rows to process`);
    
    let currentRowIndex = 0;
    
    function processNextRow() {
      if (currentRowIndex >= activityRows.length) {
        debugLog(`✅ All ${activityRows.length} activity rows processed. Total transactions: ${allTransactions.length}`);
        resolve(allTransactions);
        return;
      }
      
      const row = activityRows[currentRowIndex];
      const rowText = row.textContent?.toLowerCase() || '';
      
      debugLog(`\n🎯 ===== Processing row ${currentRowIndex + 1}/${activityRows.length} =====`);
      debugLog(`🎯 Row preview: "${rowText.substring(0, 80)}..."`);
      
      // Determine activity type
      let activityType = 'unknown';
      if (rowText.includes('dividend payment')) {
        activityType = 'dividend';
      } else if (rowText.includes('trading activity')) {
        activityType = 'trading';
      } else if (rowText.includes('advisory fee')) {
        activityType = 'advisory-fee';
      } else {
        debugLog(`⚠️ Unknown activity type, skipping row ${currentRowIndex + 1}`);
        currentRowIndex++;
        processNextRow();
        return;
      }
      
      debugLog(`🎯 Activity type: ${activityType}`);
      
      // Extract common data (date and account)
      let activityDate = new Date();
      let account = 'Investment Account';
      
      // Extract date
      const dateSpans = row.querySelectorAll('span.bmt-textStyle_text100, span.bmt-textStyle_text50');
      for (const span of dateSpans) {
        const text = span.textContent?.trim() || '';
        const dateMatch = text.match(/^([A-Z][a-z]{2})\s+(\d{1,2}),\s+(\d{4})$/);
        
        if (dateMatch) {
          const monthMap = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
          const month = monthMap[dateMatch[1]];
          const day = parseInt(dateMatch[2]);
          const year = parseInt(dateMatch[3]);
          activityDate = new Date(year, month, day);
          debugLog(`📅 Extracted date: ${text} → ${activityDate.toDateString()}`);
          break;
        }
      }
      
      // Extract account
      const goalDiv = row.querySelector('.bmt-grid-area_goal');
      if (goalDiv) {
        const accountSpan = goalDiv.querySelector('span.bmt-textStyle_text100');
        if (accountSpan) {
          account = accountSpan.textContent?.trim() || 'Investment Account';
          debugLog(`🏦 Extracted account: "${account}"`);
        }
      }
      
      // Expand the row
      debugLog(`🎯 Expanding row ${currentRowIndex + 1}...`);
      const clickEvent = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true
      });
      row.dispatchEvent(clickEvent);
      
      // Wait for expansion and parse based on type
      if (activityType === 'dividend') {
        waitForDividendExpansion(activityDate, account);
      } else if (activityType === 'trading') {
        waitForTradingExpansion(activityDate, account);
      } else if (activityType === 'advisory-fee') {
        waitForAdvisoryFeeExpansion(activityDate, account);
      }
    }
    
    function waitForDividendExpansion(date, account) {
      const detailDivs = document.querySelectorAll('div[data-samba-component="true"].bmt-d_flex.bmt-flex-d_row.bmt-jc_space-between');
      
      if (detailDivs.length > 1) {
        debugLog(`💰 Dividend expansion complete! Found ${detailDivs.length} detail divs`);
        
        detailDivs.forEach((div, idx) => {
          const spans = div.querySelectorAll('span');
          if (spans.length >= 2) {
            const tickerText = spans[0].textContent?.trim() || '';
            const amountText = spans[1].textContent?.trim() || '';
            
            // Extract just the ticker symbol (e.g., "VTI" from "VTI • Vanguard Total Stock Market ETF")
            const tickerMatch = tickerText.match(/^([A-Z]{2,5})\s*•/);
            if (!tickerMatch) return;
            
            const ticker = tickerMatch[1];
            const amount = parseFloat(amountText.replace(/[$,]/g, ''));
            
            if (ticker && !isNaN(amount)) {
              const existingTransaction = allTransactions.find(t =>
                t.ticker === ticker &&
                t.amount === amount &&
                t.date.toDateString() === date.toDateString()
              );
              
              if (!existingTransaction) {
                allTransactions.push({
                  account: account,
                  date: date,
                  description: 'Dividend',
                  ticker: ticker,
                  price: 0,
                  quantity: 0,
                  amount: amount
                });
                debugLog(`💰 Added dividend: ${ticker} = $${amount}`);
              }
            }
          }
        });
        
        closeAndMoveToNext();
      } else {
        debugLog(`⏳ Waiting for dividend expansion...`);
        setTimeout(() => waitForDividendExpansion(date, account), 100);
      }
    }
    
    function waitForTradingExpansion(date, account) {
      const expandedSections = document.querySelectorAll('div.bmt-py_space\\.200.bmt-d_flex.bmt-flex-d_column.bmt-gap_space\\.300');
      
      let foundDetails = false;
      let processedSections = 0;
      
      for (const section of expandedSections) {
        const detailContainer = section.querySelector('div.bmt-bg-c_background\\.overlay\\.weak');
        if (!detailContainer) continue;
        
        foundDetails = true;
        processedSections++;
        
        // Determine transaction type from section header
        let sectionType = 'Trade';
        const leadingContent = section.querySelector('.bmt-grid-area_leading-content span.bmt-textStyle_text100');
        if (leadingContent) {
          const typeText = leadingContent.textContent?.trim().toLowerCase() || '';
          
          if (typeText.includes('sales') || typeText.includes('sell')) {
            sectionType = 'Sell';
          } else if (typeText.includes('purchases') || typeText.includes('buy')) {
            sectionType = 'Buy';
          } else if (typeText.includes('reinvest')) {
            sectionType = 'Reinvest';
          } else if (typeText.includes('rebalance')) {
            sectionType = 'Rebalance';
          }
        }
        
        // Get all stock blocks
        const stockBlocks = detailContainer.querySelectorAll('div.bmt-d_flex.bmt-flex-d_column.bmt-gap_space\\.100');
        
        stockBlocks.forEach((block) => {
          const tickerSpan = block.querySelector('span.bmt-textStyle_text100.bmt-c_text\\.weak');
          if (!tickerSpan) return;
          
          const tickerText = tickerSpan.textContent?.trim() || '';
          const tickerMatch = tickerText.match(/^([A-Z]{2,5})\s*•/);
          if (!tickerMatch) return;
          
          const ticker = tickerMatch[1];
          let amount = 0;
          let quantity = 0;
          let price = 0;
          
          const detailRows = block.querySelectorAll('div.bmt-d_flex.bmt-jc_space-between');
          detailRows.forEach(row => {
            const spans = row.querySelectorAll('span');
            if (spans.length >= 2) {
              const label = spans[0].textContent?.trim().toLowerCase() || '';
              const value = spans[1].textContent?.trim() || '';
              
              if (label === 'amount') {
                amount = parseFloat(value.replace(/[$,]/g, ''));
              } else if (label === 'shares') {
                quantity = parseFloat(value.replace(/[$,]/g, ''));
              } else if (label === 'share price') {
                price = parseFloat(value.replace(/[$,]/g, ''));
              }
            }
          });
          
          const existingTransaction = allTransactions.find(t =>
            t.ticker === ticker &&
            t.amount === amount &&
            t.description === sectionType &&
            t.date.toDateString() === date.toDateString()
          );
          
          if (!existingTransaction) {
            allTransactions.push({
              account: account,
              date: date,
              description: sectionType,
              ticker: ticker,
              price: price,
              quantity: quantity,
              amount: amount
            });
            debugLog(`📈 Added: ${sectionType} ${ticker} = ${quantity} shares @ $${price}`);
          }
        });
      }
      
      if (foundDetails) {
        debugLog(`📈 Trading expansion complete! Processed ${processedSections} sections`);
        closeAndMoveToNext();
      } else {
        debugLog(`⏳ Waiting for trading expansion...`);
        setTimeout(() => waitForTradingExpansion(date, account), 100);
      }
    }
    
    function waitForAdvisoryFeeExpansion(date, account) {
      const gridDivs = document.querySelectorAll('div.bmt-d_grid');
      
      let feeFound = false;
      for (const gridDiv of gridDivs) {
        const leadingContent = gridDiv.querySelector('.bmt-grid-area_leading-content span');
        const trailingContent = gridDiv.querySelector('.bmt-grid-area_trailing-content span');
        
        if (leadingContent?.textContent?.trim() === 'Amount' && trailingContent) {
          const amountText = trailingContent.textContent?.trim() || '';
          let amount = parseFloat(amountText.replace(/[$,]/g, ''));
          
          if (amount > 0) {
            amount = -amount;
          }
          
          const existingTransaction = allTransactions.find(t =>
            t.description === 'Advisory Fee' &&
            t.amount === amount &&
            t.date.toDateString() === date.toDateString()
          );
          
          if (!existingTransaction) {
            allTransactions.push({
              account: account,
              date: date,
              description: 'Advisory Fee',
              ticker: '',
              price: 0,
              quantity: 0,
              amount: amount
            });
            debugLog(`💵 Added advisory fee: $${amount}`);
          }
          
          feeFound = true;
          break;
        }
      }
      
      if (feeFound) {
        closeAndMoveToNext();
      } else {
        debugLog(`⏳ Waiting for advisory fee expansion...`);
        setTimeout(() => waitForAdvisoryFeeExpansion(date, account), 100);
      }
    }
    
    function closeAndMoveToNext() {
      debugLog(`🔍 Looking for Close button...`);
      
      const closeButtons = Array.from(document.querySelectorAll('button[data-samba-component="true"]'));
      const closeButton = closeButtons.find(btn => btn.textContent?.trim() === 'Close');
      
      if (closeButton) {
        debugLog(`✅ Clicking Close button...`);
        closeButton.click();
        
        // Wait for details to disappear
        const waitForClose = () => {
          const expandedSections = document.querySelectorAll('div.bmt-py_space\\.200.bmt-d_flex.bmt-flex-d_column.bmt-gap_space\\.300');
          const detailDivs = document.querySelectorAll('div[data-samba-component="true"].bmt-d_flex.bmt-flex-d_row.bmt-jc_space-between');
          const gridDivs = document.querySelectorAll('div.bmt-d_grid');
          
          let stillHasDetails = false;
          
          // Check for trading details
          for (const section of expandedSections) {
            if (section.querySelector('div.bmt-bg-c_background\\.overlay\\.weak')) {
              stillHasDetails = true;
              break;
            }
          }
          
          // Check for dividend details (more than 1 means details are present)
          if (detailDivs.length > 1) {
            stillHasDetails = true;
          }
          
          // Check for advisory fee details
          for (const gridDiv of gridDivs) {
            const leadingContent = gridDiv.querySelector('.bmt-grid-area_leading-content span');
            if (leadingContent?.textContent?.trim() === 'Amount') {
              stillHasDetails = true;
              break;
            }
          }
          
          if (!stillHasDetails) {
            debugLog(`✅ Row ${currentRowIndex + 1} closed`);
            currentRowIndex++;
            setTimeout(() => processNextRow(), 100);
          } else {
            debugLog(`⏳ Waiting for close...`);
            setTimeout(waitForClose, 100);
          }
        };
        
        setTimeout(waitForClose, 100);
      } else {
        debugLog(`⚠️ No Close button found, moving to next row`);
        currentRowIndex++;
        setTimeout(() => processNextRow(), 100);
      }
    }
    
    // Start processing
    processNextRow();
  });
}

// Helper function to load all activities by clicking "Load more" button repeatedly (DEPRECATED - kept for compatibility)
async function loadAllActivitiesOld() {
  debugLog('📋 Loading all activities...');
  let clickCount = 0;
  const maxClicks = 100; // Safety limit
  
  while (clickCount < maxClicks) {
    // Look for the "Load more" button
    const buttons = Array.from(document.querySelectorAll('button[data-samba-component="true"]'));
    const loadMoreButton = buttons.find(btn => btn.textContent?.trim() === 'Load more');
    
    if (loadMoreButton && loadMoreButton.offsetParent !== null) { // Check if visible
      debugLog(`📋 Clicking "Load more" button (click ${clickCount + 1})...`);
      loadMoreButton.click();
      clickCount++;
      
      // Wait for new content to load
      await new Promise(resolve => setTimeout(resolve, 500));
    } else {
      debugLog(`📋 No more "Load more" button found. Total clicks: ${clickCount}`);
      break;
    }
  }
  
  if (clickCount >= maxClicks) {
    debugLog(`⚠️ Reached maximum "Load more" clicks (${maxClicks}). Proceeding with available activities.`);
  }
  
  // Wait a bit more for final content to settle
  await new Promise(resolve => setTimeout(resolve, 500));
  debugLog('✅ All activities loaded');
}

// NOTE: Old parsing functions removed - now using unified parseAllBettermentActivities() instead
// Previously had: parseBettermentDividends(), parseBettermentTradingActivity(), parseExistingDividends()

// Check if current page is activity page vs PDF page  
function isActivityPage() {
  return window.location.pathname === '/app/activity';
}

function isPdfPage() {
  return document.querySelector('canvas[data-page-number]') !== null;
}

// Add download functionality to activity pages
function addDownloadLink() {
  debugLog('📊 Adding download functionality...');
  
  // Check if link already exists to prevent duplicates
  if (downloadLinkAdded || document.querySelector('a[data-betterment-csv-link="true"]')) {
    debugLog('📊 Download link already exists, skipping...');
    return;
  }
  
  // Find a good place to add the download link
  const headerElements = document.querySelectorAll('h1, h2, .page-title, [data-testid*="title"]');
  debugLog('📊 Found', headerElements.length, 'header elements');
  
  if (headerElements.length > 0) {
    debugLog('📊 First header element:', headerElements[0]);
    debugLog('📊 First header text:', headerElements[0].textContent);
    
    // Add all transactions button
    const tradingLink = document.createElement('a');
    tradingLink.textContent = ' [Download Listed Transactions to CSV]';
    tradingLink.href = '#';
    tradingLink.style.cssText = 'color: blue; font-weight: bold; margin-left: 10px; text-decoration: none; padding: 4px 8px; background-color: #e8f0ff; border-radius: 4px; cursor: pointer; font-size: 12px;';
    tradingLink.setAttribute('data-betterment-csv-link', 'true'); // Mark as our link
    
    debugLog('📊 Created download link element');
    
    tradingLink.onclick = async function(e) {
      e.preventDefault();
      tradingLink.textContent = ' [Processing...]';
      tradingLink.style.color = 'orange';
      
      // Use the unified activity parser
      debugLog('📊 Starting unified activity parsing...');
      const allTransactions = await parseAllBettermentActivities();
      debugLog(`📊 Parsing complete. Total transactions: ${allTransactions.length}`);
      
      // Sort by date (oldest first)
      allTransactions.sort((a, b) => a.date - b.date);
      
      debugLog('📊 Transactions breakdown:');
      allTransactions.forEach((t, i) => {
        debugLog(`  ${i + 1}. ${t.description} ${t.ticker || 'N/A'} - $${t.amount} on ${t.date.toLocaleDateString()}`);
      });
      
      const csvContent = transactionsToCsv(allTransactions);
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const downloadUrl = URL.createObjectURL(blob);
      
      const downloadLink = document.createElement('a');
      downloadLink.href = downloadUrl;
      const dateStr = new Date().toISOString().split('T')[0];
      downloadLink.download = `betterment_transactions_${dateStr}.csv`;
      
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      tradingLink.textContent = ' [Download Listed Transactions to CSV]';
      tradingLink.style.color = 'blue';
    };
    
    try {
      headerElements[0].appendChild(tradingLink);
      downloadLinkAdded = true; // Set flag after successful addition
      debugLog('📊 Download link successfully appended to header');
      debugLog('📊 Link parent:', tradingLink.parentNode);
    } catch (error) {
      console.error('❌ Error appending download link:', error);
    }
  } else {
    debugLog('⚠️ No header elements found to attach download link');
  }
}


// Wait for PDF.js to load, then initialize
function initializeWhenReady() {
  // Check if we're on the activity page
  if (isActivityPage()) {
    debugLog('🎯 Activity page detected - waiting for activity list to load...');
    
    let attempts = 0;
    const maxAttempts = 40; // 20 seconds max (40 * 500ms)
    
    // Wait for activity rows to appear before adding the download link
    const waitForActivityList = () => {
      attempts++;
      
      const activityRows = document.querySelectorAll('[data-testid="activity-row"]');
      const separators = document.querySelectorAll('[data-orientation="horizontal"][role="separator"]');
      const headerElements = document.querySelectorAll('h1, h2, .page-title, [data-testid*="title"]');
      
      // Check if the activity list structure is present (rows with separators indicate fully rendered list)
      if (activityRows.length > 0 && separators.length > 0 && headerElements.length > 0) {
        debugLog('✅ Activity list fully loaded with', activityRows.length, 'rows');
        addDownloadLink();
      } else if (attempts >= maxAttempts) {
        debugLog('⚠️ Timeout waiting for activity list, attempting to add button anyway...');
        addDownloadLink();
      } else {
        debugLog('⏳ Waiting for activity list... (rows:', activityRows.length, 'separators:', separators.length, 'headers:', headerElements.length, ')');
        setTimeout(waitForActivityList, 500);
      }
    };
    
    // Start checking after a brief delay
    setTimeout(waitForActivityList, 500);
    return;
  }
  
  // Continue with PDF processing for other pages
  if (typeof window !== 'undefined' && window.pdfjsLib) {
    debugLog('✅ PDF.js is ready, initializing...');
    
    // Configure worker
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('pdf.worker.js');
    
    setTimeout(function() {
      debugLog('⏰ Starting PDF processing after 5 second delay...');
      
      const allAnchors = Array.from(document.querySelectorAll('a[href]'));
      debugLog('🔍 Found', allAnchors.length, 'total anchors');
      
      const transactionPdfRe = new RegExp('app/quarterly_statements/\\d+|app/legacy_quarterly_statements/\\d+|app/transaction_documents/\\d+|app/activity_reports/[0-9a-f-]+');
      const pdfAnchors = allAnchors.filter(a => transactionPdfRe.test(a.href));
      
      debugLog('📄 Found', pdfAnchors.length, 'PDF anchors');
      
      if (pdfAnchors.length > 0) {
        pdfAnchors.forEach(function(anchor) {
          const csvLink = document.createElement('a');
          csvLink.textContent = ' [Download CSV]';
          csvLink.href = '#';
          csvLink.style.cssText = 'color: green; font-weight: bold; margin-left: 10px; text-decoration: none; padding: 2px 6px; background-color: #e8f5e8; border-radius: 3px; cursor: pointer;';
          
          csvLink.onclick = async function(e) {
            e.preventDefault();
            
            debugLog('🔄 Processing PDF with PDF.js:', anchor.href);
            csvLink.textContent = ' [Processing...]';
            csvLink.style.color = 'orange';
            
            try {
              const textArray = await pdfToTextArray(anchor.href);
              const { transactions, reportDate } = parseBettermentTransactions(textArray);
              
              let csvContent;
              if (transactions.length === 0) {
                console.warn('⚠️ No transactions found in PDF');
                csvContent = 'Account,Date,Transaction,Portfolio/Fund,Price,Shares,Value\\n';
              } else {
                csvContent = transactionsToCsv(transactions);
              }
              
              const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
              const downloadUrl = URL.createObjectURL(blob);
              
              const downloadLink = document.createElement('a');
              downloadLink.href = downloadUrl;
              // Use reportDate from PDF instead of current date
              const dateStr = reportDate.toISOString().split('T')[0];
              downloadLink.download = `betterment_transactions_${dateStr}.csv`;
              
              document.body.appendChild(downloadLink);
              downloadLink.click();
              document.body.removeChild(downloadLink);
              
              debugLog('✅ CSV download completed with', transactions.length, 'transactions!');
              csvLink.textContent = ' [Download CSV]';
              csvLink.style.color = 'green';
              
            } catch (error) {
              console.error('❌ Error processing PDF:', error);
              csvLink.textContent = ' [Error - Try Again]';
              csvLink.style.color = 'red';
              
              setTimeout(() => {
                csvLink.textContent = ' [Download CSV]';
                csvLink.style.color = 'green';
              }, 3000);
            }
          };
          
          if (anchor.parentNode) {
            anchor.parentNode.insertBefore(csvLink, anchor.nextSibling);
          }
        });
        
        debugLog('✅ PDF.js CSV processing links added!');
      }
    }, 5000);
    
  } else {
    debugLog('⏳ PDF.js not ready yet, waiting...');
    setTimeout(initializeWhenReady, 1000);
  }
}

// Watch for URL changes (SPA navigation)
let lastUrl = location.href;
let downloadLinkAdded = false;

function checkForUrlChange() {
  const currentUrl = location.href;
  if (currentUrl !== lastUrl) {
    debugLog('🔄 URL changed from', lastUrl, 'to', currentUrl);
    lastUrl = currentUrl;
    downloadLinkAdded = false; // Reset flag on navigation
    
    // Re-initialize if we're now on the activity page
    if (isActivityPage()) {
      debugLog('🎯 Navigated to activity page - initializing...');
      initializeWhenReady();
    }
  }
}

// Check for URL changes every 500ms
setInterval(checkForUrlChange, 500);

// Also listen for browser navigation events
window.addEventListener('popstate', () => {
  debugLog('🔄 Browser navigation detected');
  downloadLinkAdded = false;
  checkForUrlChange();
});

// Start initialization
initializeWhenReady();
debugLog('🏁 PDF.js extension initialization started');