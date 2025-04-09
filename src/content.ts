/**
 * YouTube Live Chat Translator - Content Script
 * This script is injected into YouTube pages to detect and translate live chat messages
 * using the Azure Translator API.
 */

interface Settings {
  isEnabled: boolean;
  targetLang: string;
  quota: number;
}

interface TranslationResponse {
  translatedText: string;
  detectedLanguage?: string;
  charCount: number;
}

// Default settings
let settings: Settings = {
  isEnabled: true,
  targetLang: 'en',
  quota: 0,
};

// Debug mode
const DEBUG = true;

const MAX_QUOTA = 2000000; // 2M characters per month for free tier
const TRANSLATION_API_URL = chrome.runtime.getURL('/api/translate');
let processedMessages = new Set<string>();

// Console logger that's easy to spot
function logDebug(message: string, data?: any) {
  if (DEBUG) {
    if (data) {
      console.log(`%c[YT-TRANSLATOR DEBUG] ${message}`, 'background: #222; color: #bada55', data);
    } else {
      console.log(`%c[YT-TRANSLATOR DEBUG] ${message}`, 'background: #222; color: #bada55');
    }
  }
}

// Load settings from storage
function loadSettings() {
  chrome.storage.local.get(['isEnabled', 'targetLang', 'quota'], (result) => {
    if (result.isEnabled !== undefined) settings.isEnabled = result.isEnabled;
    if (result.targetLang) settings.targetLang = result.targetLang;
    if (result.quota !== undefined) settings.quota = result.quota;
    console.log('YT Translator: Settings loaded', settings);
  });
}

// Listen for changes in storage
chrome.storage.onChanged.addListener((changes) => {
  if (changes.isEnabled) settings.isEnabled = changes.isEnabled.newValue;
  if (changes.targetLang) settings.targetLang = changes.targetLang.newValue;
  if (changes.quota) settings.quota = changes.quota.newValue;
  console.log('YT Translator: Settings updated', settings);
});

// Function to detect language (simple heuristic - can be improved)
function shouldTranslate(text: string): boolean {
  // Skip messages that are too short or likely to be non-Japanese
  if (text.length < 2) {
    logDebug(`Text too short to translate: "${text}"`);
    return false;
  }
  
  // Skip emotes, links, and pure emoji messages
  if (/^[\uD800-\uDBFF][\uDC00-\uDFFF]+$/u.test(text)) {
    logDebug(`Text appears to be emojis: "${text}"`);
    return false;
  }
  
  if (text.includes('http')) {
    logDebug(`Text contains URL: "${text}"`);
    return false;
  }
  
  // If targeting English and message appears to be English, don't translate
  if (settings.targetLang === 'en' && /^[a-zA-Z0-9\s\p{P}]+$/u.test(text)) {
    logDebug(`Text already in English: "${text}"`);
    return false;
  }
  
  // If targeting Japanese and message appears to be Japanese, don't translate
  const hasJapanese = /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/u.test(text);
  if (settings.targetLang === 'ja' && hasJapanese) {
    logDebug(`Text already in Japanese: "${text}"`);
    return false;
  }

  logDebug(`Will translate: "${text}"`);
  return true;
}

// Function to translate text
async function translateText(text: string): Promise<string | null> {
  if (!settings.isEnabled) {
    logDebug('Translation is disabled');
    return null;
  }
  
  if (settings.quota >= MAX_QUOTA) {
    logDebug('Translation quota exceeded');
    return null;
  }
  
  // Skip translation if the text doesn't need it
  if (!shouldTranslate(text)) return null;
  
  try {
    logDebug(`Sending translation request for: "${text}"`);
    
    // Use runtime message to communicate with background script
    const response = await chrome.runtime.sendMessage({
      action: 'translate',
      text,
      targetLang: settings.targetLang,
    });
    
    logDebug('Translation response received', response);
    
    if (response && response.translatedText) {
      // Update quota
      settings.quota += response.charCount;
      chrome.storage.local.set({ quota: settings.quota });
      
      logDebug(`Translation successful: "${text}" → "${response.translatedText}"`);
      return response.translatedText;
    } else {
      logDebug('No translation in response', response);
    }
    return null;
  } catch (error) {
    console.error('YT Translator: Translation error', error);
    return null;
  }
}

