document.addEventListener('DOMContentLoaded', () => {
  const checkBiasButton = document.getElementById('checkBiasButton');
  const resultsDiv = document.getElementById('results');
  const sourceNameSpan = document.getElementById('sourceName');
  const biasScoreSpan = document.getElementById('biasScore');
  const ratingSpan = document.getElementById('rating');
  const leaningDescriptionSpan = document.getElementById('leaningDescription');
  const checkedUrlSpan = document.getElementById('checkedUrl');
  const errorMessageDiv = document.getElementById('error-message');
  const loadingDiv = document.getElementById('loading');

  // Function to request and display bias score
  function fetchAndDisplayBiasScore() {
    console.log("Popup: Requesting bias score.");
    resultsDiv.style.display = 'none';
    errorMessageDiv.style.display = 'none';
    // Show animated waiting message and spinner
    loadingDiv.innerHTML = `<div style='display:flex;align-items:center;gap:10px;'>
      <span class='gnews-spinner' style='width:18px;height:18px;border:3px solid #eee;border-top:3px solid #3578e5;border-radius:50%;display:inline-block;animation:gnews-spin 1s linear infinite;'></span>
      <span>Analyzing trustworthiness and bias with AI…</span>
    </div>`;
    loadingDiv.style.display = 'block';
    checkBiasButton.disabled = true;
    checkBiasButton.textContent = 'Fetching...';

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0 || !tabs[0].url) {
        console.error("Popup: No active tab found or URL is missing.");
        displayError("Could not get URL of the current page.");
        loadingDiv.style.display = 'none';
        checkBiasButton.disabled = false;
        checkBiasButton.textContent = 'Refresh Bias Score';
        return;
      }
      const currentUrl = tabs[0].url;
      console.log(`Popup: Current URL is ${currentUrl}`);

      chrome.runtime.sendMessage({ action: "getBiasScore", url: currentUrl }, (response) => {
        loadingDiv.style.display = 'none'; // Hide loading indicator
        checkBiasButton.disabled = false;
        checkBiasButton.textContent = 'Refresh Bias Score';

        if (chrome.runtime.lastError) {
          console.error("Popup: Error sending message to background script:", chrome.runtime.lastError.message);
          displayError(`Error: ${chrome.runtime.lastError.message}`);
          return;
        }

        console.log("Popup: Received response from background script:", response);
        if (response?.success) {
          const data = response.data;
          // Display article info and overall bias
          let articleInfo = '';
          if (data.article) {
            articleInfo = `<div style='margin-bottom:8px;'>
              <strong>${data.article.title || ''}</strong><br>
              <span>${[data.article.publication || '', data.article.author || ''].filter(Boolean).join(' | ')}</span><br>
              <span style='font-size:12px;color:#888;'>${data.article.date || ''}</span>
            </div>`;
          }
          let overallBias = '';
          if (data.article && (data.article.bias_score !== undefined || data.article.bias_rating || data.article.bias_description)) {
            let biasColor = '#3578e5';
            const rating = (data.article.bias_rating || '').toLowerCase();
            if (rating.includes('high bias') || rating.includes('negative') || rating.includes('slant')) {
              biasColor = '#dc3545'; // red
            } else if (rating.includes('unbiased') || rating.includes('neutral')) {
              biasColor = '#28a745'; // green
            }
            overallBias = `<div style="margin-bottom:12px; padding:10px 12px; background:#f7f7fa; border-radius:6px; border:1px solid #ececec;">
              <span style="font-size:15px; font-weight:600; color:${biasColor};">${data.article.bias_rating || ''}</span>
              <span style="font-size:13px; color:#888; margin-left:8px;">Score: ${data.article.bias_score ?? ''}</span><br>
              <span style="font-size:13px; color:#444;">${data.article.bias_description || ''}</span>
            </div>`;
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
              biasHtml = '<div><strong>Notable Bias Factors:</strong><ul style="padding-left:18px;">';
              for (const [param, val] of params) {
                let scoreColor = '#007bff';
                if (val.score >= 1 && val.score <= 3) scoreColor = '#dc3545'; // red
                else if (val.score >= 7 && val.score <= 10) scoreColor = '#28a745'; // green
                biasHtml += `<li style='margin-bottom:6px;'><strong>${param.replace(/_/g, ' ')}:</strong> <span style='color:${scoreColor};'>${val.score}</span><br>`;
                if (val.evidence?.length) {
                  biasHtml += `<ul style='margin:4px 0 0 0; padding-left:16px; font-size:12px; color:#555;'>`;
                  for (const ev of val.evidence) {
                    biasHtml += `<li>${ev}</li>`;
                  }
                  biasHtml += '</ul>';
                }
                biasHtml += '</li>';
              }
              biasHtml += '</ul></div>';
            } else {
              biasHtml = '<div><em>No strong bias indicators detected.</em></div>';
            }
          }

          resultsDiv.innerHTML = articleInfo + overallBias + biasHtml;
          resultsDiv.style.display = 'block';
        } else {
          const errorMsg = response?.error ? response.error : "Failed to get bias score.";
          console.error(`Popup: Error from background script: ${errorMsg}`);
          displayError(errorMsg);
        }
      });
    });
  }

  function displayError(message) {
    errorMessageDiv.textContent = message;
    errorMessageDiv.style.display = 'block';
    resultsDiv.style.display = 'none';
  }

  // Add event listener to the button
  checkBiasButton.addEventListener('click', fetchAndDisplayBiasScore);

  // Automatically fetch score when popup opens
  fetchAndDisplayBiasScore();

  console.log("GroundNews Bias Checker popup script loaded and auto-fetching score.");

  // Add spinner animation CSS
  (function(){
    const style = document.createElement('style');
    style.innerHTML = `@keyframes gnews-spin { 0% { transform: rotate(0deg);} 100% { transform: rotate(360deg);} }`;
    document.head.appendChild(style);
  })();
}); 