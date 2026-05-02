import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, MapPin, Trash2, Star } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const addressSchema = z.object({
  label: z.string().trim().min(1, "Informe um rótulo").max(40),
  recipient_name: z.string().trim().min(2, "Nome do destinatário").max(100),
  zip: z.string().trim().regex(/^\d{5}-?\d{3}$/, "CEP inválido"),
  street: z.string().trim().min(2).max(150),
  number: z.string().trim().min(1).max(15),
  complement: z.string().trim().max(80).optional().or(z.literal("")),
  neighborhood: z.string().trim().min(2).max(80),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().length(2, "UF de 2 letras"),
});

const emptyForm = {
  label: "Casa",
  recipient_name: "",
  zip: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
  is_default: false,
};

const AccountAddresses = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const { data: addresses, isLoading } = useQuery({
    queryKey: ["account-addresses", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("customer_addresses")
        .select("*")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const handleZipBlur = async () => {
    const cleanZip = form.zip.replace(/\D/g, "");
    if (cleanZip.length !== 8) return;
    try {
      const r = await fetch(`https://viacep.com.br/ws/${cleanZip}/json/`);
      const d = await r.json();
      if (!d.erro) {
        setForm((f) => ({
          ...f,
          street: f.street || d.logradouro || "",
          neighborhood: f.neighborhood || d.bairro || "",
          city: f.city || d.localidade || "",
          state: f.state || d.uf || "",
        }));
      }
    } catch {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const parsed = addressSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSaving(true);
    try {
      // se este vai ser default, desmarca os outros
      if (form.is_default) {
        await supabase.from("customer_addresses").update({ is_default: false }).eq("user_id", user.id);
      }
      const { error } = await supabase.from("customer_addresses").insert({
        ...parsed.data,
        complement: parsed.data.complement || null,
        is_default: form.is_default,
        user_id: user.id,
      });
      if (error) throw error;
      toast.success("Endereço salvo");
      setForm(emptyForm);
      setShowForm(false);
      qc.invalidateQueries({ queryKey: ["account-addresses", user.id] });
      qc.invalidateQueries({ queryKey: ["account-addresses-count", user.id] });
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remover este endereço?")) return;
    const { error } = await supabase.from("customer_addresses").delete().eq("id", id);
    if (error) toast.error("Erro ao remover");
    else {
      toast.success("Endereço removido");
      qc.invalidateQueries({ queryKey: ["account-addresses", user!.id] });
      qc.invalidateQueries({ queryKey: ["account-addresses-count", user!.id] });
    }
  };

  const handleSetDefault = async (id: string) => {
    if (!user) return;
    await supabase.from("customer_addresses").update({ is_default: false }).eq("user_id", user.id);
    await supabase.from("customer_addresses").update({ is_default: true }).eq("id", id);
    toast.success("Endereço padrão atualizado");
    qc.invalidateQueries({ queryKey: ["account-addresses", user.id] });
  };

  const inputCls = "w-full bg-background border border-border px-3 py-2 text-foreground focus:outline-none focus:border-bordeaux transition-colors text-sm";
  const labelCls = "font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/65 mb-1.5 block";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-display text-2xl text-foreground">Endereços</h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 bg-bordeaux text-maison-creme font-mono text-[11px] uppercase tracking-[0.22em] px-5 py-2.5 hover:bg-maison-bordeaux-deep transition-colors"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={1.8} /> Novo endereço
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-card border border-border p-6 space-y-4">
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Rótulo</label>
              <input className={inputCls} value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Casa, Trabalho…" />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Destinatário</label>
              <input className={inputCls} value={form.recipient_name} onChange={(e) => setForm({ ...form, recipient_name: e.target.value })} required />
            </div>
          </div>

          <div className="grid sm:grid-cols-4 gap-4">
            <div>
              <label className={labelCls}>CEP</label>
              <input className={inputCls} value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })} onBlur={handleZipBlur} placeholder="00000-000" required />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Rua</label>
              <input className={inputCls} value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} required />
            </div>
            <div>
              <label className={labelCls}>Número</label>
              <input className={inputCls} value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} required />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Complemento</label>
              <input className={inputCls} value={form.complement} onChange={(e) => setForm({ ...form, complement: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>Bairro</label>
              <input className={inputCls} value={form.neighborhood} onChange={(e) => setForm({ ...form, neighborhood: e.target.value })} required />
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className={labelCls}>Cidade</label>
              <input className={inputCls} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
            </div>
            <div>
              <label className={labelCls}>UF</label>
              <input className={inputCls} value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase().slice(0, 2) })} maxLength={2} required />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-foreground/75 cursor-pointer">
            <input type="checkbox" checked={form.is_default} onChange={(e) => setForm({ ...form, is_default: e.target.checked })} />
            Definir como endereço padrão
          </label>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="bg-bordeaux text-maison-creme font-mono text-[11px] uppercase tracking-[0.22em] px-6 py-3 hover:bg-maison-bordeaux-deep transition-colors disabled:opacity-60">
              {saving ? "Salvando…" : "Salvar endereço"}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setForm(emptyForm); }} className="font-mono text-[11px] uppercase tracking-[0.22em] text-foreground/65 hover:text-foreground px-4 py-3">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="animate-pulse h-32 bg-card border border-border" />
      ) : !addresses || addresses.length === 0 ? (
        !showForm && (
          <div className="bg-card border border-border p-10 text-center">
            <MapPin className="h-9 w-9 mx-auto text-foreground/25 mb-3" strokeWidth={1.3} />
            <p className="font-display text-lg text-foreground mb-1">Nenhum endereço salvo ainda</p>
            <p className="font-sans text-sm text-foreground/55">Adicione um endereço para agilizar seus pedidos.</p>
          </div>
        )
      ) : (
        <div className="space-y-3">
          {addresses.map((addr: any) => (
            <div key={addr.id} className="bg-card border border-border p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-bordeaux">
                    {addr.label}
                  </span>
                  {addr.is_default && (
                    <span className="font-mono text-[9px] uppercase tracking-[0.18em] bg-bordeaux text-maison-creme px-2 py-0.5 inline-flex items-center gap-1">
                      <Star className="h-2.5 w-2.5" strokeWidth={2} fill="currentColor" /> Padrão
                    </span>
                  )}
                </div>
                <p className="font-display text-base text-foreground mb-1">{addr.recipient_name}</p>
                <p className="font-sans text-sm text-foreground/70 leading-relaxed">
                  {addr.street}, {addr.number}{addr.complement ? ` · ${addr.complement}` : ""}<br />
                  {addr.neighborhood} · {addr.city}/{addr.state} · CEP {addr.zip}
                </p>
              </div>
              <div className="flex sm:flex-col gap-2 shrink-0">
                {!addr.is_default && (
                  <button onClick={() => handleSetDefault(addr.id)} className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/65 hover:text-bordeaux px-3 py-1.5 border border-border hover:border-bordeaux/40 transition-colors">
                    Tornar padrão
                  </button>
                )}
                <button onClick={() => handleDelete(addr.id)} className="font-mono text-[10px] uppercase tracking-[0.2em] text-destructive hover:bg-destructive/5 px-3 py-1.5 border border-destructive/30 transition-colors inline-flex items-center gap-1.5">
                  <Trash2 className="h-3 w-3" strokeWidth={1.6} /> Remover
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AccountAddresses;
