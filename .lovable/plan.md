# Plano de Ajustes — Sistema Sollaris

Abaixo está a análise de cada item da lista e o plano de resolução.

---

## 1. Excluir os pedidos fictícios

Executar uma query no banco para deletar os pedidos de teste existentes na tabela `orders`. Será necessário confirmar quais pedidos são fictícios (todos os existentes ou apenas alguns específicos).

**Ação:** Migration SQL com `DELETE FROM orders` (ou com filtro se necessário). Perguntar à usuária se deve apagar todos.

---

## 2. Vincular dados dos clientes de "Novos Pedidos" à aba "Clientes"

Atualmente, ao criar um pedido no `NewOrderDialog`, os campos `customer_name`, `customer_phone` e `customer_email` são salvos no pedido, mas não criam/vinculam um perfil na tabela `profiles`. Os clientes em `AdminCustomers` só aparecem se tiverem conta (perfil).

**Ação:**

- Ao criar pedido, verificar se já existe um perfil com o mesmo telefone. Se não, criar automaticamente um registro em `profiles` (via edge function ou lógica client-side com inserção anon permitida — será necessário adicionar RLS de INSERT para anon em `profiles`).
- Preencher o `customer_id` do pedido com o ID do perfil encontrado/criado.

---

## 3. Forma de pagamento na aba "Novo Pedido" (venda presencial)

O `NewOrderDialog` não possui campo de forma de pagamento.

**Ação:**

- Adicionar coluna `payment_method` à tabela `orders` (migration).
- Adicionar um select no step "Cliente" do `NewOrderDialog` com opções: PIX, Dinheiro, Cartão Crédito, Cartão Débito, Crediário.

---

## 4. Integrar saldo da conta / Esclarecer "Saldo" no Financeiro

O card "Saldo" atual calcula `receitas pagas - despesas pagas`, ou seja, é o saldo operacional (lucro líquido). Não é o saldo bancário real.

**Ação:**

- Renomear o card de "Saldo" para "Resultado" (receitas - despesas).
- Adicionar um campo `bank_balance` na tabela `settings` para o saldo real da conta, atualizável manualmente.
- Exibir um card "Saldo Conta" separado, alimentado por esse campo.

---

## 5. Visualização 3D para anéis no site

Recurso complexo que requer modelos 3D dos produtos. Não é viável implementar sem os arquivos 3D (.glb/.gltf).

**Ação:** Adiar. Quando houver modelos 3D disponíveis, integrar com `@react-three/fiber` e `@react-three/drei` na página de detalhe do produto.

---

## 6. Categorias em formato de lista, não blocos/caixas

Atualmente `AdminCategories` exibe categorias em grid de cards.

**Ação:** Substituir o grid por uma tabela/lista compacta com colunas: Nome, Slug, Qtd Produtos, Status, Ações.

---

## 7. Esclarecer "Compras" no Financeiro

O card "Compras" soma todas as transações com `sub_type` de compra (material, produto, equipamento). Mostra o total acumulado geral.

**Ação:**

- Adicionar filtro de período (mês atual / total) na aba Compras.
- Renomear o card para "Compras (mês)" mostrando apenas o mês corrente, e exibir o total acumulado como sub-texto.

---

## 8. Criar login para a Mari

Criar uma nova usuária no sistema de autenticação e atribuir o role adequado.

**Ação:** Usar a edge function `admin-manage-user` existente ou criar a conta via migration/script. Precisarei do email da Mari para prosseguir.

---

## 9. Designar tarefa para mim ou para Mari

A tabela `tasks` tem `created_by` mas não tem campo de "responsável" (assignee).

**Ação:**

- Adicionar coluna `assigned_to` (uuid, nullable) na tabela `tasks`.
- No formulário de tarefas (`AdminTarefas`), adicionar select para escolher responsável (lista de perfis admin).
- Exibir o nome do responsável na listagem.

---

## 10. Esclarecer aba "Notas" — qual o intuito?

As Notas funcionam como bloco de anotações internas da operação (lembretes, ideias, registros). Não são feedbacks para a IA.

**Ação:** Nenhuma mudança técnica necessária. Posso adicionar um texto explicativo no topo da página se desejar.

---

## 11. Mudar "Brain Nalu" para "Brain Sollaris"

O nome aparece na sidebar, na página do chat e na edge function.

**Ação:**

- `AdminLayout.tsx`: alterar label de "Brain Nalu" para "Brain Sollaris".
- `BrainNalu.tsx`: renomear todas as referências visuais.
- `brain-nalu/index.ts`: atualizar o system prompt.
- Manter a rota `/admin/brain-nalu` e o nome da edge function para evitar breaking changes.

---

## Resumo de execução por prioridade


| Prioridade | Item                                | Complexidade |
| ---------- | ----------------------------------- | ------------ |
| Alta       | 1. Excluir pedidos fictícios        | Baixa        |
| Alta       | 2. Vincular clientes pedidos→perfis | Média        |
| Alta       | 3. Forma de pgto no novo pedido     | Média        |
| Alta       | 8. Criar login Mari                 | Baixa        |
| Alta       | 11. Renomear Brain Sollaris         | Baixa        |
| Média      | 4. Saldo conta vs resultado         | Média        |
| Média      | 6. Categorias em lista              | Baixa        |
| Média      | 7. Compras com filtro período       | Baixa        |
| Média      | 9. Designar tarefa                  | Média        |
| Baixa      | 10. Texto explicativo Notas         | Baixa        |
| Adiado     | 5. Visualização 3D                  | Alta         |


---

## Informações necessárias antes de implementar

- **Item 1:** Apagar TODOS os pedidos ou apenas alguns específicos?
- **Item 8:** Qual o email da Mari, Denis e Ana para criar a conta?
- [mari@sollaris.com](mailto:mari@sollaris.com) e senha Mari@2026  
[Ana@sollaris.com](mailto:Ana@sollaris.com) e senha Ana@2026  
[Denis@sollaris.com](mailto:Denis@sollaris.com) e senha Denis@2026
- **Item 5:** Confirmar que será adiado (requer modelos 3D)? Sim.
- &nbsp;