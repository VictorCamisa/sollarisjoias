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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      analytics_carts: {
        Row: {
          created_at: string
          customer_name: string | null
          customer_phone: string | null
          id: string
          is_open: boolean
          item_count: number
          items: Json
          session_id: string
          total_value: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          is_open?: boolean
          item_count?: number
          items?: Json
          session_id: string
          total_value?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          is_open?: boolean
          item_count?: number
          items?: Json
          session_id?: string
          total_value?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          path: string | null
          product_id: string | null
          product_name: string | null
          session_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          path?: string | null
          product_id?: string | null
          product_name?: string | null
          session_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          path?: string | null
          product_id?: string | null
          product_name?: string | null
          session_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      analytics_pageviews: {
        Row: {
          duration_ms: number | null
          entered_at: string
          id: string
          left_at: string | null
          path: string
          referrer: string | null
          session_id: string
          title: string | null
          user_id: string | null
        }
        Insert: {
          duration_ms?: number | null
          entered_at?: string
          id?: string
          left_at?: string | null
          path: string
          referrer?: string | null
          session_id: string
          title?: string | null
          user_id?: string | null
        }
        Update: {
          duration_ms?: number | null
          entered_at?: string
          id?: string
          left_at?: string | null
          path?: string
          referrer?: string | null
          session_id?: string
          title?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      analytics_sessions: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          device_type: string | null
          ended_at: string | null
          id: string
          is_active: boolean
          landing_page: string | null
          last_seen_at: string
          os: string | null
          pageview_count: number
          referrer: string | null
          region: string | null
          session_id: string
          started_at: string
          user_agent: string | null
          user_id: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          visitor_id: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          device_type?: string | null
          ended_at?: string | null
          id?: string
          is_active?: boolean
          landing_page?: string | null
          last_seen_at?: string
          os?: string | null
          pageview_count?: number
          referrer?: string | null
          region?: string | null
          session_id: string
          started_at?: string
          user_agent?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          visitor_id?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          device_type?: string | null
          ended_at?: string | null
          id?: string
          is_active?: boolean
          landing_page?: string | null
          last_seen_at?: string
          os?: string | null
          pageview_count?: number
          referrer?: string | null
          region?: string | null
          session_id?: string
          started_at?: string
          user_agent?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      brain_conversations: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      brain_messages: {
        Row: {
          actions: string[] | null
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          actions?: string[] | null
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          actions?: string[] | null
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "brain_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "brain_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_assets: {
        Row: {
          content: string | null
          created_at: string
          file_url: string | null
          id: string
          is_active: boolean
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          file_url?: string | null
          id?: string
          is_active?: boolean
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          file_url?: string | null
          id?: string
          is_active?: boolean
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          min_order_value: number | null
          used_count: number
        }
        Insert: {
          code: string
          created_at?: string
          discount_type: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_order_value?: number | null
          used_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_order_value?: number | null
          used_count?: number
        }
        Relationships: []
      }
      customer_addresses: {
        Row: {
          city: string
          complement: string | null
          created_at: string
          id: string
          is_default: boolean
          label: string
          neighborhood: string
          number: string
          recipient_name: string
          state: string
          street: string
          updated_at: string
          user_id: string
          zip: string
        }
        Insert: {
          city: string
          complement?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string
          neighborhood: string
          number: string
          recipient_name: string
          state: string
          street: string
          updated_at?: string
          user_id: string
          zip: string
        }
        Update: {
          city?: string
          complement?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string
          neighborhood?: string
          number?: string
          recipient_name?: string
          state?: string
          street?: string
          updated_at?: string
          user_id?: string
          zip?: string
        }
        Relationships: []
      }
      customer_extra_info: {
        Row: {
          birthday: string | null
          cpf: string | null
          created_at: string
          customer_email: string | null
          customer_phone: string | null
          full_address: string | null
          id: string
          order_id: string | null
          wants_vip: boolean
        }
        Insert: {
          birthday?: string | null
          cpf?: string | null
          created_at?: string
          customer_email?: string | null
          customer_phone?: string | null
          full_address?: string | null
          id?: string
          order_id?: string | null
          wants_vip?: boolean
        }
        Update: {
          birthday?: string | null
          cpf?: string | null
          created_at?: string
          customer_email?: string | null
          customer_phone?: string | null
          full_address?: string | null
          id?: string
          order_id?: string | null
          wants_vip?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "customer_extra_info_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_favorites: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: []
      }
      financial_categories: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
          type: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
          type: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          type?: string
        }
        Relationships: []
      }
      financial_transactions: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string
          customer_name: string | null
          customer_phone: string | null
          description: string
          due_date: string | null
          id: string
          installment_number: number | null
          installments: number | null
          notes: string | null
          order_id: string | null
          paid_date: string | null
          payment_method: string | null
          status: string
          sub_type: string | null
          type: string
          updated_at: string
        }
        Insert: {
          amount?: number
          category_id?: string | null
          created_at?: string
          customer_name?: string | null
          customer_phone?: string | null
          description: string
          due_date?: string | null
          id?: string
          installment_number?: number | null
          installments?: number | null
          notes?: string | null
          order_id?: string | null
          paid_date?: string | null
          payment_method?: string | null
          status?: string
          sub_type?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string
          customer_name?: string | null
          customer_phone?: string | null
          description?: string
          due_date?: string | null
          id?: string
          installment_number?: number | null
          installments?: number | null
          notes?: string | null
          order_id?: string | null
          paid_date?: string | null
          payment_method?: string | null
          status?: string
          sub_type?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "financial_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      google_integrations: {
        Row: {
          access_token: string
          connected_at: string
          email_google: string
          expires_at: string
          id: string
          refresh_token: string
          scopes: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          connected_at?: string
          email_google: string
          expires_at: string
          id?: string
          refresh_token: string
          scopes: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          connected_at?: string
          email_google?: string
          expires_at?: string
          id?: string
          refresh_token?: string
          scopes?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      marketing_posts: {
        Row: {
          best_time: string | null
          caption: string
          created_at: string
          created_by: string | null
          hashtags: string[] | null
          id: string
          image_url: string | null
          platform: string
          platform_tips: string | null
          product_id: string | null
          prompt: string
          status: string
          style: string | null
          updated_at: string
          visual_suggestion: string | null
        }
        Insert: {
          best_time?: string | null
          caption: string
          created_at?: string
          created_by?: string | null
          hashtags?: string[] | null
          id?: string
          image_url?: string | null
          platform?: string
          platform_tips?: string | null
          product_id?: string | null
          prompt: string
          status?: string
          style?: string | null
          updated_at?: string
          visual_suggestion?: string | null
        }
        Update: {
          best_time?: string | null
          caption?: string
          created_at?: string
          created_by?: string | null
          hashtags?: string[] | null
          id?: string
          image_url?: string | null
          platform?: string
          platform_tips?: string | null
          product_id?: string | null
          prompt?: string
          status?: string
          style?: string | null
          updated_at?: string
          visual_suggestion?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketing_posts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          content: string | null
          created_at: string
          created_by: string | null
          id: string
          is_pinned: boolean
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_pinned?: boolean
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_pinned?: boolean
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          created_at: string
          customer_cpf: string | null
          customer_email: string | null
          customer_id: string | null
          customer_name: string
          customer_phone: string
          id: string
          installments: number
          items: Json
          notes: string | null
          payment_method: string | null
          sale_channel: string | null
          shipping_carrier: string | null
          shipping_city: string | null
          shipping_complement: string | null
          shipping_cost: number | null
          shipping_eta_days: number | null
          shipping_neighborhood: string | null
          shipping_number: string | null
          shipping_state: string | null
          shipping_street: string | null
          shipping_zip: string | null
          sold_at: string | null
          sold_by: string | null
          sold_by_name: string | null
          status: string
          total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_cpf?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name: string
          customer_phone: string
          id?: string
          installments?: number
          items?: Json
          notes?: string | null
          payment_method?: string | null
          sale_channel?: string | null
          shipping_carrier?: string | null
          shipping_city?: string | null
          shipping_complement?: string | null
          shipping_cost?: number | null
          shipping_eta_days?: number | null
          shipping_neighborhood?: string | null
          shipping_number?: string | null
          shipping_state?: string | null
          shipping_street?: string | null
          shipping_zip?: string | null
          sold_at?: string | null
          sold_by?: string | null
          sold_by_name?: string | null
          status?: string
          total?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_cpf?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string
          id?: string
          installments?: number
          items?: Json
          notes?: string | null
          payment_method?: string | null
          sale_channel?: string | null
          shipping_carrier?: string | null
          shipping_city?: string | null
          shipping_complement?: string | null
          shipping_cost?: number | null
          shipping_eta_days?: number | null
          shipping_neighborhood?: string | null
          shipping_number?: string | null
          shipping_state?: string | null
          shipping_street?: string | null
          shipping_zip?: string | null
          sold_at?: string | null
          sold_by?: string | null
          sold_by_name?: string | null
          status?: string
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "crediario_summary"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_360"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pix_transactions: {
        Row: {
          amount: number
          created_at: string
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          description: string | null
          expires_at: string | null
          id: string
          mp_payment_id: string | null
          order_id: string | null
          paid_at: string | null
          qr_code: string | null
          qr_code_base64: string | null
          raw_response: Json | null
          status: string
          ticket_url: string | null
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          mp_payment_id?: string | null
          order_id?: string | null
          paid_at?: string | null
          qr_code?: string | null
          qr_code_base64?: string | null
          raw_response?: Json | null
          status?: string
          ticket_url?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          mp_payment_id?: string | null
          order_id?: string | null
          paid_at?: string | null
          qr_code?: string | null
          qr_code_base64?: string | null
          raw_response?: Json | null
          status?: string
          ticket_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pix_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          banho: string | null
          category_id: string | null
          colors: string[] | null
          cost_fees: number | null
          cost_packaging: number | null
          cost_shipping: number | null
          cost_taxes: number | null
          cost_total: number | null
          cost_unit: number | null
          created_at: string
          description: string | null
          foto_detalhe: string | null
          foto_frontal: string | null
          foto_lateral: string | null
          foto_lifestyle: string | null
          id: string
          images: string[] | null
          internal_notes: string | null
          is_featured: boolean
          markup_percent: number | null
          material: string | null
          name: string
          original_price: number | null
          pedra: string | null
          price: number
          priority: string | null
          profit_amount: number | null
          purchase_date: string | null
          sizes: string[] | null
          sku: string | null
          stock_quantity: number | null
          stock_status: boolean
          supplier_code: string | null
          supplier_name: string | null
          tags: string[] | null
          tags_seo: string | null
          updated_at: string
          weight_g: number | null
        }
        Insert: {
          banho?: string | null
          category_id?: string | null
          colors?: string[] | null
          cost_fees?: number | null
          cost_packaging?: number | null
          cost_shipping?: number | null
          cost_taxes?: number | null
          cost_total?: number | null
          cost_unit?: number | null
          created_at?: string
          description?: string | null
          foto_detalhe?: string | null
          foto_frontal?: string | null
          foto_lateral?: string | null
          foto_lifestyle?: string | null
          id?: string
          images?: string[] | null
          internal_notes?: string | null
          is_featured?: boolean
          markup_percent?: number | null
          material?: string | null
          name: string
          original_price?: number | null
          pedra?: string | null
          price?: number
          priority?: string | null
          profit_amount?: number | null
          purchase_date?: string | null
          sizes?: string[] | null
          sku?: string | null
          stock_quantity?: number | null
          stock_status?: boolean
          supplier_code?: string | null
          supplier_name?: string | null
          tags?: string[] | null
          tags_seo?: string | null
          updated_at?: string
          weight_g?: number | null
        }
        Update: {
          banho?: string | null
          category_id?: string | null
          colors?: string[] | null
          cost_fees?: number | null
          cost_packaging?: number | null
          cost_shipping?: number | null
          cost_taxes?: number | null
          cost_total?: number | null
          cost_unit?: number | null
          created_at?: string
          description?: string | null
          foto_detalhe?: string | null
          foto_frontal?: string | null
          foto_lateral?: string | null
          foto_lifestyle?: string | null
          id?: string
          images?: string[] | null
          internal_notes?: string | null
          is_featured?: boolean
          markup_percent?: number | null
          material?: string | null
          name?: string
          original_price?: number | null
          pedra?: string | null
          price?: number
          priority?: string | null
          profit_amount?: number | null
          purchase_date?: string | null
          sizes?: string[] | null
          sku?: string | null
          stock_quantity?: number | null
          stock_status?: boolean
          supplier_code?: string | null
          supplier_name?: string | null
          tags?: string[] | null
          tags_seo?: string | null
          updated_at?: string
          weight_g?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          birthday: string | null
          cargo: string | null
          cpf: string | null
          created_at: string
          credit_blocked: boolean | null
          credit_limit: number | null
          credit_score: number | null
          email: string | null
          full_name: string | null
          id: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          birthday?: string | null
          cargo?: string | null
          cpf?: string | null
          created_at?: string
          credit_blocked?: boolean | null
          credit_limit?: number | null
          credit_score?: number | null
          email?: string | null
          full_name?: string | null
          id: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          birthday?: string | null
          cargo?: string | null
          cpf?: string | null
          created_at?: string
          credit_blocked?: boolean | null
          credit_limit?: number | null
          credit_score?: number | null
          email?: string | null
          full_name?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      sales_ai_config: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          only_outside_hours: boolean | null
          routing_rules: Json | null
          scenario_key: string | null
          schedule_days: number[] | null
          schedule_end: string | null
          schedule_start: string | null
          system_prompt: string | null
          temperature: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          only_outside_hours?: boolean | null
          routing_rules?: Json | null
          scenario_key?: string | null
          schedule_days?: number[] | null
          schedule_end?: string | null
          schedule_start?: string | null
          system_prompt?: string | null
          temperature?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          only_outside_hours?: boolean | null
          routing_rules?: Json | null
          scenario_key?: string | null
          schedule_days?: number[] | null
          schedule_end?: string | null
          schedule_start?: string | null
          system_prompt?: string | null
          temperature?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      sales_appointments: {
        Row: {
          client_name: string
          client_phone: string | null
          created_at: string
          duration_minutes: number
          id: string
          lead_id: string | null
          location: string | null
          notes: string | null
          scheduled_at: string
          status: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          client_name: string
          client_phone?: string | null
          created_at?: string
          duration_minutes?: number
          id?: string
          lead_id?: string | null
          location?: string | null
          notes?: string | null
          scheduled_at: string
          status?: string
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          client_name?: string
          client_phone?: string | null
          created_at?: string
          duration_minutes?: number
          id?: string
          lead_id?: string | null
          location?: string | null
          notes?: string | null
          scheduled_at?: string
          status?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_appointments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "sales_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_campaigns: {
        Row: {
          channel: string
          completed_at: string | null
          created_at: string
          description: string | null
          id: string
          message_template: string | null
          name: string
          scheduled_at: string | null
          segment_interest: string[] | null
          segment_status: string[] | null
          sent_count: number | null
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          channel?: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          message_template?: string | null
          name: string
          scheduled_at?: string | null
          segment_interest?: string[] | null
          segment_status?: string[] | null
          sent_count?: number | null
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          channel?: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          message_template?: string | null
          name?: string
          scheduled_at?: string | null
          segment_interest?: string[] | null
          segment_status?: string[] | null
          sent_count?: number | null
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      sales_knowledge_docs: {
        Row: {
          category: string | null
          content: string
          created_at: string
          id: string
          processed: boolean | null
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string
          id?: string
          processed?: boolean | null
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string
          id?: string
          processed?: boolean | null
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      sales_leads: {
        Row: {
          ai_profile_override: string | null
          avg_response_time_minutes: number | null
          budget: number | null
          campaigns_received: string[] | null
          created_at: string
          email: string | null
          engagement_score: number | null
          id: string
          interest: string | null
          last_interaction_at: string | null
          name: string
          notes: string | null
          occasion: string | null
          phone: string | null
          products_viewed: string[] | null
          source: string
          status: string
          updated_at: string
        }
        Insert: {
          ai_profile_override?: string | null
          avg_response_time_minutes?: number | null
          budget?: number | null
          campaigns_received?: string[] | null
          created_at?: string
          email?: string | null
          engagement_score?: number | null
          id?: string
          interest?: string | null
          last_interaction_at?: string | null
          name: string
          notes?: string | null
          occasion?: string | null
          phone?: string | null
          products_viewed?: string[] | null
          source?: string
          status?: string
          updated_at?: string
        }
        Update: {
          ai_profile_override?: string | null
          avg_response_time_minutes?: number | null
          budget?: number | null
          campaigns_received?: string[] | null
          created_at?: string
          email?: string | null
          engagement_score?: number | null
          id?: string
          interest?: string | null
          last_interaction_at?: string | null
          name?: string
          notes?: string | null
          occasion?: string | null
          phone?: string | null
          products_viewed?: string[] | null
          source?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      sales_opportunities: {
        Row: {
          created_at: string
          id: string
          lead_id: string
          notes: string | null
          stage_entered_at: string | null
          stage_key: string
          updated_at: string
          value: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          lead_id: string
          notes?: string | null
          stage_entered_at?: string | null
          stage_key?: string
          updated_at?: string
          value?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          lead_id?: string
          notes?: string | null
          stage_entered_at?: string | null
          stage_key?: string
          updated_at?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_opportunities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "sales_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          bank_balance: number | null
          created_at: string
          evolution_instance: string | null
          id: string
          monthly_goal: number | null
          pix_discount_percent: number | null
          store_name: string
          updated_at: string
          whatsapp_number: string
        }
        Insert: {
          bank_balance?: number | null
          created_at?: string
          evolution_instance?: string | null
          id?: string
          monthly_goal?: number | null
          pix_discount_percent?: number | null
          store_name?: string
          updated_at?: string
          whatsapp_number?: string
        }
        Update: {
          bank_balance?: number | null
          created_at?: string
          evolution_instance?: string | null
          id?: string
          monthly_goal?: number | null
          pix_discount_percent?: number | null
          store_name?: string
          updated_at?: string
          whatsapp_number?: string
        }
        Relationships: []
      }
      stock_movements: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          movement_type: string
          new_stock: number | null
          notes: string | null
          order_id: string | null
          previous_stock: number | null
          product_id: string
          quantity: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          movement_type: string
          new_stock?: number | null
          notes?: string | null
          order_id?: string | null
          previous_stock?: number | null
          product_id: string
          quantity: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          movement_type?: string
          new_stock?: number | null
          notes?: string | null
          order_id?: string | null
          previous_stock?: number | null
          product_id?: string
          quantity?: number
        }
        Relationships: []
      }
      supplier_quotations: {
        Row: {
          category: string | null
          created_at: string
          id: string
          items: Json | null
          notes: string | null
          requested_at: string | null
          responded_at: string | null
          status: string
          supplier_id: string | null
          supplier_name_external: string | null
          title: string
          total: number | null
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          items?: Json | null
          notes?: string | null
          requested_at?: string | null
          responded_at?: string | null
          status?: string
          supplier_id?: string | null
          supplier_name_external?: string | null
          title: string
          total?: number | null
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          items?: Json | null
          notes?: string | null
          requested_at?: string | null
          responded_at?: string | null
          status?: string
          supplier_id?: string | null
          supplier_name_external?: string | null
          title?: string
          total?: number | null
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_quotations_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          category: string | null
          city: string | null
          contact_name: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          rating: number | null
          state: string | null
          status: string | null
          tags: string[] | null
          updated_at: string
          website: string | null
        }
        Insert: {
          category?: string | null
          city?: string | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          rating?: number | null
          state?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          category?: string | null
          city?: string | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          rating?: number | null
          state?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assigned_to: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      crediario_summary: {
        Row: {
          credit_blocked: boolean | null
          credit_limit: number | null
          credit_score: number | null
          customer_id: string | null
          full_name: string | null
          last_payment_date: string | null
          next_due_date: string | null
          open_installments: number | null
          overdue_installments: number | null
          phone: string | null
          total_overdue: number | null
          total_owed: number | null
        }
        Relationships: []
      }
      customer_360: {
        Row: {
          addresses_count: number | null
          birthday: string | null
          cpf: string | null
          credit_limit: number | null
          credit_score: number | null
          email: string | null
          favorites_count: number | null
          first_landing_page: string | null
          first_referrer: string | null
          first_utm_campaign: string | null
          first_utm_medium: string | null
          first_utm_source: string | null
          full_name: string | null
          last_city: string | null
          last_device_type: string | null
          last_region: string | null
          last_seen_at: string | null
          orders_count: number | null
          pageviews_count: number | null
          phone: string | null
          sessions_count: number | null
          signed_up_at: string | null
          total_spent: number | null
          user_id: string | null
        }
        Insert: {
          addresses_count?: never
          birthday?: string | null
          cpf?: string | null
          credit_limit?: number | null
          credit_score?: number | null
          email?: string | null
          favorites_count?: never
          first_landing_page?: never
          first_referrer?: never
          first_utm_campaign?: never
          first_utm_medium?: never
          first_utm_source?: never
          full_name?: string | null
          last_city?: never
          last_device_type?: never
          last_region?: never
          last_seen_at?: never
          orders_count?: never
          pageviews_count?: never
          phone?: string | null
          sessions_count?: never
          signed_up_at?: string | null
          total_spent?: never
          user_id?: string | null
        }
        Update: {
          addresses_count?: never
          birthday?: string | null
          cpf?: string | null
          credit_limit?: number | null
          credit_score?: number | null
          email?: string | null
          favorites_count?: never
          first_landing_page?: never
          first_referrer?: never
          first_utm_campaign?: never
          first_utm_medium?: never
          first_utm_source?: never
          full_name?: string | null
          last_city?: never
          last_device_type?: never
          last_region?: never
          last_seen_at?: never
          orders_count?: never
          pageviews_count?: never
          phone?: string | null
          sessions_count?: never
          signed_up_at?: string | null
          total_spent?: never
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      cleanup_inactive_sessions: { Args: never; Returns: undefined }
      get_or_create_customer_full: {
        Args: {
          _address?: string
          _birthday?: string
          _cpf?: string
          _email?: string
          _name: string
          _phone?: string
        }
        Returns: string
      }
      get_or_create_customer_profile: {
        Args: { _name: string; _phone: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      link_session_to_user: {
        Args: { _session_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
