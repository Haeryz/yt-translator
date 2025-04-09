/**
 * YouTube Live Chat Translator - Background Service Worker
 * This handles communication between content scripts and the API.
 */

// Enable debug mode
const DEBUG = true;

// Debug logger
function logDebug(message: string, data?: any) {
  if (DEBUG) {
    if (data) {
      console.log(`%c[YT-TRANSLATOR BACKGROUND] ${message}`, 'background: #222; color: #bada55', data);
    } else {
      console.log(`%c[YT-TRANSLATOR BACKGROUND] ${message}`, 'background: #222; color: #bada55');
    }
  }
}

// Azure Translator API details
const DEFAULT_ENDPOINT = "https://api.cognitive.microsofttranslator.com";
let apiKey = "";
let apiRegion = "eastus";

// Load API key from storage
chrome.storage.local.get(['apiKey', 'apiRegion'], (result) => {
  if (result.apiKey) apiKey = result.apiKey;
  if (result.apiRegion) apiRegion = result.apiRegion;
  console.log('API settings loaded');
  logDebug(`API Key length: ${apiKey ? apiKey.length : 0}, Region: ${apiRegion}`);
});

// Listen for changes to API settings
chrome.storage.onChanged.addListener((changes) => {
  if (changes.apiKey) apiKey = changes.apiKey.newValue;
  if (changes.apiRegion) apiRegion = changes.apiRegion.newValue;
  console.log('API settings updated');
  logDebug(`Updated API Key length: ${apiKey ? apiKey.length : 0}, Region: ${apiRegion}`);
});

// API call to translate text
async function translateText(text: string, targetLang: string) {
  try {
    // Check if API key is set
    if (!apiKey) {
      logDebug('API key not set');
      throw new Error('API key not set. Please set your Azure Translator API key in the extension options.');
    }
    
    // Create Azure Translator API URL
    const url = `${DEFAULT_ENDPOINT}/translate?api-version=3.0&to=${targetLang}`;
    logDebug(`Translating text: "${text}" to ${targetLang}`);
    console.log(`TRANSLATING: "${text}" to ${targetLang} with API key length: ${apiKey.length}`);
    logDebug(`API URL: ${url}`);
    
    // Call the API
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey,
        'Ocp-Apim-Subscription-Region': apiRegion,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([{ Text: text }]),
    });
    
    const status = response.status;
    logDebug(`API response status: ${status}`);
    console.log(`API RESPONSE STATUS: ${status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      logDebug(`API error: ${response.status}`, errorText);
      console.error(`API ERROR ${status}: ${errorText}`);
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    logDebug(`API response data:`, data);
    console.log(`API SUCCESS: ${JSON.stringify(data)}`);
    
    if (!data || !data[0] || !data[0].translations || !data[0].translations[0]) {
      logDebug('Invalid API response format', data);
      throw new Error('Invalid API response format');
    }
    
    const result = {
      translatedText: data[0].translations[0].text,
      detectedLanguage: data[0].detectedLanguage?.language,
      charCount: text.length,
    };
    
    logDebug(`Translation result:`, result);
    console.log(`TRANSLATION RESULT: "${text}" → "${result.translatedText}"`);
    return result;
  } catch (error) {
    console.error('Translation error:', error);
    logDebug(`Translation error:`, error);
    throw error;
  }
}

// Rate limiting variables
const MAX_REQUESTS_PER_SECOND = 5;
let requestsInLastSecond = 0;
let lastRequestTime = Date.now();

// Handle the translation request with rate limiting
async function handleTranslationRequest(text: string, targetLang: string) {
  // Reset counter if more than a second has passed
  const now = Date.now();
  if (now - lastRequestTime > 1000) {
    requestsInLastSecond = 0;
    lastRequestTime = now;
  }
  
  // Check if we're over the rate limit
  if (requestsInLastSecond >= MAX_REQUESTS_PER_SECOND) {
    // Wait before proceeding
    await new Promise(resolve => setTimeout(resolve, 1000 - (now - lastRequestTime)));
    return handleTranslationRequest(text, targetLang);
  }
  
  // Increment request counter
  requestsInLastSecond++;
  
  // Perform translation
  return await translateText(text, targetLang);
}

// Keep service worker alive - FIXED VERSION
let keepAliveInterval;

function setupKeepAlive() {
  // Clear any existing interval
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
  }
  
  // Use a simple ping every 20 seconds instead of port connection
  keepAliveInterval = setInterval(() => {
    console.log("Keep-alive ping");
    
    // This self-message helps keep the service worker active
    chrome.runtime.sendMessage({ action: 'ping' })
      .catch(error => {
        // Ignore "receiving end does not exist" errors - these are expected
        if (!error.message.includes("Receiving end does not exist")) {
          console.error("Keep-alive error:", error);
        }
      });
  }, 20000); // 20 seconds
}

// Set up keep-alive on startup
setupKeepAlive();

// Handle direct API test
async function handleDirectTest(text: string, targetLang: string) {
  console.log(`DIRECT TEST: Testing API with "${text}" to ${targetLang}`);
  
  try {
    const result = await translateText(text, targetLang);
    console.log(`DIRECT TEST RESULT: Success - "${result.translatedText}"`);
    return result;
  } catch (error) {
    console.error(`DIRECT TEST ERROR: ${error.message}`);
    let statusCode = 'Unknown';
    if (error.message.includes('API error: ')) {
      const match = error.message.match(/API error: (\d+)/);
      if (match && match[1]) {
        statusCode = match[1];
      }
    }
    return { 
      error: error.message,
      statusCode
    };
  }
}

// Also listen for our own ping messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  logDebug(`Message received:`, message);
  console.log(`MESSAGE RECEIVED: ${message.action}`);

  if (message.action === 'ping') {
    sendResponse({ status: 'alive' });
    return true;
  }
  
  if (message.action === 'translate') {
    logDebug(`Translation request for: "${message.text}" to ${message.targetLang}`);
    console.log(`TRANSLATION REQUEST: "${message.text}" to ${message.targetLang}`);
    
    handleTranslationRequest(message.text, message.targetLang)
      .then(result => {
        logDebug(`Translation successful:`, result);
        console.log(`TRANSLATION SUCCESS: "${message.text}" → "${result.translatedText}"`);
        sendResponse(result);
      })
      .catch(error => {
        console.error('Error in background translation:', error);
        logDebug(`Translation error:`, error);
        console.log(`TRANSLATION ERROR: ${error.message}`);
        sendResponse({ error: String(error) });
      });
    
    // Return true to indicate that the response will be sent asynchronously
    return true;
  }
  
  // Direct test endpoint for popup API test
  if (message.action === 'direct_translate_test') {
    console.log(`DIRECT TEST REQUEST RECEIVED: "${message.text}" to ${message.targetLang}`);
    
    handleDirectTest(message.text, message.targetLang)
      .then(result => {
        console.log(`DIRECT TEST RESPONSE:`, result);
        sendResponse(result);
      })
      .catch(error => {
        console.error(`DIRECT TEST UNEXPECTED ERROR:`, error);
        sendResponse({ error: String(error) });
      });
    
    return true;
  }
  
  // Test endpoint for direct verification
  if (message.action === 'test') {
    logDebug('Received test message');
    sendResponse({ status: 'Test endpoint working' });
    return true;
  }
});

// On installation/update logic
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    // Initialize settings on first install
    await chrome.storage.local.set({
      isEnabled: true,
      targetLang: 'en',
      quota: 0,
    });
    
    // Open options page for API key setup
    chrome.runtime.openOptionsPage();
  }
}); 