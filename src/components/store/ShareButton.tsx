import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ShareButtonProps {
  name: string;
  url?: string;
}

const ShareButton = ({ name, url }: ShareButtonProps) => {
  const shareUrl = url || window.location.href;
  const text = `Olha essa peça da LARIFA: ${name}`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: name, text, url: shareUrl });
      } catch {}
    } else {
      // Fallback: WhatsApp
      window.open(`https://wa.me/?text=${encodeURIComponent(`${text}\n${shareUrl}`)}`, "_blank");
      toast.success("Link copiado para compartilhar!");
    }
  };

  return (
    <Button variant="outline" size="icon" onClick={handleShare} className="rounded-xl" title="Compartilhar">
      <Share2 className="h-4 w-4" />
    </Button>
  );
};

export default ShareButton;
