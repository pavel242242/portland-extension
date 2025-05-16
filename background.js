// Background script (service worker) for GroundNews Bias Checker

// Simple in-memory store for tab results
const tabResults = {};

// TODO: Implement actual API call to GroundNews
async function fetchBiasScoreFromAPI(url) {
  console.log(`Mock API: Fetching bias score for URL: ${url}`);
  // Simulate API call delay (7 seconds)
  await new Promise(resolve => setTimeout(resolve, 7000));

  // Mocked API response matching example.json
  const mockResponse = {
    article: {
      title: "Elon Musk Was Donald Trump's Useful Idiot",
      publication: "Foreign Policy",
      author: "Gideon Lichfield",
      date: "2025-05-14",
      url: url,
      bias_score: 33,
      bias_rating: "High bias",
      bias_description: "Significant slant with little attempt at balance"
    },
    bias_assessment: {
      language_neutrality: {
        score: 3,
        evidence: [
          "Uses term 'useful idiot' in headline",
          "Describes Musk as 'attention-seeking clown'",
          "Characterizes approach as 'slapdash'",
          "Uses phrase 'abject failure'"
        ]
      },
      source_diversity: {
        score: 5,
        evidence: [
          "Cites multiple mainstream sources (NYT, Atlantic, BBC)",
          "References three books about Musk",
          "Lacks substantial pro-Musk or pro-DOGE sources",
          "No direct quotes from DOGE or Musk defenders"
        ]
      },
      headline_content_alignment: {
        score: 7,
        evidence: [
          "Headline claim ('useful idiot') is consistent with article's thesis",
          "Article builds case that Musk was manipulated",
          "Conclusion directly states Musk 'got played'"
        ]
      },
      viewpoint_representation: {
        score: 3,
        evidence: [
          "Critical perspective dominates entirety of article",
          "Brief mention of DOGE's claimed successes only to refute them",
          "No substantive representation of Musk's or administration's viewpoint",
          "No quotes from supporters or officials defending the program"
        ]
      },
      fact_opinion_separation: {
        score: 4,
        evidence: [
          "Presents interpretive conclusion ('got played') as fact",
          "Speculates about Vought's intentions without clear attribution",
          "Some clear factual statements (dates, quoted admissions)",
          "Opinion often presented alongside facts without clear delineation"
        ]
      },
      context_completeness: {
        score: 6,
        evidence: [
          "Provides background on Musk's business philosophy",
          "Explains relationship to Vought and Project 2025",
          "Limited explanation of broader government efficiency challenges",
          "Missing context about historical attempts at government reform"
        ]
      },
      visual_bias_assessment: {
        score: "N/A",
        evidence: [
          "No visuals were available in the fetched content for assessment"
        ]
      },
      transparency_score: {
        score: 5,
        evidence: [
          "Author identifies perspective of sources used",
          "Notes Isaacson biography criticized as 'hagiographic'",
          "Discloses Amazon affiliate links",
          "No disclosure of author's potential political alignment"
        ]
      }
    }
  };

  console.log("Mock API: Returning response:", mockResponse);
  return mockResponse;
}

async function updateBadge(tabId, biasData) {
  let badgeText = "";
  let badgeColor = "#777"; // Default grey

  if (biasData?.bias_score) {
    switch (biasData.bias_score.toLowerCase()) {
      case "left":
        badgeText = "L";
        badgeColor = "#007bff"; // Blue
        break;
      case "center":
        badgeText = "C";
        badgeColor = "#28a745"; // Green
        break;
      case "right":
        badgeText = "R";
        badgeColor = "#dc3545"; // Red
        break;
      default:
        badgeText = "?";
        badgeColor = "#ffc107"; // Yellow for unknown/other
    }
  }

  await chrome.action.setBadgeText({ tabId: tabId, text: badgeText });
  await chrome.action.setBadgeBackgroundColor({ tabId: tabId, color: badgeColor });
  console.log(`Badge updated for tab ${tabId}: ${badgeText}`);
}

