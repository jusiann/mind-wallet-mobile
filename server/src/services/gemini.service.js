import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const getModel = () =>
    genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL ?? 'gemini-2.0-flash' });

export const generateJSON = async (prompt, fallback = null) => {
    const model = getModel();
    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json|```/g, '').trim();
    try {
        return JSON.parse(text);
    } catch {
        return fallback;
    }
};

export const generateText = async (prompt, fallback = null) => {
    const model = getModel();
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    return text || fallback;
};
