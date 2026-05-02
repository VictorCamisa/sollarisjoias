import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

const emailSchema = z.string().trim().email("Email inválido").max(255);

const NewsletterBlock = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase
        .from("newsletter_subscribers")
        .insert({ email: parsed.data });
      if (error && !error.message.includes("duplicate")) throw error;
      toast.success("Bem-vinda à Maison Sollaris ✨");
      setEmail("");
    } catch (err: any) {
      toast.error("Não foi possível inscrever. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-bordeaux text-maison-creme py-16 sm:py-20">
      <div className="max-w-2xl mx-auto px-6 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-maison-gold-soft mb-4">
          Lista privada
        </p>
        <h2 className="font-display text-3xl sm:text-4xl tracking-tight mb-4">
          Acesso antecipado às coleções.
        </h2>
        <p className="font-sans text-maison-creme/75 mb-8 leading-relaxed">
          Receba os lançamentos antes de irem ao público — e ofertas exclusivas só para clientes da casa.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            required
            className="flex-1 bg-transparent border border-maison-creme/30 px-4 py-3 text-maison-creme placeholder:text-maison-creme/40 focus:outline-none focus:border-maison-gold font-sans text-sm"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-maison-creme text-bordeaux font-mono text-[11px] uppercase tracking-[0.22em] px-6 py-3 hover:bg-maison-gold transition-colors disabled:opacity-60"
          >
            {loading ? "Enviando…" : "Inscrever"}
          </button>
        </form>
      </div>
    </section>
  );
};

export default NewsletterBlock;
