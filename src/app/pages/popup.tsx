import { useState } from "react";

type LanguageCode = "es" | "jp" | "de" | "en";

export default function Popup() {
  const [targetLang, setTargetLang] = useState<LanguageCode>("es");

  const saveLanguage = (lang: LanguageCode) => {
    chrome.storage.local.set({ targetLang: lang });
    setTargetLang(lang);
  };

  return (
    <div style={{ width: "200px", padding: "10px" }}>
      <h3>Translate to:</h3>
      <select
        value={targetLang}
        onChange={(e) => saveLanguage(e.target.value as LanguageCode)}
      >
        <option value="es">Spanish</option>
        <option value="jp">Japan</option>
        <option value="de">German</option>
        <option value="en">English</option>
      </select>
    </div>
  );
}
