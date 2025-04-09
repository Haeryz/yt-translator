document.addEventListener('DOMContentLoaded', function() {
  const MAX_QUOTA = 2000000; // 2M characters for free tier
  const enabledToggle = document.getElementById('enabled-toggle');
  const toggleStatus = document.getElementById('toggle-status');
  const languageSelect = document.getElementById('language-select');
  const quotaBar = document.getElementById('quota-bar');
  const quotaText = document.getElementById('quota-text');
  
  // Debug elements
  const debugToggle = document.getElementById('debug-toggle');
  const debugContent = document.getElementById('debug-content');
  const testApiButton = document.getElementById('test-api');
  const apiResult = document.getElementById('api-result');
  const apiRegion = document.getElementById('api-region');
  const apiKeyStatus = document.getElementById('api-key-status');
  
  // Load saved settings
  chrome.storage.local.get(['targetLang', 'isEnabled', 'quota', 'apiKey', 'apiRegion'], function(result) {
    // Set language selection
    if (result.targetLang) {
      languageSelect.value = result.targetLang;
    }
    
    // Set enabled toggle
    if (result.isEnabled !== undefined) {
      enabledToggle.checked = result.isEnabled;
      toggleStatus.textContent = result.isEnabled ? 'Enabled' : 'Disabled';
    }
    
    // Set quota display
    if (result.quota !== undefined) {
      const quotaPercentage = Math.min(100, (result.quota / MAX_QUOTA) * 100);
      quotaBar.style.width = `${quotaPercentage}%`;
      if (quotaPercentage > 80) {
        quotaBar.classList.add('warning');
      }
      
      quotaText.textContent = `${result.quota.toLocaleString()} / ${MAX_QUOTA.toLocaleString()} characters used`;
    }
    
    // Set API info
    if (result.apiRegion) {
      apiRegion.textContent = result.apiRegion;
    } else {
      apiRegion.textContent = 'Not set';
      apiRegion.style.color = 'red';
    }
    
    if (result.apiKey) {
      apiKeyStatus.textContent = 'Set (' + result.apiKey.substr(0, 3) + '...' + result.apiKey.substr(-3) + ')';
      apiKeyStatus.style.color = 'green';
    } else {
      apiKeyStatus.textContent = 'Not set - Setup required!';
      apiKeyStatus.style.color = 'red';
    }
  });
  
  // Handle toggle changes
  enabledToggle.addEventListener('change', function() {
    const isEnabled = enabledToggle.checked;
    chrome.storage.local.set({ isEnabled });
    toggleStatus.textContent = isEnabled ? 'Enabled' : 'Disabled';
  });
  
  // Handle language selection changes
  languageSelect.addEventListener('change', function() {
    chrome.storage.local.set({ targetLang: languageSelect.value });
  });
  
  // Debug section toggle
  debugToggle.addEventListener('click', function() {
    if (debugContent.style.display === 'none') {
      debugContent.style.display = 'block';
      debugToggle.textContent = '▼ Debug & Troubleshooting';
    } else {
      debugContent.style.display = 'none';
      debugToggle.textContent = '▶ Debug & Troubleshooting';
    }
  });
  
  // Test API connection
  testApiButton.addEventListener('click', function() {
    testApiButton.disabled = true;
    testApiButton.textContent = 'Testing...';
    apiResult.style.display = 'none';
    
    const testPhrase = 'こんにちは'; // "Hello" in Japanese
    const targetLang = languageSelect.value;
    
    // Send a test translation request to the background script
    chrome.runtime.sendMessage({
      action: 'direct_translate_test',
      text: testPhrase,
      targetLang: targetLang
    }, function(response) {
      testApiButton.disabled = false;
      testApiButton.textContent = 'Test API Connection';
      apiResult.style.display = 'block';
      
      if (response.error) {
        apiResult.className = 'error';
        apiResult.innerHTML = `
          <strong>ERROR (${response.statusCode || 'Unknown'})</strong><br>
          ${response.error}<br>
          <small>Check if your API key and region are set correctly in the options.</small>
        `;
      } else if (response.translatedText) {
        apiResult.className = 'success';
        apiResult.innerHTML = `
          <strong>SUCCESS (200)</strong><br>
          Japanese "${testPhrase}" → ${targetLang}: "${response.translatedText}"<br>
          <small>Your API connection is working correctly!</small>
        `;
      } else {
        apiResult.className = 'error';
        apiResult.innerHTML = `
          <strong>UNEXPECTED RESPONSE</strong><br>
          The API did not return a valid translation result.<br>
          <small>Response: ${JSON.stringify(response)}</small>
        `;
      }
    });
  });
}); 