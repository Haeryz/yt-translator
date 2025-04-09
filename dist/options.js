document.addEventListener('DOMContentLoaded', function() {
  const apiKeyInput = document.getElementById('api-key');
  const apiRegionSelect = document.getElementById('api-region');
  const saveButton = document.getElementById('save-btn');
  const resetButton = document.getElementById('reset-btn');
  const message = document.getElementById('message');
  
  // Load saved settings
  chrome.storage.local.get(['apiKey', 'apiRegion'], function(result) {
    if (result.apiKey) {
      apiKeyInput.value = result.apiKey;
    }
    
    if (result.apiRegion) {
      apiRegionSelect.value = result.apiRegion;
    } else {
      // Set southeastasia as the default region
      apiRegionSelect.value = 'southeastasia';
    }
  });
  
  // Save settings
  saveButton.addEventListener('click', function() {
    const apiKey = apiKeyInput.value.trim();
    const apiRegion = apiRegionSelect.value;
    
    if (!apiKey) {
      showMessage('Please enter your Azure Translator API key.', 'error');
      return;
    }
    
    // Save the settings
    chrome.storage.local.set({
      apiKey,
      apiRegion
    }, function() {
      // Test the connection with the new settings
      testAPIConnection(apiKey, apiRegion);
    });
  });
  
  // Reset quota
  resetButton.addEventListener('click', function() {
    if (confirm('Are you sure you want to reset the usage quota counter to zero?')) {
      chrome.storage.local.set({ quota: 0 }, function() {
        showMessage('Usage quota reset to 0!', 'success');
      });
    }
  });
  
  // Test API connection
  function testAPIConnection(apiKey, apiRegion) {
    const testPhrase = 'こんにちは'; // "Hello" in Japanese
    
    // Create the standard Azure Translator URL
    const url = `https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to=en`;
    
    fetch(url, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey,
        'Ocp-Apim-Subscription-Region': apiRegion,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([{ Text: testPhrase }]),
    })
    .then(response => {
      if (!response.ok) {
        return response.text().then(text => { 
          throw new Error(`API Error ${response.status}: ${text}`);
        });
      }
      return response.json();
    })
    .then(data => {
      if (data && data[0] && data[0].translations && data[0].translations[0]) {
        showMessage(`Settings saved! API test successful: "${testPhrase}" → "${data[0].translations[0].text}"`, 'success');
        console.log('API TEST SUCCESS:', data);
      } else {
        showMessage('Settings saved but API response format is invalid. Check console for details.', 'warning');
        console.log('API RESPONSE INVALID FORMAT:', data);
      }
    })
    .catch(error => {
      showMessage(`Settings saved but API test failed: ${error.message}`, 'error');
      console.error('API TEST ERROR:', error);
    });
  }
  
  // Show message with extended duration and type
  function showMessage(text, type = 'success') {
    message.textContent = text;
    message.style.display = 'block';
    
    if (type === 'error') {
      message.style.backgroundColor = '#f8d7da';
      message.style.color = '#721c24';
    } else if (type === 'warning') {
      message.style.backgroundColor = '#fff3cd';
      message.style.color = '#856404';
    } else {
      message.style.backgroundColor = '#d4edda';
      message.style.color = '#155724';
    }
    
    // Extended duration for error messages
    const duration = type === 'error' ? 6000 : 3000;
    
    setTimeout(function() {
      message.style.display = 'none';
    }, duration);
  }
}); 