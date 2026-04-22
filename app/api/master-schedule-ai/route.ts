// app/api/master-schedule-ai/route.ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const apiKey = process.env.OPENAI_API_KEY;

        if (!apiKey) {
            console.error('OPENAI_API_KEY environment variable is missing');
            return NextResponse.json(
                { error: 'OpenAI API key is not configured on the server.' },
                { status: 500 }
            );
        }

        const { prompt } = await request.json();

        if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
            return NextResponse.json({ error: 'Valid prompt is required' }, { status: 400 });
        }

        const openai = new OpenAI({ apiKey });

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert Christian school administrator and master scheduler. Provide practical, specific suggestions that respect chapel, Bible classes, teacher well-being, and spiritual formation time.',
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
            { error: 'Failed to get AI suggestions. Please try again later.' },
            { status: 500 }
        );
    }
}