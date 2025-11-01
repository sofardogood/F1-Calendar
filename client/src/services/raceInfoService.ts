interface RaceSession {
  name: string;
  date: string;
  time_utc: string;
  time_jst: string;
}

interface RaceSessionResponse {
  sessions: RaceSession[];
  name_ja?: string;
}

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';

export async function fetchRaceSessionInfo(
  raceName: string,
  circuit: string,
  dateStart: string,
  dateEnd: string
): Promise<RaceSessionResponse> {
  if (!OPENAI_API_KEY) {
    console.warn('OpenAI API key not found');
    return { sessions: [] };
  }

  try {
    const prompt = `以下のF1レース情報について、正確なセッション時間を提供してください。

レース名: ${raceName}
サーキット: ${circuit}
開催期間: ${dateStart} から ${dateEnd}

以下の形式でJSON形式で返してください：
{
  "name_ja": "レース名の日本語訳",
  "sessions": [
    {
      "name": "Free Practice 1",
      "date": "YYYY-MM-DD",
      "time_utc": "HH:MM",
      "time_jst": "HH:MM"
    },
    ...
  ]
}

注意事項：
- セッション名は "Free Practice 1", "Free Practice 2", "Free Practice 3", "Qualifying", "Race" を使用
- スプリントレースがある場合は "Sprint Qualifying" と "Sprint" を追加
- time_jstが翌日になる場合は "HH:MM+1" の形式で表記
- 実際のF1公式スケジュールに基づいて正確な時間を提供してください`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that provides accurate F1 race schedule information in JSON format.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    // Extract JSON from markdown code blocks if present
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;

    const result = JSON.parse(jsonStr.trim());
    return result;
  } catch (error) {
    console.error('Error fetching race session info:', error);
    return { sessions: [] };
  }
}
