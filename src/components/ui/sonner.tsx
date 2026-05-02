import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

/**
 * Toast Sollaris — estilo editorial premium.
 * Substitui completamente o visual padrão branco do Sonner por
 * um cartão Obsidiana com filete dourado e tipografia editorial.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      position="bottom-center"
      theme="dark"
      visibleToasts={3}
      gap={10}
      className="sollaris-toaster"
      toastOptions={{
        unstyled: true,
        duration: 3500,
        classNames: {
          toast:
            "relative flex items-center gap-3 w-full max-w-[420px] px-5 py-3.5 border border-[hsl(var(--maison-gold)/0.35)] bg-[hsl(var(--sollaris-obsidiana))] text-[hsl(var(--sollaris-white))] shadow-[0_24px_60px_-22px_rgba(0,0,0,0.9)] before:content-[''] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[2px] before:bg-[hsl(var(--maison-gold))]",
          title:
            "text-[12px] tracking-[0.22em] uppercase font-medium text-[hsl(var(--sollaris-white))] leading-tight",
          description:
            "text-[12px] tracking-wide text-white/65 mt-0.5 normal-case",
          icon: "text-[hsl(var(--maison-gold))] shrink-0",
          success:
            "border-[hsl(var(--maison-gold)/0.5)] before:bg-[hsl(var(--maison-gold))]",
          error:
            "border-[hsl(var(--maison-bordeaux)/0.7)] before:bg-[hsl(var(--maison-bordeaux))]",
          info: "before:bg-[hsl(var(--maison-gold))]",
          warning:
            "border-[hsl(var(--maison-gold)/0.6)] before:bg-[hsl(var(--maison-gold))]",
          actionButton:
            "px-3 py-1.5 text-[10px] tracking-[0.22em] uppercase border border-[hsl(var(--maison-gold))] text-[hsl(var(--maison-gold))] hover:bg-[hsl(var(--maison-gold))] hover:text-[hsl(var(--sollaris-obsidiana))] transition-colors",
          cancelButton:
            "px-3 py-1.5 text-[10px] tracking-[0.22em] uppercase text-white/55 hover:text-white",
          closeButton:
            "!bg-transparent !border-0 !text-white/45 hover:!text-[hsl(var(--maison-gold))]",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
