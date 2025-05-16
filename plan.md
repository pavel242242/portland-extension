# Chrome Extension: GroundNews Bias Checker - Development Plan

## 1. Project Setup

*   [x] Create `manifest.json` with basic extension details, permissions (`activeTab`, `scripting`, placeholder `host_permissions`), background script definition, content script definition, and browser action.
*   [ ] Create `images/` directory.
*   [ ] Add placeholder icons (`icon16.png`, `icon48.png`, `icon128.png`) to `images/`. (User will provide actual icons later).

## 2. Core Logic - Background Script (`background.js`)

*   [ ] Create `background.js`.
*   [ ] Implement a listener for messages from the popup or content script (e.g., when a URL needs to be checked).
*   [ ] Create a mock API call function:
    *   Takes a URL as input.
    *   Returns a predefined JSON object (e.g., `{"bias_score": "center", "rating": 75, "source": "Mock News"}`).
    *   Include a `TODO` comment to replace this with the actual API call to GroundNews.
*   [ ] Listen for `chrome.runtime.onMessage` to receive the URL from the popup.
*   [ ] When a message with a URL is received, call the mock API function.
*   [ ] Send the API response back to the popup.

## 3. User Interface - Popup (`popup.html`, `popup.js`, `popup.css`)

*   [x] Create `popup.html`:
    *   Basic HTML structure.
    *   A button to trigger the bias check.
    *   A placeholder element to display the bias score/results.
*   [ ] Create `popup.js`:
    *   On popup load (`DOMContentLoaded`):
        *   Automatically request bias score for the current active tab.
        *   Display loading state initially.
        *   Get the current tab's URL using `chrome.tabs.query`.
        *   Send the URL to `background.js` using `chrome.runtime.sendMessage` to get the score (this will leverage the cache in `background.js` if available).
        *   Implement a listener for messages from `background.js` (to receive the API response).
        *   Update the `popup.html` to display the bias score or an error.
        *   Hide loading state.
    *   Change the button text to "Refresh Bias Score".
    *   Add an event listener to the "Refresh Bias Score" button:
        *   On button click, re-trigger the request for the bias score (which might force a fresh fetch or use cache depending on `background.js` logic, but for now, it will just re-request).
*   [ ] (Optional) Create `popup.css` for basic styling.

## 4. Content Script (`content.js`) - On-Page Bias Widget

*   [x] Create `content.js`.
*   [ ] Modify `background.js`:
    *   [ ] When a bias score is successfully fetched (in `chrome.tabs.onUpdated` or via popup refresh leading to a fresh fetch):
        *   [ ] Send a message (`chrome.tabs.sendMessage`) to the content script of the relevant tab (`tabId`) with the bias data.
        *   [ ] The message should have a distinct action, e.g., `"displayBiasWidget"`.
*   [ ] Implement `content.js` to manage the on-page widget:
    *   [x] Add a listener for messages from `background.js` (`chrome.runtime.onMessage`).
    *   [x] When a `"displayBiasWidget"` message is received with bias data:
        *   [x] Check if the widget already exists. If so, update its content. If not, create it.
        *   [x] Create the HTML structure for the widget (e.g., a `div` with a header and a content area).
        *   [x] Populate the widget with bias information (source, bias score, rating).
        *   [x] Style the widget using injected CSS:
            *   [x] Position it fixed on the page (e.g., bottom-right corner).
            *   [x] Make it visually distinct but not overly intrusive.
            *   [x] Ensure it has a higher z-index to appear above most page content.
            *   [x] Style the header to be clickable for collapsing/expanding.
        *   [x] Implement collapse/expand functionality for the widget.
        *   [x] Widget now starts expanded by default for better visibility of new data.
        *   [x] Add a close button to the widget to dismiss it for the current page view.
    *   [ ] (Consideration) How to handle widget state if the user navigates within the same tab without a full page reload (e.g., single-page applications). For now, the widget will update on full page loads/navigation that `tabs.onUpdated` catches.

## 5. Automatic Bias Check on Page Navigation

*   [ ] Add `"tabs"` permission to `manifest.json`.
*   [ ] In `background.js`:
    *   [ ] Add a listener for `chrome.tabs.onUpdated`.
    *   [ ] When a tab completes loading (`status === 'complete'`) and has a valid HTTP/HTTPS URL:
        *   [ ] Call `fetchBiasScoreFromAPI` for the tab's URL.
        *   [ ] Store the latest bias result associated with the `tabId`.
        *   [ ] Update the browser action icon badge (e.g., `chrome.action.setBadgeText`, `chrome.action.setBadgeBackgroundColor`) with a summary of the bias (e.g., L, C, R or color).
    *   [ ] Modify the `chrome.runtime.onMessage` listener for `"getBiasScore"` in `background.js`:
        *   [ ] When the popup requests a score, first check if a recent result is already stored for the active tabId.
        *   [ ] If a stored result exists, send it back immediately.
        *   [ ] If not, proceed with fetching the score as before.

## 6. Omnibox Integration (Address Bar Check) - Future Enhancement

*   [ ] Add `"omnibox"` permission and define a keyword in `manifest.json`.
*   [ ] In `background.js`:
    *   [ ] Add a listener for `chrome.omnibox.onInputEntered`.
    *   [ ] When the keyword is used, take the provided URL, call `fetchBiasScoreFromAPI`.
    *   [ ] Decide on a method to display the result (e.g., open a new simple HTML page with the results, or use `chrome.notifications`).

## 7. Testing and Refinement

*   [x] Load the extension in Chrome (`chrome://extensions/`).
*   [x] Test the popup functionality: clicking the button, getting a mock response.
*   [ ] Test automatic bias check on page navigation: badge updates, popup shows stored/fresh data.
*   [ ] (Future) Test omnibox functionality.
*   [ ] Debug any issues.
*   [ ] (Future) Replace mock API with actual GroundNews API call.
*   [ ] (Future) Update `host_permissions` in `manifest.json` with the actual API domain.
*   [ ] (Future) Add error handling (e.g., API call fails, URL is not a news article, ignoring non-http/s URLs).
*   [ ] (Future) Improve UI/UX for badge and popup.
*   [ ] (Future) Continuously refine UI/UX based on best practices (minimalism, iconography, non-intrusive overlays, responsiveness). 