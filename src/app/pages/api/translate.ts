import type { NextApiRequest, NextApiResponse } from 'next';

const AZURE_ENDPOINT = process.env.AZURE_ENDPOINT || "https://api.cognitive.microsofttranslator.com";
const AZURE_KEY = process.env.AZURE_KEY || "";
const AZURE_REGION = process.env.AZURE_REGION || "eastus";

interface TranslationRequest {
    text: string;
    targetLang: string;
    sourceLang?: string;
}

interface AzureTranslation {
    text: string;
    to: string;
}

interface AzureResponse {
    translations: AzureTranslation[];
    detectedLanguage?: {
        language: string;
        score: number;
    };
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<{ translatedText: string; detectedLanguage?: string; charCount: number } | { error: string }>
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { text, targetLang, sourceLang } = req.body as TranslationRequest;
    
    if (!text || !targetLang) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Count the characters and update quota
    const charCount = text.length;
    
    try {
        // Build the API URL
        let url = `${AZURE_ENDPOINT}/translate?api-version=3.0&to=${targetLang}`;
        if (sourceLang) {
            url += `&from=${sourceLang}`;
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Ocp-Apim-Subscription-Key': AZURE_KEY,
                'Ocp-Apim-Subscription-Region': AZURE_REGION,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify([{ Text: text }]),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Translation API error: ${response.status} ${errorText}`);
        }

        const data: AzureResponse[] = await response.json();
        
        return res.status(200).json({ 
            translatedText: data[0].translations[0].text,
            detectedLanguage: data[0].detectedLanguage?.language,
            charCount 
        });
    } catch (error) {
        console.error('Translation error:', error);
        return res.status(500).json({ error: `Translation failed: ${error instanceof Error ? error.message : String(error)}` });
    }
}