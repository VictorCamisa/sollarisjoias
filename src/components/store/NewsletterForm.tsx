import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";

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
      toast.success("Inscrito com sucesso!");
      setEmail("");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 max-w-sm mx-auto">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Seu email"
        className="flex-1 bg-background/10 border border-background/20 px-4 py-2.5 text-sm text-background placeholder:text-background/40 outline-none focus:border-background/40 transition-colors rounded-sm"
      />
      <Button 
        type="submit" 
        size="icon" 
        className="h-10 w-10 shrink-0 bg-background text-foreground hover:bg-background/90 rounded-sm" 
        disabled={loading}
      >
        <ArrowRight className="h-4 w-4" />
      </Button>
    </form>
  );
};

export default NewsletterForm;
