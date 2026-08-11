# RELATÓRIO TÉCNICO — REJEC CORP V2

> Documento para análise de continuidade. Este relatório descreve o que já foi feito,
> a arquitetura atual, problemas encontrados na revisão de código e um roadmap
> priorizado para terminar o projeto. Você (modelo de IA) pode usar este arquivo
> como contexto para corrigir bugs, implementar melhorias e concluir pendências.

---

## 1. VISÃO GERAL DO PROJETO

**Rejec Corp** é um marketplace B2B de **economia circular**: empresas compram e
vendem restos produtivos, sucatas e materiais recicláveis entre si. A plataforma
inclui cadastro de produtos, busca/filtros, favoritos, negociação (interesse →
em negociação → aceito → finalizado), chat entre empresas, notificações,
relatórios e painel administrativo.

**Stack atual:**
- React 19 + TypeScript (strict) + Vite 8
- `react-router-dom` v7 (BrowserRouter)
- Supabase: Auth, Postgres (RLS), Storage, Realtime (mensagens e notificações)
- `react-hook-form` e `zod` instalados (MAS NÃO USADOS — ver §6)
- `react-hot-toast` instalado (não usado; o projeto tem Toast próprio)
- Estilo: CSS Modules + alguns CSS globais legados; fonte Poppins
- Ícones: `react-icons/fi`

**Histórico git (tudo em `master`):**
- `056b7a9` V1 (site estático HTML/CSS/JS + PHP — arquivos legados ainda na raiz)
- `3bc7250` / `172f0bc` / `3c88724` ajustes de rotas e publicação
- `bded4bc` **Rebuild completo do frontend** em React (07/08/2026) — versão atual

**Status atual:** o projeto compila (`npm run build` ok, único aviso de chunk
>500 kB) e o lint roda com apenas warnings. `node_modules` foi instalado na
revisão (`npm install` ok, 0 vulnerabilidades).

---

## 2. INVENTÁRIO — O QUE JÁ FOI FEITO

### 2.1 Roteamento (`src/routes/AppRoutes.tsx`)
- `/` → Landing/Login (LoginPage)
- Rotas privadas (dentro de `<PrivateRoute><AppLayout/></PrivateRoute>`):
  `/dashboard`, `/marketplace`, `/produto/:id`, `/produtos`, `/cadastrar-produto`,
  `/negociacoes`, `/negociacoes/:id`, `/mensagens`, `/favoritos`, `/notificacoes`,
  `/relatorios`, `/perfil`, `/config`, `/admin`
- `*` → redireciona para `/`

### 2.2 Páginas (15)
| Página | Responsabilidade |
|---|---|
| `LoginPage` | Landing page pública (Navbar, Hero, About, Highlight, Footer) + AuthModal |
| `DashboardPage` | Estatísticas (produtos ativos, negociações, vendas/compras, rating, views), perfil, atalhos, notificações, gráfico de produtos/mês, últimos produtos |
| `MarketplacePage` | Grid de produtos com busca, filtros (categoria, material, estado, condição, preço, grátis), ordenação e paginação |
| `ProductDetailPage` | Galeria de imagens, preço, localização, descrição, ações (interesse/favoritar/compartilhar), empresa vendedora, relacionados, contador de views |
| `ProdutosPage` | Meus produtos (listar, filtrar por status, editar, excluir) |
| `CadastroProdutoPage` | Formulário criar/editar produto (basico/preço/logística/imagem) |
| `NegociacoesPage` | Lista de negociações com filtro por status, papel (comprador/vendedor) |
| `NegociacaoDetailPage` | Detalhes, aceitar/recusar/finalizar, mensagem do interessado |
| `ChatPage` | Lista de conversas + thread com realtime (subscribe em INSERT) |
| `FavoritosPage` | Produtos favoritos |
| `NotificacoesPage` | Lista de notificações, marcar como lida |
| `RelatoriosPage` | KPIs, gráfico por mês, exportar CSV (produtos/negociações), imprimir |
| `PerfilPage` | Edição de dados da empresa, logo, banner, redes sociais |
| `ConfigPage` | Conta (email/senha/logout), aparência, notificações, preferências |
| `AdminPage` | Visão geral + empresas + produtos + denúncias (4 abas) |

