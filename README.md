# VeriFide

A Chrome extension that provides real-time fact-checking for Google Docs using AI.

## Features

- Real-time fact checking of document content
- Non-intrusive UI that integrates with Google Docs
- Privacy-focused with local processing
- Easy toggle on/off functionality

## Installation

### Prerequisites
1. Clone this repository
2. Install the Prompt API ([documentation](https://developer.chrome.com/docs/extensions/ai/prompt-api))

### Google Cloud Setup
3. Go to [Google Cloud Console](https://console.cloud.google.com)
4. Create a new project
5. Under "APIs and Services":
   - Enable Google Docs API
   - Navigate to OAuth consent screen
   - Fill out App information and Developer contact information (content doesn't matter)

### Chrome Extension Setup
6. Open Chrome Canary and go to `chrome://extensions`
7. Enable "Developer mode" (top right)
8. Click "Load unpacked" and select the project directory
9. Set up OAuth credentials:
   - Navigate to credentials page
   - Create new OAuth Client ID
   - Set application type to "Chrome extension"
   - Copy your extension ID from the extensions page
   - Paste it into the Item ID field
   - Create and copy the Client ID
10. Update the repository:
    - Open manifest.json
    - Replace `PASTE_CLIENT_ID_HERE` with your Client ID
    - Return to `chrome://extensions` and reload the extension
    - (Note: Any errors at this stage won't affect the model)

### Final Steps
11. Open a Google Doc
12. Locate the extension popup in the Chrome menu bar
13. Enable the switch
14. Look for the VeriFide button in the Google Docs Menu Bar
15. Start typing to see the fact-checking in action!

## Usage

1. Open any Google Doc
2. Click the VeriFide extension icon
3. Toggle the extension on
4. Click the "VeriFide" button in your Google Docs toolbar to fact-check the document

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. 
