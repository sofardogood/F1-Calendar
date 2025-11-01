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

// レース名から対応するRound番号を取得
const getRoundNumber = (raceName: string): number => {
  const roundMapping: Record<string, number> = {
    'Australian Grand Prix': 1,
    'Chinese Grand Prix': 2,
    'Japanese Grand Prix': 3,
    'Bahrain Grand Prix': 4,
    'Saudi Arabian Grand Prix': 5,
    'Miami Grand Prix': 6,
    'Emilia-Romagna Grand Prix': 7,
    'Monaco Grand Prix': 8,
    'Spanish Grand Prix': 9,
    'Canadian Grand Prix': 10,
    'Austrian Grand Prix': 11,
    'British Grand Prix': 12,
    'Hungarian Grand Prix': 13,
    'Belgian Grand Prix': 14,
    'Dutch Grand Prix': 15,
    'Italian Grand Prix': 16,
    'Azerbaijan Grand Prix': 17,
    'Singapore Grand Prix': 18,
    'United States Grand Prix': 19,
    'Mexico City Grand Prix': 20,
    'São Paulo Grand Prix': 21,
    'Las Vegas Grand Prix': 22,
    'Qatar Grand Prix': 23,
    'Abu Dhabi Grand Prix': 24,
  };
  return roundMapping[raceName] || 1;
};

export async function fetchRaceSessionInfo(
  raceName: string,
  circuit: string,
  dateStart: string,
  dateEnd: string
): Promise<RaceSessionResponse> {
  console.log(`Fetching race info for: ${raceName}`);

  try {
    // F1ProサイトからHTMLを取得
    const response = await fetch('https://f1pro.sub.jp/2625/', {
      mode: 'cors',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    console.log('Fetched HTML from f1pro.sub.jp');

    // HTMLからセッション情報を抽出する
    // 実際のHTMLパーシングは複雑なので、OpenAI APIを使って解析
    const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';

    if (!OPENAI_API_KEY) {
      console.warn('OpenAI API key not found');
      return {
        sessions: [],
        name_ja: raceNameTranslations[raceName] || raceName
      };
    }

    // OpenAI APIでHTMLを解析
    const prompt = `以下は2025年F1カレンダー情報が記載されたHTMLです。
「${raceName}」のセッション情報（フリー走行1-3、予選、決勝）を抽出して、以下のJSON形式で返してください。

HTML:
${html.substring(0, 10000)}

求めるJSON形式:
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

注意：
- 開催期間は${dateStart}から${dateEnd}です
- time_jstが翌日になる場合は "HH:MM+1" の形式で表記
- HTMLから正確な時間を抽出してください`;

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: 'You are a helpful assistant that extracts F1 race schedule information from HTML and returns it in JSON format.',
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

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error(`OpenAI API error: ${aiResponse.status} ${aiResponse.statusText}`, errorText);
      throw new Error(`OpenAI API error: ${aiResponse.statusText}`);
    }

    const data = await aiResponse.json();
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
