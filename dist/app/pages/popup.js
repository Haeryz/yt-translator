import { useEffect, useState } from "react";
export default function Popup() {
    const [targetLang, setTargetLang] = useState("en");
    const [isEnabled, setIsEnabled] = useState(true);
    const [quota, setQuota] = useState(0);
    const [maxQuota] = useState(2000000); // 2M characters per month for free tier
    useEffect(() => {
        // Load saved settings when component mounts
        chrome.storage.local.get(['targetLang', 'isEnabled', 'quota'], (result) => {
            if (result.targetLang)
                setTargetLang(result.targetLang);
            if (result.isEnabled !== undefined)
                setIsEnabled(result.isEnabled);
            if (result.quota !== undefined)
                setQuota(result.quota);
        });
    }, []);
    const saveLanguage = (lang) => {
        chrome.storage.local.set({ targetLang: lang });
        setTargetLang(lang);
    };
    const toggleEnabled = () => {
        const newValue = !isEnabled;
        chrome.storage.local.set({ isEnabled: newValue });
        setIsEnabled(newValue);
    };
    return (React.createElement("div", { className: "w-72 p-4 bg-gray-50" },
        React.createElement("h2", { className: "text-xl font-bold mb-4" }, "YouTube Chat Translator"),
        React.createElement("div", { className: "mb-4" },
            React.createElement("label", { className: "flex items-center cursor-pointer" },
                React.createElement("div", { className: "relative" },
                    React.createElement("input", { type: "checkbox", className: "sr-only", checked: isEnabled, onChange: toggleEnabled }),
                    React.createElement("div", { className: `block w-14 h-8 rounded-full ${isEnabled ? 'bg-blue-500' : 'bg-gray-300'}` }),
                    React.createElement("div", { className: `dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition ${isEnabled ? 'transform translate-x-6' : ''}` })),
                React.createElement("div", { className: "ml-3 font-medium" }, isEnabled ? 'Enabled' : 'Disabled'))),
        React.createElement("div", { className: "mb-4" },
            React.createElement("label", { className: "block text-sm font-medium mb-2" }, "Translate to:"),
            React.createElement("select", { className: "w-full p-2 border border-gray-300 rounded", value: targetLang, onChange: (e) => saveLanguage(e.target.value) },
                React.createElement("option", { value: "en" }, "English"),
                React.createElement("option", { value: "ja" }, "Japanese"),
                React.createElement("option", { value: "es" }, "Spanish"),
                React.createElement("option", { value: "de" }, "German"),
                React.createElement("option", { value: "fr" }, "French"),
                React.createElement("option", { value: "ko" }, "Korean"),
                React.createElement("option", { value: "zh-Hans" }, "Chinese (Simplified)"),
                React.createElement("option", { value: "ru" }, "Russian"))),
        React.createElement("div", { className: "mt-4" },
            React.createElement("h3", { className: "text-sm font-medium mb-1" }, "Monthly Usage:"),
            React.createElement("div", { className: "w-full bg-gray-200 rounded-full h-2.5" },
                React.createElement("div", { className: `h-2.5 rounded-full ${quota / maxQuota > 0.8 ? 'bg-red-500' : 'bg-blue-500'}`, style: { width: `${Math.min(100, (quota / maxQuota) * 100)}%` } })),
            React.createElement("p", { className: "text-xs text-gray-500 mt-1" },
                quota.toLocaleString(),
                " / ",
                maxQuota.toLocaleString(),
                " characters used"))));
}
