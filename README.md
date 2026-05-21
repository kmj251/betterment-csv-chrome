# Betterment Transaction Exporter

**_This extension is not affiliated with Betterment in any way._**

Betterment is a wonderful brokerage service, but doesn't provide ticker-level transaction data for easy export. This extension provides two ways to extract your transaction data:

1. **Live Activity Page Parsing** - Directly exports transactions from the Activity page including dividends, trading activity, and advisory fees
2. **PDF Parsing** - Extracts transaction data from quarterly statement PDFs

All processing happens entirely in your browser using PDF.js - **no data leaves your computer**.

## Features

- **Live Activity Export** - Download all visible transactions from the Activity page as CSV
- **PDF Processing** - Extract transactions from quarterly statement PDFs
- **Comprehensive Data** - Captures dividends, trades, advisory fees, and more
- **CSV Format** - Easy to import into spreadsheet applications or tax software
- **Client-Side Only** - All processing happens in your browser
- **Privacy First** - No data is sent to external servers

## Installation

### From Source (Development)

1. Clone the repository:
```bash
git clone https://github.com/fcfort/betterment-csv-chrome.git
cd betterment-csv-chrome
```

2. Install dependencies:
```bash
npm install
```

3. Build the extension:
```bash
npm run build
```

4. Load in Chrome:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist/app/` folder

### Chrome Web Store
Coming soon!

## Usage

### Exporting from Activity Page

1. Navigate to the Betterment Activity page
2. Use the filter to show the transactions you want to export
3. Click the **[Download Listed Transactions to CSV]** button that appears at the top
4. Wait for processing to complete
5. CSV file will automatically download

The CSV includes: Account, Date, Transaction Type, Ticker, Price, Shares, and Value.

### Exporting from PDFs

1. Navigate to any Betterment page with quarterly statement PDFs
2. Click **[Download CSV]** next to any PDF link
3. The extension will process the PDF and download a CSV file

## Development

### Scripts

```bash
# Build for production (DEBUG=false)
npm run build

# Development build (DEBUG=true, same as build)
npm run dev

# Run tests
npm test

# Run archived legacy parser/converter tests
npm run test:legacy

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Clean build directory
npm run clean
```

### Project Structure

```
app/
├── content-script.js  # Main extension logic
├── manifest.json      # Chrome extension manifest
├── pdf.min.js         # PDF.js library
├── pdf.worker.js      # PDF.js worker
└── src/               # Legacy parser/converter compatibility shims

test/
├── activity-parser-test.js  # Maintained test suite run by npm test
└── legacy/                 # Archived legacy suites run by npm run test:legacy

dist/app/             # Built extension (production)
build.js              # Build script
```

### Test Matrix

- `npm test`: Supported modern suite for the current activity-page architecture.
- `npm run test:legacy`: Archived legacy parser/converter suites with compatibility shims under `app/src`.
- Legacy Karma specs are kept in `test/legacy/karma/` for reference and are not executed by Vitest.

### Debug Mode

The extension includes a debug mode that logs detailed information to the console. 

- **Development**: `DEBUG = true` in `app/content-script.js`
- **Production**: Automatically set to `false` when running `npm run build`

## How It Works

### Activity Page Parsing

The extension detects when you're on the Betterment Activity page and:

1. Waits for activity rows to load
2. Loads all activities by clicking "Load more" until all are visible
3. Sequentially expands each activity row
4. Extracts transaction details based on activity type:
   - **Dividends**: Ticker and amount
   - **Trading Activity**: Buys, sells, and reinvestments with ticker, price, shares
   - **Advisory Fees**: Fee amount
5. Closes each row before processing the next
6. Exports all data to CSV

### PDF Parsing

For PDFs, the extension:

1. Uses PDF.js to extract text content
2. Parses transaction patterns using regular expressions
3. Identifies tickers, dates, amounts, and transaction types
4. Exports structured data to CSV

## Architecture

- **SPA Navigation Detection**: Monitors URL changes to handle Betterment's single-page application
- **Sequential Processing**: Ensures only one activity row is expanded at a time to prevent UI conflicts
- **DOM Polling**: Waits for elements to appear/disappear to ensure reliable data extraction
- **Duplicate Prevention**: Tracks processed transactions to avoid duplicates

## Technologies

- **PDF.js** - Mozilla's PDF parsing library
- **Chrome Extension Manifest V3** - Latest Chrome extension standards
- **Vitest** - Modern testing framework
- **ESLint** - Code linting
- **Node.js** - Build system

## Browser Compatibility

- Chrome (recommended)
- Edge (Chromium-based)
- Brave
- Other Chromium-based browsers

## License

[Apache 2.0](https://opensource.org/licenses/Apache-2.0)
