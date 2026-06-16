export interface LeaderboardEntry {
  participant_id: number;
  name: string;
  total_points: number;
  exactos: number;
  ganador_correcto: number;
  fallados: number;
  partidos_jugados: number;
}

export interface Match {
  id: number;
  group_name: string;
  home_code: string;
  away_code: string;
  home_name: string;
  away_name: string;
  result_home: number | null;
  result_away: number | null;
  status: 'scheduled' | 'live' | 'finished';
}

export interface Prediction {
  match_id: number;
  pred_home: number | null;
  pred_away: number | null;
}

export interface ParticipantDetail {
  participant_id: number;
  name: string;
  total_points: number;
  exactos: number;
  ganador_correcto: number;
  predictions: Array<{
    match_id: number;
    pred_home: number | null;
    pred_away: number | null;
    points: number | null;
  }>;
}
