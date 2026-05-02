import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

/**
 * Toast Sollaris — estilo editorial premium (Obsidiana + Champagne Gold).
 * Substitui completamente o visual padrão branco do Lovable/Sonner.
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
            "group flex items-center gap-3 w-full max-w-[420px] px-5 py-4 rounded-none border border-[hsl(var(--gold)/0.4)] bg-[hsl(var(--obsidian))] text-[hsl(var(--cream))] shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)] backdrop-blur-md font-serif",
          title:
            "text-[13px] tracking-[0.18em] uppercase font-medium text-[hsl(var(--cream))] leading-tight",
          description:
            "text-[12px] tracking-wide text-[hsl(var(--cream)/0.7)] mt-0.5 font-sans normal-case",
          icon: "text-[hsl(var(--gold))] shrink-0",
          success:
            "border-[hsl(var(--gold)/0.5)] before:content-[''] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[2px] before:bg-[hsl(var(--gold))] relative",
          error:
            "border-[hsl(var(--bordeaux)/0.6)] before:content-[''] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[2px] before:bg-[hsl(var(--bordeaux))] relative",
          actionButton:
            "px-3 py-1.5 text-[11px] tracking-[0.2em] uppercase border border-[hsl(var(--gold))] text-[hsl(var(--gold))] hover:bg-[hsl(var(--gold))] hover:text-[hsl(var(--obsidian))] transition-colors",
          cancelButton:
            "px-3 py-1.5 text-[11px] tracking-[0.2em] uppercase text-[hsl(var(--cream)/0.6)] hover:text-[hsl(var(--cream))]",
          closeButton:
            "!bg-transparent !border-0 !text-[hsl(var(--cream)/0.5)] hover:!text-[hsl(var(--gold))]",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
