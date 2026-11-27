export type AvatarConfig = {
  skin: string;
  hair: string;
  hairColor: string;
  eyes: string;
  mouth: string;
  outfit: string;
  outfitColor: string;
  hat: string;
  accessory: string;
  background: string;
};

export type Slot = keyof AvatarConfig;

export type Cosmetic = {
  id: string;
  slot: Slot;
  value: string;
  name: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  is_free: boolean;
  unlock_hint: string | null;
  unlocked: boolean;
};

export type Achievement = {
  id: string;
  name: string;
  description: string;
  icon: string;
  category?: string;
  earned_at?: string;
  reward?: { id: string; name: string } | null;
};

export type LeaderboardRow = {
  rank: number;
  user_id: string;
  username: string;
  avatar: AvatarConfig | null;
  country: string | null;
  score: number;
  games: number;
  total_time_ms: number;
  is_me: boolean;
};

export type HistoryItem = {
  attempt_id?: string;
  quiz_date: string;
  quiz_number: number;
  score: number;
  correct_count: number;
};

export type Dashboard = {
  profile: { id: string; username: string; country: string | null; is_admin: boolean; is_banned: boolean };
  avatar: AvatarConfig;
  today: {
    quiz_date: string;
    quiz_number: number;
    status: "not_started" | "in_progress" | "finished";
    attempt_id: string | null;
    score: number | null;
    correct_count: number | null;
    rank: number | null;
    players: number;
    streak_at_risk: boolean;
  };
  stats: {
    current_streak: number;
    best_streak: number;
    games_played: number;
    average_score: number;
    best_score: number;
    perfect_games: number;
    accuracy: number;
    practice_games: number;
  };
  recent_achievements: Achievement[];
  achievement_count: number;
  achievement_total: number;
  history: HistoryItem[];
};

export type PublicProfile = {
  id: string;
  username: string;
  bio: string | null;
  is_me: boolean;
  joined: string;
  friendship: "none" | "friends" | "outgoing" | "incoming";
  country: string | null;
  avatar: AvatarConfig;
  privacy: { show_country: boolean; show_stats: boolean; show_history: boolean; show_achievements: boolean } | null;
  stats: {
    games_played: number;
    average_score: number;
    best_score: number;
    current_streak: number;
    best_streak: number;
    perfect_games: number;
    accuracy: number;
  } | null;
  ranks: { daily: number | null; weekly: number | null; alltime: number | null } | null;
  achievements: Achievement[] | null;
  achievement_total: number;
  recent: HistoryItem[] | null;
};

export type QuestionPayload = {
  done: false;
  position: number;
  total: number;
  category: string;
  difficulty: number;
  prompt: string;
  options: string[];
  time_limit_ms: number;
  remaining_ms: number;
  score_so_far: number;
  history?: (boolean | null)[];
};

export type AnswerResult = {
  position: number;
  correct: boolean;
  timed_out: boolean;
  selected_index: number | null;
  correct_index: number;
  explanation: string;
  points: number;
  elapsed_ms: number;
  score_so_far: number;
  done: boolean;
  summary?: AttemptSummary;
};

export type AttemptSummary = {
  attempt_id: string;
  mode: "ranked" | "practice";
  score: number;
  correct_count: number;
  total_time_ms: number;
  max_score: number;
  current_streak?: number;
  best_streak?: number;
  daily_rank?: number | null;
  new_achievements: Achievement[];
};

export type ReviewAnswer = {
  position: number;
  category: string;
  difficulty: number;
  prompt: string;
  options: string[];
  correct_index: number;
  selected_index: number | null;
  is_correct: boolean;
  points: number;
  elapsed_ms: number;
  explanation: string;
};

export type AttemptReview = {
  attempt_id: string;
  mode: "ranked" | "practice";
  quiz_date: string;
  quiz_number: number;
  score: number;
  correct_count: number;
  total_time_ms: number;
  max_score: number;
  daily_rank: number | null;
  answers: ReviewAnswer[];
};

export type ShareCard = {
  username: string;
  avatar: AvatarConfig;
  country: string | null;
  quiz_date: string;
  quiz_number: number;
  score: number;
  correct_count: number;
  max_score: number;
  grid: { c: boolean; p: number }[];
  streak: number;
};

export const CATEGORIES = [
  "history",
  "science",
  "geography",
  "sport",
  "entertainment",
  "technology",
  "literature",
  "general",
] as const;
export type Category = (typeof CATEGORIES)[number];
