import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { updates } = await req.json();

    for (const u of updates) {
      const { error } = await supabase
        .from("products")
        .update({
          foto_frontal: u.foto_frontal,
          foto_detalhe: u.foto_detalhe,
          foto_lateral: u.foto_lateral,
          foto_lifestyle: u.foto_lifestyle,
          images: [u.foto_frontal, u.foto_detalhe, u.foto_lateral, u.foto_lifestyle],
        })
        .eq("id", u.id);

      if (error) console.error(`Error updating ${u.id}:`, error);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
