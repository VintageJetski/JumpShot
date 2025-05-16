-- Create player_stats table
CREATE TABLE IF NOT EXISTS public.player_stats (
  id SERIAL PRIMARY KEY,
  steam_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  team_clan_name TEXT NOT NULL,
  kills INTEGER NOT NULL DEFAULT 0,
  headshots INTEGER NOT NULL DEFAULT 0,
  wallbang_kills INTEGER NOT NULL DEFAULT 0,
  assisted_flashes INTEGER NOT NULL DEFAULT 0,
  no_scope INTEGER NOT NULL DEFAULT 0,
  through_smoke INTEGER NOT NULL DEFAULT 0,
  blind_kills INTEGER NOT NULL DEFAULT 0,
  victim_blind_kills INTEGER NOT NULL DEFAULT 0,
  assists INTEGER NOT NULL DEFAULT 0,
  deaths INTEGER NOT NULL DEFAULT 0,
  kd REAL NOT NULL DEFAULT 0,
  total_rounds_won INTEGER NOT NULL DEFAULT 0,
  t_rounds_won INTEGER NOT NULL DEFAULT 0,
  ct_rounds_won INTEGER NOT NULL DEFAULT 0,
  first_kills INTEGER NOT NULL DEFAULT 0,
  ct_first_kills INTEGER NOT NULL DEFAULT 0,
  t_first_kills INTEGER NOT NULL DEFAULT 0,
  first_deaths INTEGER NOT NULL DEFAULT 0,
  ct_first_deaths INTEGER NOT NULL DEFAULT 0,
  t_first_deaths INTEGER NOT NULL DEFAULT 0,
  flashes_thrown INTEGER NOT NULL DEFAULT 0,
  ct_flashes_thrown INTEGER NOT NULL DEFAULT 0,
  t_flashes_thrown INTEGER NOT NULL DEFAULT 0,
  flashes_thrown_in_pistol_round INTEGER NOT NULL DEFAULT 0,
  he_thrown INTEGER NOT NULL DEFAULT 0,
  ct_he_thrown INTEGER NOT NULL DEFAULT 0,
  t_he_thrown INTEGER NOT NULL DEFAULT 0,
  he_thrown_in_pistol_round INTEGER NOT NULL DEFAULT 0,
  infernos_thrown INTEGER NOT NULL DEFAULT 0,
  ct_infernos_thrown INTEGER NOT NULL DEFAULT 0,
  t_infernos_thrown INTEGER NOT NULL DEFAULT 0,
  infernos_thrown_in_pistol_round INTEGER NOT NULL DEFAULT 0,
  smokes_thrown INTEGER NOT NULL DEFAULT 0,
  ct_smokes_thrown INTEGER NOT NULL DEFAULT 0,
  t_smokes_thrown INTEGER NOT NULL DEFAULT 0,
  smokes_thrown_in_pistol_round INTEGER NOT NULL DEFAULT 0,
  total_utility_thrown INTEGER NOT NULL DEFAULT 0,
  
  -- Calculated metrics
  role TEXT,
  secondary_role TEXT,
  is_main_awper BOOLEAN DEFAULT FALSE,
  is_igl BOOLEAN DEFAULT FALSE,
  piv REAL DEFAULT 0
);

-- Create player_roles table for specific role information
CREATE TABLE IF NOT EXISTS public.player_roles (
  id SERIAL PRIMARY KEY,
  steam_id TEXT NOT NULL,
  t_role TEXT,
  ct_role TEXT,
  is_igl BOOLEAN DEFAULT FALSE,
  UNIQUE(steam_id)
);

-- Update teams table to include all required fields
-- Note: We're using team_clan_name as the primary name field
ALTER TABLE public.teams
ADD COLUMN IF NOT EXISTS tir REAL DEFAULT 0,
ADD COLUMN IF NOT EXISTS sum_piv REAL DEFAULT 0,
ADD COLUMN IF NOT EXISTS synergy REAL DEFAULT 0,
ADD COLUMN IF NOT EXISTS avg_piv REAL DEFAULT 0,
ADD COLUMN IF NOT EXISTS top_player_name TEXT,
ADD COLUMN IF NOT EXISTS top_player_piv REAL DEFAULT 0;

-- Create a matches table to store match information
CREATE TABLE IF NOT EXISTS public.matches (
  id SERIAL PRIMARY KEY,
  team1 TEXT,
  team2 TEXT,
  winner TEXT,
  score TEXT,
  map TEXT,
  event TEXT,
  match_date TIMESTAMP DEFAULT NOW()
);

-- Create a rounds table to store round data
CREATE TABLE IF NOT EXISTS public.rounds (
  id SERIAL PRIMARY KEY,
  match_id INTEGER REFERENCES public.matches(id),
  round_num INTEGER NOT NULL,
  winner TEXT NOT NULL,
  reason TEXT NOT NULL,
  bomb_plant BOOLEAN DEFAULT FALSE,
  bomb_site TEXT,
  ct_team TEXT,
  t_team TEXT,
  winner_team TEXT,
  ct_equip_value INTEGER DEFAULT 0,
  t_equip_value INTEGER DEFAULT 0,
  ct_losing_streak INTEGER DEFAULT 0,
  t_losing_streak INTEGER DEFAULT 0,
  ct_buy_type TEXT,
  t_buy_type TEXT,
  first_advantage TEXT,
  demo_file_name TEXT,
  map TEXT,
  start_time TIMESTAMP,
  freeze_end_time TIMESTAMP,
  end_time TIMESTAMP,
  bomb_plant_time TIMESTAMP
);

-- Ensure indexes on frequently queried fields
CREATE INDEX IF NOT EXISTS idx_player_stats_steam_id ON public.player_stats(steam_id);
CREATE INDEX IF NOT EXISTS idx_player_stats_team ON public.player_stats(team_clan_name);
CREATE INDEX IF NOT EXISTS idx_player_roles_steam_id ON public.player_roles(steam_id);
CREATE INDEX IF NOT EXISTS idx_rounds_match_id ON public.rounds(match_id);