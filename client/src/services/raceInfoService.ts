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

// レース名を日本語に翻訳するマッピング
const raceNameTranslations: Record<string, string> = {
  'Australian Grand Prix': 'オーストラリアGP',
  'Chinese Grand Prix': '中国GP',
  'Japanese Grand Prix': '日本GP',
  'Bahrain Grand Prix': 'バーレーンGP',
  'Saudi Arabian Grand Prix': 'サウジアラビアGP',
  'Miami Grand Prix': 'マイアミGP',
  'Emilia-Romagna Grand Prix': 'エミリア・ロマーニャGP',
  'Monaco Grand Prix': 'モナコGP',
  'Spanish Grand Prix': 'スペインGP',
  'Canadian Grand Prix': 'カナダGP',
  'Austrian Grand Prix': 'オーストリアGP',
  'British Grand Prix': 'イギリスGP',
  'Belgian Grand Prix': 'ベルギーGP',
  'Hungarian Grand Prix': 'ハンガリーGP',
  'Dutch Grand Prix': 'オランダGP',
  'Italian Grand Prix': 'イタリアGP',
  'Azerbaijan Grand Prix': 'アゼルバイジャンGP',
  'Singapore Grand Prix': 'シンガポールGP',
  'United States Grand Prix': 'アメリカGP',
  'Mexico City Grand Prix': 'メキシコシティGP',
  'São Paulo Grand Prix': 'サンパウロGP',
  'Las Vegas Grand Prix': 'ラスベガスGP',
  'Qatar Grand Prix': 'カタールGP',
  'Abu Dhabi Grand Prix': 'アブダビGP',
};

export async function fetchRaceSessionInfo(
  raceName: string,
  circuit: string,
  dateStart: string,
  dateEnd: string
): Promise<RaceSessionResponse> {
  console.log(`Fetching race info for: ${raceName}`);

  if (!OPENAI_API_KEY) {
    console.warn('OpenAI API key not found');
    return {
      sessions: [],
      name_ja: raceNameTranslations[raceName] || raceName
    };
  }

  try {
    const prompt = `以下のF1レース情報について、F1公式サイト(formula1.com)やMotorsport.comの最新情報に基づいて、正確なセッション時間を提供してください。

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
    {
      "name": "Free Practice 2",
      "date": "YYYY-MM-DD",
      "time_utc": "HH:MM",
      "time_jst": "HH:MM"
    },
    {
      "name": "Free Practice 3",
      "date": "YYYY-MM-DD",
      "time_utc": "HH:MM",
      "time_jst": "HH:MM"
    },
    {
      "name": "Qualifying",
      "date": "YYYY-MM-DD",
      "time_utc": "HH:MM",
      "time_jst": "HH:MM"
    },
    {
      "name": "Race",
      "date": "YYYY-MM-DD",
      "time_utc": "HH:MM",
      "time_jst": "HH:MM"
    }
  ]
}

重要な注意事項：
- 必ず2025年の実際のF1公式スケジュールを確認してください
- セッション名は必ず上記の5つを含めてください
- スプリントレースがある場合は "Sprint Qualifying" と "Sprint" を追加
- time_jstはUTC+9時間です
- time_jstが翌日になる場合は "HH:MM+1" の形式で表記してください
- F1公式サイトやMotorsport.comの最新情報に基づいて正確な時間を提供してください
- 日本語訳は正確に提供してください（例：Australian Grand Prix → オーストラリアGP）`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that provides accurate F1 race schedule information based on official F1 sources (formula1.com, motorsport.com). Always return valid JSON format.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.1,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenAI API error: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    console.log('OpenAI response:', content);

    const result = JSON.parse(content.trim());

    // 日本語訳がない場合は、マッピングから取得
    if (!result.name_ja) {
      result.name_ja = raceNameTranslations[raceName] || raceName;
    }

    return result;
  } catch (error) {
    console.error('Error fetching race session info:', error);
    return {
      sessions: [],
      name_ja: raceNameTranslations[raceName] || raceName
    };
  }
}
