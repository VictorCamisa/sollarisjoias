import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  const url = new URL(req.url);
  const page = url.searchParams.get("page") || "vitrine";
  
  // Base URL of the published site — fallback to origin
  const siteUrl = Deno.env.get("SITE_URL") || url.origin.replace("/functions/v1/og-share", "");
  const projectUrl = Deno.env.get("SUPABASE_URL") || "";
  
  // OG image hosted in public folder of the frontend
  const ogImage = `${siteUrl}/og-vitrine.jpg`;
  
  const pages: Record<string, { title: string; description: string; path: string }> = {
    vitrine: {
      title: "SOLLARIS — Vitrine de Semijoias",
      description: "Confira nossa curadoria exclusiva de semijoias premium. Peças selecionadas a dedo com banho de ouro 18k e acabamento de alta joalheria. Veja e peça pelo WhatsApp.",
      path: "/vitrine",
    },
  };

  const pageData = pages[page] || pages.vitrine;
  const redirectUrl = `${siteUrl}${pageData.path}`;

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${pageData.title}</title>
  <meta name="description" content="${pageData.description}" />
  
  <!-- Open Graph -->
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${pageData.title}" />
  <meta property="og:description" content="${pageData.description}" />
  <meta property="og:image" content="${ogImage}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:url" content="${redirectUrl}" />
  <meta property="og:site_name" content="SOLLARIS" />
  <meta property="og:locale" content="pt_BR" />
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${pageData.title}" />
  <meta name="twitter:description" content="${pageData.description}" />
  <meta name="twitter:image" content="${ogImage}" />
  
  <!-- Redirect real users to the SPA -->
  <meta http-equiv="refresh" content="0;url=${redirectUrl}" />
  <link rel="canonical" href="${redirectUrl}" />
</head>
<body style="background:#0F0F14;color:#D1BF94;font-family:Georgia,serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;text-align:center;">
  <div>
    <h1 style="font-size:2rem;letter-spacing:0.1em;margin-bottom:0.5rem;">SOLLARIS</h1>
    <p style="font-size:0.875rem;opacity:0.7;">Redirecionando para a vitrine...</p>
    <p style="margin-top:1rem;"><a href="${redirectUrl}" style="color:#D1BF94;">Clique aqui se não for redirecionado</a></p>
  </div>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
});
