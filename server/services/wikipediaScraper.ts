/**
 * WikipediaからF1レース情報をスクレイピング
 */

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
  results?: any[];
}

/**
 * WikipediaからF1スケジュールを取得
 */
export async function scrapeWikipediaSchedule(year: number): Promise<RaceInfo[]> {
  try {
    const url = `https://ja.wikipedia.org/wiki/${year}年のF1世界選手権`;
    console.log(`Fetching F1 schedule from Wikipedia: ${url}`);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'F1-Calendar-Scraper/1.0 (https://github.com/sofardogood/F1-Calendar; contact@example.com)'
      }
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    const races: RaceInfo[] = [];

    // "開催予定地"または"グランプリ"のセクションを探す
    const tables = document.querySelectorAll('table.wikitable');
    const seenRounds = new Set<number>();

    for (const table of tables) {
      const headers = Array.from(table.querySelectorAll('th') as NodeListOf<HTMLElement>).map(th => th.textContent?.trim() || '');

      // レーススケジュールテーブルかどうかを判定
      // ラウンド、グランプリ、サーキット、開催日の4つが揃っているテーブルのみを対象
      const hasRound = headers.some(h => h.includes('ラウンド') || h === 'Rd' || h === 'Round');
      const hasGP = headers.some(h => h.includes('グランプリ') || h.includes('GP'));
      const hasCircuit = headers.some(h => h.includes('サーキット') || h.includes('Circuit'));
      const hasDate = headers.some(h => h.includes('開催日') || h.includes('日付') || h.includes('Date'));

      const isScheduleTable = hasRound && hasGP && hasCircuit;

      if (!isScheduleTable) continue;

      const rows = table.querySelectorAll('tr');

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const cells = Array.from(row.querySelectorAll('td, th')) as HTMLElement[];

        if (cells.length < 4) continue;

        try {
          // ラウンド番号を取得
          const roundText = cells[0]?.textContent?.trim() || '';
          const roundMatch = roundText.match(/\d+/);
          if (!roundMatch) continue;

          const round = parseInt(roundMatch[0]);

          // すでに処理したラウンドはスキップ（重複を防ぐ）
          if (seenRounds.has(round)) {
            continue;
          }
          seenRounds.add(round);

          // グランプリ名を取得（日本語）
          let nameJa = '';
          let nameEn = '';
          for (const cell of cells) {
            const text = cell.textContent?.trim() || '';
            if (text.includes('GP') || text.includes('グランプリ')) {
              nameJa = text;
              // 英語名も取得を試みる
              const link = cell.querySelector('a');
              if (link) {
                nameEn = link.getAttribute('title') || link.textContent?.trim() || '';
              }
              break;
            }
          }

          if (!nameJa) continue;

          // サーキット名を取得
          let circuit = '';
          for (const cell of cells) {
            const text = cell.textContent?.trim() || '';
            if (text.includes('サーキット') || text.includes('Circuit')) {
              circuit = text.replace(/\[.*?\]/g, '').trim();
              break;
            }
          }

          // 開催地を取得
          let location = '';
          for (const cell of cells) {
            const text = cell.textContent?.trim() || '';
            // サーキット名の列の隣が開催地の可能性が高い
            if (text && !text.includes('GP') && !text.includes('グランプリ') &&
              !text.includes('サーキット') && text.length < 50) {
              location = text.replace(/\[.*?\]/g, '').trim();
              if (location && location !== roundText) break;
            }
          }

          // 日付を取得
          let dateStr = '';
          for (const cell of cells) {
            const text = cell.textContent?.trim() || '';
            if (/\d+月\d+日/.test(text) || /\d{4}-\d{2}-\d{2}/.test(text)) {
              dateStr = text.replace(/\[.*?\]/g, '').trim();
              break;
            }
          }

          // 日付をISO形式に変換
          let dateStart = '';
          let dateEnd = '';
          if (dateStr) {
            const monthDayMatch = dateStr.match(/(\d+)月(\d+)日/);
            if (monthDayMatch) {
              const month = monthDayMatch[1].padStart(2, '0');
              const day = monthDayMatch[2].padStart(2, '0');
              dateStart = `${year}-${month}-${day}`;
              dateEnd = dateStart;
            }
          }

          // デフォルト値を設定
          if (!dateStart) {
            dateStart = `${year}-01-01`;
            dateEnd = `${year}-12-31`;
          }

          races.push({
            round,
            name: nameEn || nameJa,
            name_ja: nameJa,
            circuit: circuit || 'Unknown Circuit',
            location: location || 'Unknown Location',
            date_start: dateStart,
            date_end: dateEnd,
            sessions: []
          });
        } catch (error) {
          console.error(`Error parsing race row:`, error);
          continue;
        }
      }
    }

    // ラウンド順にソート
    races.sort((a, b) => a.round - b.round);

    console.log(`Successfully scraped ${races.length} races from Wikipedia`);
    return races;
  } catch (error) {
    console.error('Error scraping Wikipedia:', error);
    throw error;
  }
}

