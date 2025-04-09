# YouTube Live Chat Translator

A Chrome extension that automatically translates YouTube live chat messages using Azure Translator API.

## Features

- Automatically detects and translates YouTube live chat messages
- Supports translation between multiple languages
- Smart detection to avoid translating messages that are already in the target language
- Tracks usage to stay within Azure Translator free tier limits (2M characters/month)
- Uses rate limiting to comply with API restrictions

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- Azure Translator API key (free tier available)

### Getting an Azure Translator API Key

1. Sign up for an Azure account if you don't have one
2. Create a Translator resource in the Azure portal
3. Get your API key and region from the Azure portal

### Installation

1. Clone this repository
   ```
   git clone https://github.com/yourusername/yt-translator.git
   cd yt-translator
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Build the extension
   ```
   npm run package
   ```

4. Load the extension in Chrome
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `dist` folder from this project

5. Configure the extension
   - Click on the extension icon in Chrome
   - Go to options (gear icon)
   - Enter your Azure Translator API key and region
   - Select your target language

## Usage

1. Go to any YouTube live stream with a chat
2. The extension will automatically detect and translate messages
3. Translations appear below the original messages in a subtle gray color
4. Use the extension popup to change the target language or disable translation

## Development

### Project Structure

```
src/
├── app/               # Next.js app pages for development use
│   └── pages/         # Extension pages for development use
├── background.ts      # Extension background script
└── content.ts         # Content script injected into YouTube
public/
├── manifest.json      # Extension manifest
├── popup.js           # Popup script
├── options.js         # Options page script
├── simple-popup.html  # Extension popup UI
└── simple-options.html # Extension options page
```

### Build Commands

- `npm run build:content` - Build the content script
- `npm run build:background` - Build the background script
- `npm run build:extension` - Build the extension scripts
- `npm run package` - Package the extension for distribution

## Limitations

- Free tier of Azure Translator API is limited to 2 million characters per month
- Translation requests are rate-limited to 5 per second

## License

MIT