### 2.3 Componentes
- **Layout:** `AppLayout` (sidebar + topbar + busca global + dropdowns de notificação e usuário), `Navbar`, `LandingLayout`, `Footer`
- **Home:** `Hero`, `About`, `Highlight`
- **Auth:** `AuthModal` (login/registro), `LoginCard`
- **Negociação:** `NegotiationModal` (envio de interesse)
- **Produto:** `ProductCard`
- **UI kit (`src/components/ui/`):** Avatar, Badge, Breadcrumb, Button, Card, Checkbox, EmptyState, ImageUploader, Input, Loader (+PageLoader/SkeletonCard), Modal, Pagination, Select, Sidebar, StarRating, Switch, Textarea, Toast (ToastProvider/useToast)

### 2.4 Contextos e hooks
- `AuthContext`: sessão Supabase + perfil `companies`; recupera empresa "pendente" do `localStorage` (fluxo de confirmação de e-mail)
- `NotificationContext`: lista notificações, contador de não lidas, realtime (INSERT), marcar todas como lidas
- `useProducts` (com debounce), `useFavorites`, `useSettings`, `useCompany`, `useDebounce`, `usePagination`

### 2.5 Serviços (`src/services/`)
- `supabase/client.ts` — client + `getErrorMessage`
- `auth` — signIn, signUp, createCompanyProfile, updateProfile, signOut, resetPassword, updatePassword, updateEmail
- `companies` — getCompany, getCurrentCompany, listCompanies, updateCompany, markOnboardingDone, getCompanyStats
- `products` — buildProductQuery, listProducts (paginação), getProduct, incrementProductViews (RPC), create/update/delete, listMyProducts, listRelatedProducts
- `categories` — list, listAll, create/update/delete, listSubcategories
- `favorites` — list/is/add/remove/toggle
- `messages` — listConversations, getOrCreateConversation, getConversation, listMessages, sendMessage, markConversationRead, subscribeToConversation
- `negotiations` — create, list, get, updateNegotiationStatus, getNegotiationStats
- `notifications` — list, getUnreadCount, markRead, markAll, create, delete, subscribe
- `reviews` — listReviews, createReview, refreshCompanyRating
- `reports` — createReport, listReports, updateReportStatus
- `admin` — getAdminDashboard, adminListCompanies, toggleVerified/Active, deleteCompany, adminListProducts, deleteProduct, exportToCSV
- `activity` — logActivity, listActivities
- `settings` — getSettings, saveSettings
- `exports` — downloadCSV, printReport
- `storage` — getPublicUrl, uploadFile, uploadImages, uploadDocuments, removeFile, uploadCompanyMedia

### 2.6 Tipos (`src/types/`) e utilitários
- 13 arquivos de tipos + barrel `index.ts`
- `utils/format.ts`: formatCurrency, formatNumber, formatQuantity, formatDate, formatDateTime, timeAgo, formatCEP, formatCNPJ, formatPhone, initials, monthLabel

### 2.7 Banco de dados (`supabase/schema.sql`)
14 tabelas em `public` com RLS:
`companies`, `categories`, `subcategories`, `produtos`, `favorites`, `conversations`,
`messages`, `negotiations`, `notifications`, `reviews`, `reports`, `activity_logs`,
`user_settings` + bucket de storage `produtos` (público).
Seeds de 10 categorias (plástico, metal, papel, vidro, etc.).

**Observação:** não há nenhuma função SQL/RPC definida no schema, embora o
frontend chame `increment_views` (RPC) — ver problema CRÍTICO #3.

---

## 3. ARQUITETURA E FLUXO DE DADOS

```
React (SPA) ──supabase-js (anon key)──▶ Supabase
   │                                        │
   ├─ Auth  ───────────────────────────────▶ Auth (JWT) + RLS
   ├─ Data  ── read/write em 14 tabelas ──▶ Postgres (policies por usuário/role)
   ├─ Storage ─ upload/getPublicUrl ──────▶ Bucket "produtos"
   └─ Realtime ─ messages/notifications ──▶ Postgres Changes (channels)
```

- **Auth:** `supabase.auth.signInWithPassword` / `signUp`. O perfil empresarial é a
  tabela `companies` com `id = auth.users.id`. `role` default `'company'`; `admin` é
  definido manualmente no banco.
- **Proteção de rota:** `PrivateRoute` só verifica `user` (não verifica `role` nem
  `active`) — ver problema CRÍTICO #6.
- **Imagens de produto:** hoje são **base64** gravadas direto em `produtos.main_image`
  (não usam Storage) — ver problema CRÍTICO #2.

---

