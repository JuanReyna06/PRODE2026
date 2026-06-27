export interface LeaderboardEntry {
  participant_id: number;
  name: string;
  total_points: number;
  pts_grupos: number;
  pts_eliminatorias: number;
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

export interface KnockoutMatch {
  id: number;
  round: 'R16' | 'QF' | 'SF' | 'F';
  match_order: number;
  home_code: string | null;
  away_code: string | null;
  home_label: string | null;   // ej: 'España', '2J'
  away_label: string | null;
  result_home: number | null;
  result_away: number | null;
  penalty_winner: string | null;
  status: 'scheduled' | 'live' | 'finished';
}

export interface KnockoutPrediction {
  match_id: number;
  pred_home: number | null;
  pred_away: number | null;
  pred_winner: string | null;   // código del equipo
  pred_qualifier: string | null;
  pts_goles: number | null;
  pts_ganador: number | null;
  pts_clasificado: number | null;
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