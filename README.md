# VeriFide

A Chrome extension that provides real-time fact-checking for Google Docs using AI.

## Features

- Real-time fact checking of document content
- Non-intrusive UI that integrates with Google Docs
- Privacy-focused with local processing
- Easy toggle on/off functionality

## Installation

1. Clone this repository
2. Follow instructions to download the Prompt API from the given documentation. (https://developer.chrome.com/docs/extensions/ai/prompt-api)
3. Navigate to console.cloud.google.com .
4. Create a new project.
5. Navigate to API's and Services, and enable Google Docs API.
6. Navigate to OAuth consent screen.
7. Fill out the App information and Developer contact information. (It does not matter what you put here)
9. Open Chrome Canary and navigate to `chrome://extensions`
10. Enable "Developer mode" in the top right.
11. Click "Load unpacked" and select the project directory.
12. Next, navigate to credentials and create an OAuth Client ID.
13. Set application type to Chrome extension.
14. From the extensions page, copy the ID and paste into the Item ID field.
15. Create the Client ID and copy it
16. Navigate to manifest.json in the cloned repository and paste your Client ID where it says PASTE_CLIENT_ID_HERE
17. Next head back to chrome://extensions and reload the extension (there may be an error but this does not affect the model)
18. Next head to a google doc, find the extension popup in the chrome menu bar.
19. Enable the switch, and you should see a VeriFide button in the Google Docs Menu Bar.
20. Type on the document and watch the magic happen.
    

## Usage

1. Open any Google Doc
2. Click the VeriFide extension icon
3. Toggle the extension on
4. Click the "VeriFide" button in your Google Docs toolbar to fact-check the document

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. 
