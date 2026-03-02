import type { CartItem } from "@/contexts/CartContext";

const DEFAULT_NUMBER = "5500000000000"; // replaced by settings

export function generateWhatsAppLink(items: CartItem[], total: number, whatsappNumber?: string) {
  const number = whatsappNumber || DEFAULT_NUMBER;

  const lines = items.map(
    (item) =>
      `• ${item.name} — Tam: ${item.size}, Cor: ${item.color}, Qtd: ${item.quantity} — R$ ${(item.price * item.quantity).toFixed(2).replace(".", ",")}\n  Imagem: ${item.image}`
  );

  const message = `Olá! Gostaria de finalizar meu pedido LARIFA 🛍️\n\n${lines.join("\n\n")}\n\n💰 *Total: R$ ${total.toFixed(2).replace(".", ",")}*`;

  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
