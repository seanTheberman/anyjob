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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      eloo_bookings: {
        Row: {
          address: string | null
          city: string | null
          client_id: string | null
          created_at: string | null
          estimated_hours: number | null
          id: string
          is_paid: boolean | null
          latitude: number | null
          longitude: number | null
          notes: string | null
          postal_code: string | null
          provider_id: string | null
          scheduled_date: string | null
          scheduled_time_end: string | null
          scheduled_time_start: string | null
          service_id: string | null
          status: Database["public"]["Enums"]["eloo_booking_status"] | null
          stripe_payment_intent_id: string | null
          total_price: number | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          client_id?: string | null
          created_at?: string | null
          estimated_hours?: number | null
          id?: string
          is_paid?: boolean | null
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          postal_code?: string | null
          provider_id?: string | null
          scheduled_date?: string | null
          scheduled_time_end?: string | null
          scheduled_time_start?: string | null
          service_id?: string | null
          status?: Database["public"]["Enums"]["eloo_booking_status"] | null
          stripe_payment_intent_id?: string | null
          total_price?: number | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          client_id?: string | null
          created_at?: string | null
          estimated_hours?: number | null
          id?: string
          is_paid?: boolean | null
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          postal_code?: string | null
          provider_id?: string | null
          scheduled_date?: string | null
          scheduled_time_end?: string | null
          scheduled_time_start?: string | null
          service_id?: string | null
          status?: Database["public"]["Enums"]["eloo_booking_status"] | null
          stripe_payment_intent_id?: string | null
          total_price?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "eloo_bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "eloo_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eloo_bookings_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "eloo_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eloo_bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "eloo_provider_services"
            referencedColumns: ["id"]
          },
        ]
      }
      eloo_categories: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          name_en: string | null
          slug: string
          sort_order: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          name_en?: string | null
          slug: string
          sort_order?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          name_en?: string | null
          slug?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      eloo_conversations: {
        Row: {
          booking_id: string | null
          client_id: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          last_message_at: string | null
          provider_id: string | null
        }
        Insert: {
          booking_id?: string | null
          client_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_message_at?: string | null
          provider_id?: string | null
        }
        Update: {
          booking_id?: string | null
          client_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_message_at?: string | null
          provider_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "eloo_conversations_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "eloo_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eloo_conversations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "eloo_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eloo_conversations_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "eloo_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      eloo_messages: {
        Row: {
          attachments: Json | null
          content: string
          conversation_id: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          read_at: string | null
          sender_id: string | null
        }
        Insert: {
          attachments?: Json | null
          content: string
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          read_at?: string | null
          sender_id?: string | null
        }
        Update: {
          attachments?: Json | null
          content?: string
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          read_at?: string | null
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "eloo_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "eloo_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eloo_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "eloo_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      eloo_notifications: {
        Row: {
          action_url: string | null
          created_at: string | null
          data: Json | null
          id: string
          is_read: boolean | null
          message: string | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "eloo_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "eloo_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      eloo_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          city: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string
          is_verified: boolean | null
          last_name: string | null
          latitude: number | null
          longitude: number | null
          phone: string | null
          postal_code: string | null
          role: string | null
          stripe_account_id: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id: string
          is_verified?: boolean | null
          last_name?: string | null
          latitude?: number | null
          longitude?: number | null
          phone?: string | null
          postal_code?: string | null
          role?: string | null
          stripe_account_id?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          is_verified?: boolean | null
          last_name?: string | null
          latitude?: number | null
          longitude?: number | null
          phone?: string | null
          postal_code?: string | null
          role?: string | null
          stripe_account_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      eloo_provider_services: {
        Row: {
          category_id: string | null
          created_at: string | null
          description: string | null
          hourly_rate: number
          gig_details: Json
          id: string
          is_active: boolean | null
          max_radius_km: number | null
          min_hours: number | null
          provider_id: string | null
          subcategory_id: string | null
          tags: string[] | null
          title: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          hourly_rate: number
          gig_details?: Json
          id?: string
          is_active?: boolean | null
          max_radius_km?: number | null
          min_hours?: number | null
          provider_id?: string | null
          subcategory_id?: string | null
          tags?: string[] | null
          title: string
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          hourly_rate?: number
          gig_details?: Json
          id?: string
          is_active?: boolean | null
          max_radius_km?: number | null
          min_hours?: number | null
          provider_id?: string | null
          subcategory_id?: string | null
          tags?: string[] | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "eloo_provider_services_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "eloo_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eloo_provider_services_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "eloo_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eloo_provider_services_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "eloo_subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      eloo_reviews: {
        Row: {
          booking_id: string | null
          comment: string | null
          created_at: string | null
          id: string
          is_public: boolean | null
          rating: number
          reviewee_id: string | null
          reviewer_id: string | null
        }
        Insert: {
          booking_id?: string | null
          comment?: string | null
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          rating: number
          reviewee_id?: string | null
          reviewer_id?: string | null
        }
        Update: {
          booking_id?: string | null
          comment?: string | null
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          rating?: number
          reviewee_id?: string | null
          reviewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "eloo_reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "eloo_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eloo_reviews_reviewee_id_fkey"
            columns: ["reviewee_id"]
            isOneToOne: false
            referencedRelation: "eloo_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eloo_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "eloo_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      eloo_subcategories: {
        Row: {
          base_price_per_hour: number | null
          category_id: string | null
          description: string | null
          id: string
          is_active: boolean | null
          min_hours: number | null
          name: string
          slug: string
        }
        Insert: {
          base_price_per_hour?: number | null
          category_id?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          min_hours?: number | null
          name: string
          slug: string
        }
        Update: {
          base_price_per_hour?: number | null
          category_id?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          min_hours?: number | null
          name?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "eloo_subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "eloo_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      eloo_subscriptions: {
        Row: {
          cancelled_at: string | null
          created_at: string | null
          id: string
          plan: Database["public"]["Enums"]["eloo_subscription_plan"]
          price_monthly: number | null
          renews_at: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["eloo_subscription_status"] | null
          stripe_subscription_id: string | null
          user_id: string | null
        }
        Insert: {
          cancelled_at?: string | null
          created_at?: string | null
          id?: string
          plan: Database["public"]["Enums"]["eloo_subscription_plan"]
          price_monthly?: number | null
          renews_at?: string | null
          started_at?: string | null
          status?:
            | Database["public"]["Enums"]["eloo_subscription_status"]
            | null
          stripe_subscription_id?: string | null
          user_id?: string | null
        }
        Update: {
          cancelled_at?: string | null
          created_at?: string | null
          id?: string
          plan?: Database["public"]["Enums"]["eloo_subscription_plan"]
          price_monthly?: number | null
          renews_at?: string | null
          started_at?: string | null
          status?:
            | Database["public"]["Enums"]["eloo_subscription_status"]
            | null
          stripe_subscription_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "eloo_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "eloo_profiles"
            referencedColumns: ["id"]
          },
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
      eloo_booking_status:
        | "pending"
        | "confirmed"
        | "in_progress"
        | "completed"
        | "cancelled"
      eloo_subscription_plan: "monthly" | "annual"
      eloo_subscription_status: "active" | "cancelled" | "expired" | "paused"
      eloo_user_role: "client" | "provider" | "admin"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      eloo_booking_status: [
        "pending",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled",
      ],
      eloo_subscription_plan: ["monthly", "annual"],
      eloo_subscription_status: ["active", "cancelled", "expired", "paused"],
      eloo_user_role: ["client", "provider", "admin"],
    },
  },
} as const
