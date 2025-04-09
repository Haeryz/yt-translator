import { useEffect, useState } from "react";
export default function Options() {
    const [apiKey, setApiKey] = useState("");
    const [apiRegion, setApiRegion] = useState("eastus");
    const [savedMessage, setSavedMessage] = useState("");
    useEffect(() => {
        // Load saved settings
        chrome.storage.local.get(['apiKey', 'apiRegion'], (result) => {
            if (result.apiKey)
                setApiKey(result.apiKey);
            if (result.apiRegion)
                setApiRegion(result.apiRegion);
        });
    }, []);
    const saveSettings = () => {
        chrome.storage.local.set({
            apiKey,
            apiRegion
        }, () => {
            setSavedMessage("Settings saved!");
            setTimeout(() => setSavedMessage(""), 3000);
        });
    };
    const resetQuota = () => {
        if (confirm("Are you sure you want to reset the usage quota counter?")) {
            chrome.storage.local.set({ quota: 0 }, () => {
                setSavedMessage("Usage quota reset to 0!");
                setTimeout(() => setSavedMessage(""), 3000);
            });
        }
    };
    return (React.createElement("div", { className: "w-full max-w-2xl mx-auto p-6 bg-white" },
        React.createElement("h1", { className: "text-2xl font-bold mb-6" }, "YouTube Live Chat Translator Settings"),
        React.createElement("div", { className: "mb-6" },
            React.createElement("p", { className: "mb-4" },
                "To use this extension, you need an Azure Translator API key.",
                React.createElement("a", { href: "https://azure.microsoft.com/en-us/products/ai-services/translator", target: "_blank", rel: "noreferrer", className: "text-blue-500 ml-1 hover:underline" }, "Get one here"),
                "."),
            React.createElement("div", { className: "mb-4" },
                React.createElement("label", { htmlFor: "apiKey", className: "block text-sm font-medium mb-2" }, "Azure Translator API Key:"),
                React.createElement("input", { type: "password", id: "apiKey", value: apiKey, onChange: (e) => setApiKey(e.target.value), className: "w-full p-2 border border-gray-300 rounded", placeholder: "Enter your Azure Translator API key" })),
            React.createElement("div", { className: "mb-4" },
                React.createElement("label", { htmlFor: "apiRegion", className: "block text-sm font-medium mb-2" }, "Azure Region:"),
                React.createElement("select", { id: "apiRegion", value: apiRegion, onChange: (e) => setApiRegion(e.target.value), className: "w-full p-2 border border-gray-300 rounded" },
                    React.createElement("option", { value: "eastus" }, "East US"),
                    React.createElement("option", { value: "eastus2" }, "East US 2"),
                    React.createElement("option", { value: "westus" }, "West US"),
                    React.createElement("option", { value: "westus2" }, "West US 2"),
                    React.createElement("option", { value: "northeurope" }, "North Europe"),
                    React.createElement("option", { value: "westeurope" }, "West Europe"),
                    React.createElement("option", { value: "southeastasia" }, "Southeast Asia"),
                    React.createElement("option", { value: "eastasia" }, "East Asia")))),
        React.createElement("div", { className: "flex space-x-4" },
            React.createElement("button", { onClick: saveSettings, className: "px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600" }, "Save Settings"),
            React.createElement("button", { onClick: resetQuota, className: "px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300" }, "Reset Usage Quota")),
        savedMessage && (React.createElement("div", { className: "mt-4 p-2 bg-green-100 text-green-800 rounded" }, savedMessage)),
        React.createElement("div", { className: "mt-8 text-sm text-gray-500" },
            React.createElement("h2", { className: "font-medium text-gray-700 mb-2" }, "About the Free Tier Limits"),
            React.createElement("p", null, "The free tier of Azure Translator API allows for 2 million characters per month. This extension tracks your usage to help you stay within the free limit."))));
}
