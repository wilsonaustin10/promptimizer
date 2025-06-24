# Promptimizer Browser Extension

A browser extension that optimizes prompts for GPT-4o, Claude 3 Sonnet, and Gemini 1.5 with one click.

## Features

- **One-click optimization** - Transform any prompt into an optimized version for your target LLM
- **Multiple LLM support** - Optimized for GPT-4o, Claude 3 Sonnet, and Gemini 1.5
- **Smart intent detection** - Automatically detects whether your prompt is for coding, analysis, or creative writing
- **Context menu integration** - Right-click any selected text to optimize it
- **Copy to clipboard** - Easily copy optimized prompts with one click

## Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   cd promptimizer-extension
   npm install
   ```
3. Build the extension:
   ```bash
   npm run build
   ```
4. Load the extension in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

## Setup

1. Click the extension icon and go to Settings
2. Enter your OpenAI API key
3. Configure your preferred default model

## Usage

### From the Popup
1. Click the extension icon
2. Paste or type your prompt
3. Select your target model
4. Click "Optimize Prompt"
5. Copy the optimized result

### From Context Menu
1. Select any text on a webpage
2. Right-click and choose "Optimize this prompt"
3. The popup will open with your text ready to optimize

## Development

```bash
# Run in development mode
npm run dev

# Build for production
npm run build

# Clean build folder
npm run clean
```

## Tech Stack

- React 18 with TypeScript
- Vite for fast builds
- Tailwind CSS for styling
- Chrome Extension Manifest V3
- OpenAI API for optimization

## Privacy

- Your API key is stored locally and securely
- No data is sent to any servers except OpenAI's API
- Selected text is only stored temporarily in local storage