## 4. REVIEW DE CÓDIGO — PROBLEMAS ENCONTRADOS

Classificação: 🔴 crítico | 🟠 alta | 🟡 média | 🔵 baixa.

### 🔴 CRÍTICOS (segurança / dados)

1. **`.env` commitado no git.** `git ls-files` mostra `.env` na raiz, e o
   `.gitignore` NÃO o ignora. O histórico do repositório também guarda a chave
   `anon` (pública por design, mas a boa prática manda não versionar). Ação:
   adicionar `.env` ao `.gitignore`, `git rm --cached .env` e (idealmente)
   rotacionar a `anon key` no painel Supabase.

2. **Imagens de produto em base64 no banco.** `ImageUploader.tsx` lê o arquivo
   como `data URL` e `CadastroProdutoPage` grava isso em `produtos.main_image`.
   Problemas: infla a tabela `produtos` (até 5 MB por produto), aproxima limites
   de payload do Postgres/Supabase, e **ignora o Storage** — o bucket `produtos`
   e as funções `uploadFile`/`uploadImages`/`removeFile` de `storageService.ts`
   existem prontas mas não são usadas no cadastro.

3. **RPC `increment_views` não existe.** `productService.ts:77` chama
   `supabase.rpc("increment_views", ...)`, mas o `schema.sql` não cria essa
   função. A falha é engolida por `.catch(() => undefined)` em
   `ProductDetailPage.tsx:61`, então o contador de visualizações **nunca
   incrementa**. Ação: criar função SQL (ex.: `update produtos set views = views + 1`).

4. **Rota `/admin` sem proteção de papel.** `PrivateRoute` só exige usuário
   autenticado. Qualquer empresa logada pode acessar `/admin` e, como a policy de
   SELECT de `companies` libera para todo autenticado, o painel lista empresas e
   produtos de todos. Ação: guard de `role === 'admin'` na rota OU check no
   `AdminPage`; e RLS que restrinja `companies` para admin (ou um helper).

5. **`totalUsers` do admin usa `auth.admin.listUsers` com anon key.**
   `adminService.ts:23` — o endpoint admin exige **service role key**, indisponível
   no client. A chamada falha (silenciosamente, pois o `getAdminDashboard` faz
   try/catch fora). Ação: remover, usar contagem da tabela `companies`, ou mover
   para edge function/backend com service role.

6. **Empresas desativadas (`active = false`) continuam operando.** O admin
   alterna `active`, mas: (a) o usuário ainda loga; (b) as policies de RLS não
   filtram `active`; (c) produtos/negociações seguem visíveis. Ação: verificar
   `active` no login/profile e filtrar nas queries, e/ou desabilitar o usuário via
   `auth.admin.updateUserById({ ban_duration })`.

7. **Storage sem policies e sem controle de conteúdo.** O bucket `produtos` é
   público, mas o schema não define policies de storage para upload/list/delete.
   Como o client usa anon key, o upload pode ser restrito por padrão — e o fluxo
   atual (base64) nem passa por ele. Ação: criar policies de storage e usar o
   upload real.

### 🟠 ALTA (funcional / UX)

8. **Sistema de notificações "morto".** Existem tabela, serviço, contexto, realtime
   e UI, mas **nenhum fluxo cria notificações**: nem ao enviar interesse, nem ao
   chegar mensagem, nem na mudança de status de negociação, nem no admin. O
   `NotificationContext` só reage a INSERTs. Ação: criar notificações nos
   pontos certos (client, trigger SQL ou edge function).

9. **"Falar com a empresa" / "Conversar" não abrem conversa.** Os botões de
   `ProductDetailPage` e `NegociacaoDetailPage` apenas navegam para `/mensagens`.
   `getOrCreateConversation` (`messageService.ts:49`) está pronto e **não é
   usado em lugar nenhum**. Ação: navegar para `/mensagens?conversa=<id>` após
   criar/abrir a conversa.

10. **Redefinição de senha quebrada.** `authService.resetPassword` redireciona para
    `${origin}/redefinir-senha`, rota que **não existe** no `AppRoutes`. Ação:
    criar página `/redefinir-senha` que chame `updatePassword` com o token mágico
    (recuperar `supabase.auth.getSession()`/`onAuthStateChange`).

11. **Fluxo de registro confuso e UX com `alert()`.** `AuthModal` usa `alert()` em
    vez do Toast, não valida força de senha nem confirmação de senha, não valida
    CNPJ (apenas remove máscara), e não trata o caso "e-mail de confirmação
    pendente" com mensagem clara. Ação: migrar para Toast + validações + tratar
    `user.identities.length === 0`/confirmação.

