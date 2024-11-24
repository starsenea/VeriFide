# VeriFide - AI-Powered Fact Checking for Google Docs

VeriFide is a Chrome extension that uses AI to fact-check content in Google Docs, providing real-time corrections for factual inaccuracies while respecting subjective statements.

## Contact

#### Ethan Zhang
- Email: zhangethan@icloud.com | zhan5173@purdue.edu
- LinkedIn: [Ethan Zhang](https://www.linkedin.com/in/ez24/)

#### Rishi Padhye
- Email: rishipadhye@gmail.com | rpadhye@purdue.edu
- LinkedIn: [Rishi Padhye](https://www.linkedin.com/in/rpadhye/)

## Features
- Real-time fact checking of Google Docs content
- Distinguishes between subjective opinions and objective claims
- Secure OAuth authentication
- Clean, minimal UI with notifications

## Installation

1. Clone this repository
2. Get your Google OAuth Client ID:
   - Create project at [Google Cloud Console](https://console.cloud.google.com/)
   - Enable Google Docs API
   - Create OAuth 2.0 credentials
   - Add `chrome-extension://` to authorized origins
3. Replace `client_id` in `manifest.json`
4. Load in Chrome:
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select extension directory

## Usage
1. Open a Google Doc
2. Click the VeriFide extension icon
3. Click "Fact-Check Current Document"
4. Review corrections in the notifications

## Technical Overview
- `manifest.json` - Configuration
- `background.js` - AI processing
- `contentScript.js` - Document interaction
- `popup/` - UI files
- Uses Google OAuth 2.0 and Chrome's AI capabilities

## Privacy & Security
- Access only when requested
- No permanent data storage
- Secure AI processing
- OAuth token management by Chrome

## Contributing
1. Fork repository
2. Create feature branch
3. Submit Pull Request

## License
GNU GENERAL PUBLIC LICENSE |Version 3, 29 June 2007

Note: Keep your OAuth client ID private and don't commit it to git. 