/**
 * 特定の年度のレース詳細ページから日程情報を取得
 */
export async function scrapeRaceDetails(year: number, raceName: string): Promise<RaceSession[]> {
  try {
    // レース名からWikipediaページURLを構築
    const encodedName = encodeURIComponent(raceName.replace(/\s+/g, '_'));
    const url = `https://ja.wikipedia.org/wiki/${year}年${encodedName}`;

    console.log(`Fetching race details from: ${url}`);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'F1-Calendar-Scraper/1.0 (https://github.com/sofardogood/F1-Calendar; contact@example.com)'
      }
    });
    if (!response.ok) {
      console.warn(`Could not fetch race details: ${response.status}`);
      return [];
    }

    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    const sessions: RaceSession[] = [];

    // セッション情報を含むテーブルを探す
    const tables = document.querySelectorAll('table.wikitable');

    for (const table of tables) {
      const rows = table.querySelectorAll('tr');

      for (const row of rows) {
        const cells = Array.from(row.querySelectorAll('td, th')) as HTMLElement[];
        const text = cells.map(c => c.textContent?.trim() || '').join(' ');

        // フリー走行、予選、決勝などのキーワードを探す
        if (text.includes('フリー走行') || text.includes('予選') ||
          text.includes('スプリント') || text.includes('決勝')) {

          let sessionName = '';
          if (text.includes('フリー走行1')) sessionName = 'Free Practice 1';
          else if (text.includes('フリー走行2')) sessionName = 'Free Practice 2';
          else if (text.includes('フリー走行3')) sessionName = 'Free Practice 3';
          else if (text.includes('スプリント予選')) sessionName = 'Sprint Qualifying';
          else if (text.includes('スプリント')) sessionName = 'Sprint';
          else if (text.includes('予選')) sessionName = 'Qualifying';
          else if (text.includes('決勝')) sessionName = 'Race';

          if (sessionName && cells.length >= 2) {
            // 日付と時刻を抽出
            const dateText = cells[cells.length - 1].textContent?.trim() || '';
            const timeMatch = dateText.match(/(\d{1,2}):(\d{2})/);

            if (timeMatch) {
              const timeJst = timeMatch[0];
              const hours = parseInt(timeMatch[1]);
              const minutes = timeMatch[2];

              // JST → UTC変換
              let utcHours = hours - 9;
              if (utcHours < 0) utcHours += 24;
              const timeUtc = `${utcHours.toString().padStart(2, '0')}:${minutes}`;

              sessions.push({
                name: sessionName,
                date: `${year}-01-01`, // 実際の日付は別途取得が必要
                time_jst: timeJst,
                time_utc: timeUtc
              });
            }
          }
        }
      }
    }

    return sessions;
  } catch (error) {
    console.error(`Error scraping race details for ${raceName}:`, error);
    return [];
  }
}
