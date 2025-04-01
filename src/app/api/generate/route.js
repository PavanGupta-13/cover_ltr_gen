// src/app/api/generate/route.js
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { prompt, resumeText, jobDescription } = await request.json();

    const payload = {
      "model": "sonar",
      "stream": false,
      "max_tokens": 1024,
      "temperature": 0.0,
      "messages": [
        {
          "role": "user",
          "content": `${prompt}\n\nResume:\n${resumeText}\n\nJob Description:\n${jobDescription}`
        }
      ]
    };

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}