// Process chat messages
function processChatMessage(message: Element) {
  try {
    // Debug the message we're processing
    console.log("PROCESSING MESSAGE:", message);
    
    // Only process elements that are actually chat messages
    if (!message.tagName) {
      console.log("No tagName, skipping");
      return;
    }
    
    // Skip if already processed
    const messageId = message.getAttribute('id') || '';
    if (processedMessages.has(messageId)) {
      console.log("Already processed, skipping:", messageId);
      return;
    }
    
    // Debug all possible message containers
    const possibleMessageElements = message.querySelectorAll('span[id="message"], span[id="content"], div[id="message"], div[id="content"]');
    console.log("Found possible message elements:", possibleMessageElements.length);
    
    // Find the actual message text
    let messageSpan = message.querySelector('span#message');
    
    // If we couldn't find it, try other common selectors
    if (!messageSpan) {
      messageSpan = message.querySelector('#content-text') || 
                   message.querySelector('#message') || 
                   message.querySelector('#content') ||
                   message.querySelector('.chat-message');
    }
    
    if (!messageSpan) {
      console.log("No message span found in:", message);
      return;
    }
    
    console.log("Found message span:", messageSpan);
    
    const originalText = messageSpan.textContent?.trim();
    if (!originalText) {
      console.log("No text content in message span");
      return;
    }
    
    console.log("Found message text:", originalText);
    
    // Mark as processed to avoid duplicates
    processedMessages.add(messageId);
    
    // Translate the message
    translateText(originalText)
      .then(translatedText => {
        if (!translatedText) return;
        
        console.log(`TRANSLATION SUCCESS: "${originalText}" → "${translatedText}"`);
        
        // Create translation element with a cleaner style that matches YouTube's native text
        const translationElement = document.createElement('span');
        translationElement.className = 'yt-translator-translation';
        
        // Use a globe emoji as the translation indicator
        translationElement.textContent = ` 🌐 ${translatedText}`;
        
        // Match YouTube's text style - no background, same font
        translationElement.style.cssText = `
          margin-left: 4px;
          display: inline;
          color: inherit;
          font: inherit;
          white-space: normal; 
        `;
        
        // Direct injection into the message span
        messageSpan.appendChild(translationElement);
        console.log("Translation added to the DOM");
      })
      .catch(error => console.error('Translation error:', error));
  } catch (err) {
    console.error("Error processing chat message:", err);
  }
}

// Function to observe chat messages - more aggressive version
function observeLiveChat() {
  console.log("Searching for chat messages...");
  
  // Try multiple selectors to find chat messages
  const selectors = [
    'yt-live-chat-text-message-renderer',
    'yt-live-chat-paid-message-renderer',
    'yt-live-chat-legacy-paid-message-renderer',
    '[id*="live-chat"] [id*="message"]',
    '[class*="chat"] [id*="message"]'
  ];
  
  // Try each selector
  for (const selector of selectors) {
    const chatItems = document.querySelectorAll(selector);
    if (chatItems.length > 0) {
      console.log(`👉 FOUND ${chatItems.length} chat messages using selector: ${selector}`);
      chatItems.forEach(message => {
        processChatMessage(message);
      });
      return; // Stop if we found messages
    }
  }
  
  // If we get here, check for iframes which might contain the chat
  const iframes = document.querySelectorAll('iframe');
  console.log(`Found ${iframes.length} iframes on the page`);
  
  for (let i = 0; i < iframes.length; i++) {
    try {
      const iframe = iframes[i];
      console.log(`Checking iframe ${i}:`, iframe);
      
      // Try to access iframe content
      const iframeDocument = iframe.contentDocument || iframe.contentWindow?.document;
      if (iframeDocument) {
        console.log(`Successfully accessed iframe ${i} content`);
        
        // Look for chat messages inside the iframe
        for (const selector of selectors) {
          const chatItems = iframeDocument.querySelectorAll(selector);
          if (chatItems.length > 0) {
            console.log(`👉 FOUND ${chatItems.length} chat messages in iframe using selector: ${selector}`);
            chatItems.forEach(message => {
              processChatMessage(message);
            });
            return; // Stop if we found messages
          }
        }
      }
    } catch (err) {
      console.log(`Can't access iframe ${i} content due to same-origin policy`);
    }
  }
  
  console.log("No chat messages found with any selector");
}

// Track if observer is already set up
let observerInitialized = false;

