# VeriFide - AI-Powered Fact Checking for Google Docs

VeriFide is a Chrome extension that uses AI to fact-check content in Google Docs, providing real-time corrections for factual inaccuracies while respecting subjective statements.

## Features

- Real-time fact checking of Google Docs content
- Distinguishes between subjective opinions and objective claims
- Secure OAuth authentication with Google Docs
- Clean, minimal UI with Bulma CSS framework
- Popup notifications for corrections and errors

## Installation

### For Users
1. Clone this repository
2. Get your own Google OAuth Client ID:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project
   - Enable the Google Docs API
   - Create OAuth 2.0 credentials
   - Add `chrome-extension://` to authorized origins
3. Replace the `client_id` in `manifest.json` with your own
4. Load the extension in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the extension directory

### For Developers
1. Clone the repository
2. Install dependencies (if any)
3. Follow the same steps as users to set up OAuth credentials
4. Make sure to never commit your personal client ID

## Usage

1. Open a Google Doc
2. Click the VeriFide extension icon
3. Click "Fact-Check Current Document"
4. Review the analysis results in the popup
5. Corrections will appear as notifications in the document

## Technical Details

### Files Structure
- `manifest.json` - Extension configuration
- `background.js` - Handles AI processing and background tasks
- `contentScript.js` - Manages document interaction and notifications
- `popup/` - Contains the extension UI files
  - `popup.html` - Main interface
  - `popup.js` - UI logic
  - `bulma.min.css` - Styling

### Authentication
The extension uses Google OAuth 2.0 for authentication. You'll need to:
1. Create your own OAuth 2.0 client ID
2. Enable Google Docs API access
3. Configure proper scopes in manifest.json

### AI Integration
- Uses Chrome's built-in AI capabilities
- Implements a two-stage analysis:
  1. Subjective/Objective classification
  2. Fact checking for objective statements

## Privacy & Security

- The extension only accesses Google Docs content when explicitly requested
- No data is stored permanently
- All processing happens through Chrome's secure AI implementation
- OAuth tokens are managed securely by Chrome

## Development

### Setting Up Dev Environment
1. Clone the repository
2. Create your OAuth credentials
3. Update `manifest.json` with your client ID
4. Load the unpacked extension in Chrome

### Building for Production
1. Ensure all credentials are properly configured
2. Test thoroughly in development environment
3. Package the extension for Chrome Web Store submission

## Troubleshooting

Common issues and solutions:
- **Authentication Errors**: Verify your OAuth credentials and permissions
- **Extension Not Loading**: Check manifest.json configuration
- **No Response**: Ensure you're on a Google Docs page
- **API Errors**: Verify Google Docs API is enabled in your project

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

[Add your chosen license here]

## Contact

[Add your contact information here]

## Setup for Developers
1. Clone the repository
2. Get your own Google OAuth Client ID:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project
   - Enable the Google Docs API
   - Create OAuth 2.0 credentials
   - Add `chrome-extension://` to authorized origins
3. Replace the `client_id` in `manifest.json` with your own
4. Load the extension in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the extension directory

Note: Changes to your local `manifest.json` won't be tracked by git, so your client ID will remain private. 