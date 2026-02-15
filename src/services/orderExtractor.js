const Groq = require('groq-sdk');

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

/**
 * Extract structured order data from a transcript using Llama 3
 */
async function extractOrder(text) {
    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: `You are an expert order extraction agent for a restaurant/cafeteria set in the UAE. 
          Your task is to extract food and drink items from the user's transcript.

          Menu Context (Use this to match items):
          - Foods: Chicken Biryani (20 AED), Beef Biryani (22 AED), Paratha (2 AED), Samosa (1 AED), Butter Chicken (25 AED).
          - Drinks: Karak Chai (2 AED), Water (1 AED), Fresh Juice (10 AED), Soft Drinks (3 AED).
          
          Guidelines:
          1. Return ONLY a valid JSON object.
          2. Structure: { "items": [ { "name": string, "quantity": number, "notes": string } ], "total_price_estimate": string }
          3. If quantity is not mentioned, assume 1.
          4. Convert verbal numbers (one, two) to digits (1, 2).
          5. If notes or special requests are mentioned (e.g., "no sugar", "extra spicy"), put them in the notes field.
          6. If no items are found, return { "items": [] }.`
                },
                {
                    role: 'user',
                    content: text
                }
            ],
            model: 'llama-3.3-70b-versatile',
            response_format: { type: 'json_object' },
            temperature: 0.1, // Low temperature for consistent JSON
        });

        const result = JSON.parse(chatCompletion.choices[0].message.content);
        return result;
    } catch (error) {
        console.error('Groq Extraction Error:', error);
        return { items: [] };
    }
}

module.exports = {
    extractOrder,
};