12. **Reviews/avaliações sem UI.** `reviewService` (list/create/refreshCompanyRating)
    e as colunas `rating`/`review_count` de `companies` existem, mas nenhuma página
    exibe formulário de avaliação. Ação: adicionar seção de avaliações no perfil da
    empresa e estrelas na empresa do product detail.

13. **`dark_mode` e `language` salvos, mas não aplicados.** `ConfigPage` grava
    `dark_mode`/`language` em `user_settings`, mas não há `useEffect` que aplique a
    classe `dark` no `body` nem qualquer i18n (tudo hardcoded em pt-BR).

14. **Onboarding não implementado.** Existem `companies.onboarding_done`,
    `markOnboardingDone` e o pendente do localStorage, mas não há página de
    onboarding e o campo nunca é checado.

15. **Chat sem contador de não lidas.** O tipo `Conversation.unread_count` existe,
    mas `listConversations` não calcula não lidas; a badge do menu "Mensagens" usa
    o contador de **notificações** (errado).

16. **Múltiplas imagens/documentos sem suporte no formulário.** O schema tem
    `produtos.images text[]` e `documents text[]` e `storageService.uploadImages/`
    `uploadDocuments`, mas o `CadastroProdutoPage` só envia `main_image`.

17. **CEP sem integração ViaCEP** (campo só é mascarado).

18. **Sem paginação server-side em "Meus produtos", negociações e admin**
    (buscam tudo e filtram no client).

19. **Duplicação de CSV.** `exportToCSV` (`adminService.ts:93`, separador `,`) e
    `downloadCSV` (`exportService.ts:1`, separador `;`) fazem a mesma coisa de
    forma inconsistente. Manter só um.

20. **Listagens não paginadas / queries pesadas.** `getCompanyStats` e
    `getNegotiationStats` fazem várias queries; `getNegotiationStats` baixa TODAS
    as negociações do usuário para calcular totais.

### 🟡 MÉDIA (código / organização)

21. **Arquivos legados da V1 na raiz** (CadastroProduto/, InícioLogin/, Menu/,
    Produtos/, User/, `supabase.js`, `image/`). Causam warnings de lint, poluem o
    repositório e `supabase.js` contém credenciais hardcoded. Mover para `legacy/`
    ou excluir.

22. **`.env` duplicado com `supabase.js` na raiz** — dois lugares para a mesma
    configuração (o React usa `src/services/supabase/client.ts` com `import.meta.env`).

23. **CSS duplicado/conflitante.** Há `Navbar.css` + `Navbar.module.css`,
    `LandingLayout.css` + `LandingLayout.module.css`, e CSS globais antigos
    importados. Padronizar (recomendado: apenas CSS Modules).

24. **`react-hook-form`, `zod` e `react-hot-toast` instalados e não usados** —
    aumentar peso de dependências sem benefício; ou migrar os formulários para
    RHF+zod e remover `react-hot-toast`.

25. **`tsconfig` strict** — bom. O lint (oxlint) está configurado com plugin react;
    o README sugere ativar `typeAware` com `oxlint-tsgolint` (não feito).

26. **Bundle único de ~588 kB (gzip ~163 kB)** — Vite sugere code splitting
    (React.lazy por rota).

27. **`alert()`/`window.confirm` espalhados** (AuthModal, Admin, Produtos) —
    substituir por Toast/Modal próprio.

28. **Sem testes** (unit/e2e) e **sem CI/CD** configurados.

29. **README é o template padrão do Vite** — não documenta o projeto.

30. **Funções auxiliares duplicadas** (`formatCEP` definido em CadastroProdutoPage,
    PerfilPage e `utils/format.ts`; lista de `UFS` repetida em 3+ arquivos).

31. **`getCompanyStats.sales/purchases`** contam status `aceito` e `finalizado`
    como venda/compra — mas `aceito` ainda não é negociação concluída; revisar a
    semântica.

32. **`NegociacaoDetailPage`**: só o vendedor pode finalizar; o comprador não
    confirma. Sem fluxo de cancelamento/em_negociação por nenhum dos lados
    (não existe botão "voltar para em negociação").

33. **`listRelatedProducts`** faz 2 queries (fallback) sem necessidade aparente.

