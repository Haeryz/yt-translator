import type { NextApiRequest, NextApiResponse } from 'next';

interface TranslationRequest {
    text: string;
    targetLang: string;
}

interface AzureTranslation {
    text: string;
    to: string;
}

interface AzureResponse {
    translations: AzureTranslation[];
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<{ translatedText: string } | { error: string }>
) {
    const { text, targetLang } = req.body as TranslationRequest;

    try {
        const response = await fetch(
            `${process.env.AZURE_ENDPOINT}/translate?api-version=3.0&to=${targetLang}`,
            {
                method: 'POST',
                headers: {
                    'Ocp-Apim-Subscription-Key': process.env.AZURE_KEY!,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify([{ Text: text }]),
            }
        );

        const data: AzureResponse[] = await response.json();
        res.status(200).json({ translatedText: data[0].translations[0].text });
    } catch (error) {
        res.status(500).json({ error: `Translation failed ${error}` });
    }
}