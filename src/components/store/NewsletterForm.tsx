import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Send } from "lucide-react";

const NewsletterForm = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    const { error } = await supabase
      .from("newsletter_subscribers" as any)
      .insert({ email: email.trim().toLowerCase() } as any);

    if (error) {
      if (error.code === "23505") {
        toast.info("Este email já está cadastrado!");
      } else {
        toast.error("Erro ao cadastrar. Tente novamente.");
      }
    } else {
      toast.success("Inscrito com sucesso! 🎉");
      setEmail("");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 max-w-sm">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Seu melhor email"
        className="flex-1 bg-secondary rounded-xl px-3 py-2 text-sm outline-none border border-border focus:border-accent transition-colors placeholder:text-muted-foreground"
      />
      <Button type="submit" size="icon" className="rounded-xl h-9 w-9 shrink-0" disabled={loading}>
        <Send className="h-4 w-4" />
      </Button>
    </form>
  );
};

export default NewsletterForm;
