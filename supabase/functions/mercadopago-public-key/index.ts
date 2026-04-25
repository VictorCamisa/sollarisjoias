// Retorna a public key do MP pro frontend (necessária pra inicializar o SDK Bricks)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const publicKey = Deno.env.get("MERCADOPAGO_PUBLIC_KEY") || "";

  return new Response(JSON.stringify({ public_key: publicKey }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
