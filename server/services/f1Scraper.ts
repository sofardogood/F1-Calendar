import { JSDOM } from 'jsdom';

interface RaceSession {
  name: string;
  date: string;
  time_utc: string;
  time_jst: string;
}

interface RaceInfo {
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

    // HTMLからテーブルやリストを解析
    // 実際のHTML構造に応じて調整が必要
    const raceElements = document.querySelectorAll('.race-schedule-item');

    raceElements.forEach((element) => {
      try {
        const raceInfo = parseRaceElement(element);
        if (raceInfo) {
          races.push(raceInfo);
        }
      } catch (error) {
        console.error('Failed to parse race element:', error);
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
 * レース要素をパースして情報を抽出
 */
function parseRaceElement(element: Element): RaceInfo | null {
  // HTMLの実際の構造に応じて実装
  // これはサンプル実装
  const nameElement = element.querySelector('.race-name');
  const dateElement = element.querySelector('.race-date');
  const sessionElements = element.querySelectorAll('.session-time');

  if (!nameElement || !dateElement) {
    return null;
  }

  const sessions: RaceSession[] = [];
  sessionElements.forEach((session) => {
    const sessionName = session.querySelector('.session-name')?.textContent || '';
    const sessionDate = session.querySelector('.session-date')?.textContent || '';
    const sessionTime = session.querySelector('.session-time')?.textContent || '';

    sessions.push({
      name: sessionName.trim(),
      date: sessionDate.trim(),
      time_utc: '', // 計算が必要
      time_jst: sessionTime.trim()
    });
  });

  return {
    name: nameElement.textContent?.trim() || '',
    name_ja: nameElement.getAttribute('data-ja') || '',
    circuit: element.querySelector('.circuit')?.textContent?.trim() || '',
    location: element.querySelector('.location')?.textContent?.trim() || '',
    date_start: dateElement.getAttribute('data-start') || '',
    date_end: dateElement.getAttribute('data-end') || '',
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
