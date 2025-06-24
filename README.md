# 🚀 Promptimizer

A browser extension that optimizes prompts for GPT-4o, Claude 3 Sonnet, Gemini 1.5, and o3-mini with one click. Get high-quality, model-specific prompt optimizations in seconds.

![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Features

- **🎯 Multi-Model Support**: Optimize for GPT-4o, Claude 3 Sonnet, Gemini 1.5, and o3-mini
- **⚡ Two-Tier Quality System**: Choose between Simple (fast) or Advanced (detailed) optimization
- **🔄 Real-time Streaming**: See results as they're generated
- **💾 Smart Caching**: Instant results for repeated prompts
- **🖱️ Context Menu Integration**: Right-click any text to optimize
- **📋 One-Click Copy**: Copy optimized prompts to clipboard instantly
- **🔒 Privacy-First**: Your API key is stored locally and securely

## 🛠️ Installation

### From Source

1. Clone this repository:
   ```bash
   git clone https://github.com/wilsonaustin10/promptimizer.git
   cd promptimizer/promptimizer-extension
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
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked"
   - Select the `dist` folder

## 🔧 Setup

1. Click the Promptimizer extension icon
2. Go to Settings (⚙️)
3. Enter your OpenAI API key
4. Save settings

## 💡 Usage

### From the Popup
1. Click the extension icon
2. Paste or type your prompt
3. Select target model and quality level
4. Click "✨ Optimize Prompt"
5. Copy the result with one click

### From Any Webpage
1. Select text on any webpage
2. Right-click and choose "Optimize this prompt"
3. The popup opens with your text ready to optimize

## 🎨 Model Options

| Model | Best For | Speed |
|-------|----------|-------|
| **o3-mini** | Complex reasoning tasks | 5-10s |
| **GPT-4o** | General optimization | 2-3s |
| **Claude 3** | Structured, ethical prompts | 1-2s |
| **Gemini 1.5** | Analytical prompts | 1-2s |

## 🔄 Quality Levels

- **⚡ Simple**: Fast optimization with essential improvements
- **🎯 Advanced**: Comprehensive optimization with detailed structure

## 🏗️ Architecture

```
promptimizer-extension/
├── src/
│   ├── popup/          # React-based popup UI
│   ├── background/     # Service worker for API calls
│   ├── content/        # Content script for text selection
│   └── options/        # Settings page
├── manifest.json       # Extension configuration
└── dist/              # Built extension files
```

## 🔌 API Support

Currently supports OpenAI API with models:
- o3-mini-2025-01-31
- gpt-4o-mini
- gpt-3.5-turbo-1106

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with React, TypeScript, and Vite
- Uses OpenAI's API for prompt optimization
- Inspired by the need for better prompt engineering tools

---

Made with ❤️ by [Austin Wilson](https://github.com/wilsonaustin10)