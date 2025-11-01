/**
 * このファイルは廃止されました。
 * セッション情報はすべてf1_data.jsonに含まれています。
 *
 * GitHub Actionsによって毎日自動更新されます。
 * 詳細はREADME.mdを参照してください。
 */

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

/**
 * @deprecated この関数は使用されていません。f1_data.jsonから直接セッション情報を取得してください。
 */
export async function fetchRaceSessionInfo(
  raceName: string,
  circuit: string,
  dateStart: string,
  dateEnd: string
): Promise<RaceSessionResponse> {
  console.warn('fetchRaceSessionInfo is deprecated. Use f1_data.json directly.');
  return {
    sessions: [],
    name_ja: raceName
  };
}
