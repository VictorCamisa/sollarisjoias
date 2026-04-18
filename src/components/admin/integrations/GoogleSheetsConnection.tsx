import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { FileSpreadsheet, Link2, Unlink, ExternalLink, Loader2, CheckCircle2 } from "lucide-react";

interface SheetItem {
  id: string;
  name: string;
  modifiedTime?: string;
  webViewLink?: string;
}

export const GoogleSheetsConnection = () => {
  const qc = useQueryClient();
  const [connecting, setConnecting] = useState(false);
  const [sheets, setSheets] = useState<SheetItem[]>([]);
  const [loadingSheets, setLoadingSheets] = useState(false);

  const { data: status, isLoading } = useQuery({
    queryKey: ["google-integration-status"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("google-sheets-proxy", {
        body: { action: "status" },
      });
      if (error) throw error;
      return data as { connected: boolean; email_google?: string; connected_at?: string };
    },
  });

  // Detect callback success and refresh
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("google_connected") === "1") {
      toast.success("Google Sheets conectado!");
      url.searchParams.delete("google_connected");
      window.history.replaceState({}, "", url.toString());
      qc.invalidateQueries({ queryKey: ["google-integration-status"] });
    }
  }, [qc]);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) throw new Error("Faça login primeiro");

      const returnTo = `${window.location.origin}/admin/configuracoes?google_connected=1`;
      const initUrl = `https://${projectId}.supabase.co/functions/v1/google-oauth-callback?action=init&return_to=${encodeURIComponent(returnTo)}`;
      const res = await fetch(initUrl, {
        headers: { Authorization: `Bearer ${token}`, apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
      });
      const json = await res.json();
      if (!res.ok || !json.url) throw new Error(json.error || "Falha ao iniciar OAuth");
      window.location.href = json.url;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao conectar");
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Desconectar Google Sheets? O Brain perderá acesso às planilhas.")) return;
    const { error } = await supabase.functions.invoke("google-sheets-proxy", {
      body: { action: "disconnect" },
    });
    if (error) {
      toast.error("Erro ao desconectar");
      return;
    }
    toast.success("Desconectado");
    setSheets([]);
    qc.invalidateQueries({ queryKey: ["google-integration-status"] });
  };

  const loadSheets = async () => {
    setLoadingSheets(true);
    try {
      const { data, error } = await supabase.functions.invoke("google-sheets-proxy", {
        body: { action: "list_sheets" },
      });
      if (error) throw error;
      setSheets((data as { sheets: SheetItem[] }).sheets || []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao listar planilhas");
    } finally {
      setLoadingSheets(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Loader2 className="h-4 w-4 animate-spin" /> Carregando integração...
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-emerald-500/10 p-2 text-emerald-500">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Google Sheets</h3>
            <p className="text-sm text-muted-foreground">
              Conecte sua conta Google para o Brain ler e escrever nas suas planilhas em tempo real.
            </p>
          </div>
        </div>
        {status?.connected && (
          <Badge variant="secondary" className="gap-1 bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3" /> Conectado
          </Badge>
        )}
      </div>

      {status?.connected ? (
        <>
          <div className="rounded-md bg-secondary/40 p-3 text-sm">
            <p className="text-muted-foreground">Conta conectada</p>
            <p className="font-medium text-foreground">{status.email_google}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={loadSheets} disabled={loadingSheets}>
              {loadingSheets ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileSpreadsheet className="h-3.5 w-3.5" />}
              Listar minhas planilhas
            </Button>
            <Button size="sm" variant="outline" onClick={handleDisconnect}>
              <Unlink className="h-3.5 w-3.5" /> Desconectar
            </Button>
          </div>
          {sheets.length > 0 && (
            <div className="max-h-64 overflow-y-auto rounded-md border border-border divide-y divide-border">
              {sheets.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-2 p-2.5 text-sm hover:bg-secondary/30">
                  <span className="truncate font-medium">{s.name}</span>
                  {s.webViewLink && (
                    <a
                      href={s.webViewLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <Button onClick={handleConnect} disabled={connecting} className="gap-2">
          {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
          Conectar Google Sheets
        </Button>
      )}
    </div>
  );
};