34. **`NotificationContext`** dispara `refresh()` em todo `profileId` mudar sem
    verificar se a sessão realmente mudou (pequeno risco de loops de refetch).

### 🔵 BAIXA (detalhes)

35. `AuthModal`/`LoginCard` têm campos de login decorativos no landing (o form real
    é o modal); o LoginCard é duplicação de UI.
36. `formatPhone` existe mas não é usado em lugar nenhum.
37. `StarRating` renderiza estrelas baseadas em `value` fracionário sem cliques
    (é apenas exibição).
38. Falta `aria-label` em alguns botões de ícone.
39. `printReport` abre janela com `document.write` — funcional, mas frágil.
40. `.oxlintrc.json` — verificar se a rule `react/only-export-components` não
    está reclamando dos `useToast`/`useAuth`/`useNotifications` exportados junto
    com providers (hoje são warnings).

---

## 5. ROADMAP PRIORIZADO PARA TERMINAR O PROJETO

Ordem recomendada (do mais crítico para o cosmético):

1. **Segurança**
   - Adicionar `.env` ao `.gitignore`; `git rm --cached .env`; rotacionar chave anon.
   - Criar policies de storage para o bucket `produtos`.
   - Verificar `active` da empresa no login/refreshProfile e nas queries.
   - Proteger rota `/admin` com verificação de `role === 'admin'`.

2. **Correções de backend/dados**
   - Criar função SQL `increment_views` (e colocar no `schema.sql`).
   - Migrar upload de imagem de base64 → Storage (usar `uploadFile`/`removeFile`,
     atualizar `main_image` com o path retornado).
   - Remover `auth.admin.listUsers` do dashboard admin (ou mover para edge function).
   - Criar triggers (SQL) ou chamadas que gerem notificações automáticas
     (interesse, mensagem, mudança de status, denúncia).
   - Calcular `unread_count` por conversa.

3. **Fluxos de usuário**
   - Página `/redefinir-senha` + tratamento de confirmação de e-mail.
   - "Falar com a empresa" criando/abrindo conversa real (usar `getOrCreateConversation`).
   - UI de avaliações/reviews por empresa.
   - Aplicar `dark_mode` de verdade e iniciar i18n (ou remover a opção).
   - Página de onboarding (ou remover campo `onboarding_done`).

4. **Qualidade de produto**
   - Paginação server-side (produtos do usuário, negociações, admin).
   - Multi-imagem + documentos no cadastro; integração ViaCEP.
   - Substituir `alert()`/`confirm` por Toast/Modal.
   - Validação de CNPJ e senha no registro (usar RHF + zod já instalados).

5. **Organização do código**
   - Remover/mover para `legacy/` os arquivos da V1 (HTML/PHP/JS) e `supabase.js`.
   - Unificar CSV em um único serviço; centralizar UFS e formatCEP.
   - Remover dependências não usadas ou adotar RHF/zod/toast oficial.
   - Code splitting com `React.lazy` nas rotas.
   - Melhorar README; adicionar testes e CI.

---

## 6. NOTAS DE IMPLEMENTAÇÃO IMPORTANTES

- **`react-hook-form`/`zod` já estão no `package.json`** (`^7.84.0` / `^3.25.76`):
  se for adicionar validação robusta nos formulários, use-os em vez de adicionar
  novas libs.
- **`react-hot-toast` está instalado mas o app usa o Toast próprio**
  (`src/components/ui/Toast.tsx`). Não misturar.
- **Nenhuma função SQL/RPC existe hoje no `schema.sql`.** Tudo que o frontend
  chama via `.rpc()` (ex.: `increment_views`) precisa ser criado no Supabase.
- **RLS libera SELECT de `produtos`/`companies`/`categories` para qualquer
  autenticado** — intencional para o marketplace, mas o admin precisa de guard no
  frontend E de políticas específicas se quiser bloquear leitura ampla.
- **Para admin real (service role),** o correto é um backend intermediário (edge
  function) ou RLS própria para `role = 'admin'`; a anon key não autoriza
  `auth.admin.*`.

---

## 7. COMANDOS DO PROJETO

```bash
npm install        # instala dependências
npm run dev        # dev server (Vite)
npm run build      # tsc -b && vite build
npm run lint       # oxlint
npm run preview    # preview do build
```

**Schema do banco:** executar `supabase/schema.sql` no SQL Editor do Supabase
(é idempotente, usa `if not exists`).
**Variáveis de ambiente:** `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
(ver `.env`).
