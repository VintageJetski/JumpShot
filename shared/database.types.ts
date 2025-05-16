export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      players: {
        Row: {
          id: string
          name: string
          team: string | null
          tRole: string | null
          ctRole: string | null
          isIGL: boolean | null
          averageHS: number | null
          averageKills: number | null
          averageDeaths: number | null
          kdr: number | null
          clutchWinRate: number | null
          tradingSuccessRate: number | null
          openingKillRate: number | null
          firstDeathRate: number | null
          utilityDamagePerRound: number | null
          flashAssists: number | null
          piv: number | null
          consistencyScore: number | null
          timestamp: string | null
        }
        Insert: {
          id: string
          name: string
          team?: string | null
          tRole?: string | null
          ctRole?: string | null
          isIGL?: boolean | null
          averageHS?: number | null
          averageKills?: number | null
          averageDeaths?: number | null
          kdr?: number | null
          clutchWinRate?: number | null
          tradingSuccessRate?: number | null
          openingKillRate?: number | null
          firstDeathRate?: number | null
          utilityDamagePerRound?: number | null
          flashAssists?: number | null
          piv?: number | null
          consistencyScore?: number | null
          timestamp?: string | null
        }
        Update: {
          id?: string
          name?: string
          team?: string | null
          tRole?: string | null
          ctRole?: string | null
          isIGL?: boolean | null
          averageHS?: number | null
          averageKills?: number | null
          averageDeaths?: number | null
          kdr?: number | null
          clutchWinRate?: number | null
          tradingSuccessRate?: number | null
          openingKillRate?: number | null
          firstDeathRate?: number | null
          utilityDamagePerRound?: number | null
          flashAssists?: number | null
          piv?: number | null
          consistencyScore?: number | null
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "players_team_fkey"
            columns: ["team"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          }
        ]
      }
      teams: {
        Row: {
          id: string
          name: string
          tir: number | null
          winRate: number | null
          matchesPlayed: number | null
          roundWinRate: number | null
          tSideWinRate: number | null
          ctSideWinRate: number | null
          rankingPoints: number | null
          timestamp: string | null
        }
        Insert: {
          id: string
          name: string
          tir?: number | null
          winRate?: number | null
          matchesPlayed?: number | null
          roundWinRate?: number | null
          tSideWinRate?: number | null
          ctSideWinRate?: number | null
          rankingPoints?: number | null
          timestamp?: string | null
        }
        Update: {
          id?: string
          name?: string
          tir?: number | null
          winRate?: number | null
          matchesPlayed?: number | null
          roundWinRate?: number | null
          tSideWinRate?: number | null
          ctSideWinRate?: number | null
          rankingPoints?: number | null
          timestamp?: string | null
        }
        Relationships: []
      }
      matches: {
        Row: {
          id: string
          team1: string | null
          team2: string | null
          winner: string | null
          score: string | null
          map: string | null
          event: string | null
          matchDate: string | null
          timestamp: string | null
        }
        Insert: {
          id: string
          team1?: string | null
          team2?: string | null
          winner?: string | null
          score?: string | null
          map?: string | null
          event?: string | null
          matchDate?: string | null
          timestamp?: string | null
        }
        Update: {
          id?: string
          team1?: string | null
          team2?: string | null
          winner?: string | null
          score?: string | null
          map?: string | null
          event?: string | null
          matchDate?: string | null
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_team1_fkey"
            columns: ["team1"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_team2_fkey"
            columns: ["team2"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_winner_fkey"
            columns: ["winner"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          }
        ]
      }
      rounds: {
        Row: {
          id: string
          matchId: string | null
          roundNumber: number | null
          winner: string | null
          winType: string | null
          map: string | null
          timestamp: string | null
        }
        Insert: {
          id: string
          matchId?: string | null
          roundNumber?: number | null
          winner?: string | null
          winType?: string | null
          map?: string | null
          timestamp?: string | null
        }
        Update: {
          id?: string
          matchId?: string | null
          roundNumber?: number | null
          winner?: string | null
          winType?: string | null
          map?: string | null
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rounds_matchId_fkey"
            columns: ["matchId"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          }
        ]
      }
      player_stats: {
        Row: {
          id: string
          playerId: string | null
          matchId: string | null
          kills: number | null
          deaths: number | null
          assists: number | null
          hs_percentage: number | null
          adr: number | null
          kast: number | null
          first_kills: number | null
          first_deaths: number | null
          utility_damage: number | null
          flash_assists: number | null
          rating: number | null
          timestamp: string | null
        }
        Insert: {
          id: string
          playerId?: string | null
          matchId?: string | null
          kills?: number | null
          deaths?: number | null
          assists?: number | null
          hs_percentage?: number | null
          adr?: number | null
          kast?: number | null
          first_kills?: number | null
          first_deaths?: number | null
          utility_damage?: number | null
          flash_assists?: number | null
          rating?: number | null
          timestamp?: string | null
        }
        Update: {
          id?: string
          playerId?: string | null
          matchId?: string | null
          kills?: number | null
          deaths?: number | null
          assists?: number | null
          hs_percentage?: number | null
          adr?: number | null
          kast?: number | null
          first_kills?: number | null
          first_deaths?: number | null
          utility_damage?: number | null
          flash_assists?: number | null
          rating?: number | null
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_stats_matchId_fkey"
            columns: ["matchId"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_stats_playerId_fkey"
            columns: ["playerId"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for more convenient data access
export type Player = Database['public']['Tables']['players']['Row']
export type Team = Database['public']['Tables']['teams']['Row']
export type Match = Database['public']['Tables']['matches']['Row']
export type Round = Database['public']['Tables']['rounds']['Row']
export type PlayerStats = Database['public']['Tables']['player_stats']['Row']