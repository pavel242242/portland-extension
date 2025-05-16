# GroundNews Bias Checker Chrome Extension

## Overview

GroundNews Bias Checker is a Chrome extension that analyzes the bias and trustworthiness of news articles as you browse. It uses AI to assess various bias parameters and provides a clear, minimalist summary both in a popup and as an on-page widget. The extension also allows users to provide feedback on the bias detection, helping improve future results.

## What is Real vs. Mocked?

- **Bias Analysis (Mocked):** The extension currently uses a mock API response in `background.js` to simulate bias analysis. No real external AI or news analysis service is called yet. The mock simulates a delay and returns a fixed example result for demonstration and development purposes.
- **Data Streaming (Real):** All analyzed URLs, bias ratings, and user feedback (thumbs up/down) are actually sent via POST requests to real Keboola stream endpoints. This means usage and feedback data are genuinely collected and can be processed on the backend.
- **UI/UX (Real):** All user interface elements (popup, widget, feedback, loading states) are fully functional and reflect the extension's intended design and workflow.

## Features

- **Automatic Bias Detection:** Analyzes news articles as you browse and displays a badge in the Chrome toolbar.
- **Popup UI:** Click the extension icon to see a summary of the article's bias, including an overall rating and detailed parameter scores.
- **On-Page Widget:** A collapsible, non-intrusive overlay shows bias details directly on the page.
- **Color-Coded Scores:** Red for high bias, green for unbiased/neutral, with clear explanations.
- **AI Analysis Loading State:** Friendly spinner and message while the analysis is running.
- **User Feedback:** Thumbs up/down buttons let users rate the accuracy of the bias detection.
- **Data Streaming:** All analyzed URLs and ratings are sent to a backend for further analysis and improvement.

## Installation

1. Clone or download this repository.
2. Open Chrome and go to `chrome://extensions/`.
3. Enable "Developer mode" (top right).
4. Click "Load unpacked" and select the extension directory.
5. The GroundNews Bias Checker icon will appear in your toolbar.

## Usage

- **Automatic Analysis:** As you browse, the extension will analyze news articles and show a badge (L/C/R) in the toolbar.
- **Popup:** Click the icon to see the overall bias score, rating, and detailed breakdown.
- **On-Page Widget:** See a summary and details in a collapsible overlay at the bottom right of the page.
- **Feedback:** Use the 👍 or 👎 buttons in the widget to rate the bias detection. Your feedback is sent anonymously to help improve the system.

## Development

- The extension uses a mock API for local development. To use a real API, update the `fetchBiasScoreFromAPI` function in `background.js`.
- All API results and user feedback are POSTed to Keboola stream endpoints for analytics.
- Code is organized into:
  - `background.js` (background logic, API calls, streaming)
  - `content.js` (on-page widget)
  - `popup.js` (popup UI)
  - `manifest.json` (extension manifest)

## Contributing

Pull requests and suggestions are welcome! Please open an issue or submit a PR for improvements, bug fixes, or new features.

## License

MIT License 