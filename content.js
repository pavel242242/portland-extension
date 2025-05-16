// Content script for GroundNews Bias Checker
// This script runs in the context of the web page.
// For now, it's a placeholder. Future enhancements could include:
// - Displaying bias information directly on the page.
// - Sending information from the page to the background script if needed.

console.log("GroundNews Bias Checker content script loaded.");

let biasWidget = null;
let widgetStyleSheet = null;

function ensureWidgetStylesheet() {
  if (widgetStyleSheet) return;

  const css = `
    #gnews-bias-widget {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 320px;
      border: 1px solid #e0e0e0;
      border-radius: 10px;
      background-color: #fff;
      box-shadow: 0 4px 16px rgba(0,0,0,0.10);
      font-family: inherit;
      font-size: 15px;
      z-index: 99999999;
      color: #222;
      overflow: hidden;
    }
    #gnews-bias-widget * {
        box-sizing: border-box;
    }
    #gnews-bias-widget-header {
      padding: 12px 16px;
      background-color: #f7f7fa;
      border-bottom: 1px solid #ececec;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 600;
      letter-spacing: 0.2px;
    }
    #gnews-bias-widget-header:hover {
      background-color: #f0f0f5;
    }
    #gnews-bias-widget-content {
      padding: 16px 16px 12px 16px;
      line-height: 1.6;
    }
    #gnews-bias-widget-content p {
      margin: 0 0 8px 0;
    }
    #gnews-bias-widget-content p:last-child {
      margin-bottom: 0;
    }
    #gnews-bias-widget-content strong {
      color: #222;
    }
    #gnews-bias-widget.collapsed #gnews-bias-widget-content {
      display: none;
    }
    #gnews-bias-widget-toggle {
      font-size: 18px;
      line-height: 1;
    }
    #gnews-bias-widget-close {
      font-size: 18px;
      font-weight: bold;
      border: none;
      background: transparent;
      cursor: pointer;
      padding: 0 0 0 10px;
      color: #888;
    }
    #gnews-bias-widget-close:hover {
      color: #333;
    }
    .gnews-bias-param {
      margin-bottom: 14px;
      padding-left: 0;
      background: none;
      border: none;
      border-radius: 0;
      display: block;
    }
    .gnews-bias-param-title {
      font-weight: 600;
      margin-right: 6px;
    }
    .gnews-bias-param-score {
      font-weight: 600;
      color: #3578e5;
      margin-right: 4px;
    }
    .gnews-bias-evidence-list {
      margin: 4px 0 0 0;
      padding-left: 18px;
      font-size: 13px;
      color: #888;
    }
    .gnews-bias-evidence-list li {
      margin-bottom: 2px;
      border-radius: 2px;
      padding: 1px 2px;
      background: none;
      transition: none;
    }
    .gnews-bias-evidence-list li:hover {
      background: #f5f7fa;
    }
  `;
  widgetStyleSheet = document.createElement("style");
  widgetStyleSheet.type = "text/css";
  widgetStyleSheet.innerText = css;
  document.head.appendChild(widgetStyleSheet);
}

// Icon map for bias parameters
const biasParamIcons = {
  language_neutrality: '🗣️',
  source_diversity: '🌐',
  headline_content_alignment: '📰',
  viewpoint_representation: '💬',
  fact_opinion_separation: '📊',
  context_completeness: '📚',
  visual_bias_assessment: '🖼️',
  transparency_score: '🔍'
};