// Set up MutationObserver to detect new chat messages
function setupObserver() {
  // Prevent multiple observers
  if (observerInitialized) {
    return;
  }
  
  console.log('Setting up observer for chat messages');
  
  // Try to find the chat container with multiple selectors
  const containerSelectors = [
    'yt-live-chat-item-list-renderer #items',
    'yt-live-chat-item-list-renderer',
    '#chat #items',
    '#chat-messages',
    '#item-list #items',
    '#chat',
    '#live-chat',
    '[id*="live-chat"]',
    '[id*="chat"]'
  ];
  
  let chatContainer = null;
  
  // Try each selector until we find a container
  for (const selector of containerSelectors) {
    chatContainer = document.querySelector(selector);
    if (chatContainer) {
      console.log(`👉 FOUND chat container with selector: ${selector}`);
      break;
    }
  }
  
  // If we still can't find it, try a more reliable method by going up from any existing chat message
  if (!chatContainer) {
    console.log("Trying alternative method to find chat container");
    const selectors = [
      'yt-live-chat-text-message-renderer',
      'yt-live-chat-paid-message-renderer',
      '[id*="message"]',
      '[class*="chat-message"]'
    ];
    
    for (const selector of selectors) {
      const anyMessage = document.querySelector(selector);
      if (anyMessage) {
        console.log(`Found a message element with selector: ${selector}`);
        
        // Go up to find the container
        let parent = anyMessage.parentElement;
        let iteration = 0;
        while (parent && iteration < 10) {
          console.log(`Checking parent level ${iteration}:`, parent);
          if (parent.id && (parent.id.includes('items') || parent.id.includes('chat'))) {
            chatContainer = parent;
            console.log(`👉 FOUND chat container by traversing up: ${parent.id}`);
            break;
          }
          parent = parent.parentElement;
          iteration++;
        }
        
        if (chatContainer) break;
      }
    }
  }
  
  // Last resort: observe the entire body
  if (!chatContainer) {
    console.log("No chat container found, observing body as last resort");
    chatContainer = document.body;
  }
  
  console.log('Using chat container:', chatContainer);
  
  // Create an observer instance
  const observer = new MutationObserver((mutations) => {
    let newMessagesFound = false;
    
    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        for (let i = 0; i < mutation.addedNodes.length; i++) {
          const node = mutation.addedNodes[i];
          if (node instanceof HTMLElement) {
            // Check if this is a chat message
            if (node.tagName && (
                node.tagName.toLowerCase().includes('message') || 
                node.id?.includes('message') ||
                node.className?.includes('message') ||
                node.tagName.toLowerCase() === 'yt-live-chat-text-message-renderer'
            )) {
              console.log("New message element detected:", node);
              processChatMessage(node);
              newMessagesFound = true;
            }
            
            // Also look for chat messages within the added node
            if (node.querySelectorAll) {
              const messages = node.querySelectorAll('yt-live-chat-text-message-renderer, [id*="message"]');
              if (messages.length > 0) {
                console.log(`Found ${messages.length} messages inside a new element`);
                for (let j = 0; j < messages.length; j++) {
                  processChatMessage(messages[j]);
                  newMessagesFound = true;
                }
              }
            }
          }
        }
      }
    }
    
    if (newMessagesFound) {
      console.log("Processed new messages from mutation observer");
    }
  });
  
  // Start observing with appropriate options
  const options = chatContainer === document.body 
    ? { childList: true, subtree: true } 
    : { childList: true };
    
  observer.observe(chatContainer, options);
  observerInitialized = true;
  
  // Process existing messages immediately
  observeLiveChat();
}

// Initialize with more aggressive retries
function initialize() {
  console.log('YouTube Live Chat Translator loaded');
  loadSettings();
  
  // Run on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setupObserver();
    });
  } else {
    setupObserver();
  }
  
  // Also set up checks after the page is fully loaded
  window.addEventListener('load', () => {
    setupObserver();
    setTimeout(observeLiveChat, 1000);
    setTimeout(observeLiveChat, 3000);
    setTimeout(observeLiveChat, 5000);
  });
  
  // Check after YouTube SPA navigation
  window.addEventListener('yt-navigate-finish', () => {
    console.log("YouTube navigation detected, resetting and re-initializing");
    observerInitialized = false;
    processedMessages.clear();
    setupObserver();
    setTimeout(observeLiveChat, 1000);
  });
  
  // Also check periodically
  setInterval(() => {
    if (!observerInitialized) {
      setupObserver();
    }
    observeLiveChat();
  }, 5000);
}

// Start the extension
initialize();

// For immediate testing - force translate a test message
setTimeout(() => {
  logDebug('PERFORMING TEST TRANSLATION');
  translateText('こんにちは')
    .then(result => {
      logDebug(`Test translation result: ${result}`);
      console.log(`%c[YT-TRANSLATOR TEST] Japanese 'こんにちは' translated to: ${result}`, 'background: #722; color: yellow; font-size: 14px;');
    })
    .catch(err => {
      logDebug('Test translation failed:', err);
    });
}, 5000); 