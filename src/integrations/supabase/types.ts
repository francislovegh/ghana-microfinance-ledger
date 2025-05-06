export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          entity: string
          entity_id: string | null
          id: string
          ip_address: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          entity: string
          entity_id?: string | null
          id?: string
          ip_address?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          entity?: string
          entity_id?: string | null
          id?: string
          ip_address?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kyc_documents: {
        Row: {
          created_at: string | null
          document_type: string
          document_url: string
          id: string
          updated_at: string | null
          user_id: string
          verified: boolean | null
        }
        Insert: {
          created_at?: string | null
          document_type: string
          document_url: string
          id?: string
          updated_at?: string | null
          user_id: string
          verified?: boolean | null
        }
        Update: {
          created_at?: string | null
          document_type?: string
          document_url?: string
          id?: string
          updated_at?: string | null
          user_id?: string
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "kyc_documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_collaterals: {
        Row: {
          collateral_type: string
          created_at: string | null
          description: string
          document_url: string | null
          id: string
          loan_id: string
          value: number
        }
        Insert: {
          collateral_type: string
          created_at?: string | null
          description: string
          document_url?: string | null
          id?: string
          loan_id: string
          value: number
        }
        Update: {
          collateral_type?: string
          created_at?: string | null
          description?: string
          document_url?: string | null
          id?: string
          loan_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "loan_collaterals_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_guarantors: {
        Row: {
          address: string
          created_at: string | null
          document_url: string | null
          email: string | null
          full_name: string
          id: string
          id_number: string
          id_type: Database["public"]["Enums"]["id_type"]
          loan_id: string
          phone_number: string
          relationship: string
        }
        Insert: {
          address: string
          created_at?: string | null
          document_url?: string | null
          email?: string | null
          full_name: string
          id?: string
          id_number: string
          id_type: Database["public"]["Enums"]["id_type"]
          loan_id: string
          phone_number: string
          relationship: string
        }
        Update: {
          address?: string
          created_at?: string | null
          document_url?: string | null
          email?: string | null
          full_name?: string
          id?: string
          id_number?: string
          id_type?: Database["public"]["Enums"]["id_type"]
          loan_id?: string
          phone_number?: string
          relationship?: string
        }
        Relationships: [
          {
            foreignKeyName: "loan_guarantors_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_schedules: {
        Row: {
          created_at: string | null
          due_date: string
          id: string
          interest_amount: number
          is_paid: boolean | null
          loan_id: string
          paid_amount: number | null
          payment_date: string | null
          payment_number: number
          penalty_amount: number | null
          principal_amount: number
          total_amount: number
        }
        Insert: {
          created_at?: string | null
          due_date: string
          id?: string
          interest_amount: number
          is_paid?: boolean | null
          loan_id: string
          paid_amount?: number | null
          payment_date?: string | null
          payment_number: number
          penalty_amount?: number | null
          principal_amount: number
          total_amount: number
        }
        Update: {
          created_at?: string | null
          due_date?: string
          id?: string
          interest_amount?: number
          is_paid?: boolean | null
          loan_id?: string
          paid_amount?: number | null
          payment_date?: string | null
          payment_number?: number
          penalty_amount?: number | null
          principal_amount?: number
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "loan_schedules_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      loans: {
        Row: {
          amount: number
          created_at: string | null
          disbursed_at: string | null
          id: string
          interest_rate: number
          loan_number: string
          next_payment_date: string | null
          purpose: string | null
          remaining_balance: number | null
          status: Database["public"]["Enums"]["loan_status"]
          term_months: number
          total_paid: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          disbursed_at?: string | null
          id?: string
          interest_rate: number
          loan_number: string
          next_payment_date?: string | null
          purpose?: string | null
          remaining_balance?: number | null
          status?: Database["public"]["Enums"]["loan_status"]
          term_months: number
          total_paid?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          disbursed_at?: string | null
          id?: string
          interest_rate?: number
          loan_number?: string
          next_payment_date?: string | null
          purpose?: string | null
          remaining_balance?: number | null
          status?: Database["public"]["Enums"]["loan_status"]
          term_months?: number
          total_paid?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          created_at: string | null
          date_of_birth: string | null
          email: string | null
          full_name: string
          id: string
          id_number: string | null
          id_type: Database["public"]["Enums"]["id_type"] | null
          is_verified: boolean | null
          phone_number: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          full_name: string
          id: string
          id_number?: string | null
          id_type?: Database["public"]["Enums"]["id_type"] | null
          is_verified?: boolean | null
          phone_number: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          full_name?: string
          id?: string
          id_number?: string | null
          id_type?: Database["public"]["Enums"]["id_type"] | null
          is_verified?: boolean | null
          phone_number?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Relationships: []
      }
      savings_accounts: {
        Row: {
          account_number: string
          account_type: Database["public"]["Enums"]["savings_type"]
          balance: number
          created_at: string | null
          id: string
          interest_rate: number
          is_active: boolean | null
          maturity_date: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_number: string
          account_type: Database["public"]["Enums"]["savings_type"]
          balance?: number
          created_at?: string | null
          id?: string
          interest_rate: number
          is_active?: boolean | null
          maturity_date?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_number?: string
          account_type?: Database["public"]["Enums"]["savings_type"]
          balance?: number
          created_at?: string | null
          id?: string
          interest_rate?: number
          is_active?: boolean | null
          maturity_date?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "savings_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          account_id: string | null
          amount: number
          created_at: string | null
          description: string | null
          id: string
          loan_id: string | null
          metadata: Json | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          performed_by: string
          reference_number: string | null
          status: string | null
          transaction_number: string
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          created_at?: string | null
          description?: string | null
          id?: string
          loan_id?: string | null
          metadata?: Json | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          performed_by: string
          reference_number?: string | null
          status?: string | null
          transaction_number: string
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          loan_id?: string | null
          metadata?: Json | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          performed_by?: string
          reference_number?: string | null
          status?: string | null
          transaction_number?: string
          transaction_type?: Database["public"]["Enums"]["transaction_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "savings_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_account_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_loan_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_loan_schedule: {
        Args: { p_loan_id: string }
        Returns: undefined
      }
      generate_transaction_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: string
      }
      process_loan_payment: {
        Args: { p_loan_id: string; p_amount: number; p_payment_date?: string }
        Returns: number
      }
    }
    Enums: {
      id_type: "ghana_card" | "voter_id" | "passport"
      loan_status:
        | "pending"
        | "approved"
        | "disbursed"
        | "active"
        | "fully_paid"
        | "defaulted"
      payment_method:
        | "cash"
        | "bank_transfer"
        | "mtn_momo"
        | "vodafone_cash"
        | "airteltigo_money"
      savings_type: "regular" | "fixed_deposit" | "susu"
      transaction_type:
        | "deposit"
        | "withdrawal"
        | "loan_disbursement"
        | "loan_repayment"
        | "interest_payment"
        | "penalty_payment"
        | "transfer"
      user_role:
        | "admin"
        | "teller"
        | "loan_officer"
        | "field_agent"
        | "customer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      id_type: ["ghana_card", "voter_id", "passport"],
      loan_status: [
        "pending",
        "approved",
        "disbursed",
        "active",
        "fully_paid",
        "defaulted",
      ],
      payment_method: [
        "cash",
        "bank_transfer",
        "mtn_momo",
        "vodafone_cash",
        "airteltigo_money",
      ],
      savings_type: ["regular", "fixed_deposit", "susu"],
      transaction_type: [
        "deposit",
        "withdrawal",
        "loan_disbursement",
        "loan_repayment",
        "interest_payment",
        "penalty_payment",
        "transfer",
      ],
      user_role: ["admin", "teller", "loan_officer", "field_agent", "customer"],
    },
  },
} as const
