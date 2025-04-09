import { useEffect, useState } from "react";

type LanguageCode = "en" | "ja" | "es" | "de" | "fr" | "ko" | "zh-Hans" | "ru";

export default function Popup() {
  const [targetLang, setTargetLang] = useState<LanguageCode>("en");
  const [isEnabled, setIsEnabled] = useState(true);
  const [quota, setQuota] = useState(0);
  const [maxQuota] = useState(2000000); // 2M characters per month for free tier

  useEffect(() => {
    // Load saved settings when component mounts
    chrome.storage.local.get(['targetLang', 'isEnabled', 'quota'], (result) => {
      if (result.targetLang) setTargetLang(result.targetLang);
      if (result.isEnabled !== undefined) setIsEnabled(result.isEnabled);
      if (result.quota !== undefined) setQuota(result.quota);
    });
  }, []);

  const saveLanguage = (lang: LanguageCode) => {
    chrome.storage.local.set({ targetLang: lang });
    setTargetLang(lang);
  };

  const toggleEnabled = () => {
    const newValue = !isEnabled;
    chrome.storage.local.set({ isEnabled: newValue });
    setIsEnabled(newValue);
  };

  return (
    <div className="w-72 p-4 bg-gray-50">
      <h2 className="text-xl font-bold mb-4">YouTube Chat Translator</h2>
      
      <div className="mb-4">
        <label className="flex items-center cursor-pointer">
          <div className="relative">
            <input 
              type="checkbox" 
              className="sr-only" 
              checked={isEnabled}
              onChange={toggleEnabled}
            />
            <div className={`block w-14 h-8 rounded-full ${isEnabled ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
            <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition ${isEnabled ? 'transform translate-x-6' : ''}`}></div>
          </div>
          <div className="ml-3 font-medium">
            {isEnabled ? 'Enabled' : 'Disabled'}
          </div>
        </label>
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Translate to:</label>
        <select
          className="w-full p-2 border border-gray-300 rounded"
          value={targetLang}
          onChange={(e) => saveLanguage(e.target.value as LanguageCode)}
        >
          <option value="en">English</option>
          <option value="ja">Japanese</option>
          <option value="es">Spanish</option>
          <option value="de">German</option>
          <option value="fr">French</option>
          <option value="ko">Korean</option>
          <option value="zh-Hans">Chinese (Simplified)</option>
          <option value="ru">Russian</option>
        </select>
      </div>
      
      <div className="mt-4">
        <h3 className="text-sm font-medium mb-1">Monthly Usage:</h3>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className={`h-2.5 rounded-full ${quota/maxQuota > 0.8 ? 'bg-red-500' : 'bg-blue-500'}`} 
            style={{ width: `${Math.min(100, (quota/maxQuota)*100)}%` }}
          ></div>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {quota.toLocaleString()} / {maxQuota.toLocaleString()} characters used
        </p>
      </div>
    </div>
  );
}
