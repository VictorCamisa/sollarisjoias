

## Plano: Migrar geração de imagem de volta para OpenAI (gpt-image-1)

### Problema
O código atual usa Lovable AI Gateway (Gemini) para gerar imagens, mas esta conta não tem créditos. Você já tem `OPENAI_API_KEY` configurada.

### Solução

**Arquivo: `supabase/functions/generate-post-image/index.ts`**

1. **Trocar de Lovable AI para OpenAI direta** — usar `https://api.openai.com/v1/images/generations` com modelo `gpt-image-1`
2. **Manter inputs multimodais** — o `gpt-image-1` aceita imagens inline no prompt. Enviar foto do produto, logo e referências como inputs visuais para que a arte final incorpore os elementos reais da marca
3. **Formato da request**: usar o endpoint de images/generations da OpenAI com os parâmetros corretos (`model`, `prompt`, `size: 1080x1080`, `quality: high`)
4. **Manter toda a lógica existente** de: carregar brand assets do DB, buscar produto, coletar referências, upload para storage

**Arquivo: `supabase/functions/generate-post/index.ts`**

5. **Manter no Lovable AI Gateway** para legendas (texto) — ou migrar para OpenAI também com `OPENAI_API_KEY` para consistência e evitar problemas de créditos. Usar `gpt-4o-mini` para legendas.

### Detalhes técnicos

- `gpt-image-1` suporta input multimodal via o campo `image` no body, permitindo enviar produto + logo + referências
- Size `1024x1024` (mais próximo de 1080x1080 disponível)
- Response em base64 para upload direto ao storage
- Fallback: se falhar, tentar `dall-e-3`
- Deploy automático das edge functions após edição

