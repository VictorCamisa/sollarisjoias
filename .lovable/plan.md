

## Plano: Central de Gestão de Clientes no Admin

### Contexto

Hoje o admin não tem nenhum módulo de clientes. Os pedidos salvam `customer_name`, `customer_phone`, `customer_email` como texto solto, sem vínculo a um cadastro de cliente. Não existe tabela `profiles` nem autenticação para clientes no storefront.

### O que será feito

**1. Banco de dados**

- Criar tabela `profiles` (id referenciando auth.users, nome, telefone, endereço, notas internas, created_at)
- Trigger automático: ao criar conta no auth, cria profile automaticamente
- RLS: admin lê/edita todos; cliente lê/edita só o próprio
- Adicionar coluna `customer_id` (uuid, nullable, FK para profiles) na tabela `orders` para vincular pedidos a clientes cadastrados

**2. Autenticação de clientes no storefront**

- Criar páginas `/conta/login` e `/conta/cadastro` para clientes se registrarem (email + senha)
- Página `/conta` com dados do perfil e histórico de pedidos
- Ao fazer pedido, se logado, vincula automaticamente o `customer_id`

**3. Módulo Admin: Clientes (`/admin/clientes`)**

- Lista de todos os clientes com busca por nome/email/telefone
- Ficha do cliente com:
  - Dados cadastrais (editáveis pelo admin)
  - Histórico completo de pedidos (com totais)
  - Métricas: total gasto, quantidade de pedidos, último pedido
  - Notas internas do admin sobre o cliente
- Ação: resetar senha do cliente (via `supabase.auth.admin` em edge function)
- Ação: desativar/banir cliente

**4. Edge function `admin-manage-user`**

- Função serverless que usa `SUPABASE_SERVICE_ROLE_KEY` para:
  - Resetar senha (envia email de recuperação)
  - Desativar conta
- Protegida: verifica se quem chama é admin via `has_role`

**5. Navegação**

- Adicionar "Clientes" (`Users` icon) no menu lateral do admin entre Pedidos e Newsletter

### Estrutura da tabela `profiles`

```text
profiles
├── id          uuid  PK  (= auth.users.id)
├── full_name   text
├── phone       text
├── address     text
├── notes       text       (notas internas admin)
├── created_at  timestamptz
└── updated_at  timestamptz
```

### Arquivos novos/editados

| Arquivo | Ação |
|---------|------|
| Migration SQL | Criar `profiles`, trigger, coluna `customer_id` em orders |
| `supabase/functions/admin-manage-user/index.ts` | Edge function para reset senha / desativar |
| `src/pages/admin/AdminCustomers.tsx` | Lista + ficha de clientes |
| `src/pages/admin/AdminLayout.tsx` | Adicionar link "Clientes" |
| `src/App.tsx` | Rota `/admin/clientes` + rotas de conta do cliente |
| `src/pages/account/Login.tsx` | Login do cliente |
| `src/pages/account/Register.tsx` | Cadastro do cliente |
| `src/pages/account/Account.tsx` | Área do cliente (perfil + histórico) |
| `src/components/layout/Navbar.tsx` | Link para conta/login |