function createOrUpdateWidget(data) {
  ensureWidgetStylesheet();

  if (!biasWidget) {
    biasWidget = document.createElement('div');
    biasWidget.id = 'gnews-bias-widget';

    const header = document.createElement('div');
    header.id = 'gnews-bias-widget-header';
    
    const titleSpan = document.createElement('span');
    titleSpan.textContent = 'GroundNews Bias';

    const controlsDiv = document.createElement('div');
    const toggleButton = document.createElement('span');
    toggleButton.id = 'gnews-bias-widget-toggle';
    toggleButton.innerHTML = '&#x25B2;'; // Up arrow

    const closeButton = document.createElement('button');
    closeButton.id = 'gnews-bias-widget-close';
    closeButton.innerHTML = '&times;';
    closeButton.title = 'Close widget';
    closeButton.onclick = (e) => {
      e.stopPropagation();
      if (biasWidget) {
        biasWidget.remove();
        biasWidget = null;
      }
    };

    controlsDiv.appendChild(toggleButton);
    controlsDiv.appendChild(closeButton);
    header.appendChild(titleSpan);
    header.appendChild(controlsDiv);

    header.onclick = () => {
      biasWidget.classList.toggle('collapsed');
      toggleButton.innerHTML = biasWidget.classList.contains('collapsed') ? '&#x25BC;' : '&#x25B2;';
    };

    const content = document.createElement('div');
    content.id = 'gnews-bias-widget-content';

    biasWidget.appendChild(header);
    biasWidget.appendChild(content);
    document.body.appendChild(biasWidget);
    biasWidget.querySelector('#gnews-bias-widget-toggle').innerHTML = '&#x25B2;';
  }

  // Article info and overall bias
  let articleInfo = '';
  let overallBias = '';
  if (data.article) {
    articleInfo = `<div style='margin-bottom:8px;'>
      <strong>${data.article.title || ''}</strong><br>
      <span>${[data.article.publication || '', data.article.author || ''].filter(Boolean).join(' | ')}</span><br>
      <span style='font-size:12px;color:#888;'>${data.article.date || ''}</span>
    </div>`;
    if (data.article.bias_score !== undefined || data.article.bias_rating || data.article.bias_description) {
      let biasColor = '#3578e5';
      const rating = (data.article.bias_rating || '').toLowerCase();
      if (rating.includes('high bias') || rating.includes('negative') || rating.includes('slant')) {
        biasColor = '#dc3545'; // red
      } else if (rating.includes('unbiased') || rating.includes('neutral')) {
        biasColor = '#28a745'; // green
      }
      overallBias = `<div style=\"margin-bottom:12px; padding:10px 12px; background:#f7f7fa; border-radius:6px; border:1px solid #ececec;\">
        <span style=\"font-size:15px; font-weight:600; color:${biasColor};\">${data.article.bias_rating || ''}</span>
        <span style=\"font-size:13px; color:#888; margin-left:8px;\">Score: ${data.article.bias_score ?? ''}</span><br>
        <span style=\"font-size:13px; color:#444;\">${data.article.bias_description || ''}</span>
      </div>`;
    }
  }

  // Filter bias parameters by score
  let biasHtml = '';
  if (data.bias_assessment) {
    const params = Object.entries(data.bias_assessment).filter(([key, val]) => {
      const score = val.score;
      if (typeof score === 'number') {
        return (score >= 1 && score <= 3) || (score >= 7 && score <= 10);
      }
      return false;
    });
    if (params.length > 0) {
      biasHtml = '<div><strong>Notable Bias Factors:</strong>';
      for (const [param, val] of params) {
        let scoreColor = '#3578e5';
        if (val.score >= 1 && val.score <= 3) scoreColor = '#dc3545'; // red
        else if (val.score >= 7 && val.score <= 10) scoreColor = '#28a745'; // green
        biasHtml += `<div class="gnews-bias-param">
          <span class="gnews-bias-param-title">${param.replace(/_/g, ' ')}</span>
          <span class="gnews-bias-param-score" style="color:${scoreColor};">${val.score}</span>
        </div>`;
        if (val.evidence?.length) {
          biasHtml += '<ul class="gnews-bias-evidence-list">';
          for (const ev of val.evidence) {
            biasHtml += `<li>${ev}</li>`;
          }
          biasHtml += '</ul>';
        }
      }
      biasHtml += '</div>';
    } else {
      biasHtml = '<div><em>No strong bias indicators detected.</em></div>';
    }
  }

  // Add feedback buttons at the bottom
  let feedbackRow = '';
  if (data.article && data.article.url) {
    feedbackRow = `<div class="gnews-feedback-row" style="margin-top:18px;display:flex;align-items:center;gap:12px;">
      <span style="font-size:15px;">Was this bias detection accurate?</span>
      <button class="gnews-feedback-btn" data-fb="thumbs_up" title="Thumbs up" style="font-size:18px;padding:2px 8px;cursor:pointer;border:1px solid #e0e0e0;background:#f7f7fa;border-radius:4px;">👍</button>
      <button class="gnews-feedback-btn" data-fb="thumbs_down" title="Thumbs down" style="font-size:18px;padding:2px 8px;cursor:pointer;border:1px solid #e0e0e0;background:#f7f7fa;border-radius:4px;">👎</button>
    </div>`;
  }

  const contentDiv = biasWidget.querySelector('#gnews-bias-widget-content');
  contentDiv.innerHTML = articleInfo + overallBias + biasHtml + feedbackRow;

  // Add feedback button listeners
  if (data.article && data.article.url) {
    const btns = biasWidget.querySelectorAll('.gnews-feedback-btn');
    btns.forEach(btn => {
      btn.onclick = () => {
        sendUserFeedback(data.article.url, data, btn.getAttribute('data-fb'));
      };
    });
  }

  if (!biasWidget.isConnected) {
      document.body.appendChild(biasWidget);
  }
  biasWidget.classList.remove('collapsed');
  const toggleButton = biasWidget.querySelector('#gnews-bias-widget-toggle');
  if (toggleButton) toggleButton.innerHTML = '&#x25B2;';
}

