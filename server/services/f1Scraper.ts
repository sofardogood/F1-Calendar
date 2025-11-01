import { JSDOM } from 'jsdom';

interface RaceSession {
  name: string;
  date: string;
  time_utc: string;
  time_jst: string;
}

interface RaceInfo {
  round: number;
  name: string;
  name_ja: string;
  circuit: string;
  location: string;
  date_start: string;
  date_end: string;
  sessions: RaceSession[];
}

/**
 * F1Pro日本語サイトから全レースのスケジュール情報をスクレイピング
 */
export async function scrapeF1Schedule(): Promise<RaceInfo[]> {
  try {
    console.log('Fetching F1 schedule from f1pro.sub.jp...');

    const response = await fetch('https://f1pro.sub.jp/2625/');

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    const races: RaceInfo[] = [];

    // 「第X戦｜レース名GP」パターンのh3見出しを検索
    const headings = document.querySelectorAll('h3.wp-block-heading');

    headings.forEach((heading) => {
      const headingText = heading.textContent?.trim() || '';
      const match = headingText.match(/^第(\d+)戦｜(.+GP)$/);

      if (match) {
        try {
          const round = parseInt(match[1]);
          const raceNameJa = match[2];
          const raceInfo = parseRaceSection(heading, round, raceNameJa, document);

          if (raceInfo) {
            races.push(raceInfo);
          }
        } catch (error) {
          console.error(`Failed to parse race section: ${headingText}`, error);
        }
      }
    });

    console.log(`Successfully scraped ${races.length} races`);
    return races;
  } catch (error) {
    console.error('Error scraping F1 schedule:', error);
    throw error;
  }
}

/**
 * レース名の日本語から英語への変換マッピング
 */
const raceNameMapping: Record<string, { name: string; circuit: string; location: string }> = {
  'オーストラリアGP': { name: 'Australian Grand Prix', circuit: 'Albert Park Circuit', location: 'Melbourne, Australia' },
  '中国GP': { name: 'Chinese Grand Prix', circuit: 'Shanghai International Circuit', location: 'Shanghai, China' },
  '日本GP': { name: 'Japanese Grand Prix', circuit: 'Suzuka Circuit', location: 'Suzuka, Japan' },
  'バーレーンGP': { name: 'Bahrain Grand Prix', circuit: 'Bahrain International Circuit', location: 'Sakhir, Bahrain' },
  'サウジアラビアGP': { name: 'Saudi Arabian Grand Prix', circuit: 'Jeddah Corniche Circuit', location: 'Jeddah, Saudi Arabia' },
  'マイアミGP': { name: 'Miami Grand Prix', circuit: 'Miami International Autodrome', location: 'Miami, USA' },
  'エミリア・ロマーニャGP': { name: 'Emilia-Romagna Grand Prix', circuit: 'Autodromo Enzo e Dino Ferrari', location: 'Imola, Italy' },
  'モナコGP': { name: 'Monaco Grand Prix', circuit: 'Circuit de Monaco', location: 'Monte Carlo, Monaco' },
  'スペインGP': { name: 'Spanish Grand Prix', circuit: 'Circuit de Barcelona-Catalunya', location: 'Barcelona, Spain' },
  'カナダGP': { name: 'Canadian Grand Prix', circuit: 'Circuit Gilles Villeneuve', location: 'Montreal, Canada' },
  'オーストリアGP': { name: 'Austrian Grand Prix', circuit: 'Red Bull Ring', location: 'Spielberg, Austria' },
  'イギリスGP': { name: 'British Grand Prix', circuit: 'Silverstone Circuit', location: 'Silverstone, UK' },
  'ベルギーGP': { name: 'Belgian Grand Prix', circuit: 'Circuit de Spa-Francorchamps', location: 'Spa, Belgium' },
  'ハンガリーGP': { name: 'Hungarian Grand Prix', circuit: 'Hungaroring', location: 'Budapest, Hungary' },
  'オランダGP': { name: 'Dutch Grand Prix', circuit: 'Circuit Zandvoort', location: 'Zandvoort, Netherlands' },
  'イタリアGP': { name: 'Italian Grand Prix', circuit: 'Autodromo Nazionale di Monza', location: 'Monza, Italy' },
  'アゼルバイジャンGP': { name: 'Azerbaijan Grand Prix', circuit: 'Baku City Circuit', location: 'Baku, Azerbaijan' },
  'シンガポールGP': { name: 'Singapore Grand Prix', circuit: 'Marina Bay Street Circuit', location: 'Singapore' },
  'アメリカGP': { name: 'United States Grand Prix', circuit: 'Circuit of the Americas', location: 'Austin, USA' },
  'メキシコGP': { name: 'Mexico City Grand Prix', circuit: 'Autódromo Hermanos Rodríguez', location: 'Mexico City, Mexico' },
  'メキシコシティGP': { name: 'Mexico City Grand Prix', circuit: 'Autódromo Hermanos Rodríguez', location: 'Mexico City, Mexico' },
  'サンパウロGP': { name: 'São Paulo Grand Prix', circuit: 'Autódromo José Carlos Pace', location: 'São Paulo, Brazil' },
  'ラスベガスGP': { name: 'Las Vegas Grand Prix', circuit: 'Las Vegas Street Circuit', location: 'Las Vegas, USA' },
  'カタールGP': { name: 'Qatar Grand Prix', circuit: 'Losail International Circuit', location: 'Lusail, Qatar' },
  'アブダビGP': { name: 'Abu Dhabi Grand Prix', circuit: 'Yas Marina Circuit', location: 'Abu Dhabi, UAE' },
};

