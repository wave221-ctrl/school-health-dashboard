import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
    try {
        const { prompt } = await request.json();

        if (!prompt) {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
        }

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',   // cheap and good for this use case
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert Christian school administrator and master scheduler. Give practical, specific suggestions that respect chapel, Bible classes, teacher wellbeing, and spiritual formation time.',
                },
                { role: 'user', content: prompt },
            ],
            temperature: 0.7,
            max_tokens: 1200,
        });

        const aiResponse = completion.choices[0]?.message?.content || 'No response from AI.';

        return NextResponse.json({ response: aiResponse });
    } catch (error: any) {
        console.error('OpenAI API Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to get AI suggestions' },
            { status: 500 }
        );
    }
}