function showLoadingWidget() {
  ensureWidgetStylesheet();
  if (!biasWidget) {
    biasWidget = document.createElement('div');
    biasWidget.id = 'gnews-bias-widget';
    const header = document.createElement('div');
    header.id = 'gnews-bias-widget-header';
    const titleSpan = document.createElement('span');
    titleSpan.textContent = 'GroundNews Bias';
    const controlsDiv = document.createElement('div');
    const toggleButton = document.createElement('span');
    toggleButton.id = 'gnews-bias-widget-toggle';
    toggleButton.innerHTML = '&#x25B2;';
    const closeButton = document.createElement('button');
    closeButton.id = 'gnews-bias-widget-close';
    closeButton.innerHTML = '&times;';
    closeButton.title = 'Close widget';
    closeButton.onclick = (e) => {
      e.stopPropagation();
      if (biasWidget) {
        biasWidget.remove();
        biasWidget = null;
      }
    };
    controlsDiv.appendChild(toggleButton);
    controlsDiv.appendChild(closeButton);
    header.appendChild(titleSpan);
    header.appendChild(controlsDiv);
    header.onclick = () => {
      biasWidget.classList.toggle('collapsed');
      toggleButton.innerHTML = biasWidget.classList.contains('collapsed') ? '&#x25BC;' : '&#x25B2;';
    };
    const content = document.createElement('div');
    content.id = 'gnews-bias-widget-content';
    biasWidget.appendChild(header);
    biasWidget.appendChild(content);
    document.body.appendChild(biasWidget);
    biasWidget.querySelector('#gnews-bias-widget-toggle').innerHTML = '&#x25B2;';
  }
  const contentDiv = biasWidget.querySelector('#gnews-bias-widget-content');
  contentDiv.innerHTML = `<div style='display:flex;align-items:center;gap:10px;padding:18px 0;'>
    <span class='gnews-spinner' style='width:18px;height:18px;border:3px solid #eee;border-top:3px solid #3578e5;border-radius:50%;display:inline-block;animation:gnews-spin 1s linear infinite;'></span>
    <span>Analyzing trustworthiness and bias with AI…</span>
  </div>`;
  biasWidget.classList.remove('collapsed');
  if (!biasWidget.isConnected) {
    document.body.appendChild(biasWidget);
  }
  // Add spinner animation CSS if not already present
  if (!document.getElementById('gnews-spinner-style')) {
    const style = document.createElement('style');
    style.id = 'gnews-spinner-style';
    style.innerHTML = `@keyframes gnews-spin { 0% { transform: rotate(0deg);} 100% { transform: rotate(360deg);} }`;
    document.head.appendChild(style);
  }
}

function sendUserFeedback(url, result, feedback) {
  fetch('https://stream-in.north-europe.azure.keboola.com/stream/532/ground-news-rating/MEaBx1d9kjkkdvx05JCgjXDh0qYpW50t11sCu5NUILYURDKQ', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, bias_rating: result.article?.bias_rating, feedback })
  }).then(() => {
    showFeedbackThanks();
  }).catch(() => {
    showFeedbackThanks();
  });
}

function showFeedbackThanks() {
  const contentDiv = biasWidget?.querySelector('#gnews-bias-widget-content');
  if (contentDiv) {
    const fbDiv = contentDiv.querySelector('.gnews-feedback-row');
    if (fbDiv) {
      fbDiv.innerHTML = '<span style="color:#28a745;font-weight:500;">Thank you for your feedback!</span>';
    }
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "displayBiasWidget" && request.data) {
    console.log("Content script: Received bias data for widget:", request.data);
    createOrUpdateWidget(request.data);
    sendResponse({ success: true, message: "Widget displayed/updated." });
  } else if (request.action === "showLoadingWidget") {
    showLoadingWidget();
    sendResponse({ success: true, message: "Widget loading shown." });
  } else {
    sendResponse({ success: false, message: "Unknown action or no data." });
  }
  return true;
}); 