/**
 * セッション名を英語に変換
 */
function getSessionName(jaName: string): string {
  if (jaName.includes('FP1') || jaName.includes('フリー走行1')) return 'Free Practice 1';
  if (jaName.includes('FP2') || jaName.includes('フリー走行2')) return 'Free Practice 2';
  if (jaName.includes('FP3') || jaName.includes('フリー走行3')) return 'Free Practice 3';
  if (jaName.includes('予選') || jaName.includes('Qualifying')) return 'Qualifying';
  if (jaName.includes('スプリント予選')) return 'Sprint Qualifying';
  if (jaName.includes('スプリント')) return 'Sprint';
  if (jaName.includes('決勝') || jaName.includes('Race')) return 'Race';
  return jaName;
}

/**
 * JST時間からUTC時間を計算（簡易版）
 */
function convertJSTtoUTC(jstTime: string): string {
  const match = jstTime.match(/(\d{1,2}):(\d{2})/);
  if (!match) return jstTime;

  let hours = parseInt(match[1]);
  const minutes = match[2];

  // JST = UTC + 9
  hours = hours - 9;
  if (hours < 0) {
    hours += 24;
  }

  return `${hours.toString().padStart(2, '0')}:${minutes}`;
}

/**
 * レースセクション全体をパースして情報を抽出
 */
function parseRaceSection(heading: Element, round: number, raceNameJa: string, document: Document): RaceInfo | null {
  const raceData = raceNameMapping[raceNameJa];

  if (!raceData) {
    console.warn(`Unknown race: ${raceNameJa}`);
    return null;
  }

  const sessions: RaceSession[] = [];
  let currentDate = '';
  let dateStart = '';
  let dateEnd = '';

  // 見出しの次の要素から、次のh3までの間にあるコンテンツを解析
  let currentElement = heading.nextElementSibling;

  while (currentElement && currentElement.tagName !== 'H3') {
    // 日付ヘッダーを検索（赤背景のp要素）
    const dateHeader = currentElement.querySelector('p.has-vivid-red-background-color');
    if (dateHeader) {
      const dateText = dateHeader.textContent?.trim() || '';
      const dateMatch = dateText.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
      if (dateMatch) {
        const [, year, month, day] = dateMatch;
        currentDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

        // 最初の日付を開始日として設定
        if (!dateStart) {
          dateStart = currentDate;
        }
        // 毎回更新して最後の日付を終了日として設定
        dateEnd = currentDate;
      }
    }

    // セッション情報を含むリストを検索
    const listItems = currentElement.querySelectorAll('li');
    listItems.forEach((li) => {
      const strongElement = li.querySelector('strong');
      if (strongElement) {
        const sessionNameJa = strongElement.textContent?.trim() || '';

        // 日本時間を検索
        const timeElements = li.querySelectorAll('li');
        let timeJst = '';

        timeElements.forEach((timeEl) => {
          const timeText = timeEl.textContent?.trim() || '';
          if (timeText.includes('日本時間')) {
            const timeMatch = timeText.match(/(\d{1,2}:\d{2})/);
            if (timeMatch) {
              timeJst = timeMatch[1];
            }
          }
        });

        if (timeJst && currentDate) {
          const sessionName = getSessionName(sessionNameJa);
          const timeUtc = convertJSTtoUTC(timeJst);

          sessions.push({
            name: sessionName,
            date: currentDate,
            time_jst: timeJst,
            time_utc: timeUtc
          });
        }
      }
    });

    currentElement = currentElement.nextElementSibling;
  }

  return {
    round,
    name: raceData.name,
    name_ja: raceNameJa,
    circuit: raceData.circuit,
    location: raceData.location,
    date_start: dateStart,
    date_end: dateEnd,
    sessions
  };
}

/**
 * スクレイピング結果をJSONファイルに保存
 */
export async function updateF1DataFile(): Promise<void> {
  const races = await scrapeF1Schedule();

  // f1_data.jsonを更新
  const fs = await import('fs/promises');
  const path = await import('path');

  const dataPath = path.join(process.cwd(), 'client/src/f1_data.json');
  const currentData = JSON.parse(await fs.readFile(dataPath, 'utf-8'));

  // 既存のドライバー/コンストラクター情報は保持
  const updatedData = {
    ...currentData,
    races: races,
    last_updated: new Date().toISOString()
  };

  await fs.writeFile(dataPath, JSON.stringify(updatedData, null, 2));
  console.log('f1_data.json updated successfully');
}