async function sendUsageToKeboola(url, bias_rating) {
  try {
    await fetch('https://stream-in.north-europe.azure.keboola.com/stream/532/ground-news/BRuGURKY0d0lfXss8aufaSJEMGmU0ieVkqnnzHkPjb62FU32', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, bias_rating })
    });
    console.log('Sent usage to Keboola stream.');
  } catch (err) {
    console.error('Failed to send usage to Keboola:', err);
  }
}

// Listen for tab updates to automatically check bias
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Check if the tab is fully loaded and has a URL
  if (changeInfo.status === 'complete' && tab.url && (tab.url.startsWith('http://') || tab.url.startsWith('https://'))) {
    console.log(`Tab ${tabId} updated and complete. URL: ${tab.url}`);
    // Show loading widget immediately
    chrome.tabs.sendMessage(tabId, { action: "showLoadingWidget" }).catch(err => console.log("Error sending loading to content script (onUpdated):", err.message));
    try {
      const biasData = await fetchBiasScoreFromAPI(tab.url);
      tabResults[tabId] = { data: biasData, timestamp: Date.now() };
      await updateBadge(tabId, biasData);
      // Send data to content script
      chrome.tabs.sendMessage(tabId, { action: "displayBiasWidget", data: biasData }).catch(err => console.log("Error sending to content script (onUpdated):", err.message));
      console.log(`Bias data stored and sent to content script for tab ${tabId}:`, biasData);
      // Send to Keboola (usage)
      sendUsageToKeboola(tab.url, biasData.article?.bias_rating);
    } catch (error) {
      console.error(`Error fetching bias score for tab ${tabId} (${tab.url}):`, error);
      tabResults[tabId] = { error: error.message, timestamp: Date.now() };
      await updateBadge(tabId, null); // Clear badge or set to error state
    }
  }
});

// Listen for when a tab is closed to clean up stored results
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  if (tabResults[tabId]) {
    delete tabResults[tabId];
    console.log(`Cleared stored result for closed tab ${tabId}`);
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getBiasScore") {
    const tabId = sender.tab?.id; // Popup messages will have sender.tab

    if (tabId && tabResults[tabId]) {
      console.log(`Background: Found stored result for tab ${tabId}`);
      const storedResult = tabResults[tabId];
      if (storedResult.data) {
        sendResponse({ success: true, data: storedResult.data, source: 'cache' });
      } else if (storedResult.error) {
        sendResponse({ success: false, error: storedResult.error, source: 'cache' });
      }
      return; // Sent response from cache, no need to return true for async
    }

    // If no cached result, or message not from a tab context (e.g. direct test)
    if (request.url) {
      console.log(`Background: No cached result for tab ${tabId} or direct request. Fetching for URL: ${request.url}`);
      fetchBiasScoreFromAPI(request.url)
        .then(response => {
          console.log("Background: Sending fresh response to popup:", response);
          if (tabId) { // If this was from a popup, cache it now
            tabResults[tabId] = { data: response, timestamp: Date.now() };
            updateBadge(tabId, response); // Update badge too, in case it wasn't set by onUpdated
            // Send data to content script
            chrome.tabs.sendMessage(tabId, { action: "displayBiasWidget", data: response }).catch(err => console.log("Error sending to content script (onMessage)", err.message));
            // Send to Keboola (usage)
            sendUsageToKeboola(request.url, response.article?.bias_rating);
          }
          sendResponse({ success: true, data: response, source: 'fresh' });
        })
        .catch(error => {
          console.error("Background: Error fetching bias score:", error);
          if (tabId) {
            tabResults[tabId] = { error: error.message, timestamp: Date.now() };
             updateBadge(tabId, null);
          }
          sendResponse({ success: false, error: error.message, source: 'fresh' });
        });
      return true; // Indicates that the response will be sent asynchronously
    }
    console.error("Background: Request to get bias score missing URL and no cache hit.");
    sendResponse({ success: false, error: "URL not provided and no cache available" });
  }
});

console.log("GroundNews Bias Checker background script loaded with onUpdated listener."); 