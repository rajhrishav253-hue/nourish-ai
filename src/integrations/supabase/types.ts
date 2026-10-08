export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      ai_meal_plans: {
        Row: {
          created_at: string
          id: string
          params: Json
          plan: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          params?: Json
          plan: Json
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          params?: Json
          plan?: Json
          user_id?: string
        }
        Relationships: []
      }
      ai_recommendations: {
        Row: {
          content: string
          context: Json | null
          created_at: string
          id: string
          kind: string
          log_date: string
          user_id: string
        }
        Insert: {
          content: string
          context?: Json | null
          created_at?: string
          id?: string
          kind?: string
          log_date?: string
          user_id?: string
        }
        Update: {
          content?: string
          context?: Json | null
          created_at?: string
          id?: string
          kind?: string
          log_date?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          created_at: string
          id: string
          message: Json
          role: string
          thread_id: string
          ui_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: Json
          role: string
          thread_id: string
          ui_id: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: Json
          role?: string
          thread_id?: string
          ui_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "chat_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_threads: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      custom_meal_items: {
        Row: {
          carbs: number
          fat: number
          fiber: number
          food_id: string | null
          food_name: string
          grams: number
          id: string
          kcal: number
          meal_id: string
          protein: number
          quantity: number
          unit: string
          user_id: string
        }
        Insert: {
          carbs?: number
          fat?: number
          fiber?: number
          food_id?: string | null
          food_name: string
          grams: number
          id?: string
          kcal?: number
          meal_id: string
          protein?: number
          quantity: number
          unit: string
          user_id?: string
        }
        Update: {
          carbs?: number
          fat?: number
          fiber?: number
          food_id?: string | null
          food_name?: string
          grams?: number
          id?: string
          kcal?: number
          meal_id?: string
          protein?: number
          quantity?: number
          unit?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_meal_items_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_meal_items_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "custom_meals"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_meals: {
        Row: {
          carbs: number
          created_at: string
          fat: number
          fiber: number
          id: string
          kcal: number
          meal_type: string
          name: string
          protein: number
          user_id: string
        }
        Insert: {
          carbs?: number
          created_at?: string
          fat?: number
          fiber?: number
          id?: string
          kcal?: number
          meal_type?: string
          name: string
          protein?: number
          user_id?: string
        }
        Update: {
          carbs?: number
          created_at?: string
          fat?: number
          fiber?: number
          id?: string
          kcal?: number
          meal_type?: string
          name?: string
          protein?: number
          user_id?: string
        }
        Relationships: []
      }
      favorite_foods: {
        Row: {
          created_at: string
          food_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          food_id: string
          user_id?: string
        }
        Update: {
          created_at?: string
          food_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorite_foods_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
        ]
      }
      food_logs: {
        Row: {
          carbs: number
          created_at: string
          fat: number
          fiber: number
          food_id: string | null
          food_name: string
          grams: number
          id: string
          kcal: number
          log_date: string
          meal_type: string
          protein: number
          quantity: number
          unit: string
          user_id: string
        }
        Insert: {
          carbs?: number
          created_at?: string
          fat?: number
          fiber?: number
          food_id?: string | null
          food_name: string
          grams?: number
          id?: string
          kcal?: number
          log_date?: string
          meal_type?: string
          protein?: number
          quantity?: number
          unit?: string
          user_id?: string
        }
        Update: {
          carbs?: number
          created_at?: string
          fat?: number
          fiber?: number
          food_id?: string | null
          food_name?: string
          grams?: number
          id?: string
          kcal?: number
          log_date?: string
          meal_type?: string
          protein?: number
          quantity?: number
          unit?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "food_logs_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
        ]
      }
      foods: {
        Row: {
          carbs: number
          category: string
          created_at: string
          fat: number
          fiber: number
          id: string
          is_veg: boolean
          is_vegan: boolean
          kcal: number
          name: string
          protein: number
          servings: Json
          user_id: string | null
        }
        Insert: {
          carbs?: number
          category?: string
          created_at?: string
          fat?: number
          fiber?: number
          id?: string
          is_veg?: boolean
          is_vegan?: boolean
          kcal: number
          name: string
          protein?: number
          servings?: Json
          user_id?: string | null
        }
        Update: {
          carbs?: number
          category?: string
          created_at?: string
          fat?: number
          fiber?: number
          id?: string
          is_veg?: boolean
          is_vegan?: boolean
          kcal?: number
          name?: string
          protein?: number
          servings?: Json
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          activity_level: string | null
          age: number | null
          budget_inr: number | null
          calorie_target: number | null
          carb_target: number | null
          created_at: string
          custom_diet: string | null
          diet_pref: string | null
          dislikes: string | null
          fat_target: number | null
          fiber_target: number | null
          gender: string | null
          goal: string | null
          height_cm: number | null
          id: string
          likes: string | null
          name: string | null
          onboarded: boolean
          protein_target: number | null
          reminders: Json
          restrictions: string | null
          start_weight_kg: number | null
          target_weight_kg: number | null
          updated_at: string
          water_target_ml: number | null
          weight_kg: number | null
        }
        Insert: {
          activity_level?: string | null
          age?: number | null
          budget_inr?: number | null
          calorie_target?: number | null
          carb_target?: number | null
          created_at?: string
          custom_diet?: string | null
          diet_pref?: string | null
          dislikes?: string | null
          fat_target?: number | null
          fiber_target?: number | null
          gender?: string | null
          goal?: string | null
          height_cm?: number | null
          id: string
          likes?: string | null
          name?: string | null
          onboarded?: boolean
          protein_target?: number | null
          reminders?: Json
          restrictions?: string | null
          start_weight_kg?: number | null
          target_weight_kg?: number | null
          updated_at?: string
          water_target_ml?: number | null
          weight_kg?: number | null
        }
        Update: {
          activity_level?: string | null
          age?: number | null
          budget_inr?: number | null
          calorie_target?: number | null
          carb_target?: number | null
          created_at?: string
          custom_diet?: string | null
          diet_pref?: string | null
          dislikes?: string | null
          fat_target?: number | null
          fiber_target?: number | null
          gender?: string | null
          goal?: string | null
          height_cm?: number | null
          id?: string
          likes?: string | null
          name?: string | null
          onboarded?: boolean
          protein_target?: number | null
          reminders?: Json
          restrictions?: string | null
          start_weight_kg?: number | null
          target_weight_kg?: number | null
          updated_at?: string
          water_target_ml?: number | null
          weight_kg?: number | null
        }
        Relationships: []
      }
      water_logs: {
        Row: {
          amount_ml: number
          created_at: string
          id: string
          log_date: string
          target_ml: number | null
          user_id: string
        }
        Insert: {
          amount_ml: number
          created_at?: string
          id?: string
          log_date?: string
          target_ml?: number | null
          user_id?: string
        }
        Update: {
          amount_ml?: number
          created_at?: string
          id?: string
          log_date?: string
          target_ml?: number | null
          user_id?: string
        }
        Relationships: []
      }
      weight_logs: {
        Row: {
          created_at: string
          id: string
          log_date: string
          notes: string | null
          user_id: string
          weight_kg: number
        }
        Insert: {
          created_at?: string
          id?: string
          log_date?: string
          notes?: string | null
          user_id?: string
          weight_kg: number
        }
        Update: {
          created_at?: string
          id?: string
          log_date?: string
          notes?: string | null
          user_id?: string
          weight_kg?: number
        }
        Relationships: []
      }
    }
    Views: {
      daily_nutrition: {
        Row: {
          carbs: number | null
          fat: number | null
          fiber: number | null
          items: number | null
          kcal: number | null
          log_date: string | null
          protein: number | null
          user_id: string | null
        }
        Relationships: []
      }
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
