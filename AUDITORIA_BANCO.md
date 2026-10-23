# Auditoria do banco de dados e integrações — Rejet Corp V2

**Data:** 22/10/2026
**Escopo:** schema SQL, migrations, serviços do frontend, RLS, Storage e Realtime.
**Método:** leitura estática do código + verificação de conectividade do backend configurado.

---

## 0. Resumo executivo

1. **Bloqueador:** o projeto Supabase configurado em `.env` **não existe mais / não resolve em DNS**
   (`zvnxhasgnokghfskpukw.supabase.co` → NXDOMAIN no Google DNS e no Cloudflare DNS).
   O projeto antigo citado no legado (`wjgdtdseobwedjjedhvn.supabase.co`) também não resolve.
   Consequência: **login, CRUD, Storage e Realtime estão todos indisponíveis** no ambiente local.
2. O banco não é versionado por ferramenta (não há `supabase/config.toml` nem histórico de migrations).
   Existem **três fontes divergentes** de schema: `supabase/schema.sql`, `supabase/migrations/*.sql`
   e `supabase/migration_fix.sql`.
3. Há uma **escalada de privilégio crítica**: qualquer usuário autenticado pode se tornar `admin`
   via `companies` (insert/update), porque as policies de RLS não restringem colunas.
4. Várias features estão **meio integradas**: denúncias sem UI de criação, avaliações que não atualizam
   o rating da empresa, Realtime não habilitado no banco, upload de logo/banner bloqueado por policy,
   exclusão de empresa impossível com a chave publishable, onboarding e preferências sem efeito.

> **Importante:** como o backend não está acessível, esta auditoria é **estática** (código + SQL).
> Não foi possível inspecionar o estado real das tabelas/policies no Supabase.

---

## 1. Bloqueador — backend inacessível

| Verificação | Resultado |
|---|---|
| DNS `zvnxhasgnokghfskpukw.supabase.co` (Google 8.8.8.8) | NXDOMAIN |
| DNS `zvnxhasgnokghfskpukw.supabase.co` (Cloudflare 1.1.1.1) | NXDOMAIN |
| DNS `wjgdtdseobwedjjedhvn.supabase.co` (legado) | NXDOMAIN |
| Chave em `.env` | `sb_publishable_…` (46 chars, formato novo) |
| `supabase/config.toml` | inexistente |
| `.env.example` | inexistente |

**Ações:**
1. Criar um novo projeto no Supabase (ou restaurar o antigo, se houver backup).
2. Rodar um schema consolidado (ver §5).
3. Atualizar `.env` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) e as variáveis do deploy.
4. Rotacionar as chaves: o repositório é **público** e as chaves publishable apareceram no histórico
   de `.env`/`supabase.js`. (Publishable key é pública por design, mas rotacionar é boa prática.)
5. Se havia dados de produção, verificar backup no painel do Supabase — projeto deletado
   normalmente **não é recuperável**.

---

## 2. Inventário — o que o frontend espera do banco

### 2.1 Tabelas usadas

`companies`, `categories`, `subcategories`, `produtos`, `favorites`, `conversations`, `messages`,
`negotiations`, `negotiation_history`, `notifications`, `reviews`, `reports`, `activity_logs`,
`user_settings` — todas definidas em `supabase/schema.sql`.

### 2.2 Funções/RPC usadas

| RPC | Chamada em | Existe no SQL? |
|---|---|---|
| `increment_views(uuid)` | `productService.ts:77` | Sim (`schema.sql` + migration) |
| `notify_user(...)` | triggers SQL | Sim, mas **exposta indevidamente** |
| `log_user_activity(...)` | triggers SQL | Sim, mas **exposta indevidamente** |

### 2.3 Extensões / infra

- `pgcrypto` — usada para `gen_random_uuid()`.
- Bucket `produtos` público.
- Realtime (Postgres Changes) — usado no client, **não habilitado no banco**.

---

## 3. Achados por severidade

### 🔴 Críticos

#### C1. Escalada de privilégio em `companies` (role admin)
`schema.sql:45-49`
```sql
create policy "companies_insert_self" on public.companies
  for insert with check (id = auth.uid());

create policy "companies_update_self" on public.companies
  for update using (id = auth.uid());
```
RLS não limita colunas. Qualquer usuário autenticado pode:
```ts
await supabase.from("companies").update({ role: "admin", verified: true }).eq("id", user.id);
// ou no insert: role: "admin"
```
Com `role = 'admin'`, ele passa a satisfazer todas as policies administrativas
(`categories_*`, `reports_*`, `activity_logs_*`, `companies_update_admin`).
**Correção:** trigger `BEFORE INSERT/UPDATE` que força/restaura `role`, `verified`, `active`,
`rating` e `review_count` para usuários não-admin (SQL em §5.1).

#### C2. Funções `security definer` expostas via RPC
`schema.sql:464-493` — `notify_user` e `log_user_activity` são `security definer` e **não têm
`REVOKE`**. No Postgres, `EXECUTE` é concedido a `PUBLIC` por padrão, e o PostgREST expõe funções
do schema `public` como RPC. Qualquer autenticado (ou anônimo, dependendo dos grants) pode:
- notificar/spamar qualquer usuário (`notify_user`);
- forjar logs de atividade (`log_user_activity`), enganando o admin.

**Correção:** `revoke all ... from public, anon, authenticated;` (triggers continuam funcionando
porque rodam como owner). O mesmo vale para futuras funções auxiliares.

#### C3. Schema sem versionamento e com fontes divergentes
- `supabase/schema.sql:282-290` define `negotiation_history` com
  `actor_id`, `previous_status`, `new_status`, `observation`.
- `supabase/migrations/20260811_negotiation_history.sql:5-13` cria a **mesma tabela** com
  `status_from`, `status_to`, `note`, `created_by`.
- `supabase/migration_fix.sql:19-58` tenta reconciliar as duas.

O serviço `negotiationService.ts:119-127` consulta `actor_id`, `previous_status`, `new_status` e o
embed `companies!negotiation_history_actor_id_fkey`. Se apenas a migration de 11/08 for executada
(sem `migration_fix.sql`), **a timeline de negociações quebra**.
Além disso, `schema.sql` **não é idempotente**: os `create policy` não têm `drop policy if exists`,
então rodá-lo duas vezes falha com “policy already exists”.

**Correção:** consolidar tudo em **um único arquivo idempotente** e adotar a CLI do Supabase
(`supabase init`, `supabase migration new`, `supabase db push`) para versionar.

---

### 🟠 Altos

#### H1. Upload de logo/banner bloqueado pela policy de Storage
`storageService.ts:53-69` grava em `companies/{userId}/logo-...`.
As policies (`schema.sql:687-713`) exigem que **a primeira pasta seja o uid**:
```sql
(storage.foldername(name))[1] = auth.uid()::text
```
Como o primeiro segmento é `companies`, o upload é negado → “Falha ao enviar a logo/banner”.
**Correção:** mudar o path para `${userId}/company/logo-...` **ou** criar policies específicas
para `companies/{uid}/...`.

#### H2. `rating`/`review_count` nunca são atualizados
`reviewService.ts:36-57` recalcula o rating **no client** e faz `update` na empresa avaliada.
A policy `companies_update_self` (`schema.sql:48-49`) só permite atualizar a própria empresa;
qualquer outro usuário atualiza 0 linhas **sem erro**. O trigger `on_review_insert`
(`schema.sql:610-624`) só notifica, não recalcula.
**Resultado:** empresas ficam eternamente com `rating = 0` e `review_count = 0`.
**Correção:** trigger `AFTER INSERT/UPDATE/DELETE ON reviews` com `security definer` recalculando
via `avg(rating)` (SQL em §5.2) e remover o update client-side.

#### H3. Realtime implementado no client, mas desligado no banco
`messageService.ts:139-162` e `notificationService.ts:51-74` assinam `postgres_changes`,
mas nenhum SQL adiciona `messages`/`notifications` à publicação `supabase_realtime`.
**Resultado:** chat e notificações só aparecem após refresh manual.
**Correção:** `alter publication supabase_realtime add table ...` (SQL em §5.3).

#### H4. Exclusão de empresa sempre falha com a chave publishable
`adminService.ts:66-69` usa `supabase.auth.admin.deleteUser(id)`.
O namespace `auth.admin` exige `service_role` e **nunca funciona no browser** com a anon/publishable key.
**Correção:** RPC `security definer` que valida o admin e remove `companies` + `auth.users`,
ou Edge Function com service role; e trocar a chamada no client.

#### H5. Excluir produto apaga negociações e histórico
`schema.sql:251` — `negotiations.product_id ... on delete cascade`.
Como `negotiation_history` também cascateia de `negotiations` (`schema.sql:284`), deletar um produto
**apaga o histórico de negociações**.
**Correção:** soft delete de produto (`deleted_at`/status `deleted`) ou mudar a FK para
`on delete set null` (exige tornar `negotiations.product_id` nullable).

#### H6. `messages` permite inserir em conversa alheia
`schema.sql:234-235` — a policy de insert só verifica `sender_id = auth.uid()`, **não** se o usuário
participa da conversa. Com o UUID de uma conversa, é possível injetar mensagens (e disparar
notificações para os participantes).
**Correção:** exigir `exists (... conversations ... participant_a/b = auth.uid())` (SQL em §5.4).

#### H7. Preferências de notificação não têm efeito
`user_settings.notify_messages/interests/negotiations` (`schema.sql:416-426`) existem e são salvas
pela `ConfigPage`, mas `notify_user` (`schema.sql:464-478`) insere a notificação sempre.
**Correção:** checar `user_settings` dentro de `notify_user` (SQL em §5.5).

---

### 🟡 Médios

| # | Achado | Evidência |
|---|---|---|
| M1 | **Denúncias sem criação.** `createReport` existe, mas nenhum componente chama. A aba “Denúncias” do admin lê uma tabela que o usuário não consegue alimentar. Além disso `reporter_id = null` falha na policy (`null = auth.uid()`). | `reportService.ts`, `AdminPage.tsx:418` |
| M2 | **Onboarding não implementado.** `onboarding_done` e `markOnboardingDone` nunca são usados; não há página/fluxo. | `companyService.ts:54`, `types/company.ts:24` |
| M3 | **`negotiations` permite alterar campos além do status.** A policy de UPDATE não restringe colunas; um participante pode trocar `product_id`, `seller_id`, `quantity`, `offered_price`. | `schema.sql:273-274` |
| M4 | **Sem validação de status.** `negotiations.status`, `produtos.status`, `reports.status`, `notifications.type` e `companies.role` são `text` livres — qualquer string entra. Sem CHECK/enum. | `schema.sql` |
| M5 | **Conversas duplicadas.** Não existe unique em `(participant_a, participant_b, product_id)`; corrida entre `getOrCreateConversation` pode criar duplicatas. Embeds dependem de nomes de FK auto-gerados (`conversations_participant_a_fkey` etc.) — frágeis se o schema for recriado diferente. | `messageService.ts:49-75` |
| M6 | **Editar produto força `status = "active"`.** Um produto vendido/inativo volta a ativo ao ser editado; não há ação de desativar. O filtro “Inativos” em Meus Produtos nunca tem itens. | `CadastroProdutoPage.tsx:322` |
| M7 | **Subcategorias sem seed.** A UI de subcategoria só aparece se houver registros; o `schema.sql` só semeia `categories`. | `schema.sql:667-678` |
| M8 | **Troca de e-mail/senha ignora erro.** `updateEmail`/`updatePassword` retornam `{ error }`, mas a `ConfigPage` sempre mostra sucesso; `companies.email` não é sincronizado com `auth.users.email`. | `ConfigPage.tsx:75-107`, `authService.ts:117-123` |
| M9 | **Fallback de perfil com CNPJ vazio.** `createProduct` faz upsert com `cnpj: meta.cnpj ?? ""`; `companies.cnpj` é `unique`, então o segundo usuário sem CNPJ falha. | `productService.ts:96-104` |
| M10 | **Dark mode do banco não é aplicado no login.** O boot lê apenas `localStorage`; `user_settings.dark_mode` só é aplicado no momento em que se clica em “Salvar” na Config. | `main.tsx:13`, `useDarkMode.ts`, `ConfigPage.tsx:50-56` |
| M11 | **Dashboard admin conta negociações erradas.** `negotiations_select_self` limita o admin às negociações dele; `getAdminDashboard` usa essa contagem como total global. | `adminService.ts:21`, `schema.sql:267-268` |
| M12 | **Listagem de conversas pesada.** O embed `last_message:messages(...)` traz **todas** as mensagens de cada conversa e escolhe a última em JS, sem `limit/order`. | `messageService.ts:9-15` |
| M13 | **Avaliação própria permitida.** A policy de insert só exige `reviewer_id = auth.uid()`; nada impede avaliar a própria empresa. | `schema.sql:354-355` |

---

### 🔵 Baixos

- Índices faltantes: `favorites(user_id)`, `conversations(participant_a/b)`, `reviews(company_id)`,
  `reports(status)`, `produtos(created_at)`, `negotiations(updated_at)`.
- Sem trigger de `updated_at`; depende do client em todos os updates.
- `documents` tem exibição no detalhe do produto, mas **não há upload** no cadastro.
- `privacy_profile` não é aplicado em lugar nenhum (não há rota pública de perfil).
- `language` e `notify_news` não têm efeito.
- Exclusão de produto/empresa não remove arquivos do Storage (órfãos).
- CSV duplicado (`adminService.exportToCSV` com `,` e `exportService.downloadCSV` com `;`).
- Sem `.env.example` e o README ainda é o template do Vite.
- `favoriteService.ts:4-5` seleciona produto sem `negotiable`, `min_quantity` e `views_updated_at`
  (cast para `Product` esconde a divergência).

---

## 4. O que falta integrar (feature × status)

| Feature | Frontend | Banco | Status |
|---|---|---|---|
| Auth (login/cadastro/reset) | ✅ | ✅ Supabase Auth + `companies` | ✅ (perfil criado no client; ver M8/M9) |
| Perfil da empresa + logo/banner | ✅ | ✅ `companies` + Storage | ⚠️ upload **quebrado** (H1) |
| Produtos (CRUD, multi-imagem) | ✅ | ✅ `produtos` + Storage | ✅ (com H5/M6) |
| Categorias | ✅ | ✅ `categories` | ✅ |
| Subcategorias | ✅ | ⚠️ sem seed | ⚠️ (M7) |
| Busca/filtros/paginação | ✅ | ✅ | ✅ (paginado só no marketplace) |
| Favoritos | ✅ | ✅ `favorites` | ✅ |
| Negociações + histórico | ✅ | ✅ `negotiations`/`negotiation_history` | ⚠️ drift de migration (C3/M3) |
| Chat | ✅ | ✅ `conversations`/`messages` | ⚠️ Realtime off (H3), policy (H6) |
| Notificações | ✅ | ✅ `notifications` + triggers | ⚠️ Realtime off, prefs ignoradas (H3/H7) |
| Avaliações | ✅ | ✅ `reviews` | ⚠️ rating nunca atualiza (H2) |
| Denúncias | ⚠️ só admin | ✅ `reports` | ❌ sem UI de criação (M1) |
| Painel admin | ✅ | ✅ | ⚠️ excluir empresa quebrado; KPI errado (H4/M11) |
| Configurações | ✅ | ✅ `user_settings` | ⚠️ dark mode parcial; prefs sem efeito (M10/H7) |
| Onboarding | ❌ | ✅ `onboarding_done` | ❌ não implementado (M2) |
| Documentos do produto | ⚠️ só exibição | ✅ `documents` | ❌ sem upload |
| Relatórios/exportação | ✅ | ✅ (client-side) | ✅ |
| Realtime | ✅ (subscribe) | ❌ publicação | ❌ desligado (H3) |

---

## 5. Correções SQL recomendadas

> Revisar antes de executar. Preferir um projeto novo com um único schema consolidado.

### 5.1 Bloquear escalada de privilégio em `companies`
```sql
create or replace function public.guard_company_privileges()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_admin boolean;
begin
  -- SQL editor / service role não têm auth.uid()
  if auth.uid() is null then
    return new;
  end if;

  select exists(
    select 1 from public.companies c
    where c.id = auth.uid() and c.role = 'admin'
  ) into v_is_admin;

  if v_is_admin then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.role := 'company';
    new.verified := false;
    new.active := true;
    new.rating := 0;
    new.review_count := 0;
  else
    new.role := old.role;
    new.verified := old.verified;
    new.active := old.active;
    new.rating := old.rating;
    new.review_count := old.review_count;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_guard_company_privileges on public.companies;
create trigger trg_guard_company_privileges
  before insert or update on public.companies
  for each row execute function public.guard_company_privileges();
```

### 5.2 Revogar RPCs auxiliares e recalcular rating
```sql
revoke all on function public.notify_user(uuid, text, text, text, text) from public;
revoke all on function public.log_user_activity(uuid, text, text) from public;
revoke all on function public.notify_user(uuid, text, text, text, text) from anon, authenticated;
revoke all on function public.log_user_activity(uuid, text, text) from anon, authenticated;

create or replace function public.refresh_company_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ids uuid[];
begin
  if tg_op = 'DELETE' then
    v_ids := array[old.company_id];
  elsif tg_op = 'UPDATE' then
    v_ids := array[old.company_id, new.company_id];
  else
    v_ids := array[new.company_id];
  end if;

  update public.companies c
     set rating = coalesce((
           select round(avg(r.rating)::numeric, 2)
             from public.reviews r
            where r.company_id = c.id
         ), 0),
         review_count = (
           select count(*) from public.reviews r where r.company_id = c.id
         ),
         updated_at = now()
   where c.id = any(v_ids);

  return null;
end;
$$;

drop trigger if exists trg_refresh_company_rating on public.reviews;
create trigger trg_refresh_company_rating
  after insert or update or delete on public.reviews
  for each row execute function public.refresh_company_rating();
```

### 5.3 Habilitar Realtime
```sql
do $$ begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.notifications;
exception when duplicate_object then null; end $$;
```

### 5.4 Exigir participação para inserir mensagem
```sql
drop policy if exists "messages_insert_self" on public.messages;
create policy "messages_insert_participant" on public.messages
  for insert with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.conversations c
       where c.id = messages.conversation_id
         and (c.participant_a = auth.uid() or c.participant_b = auth.uid())
    )
  );
```

### 5.5 Respeitar preferências em `notify_user`
```sql
create or replace function public.notify_user(
  p_user_id uuid, p_type text, p_title text,
  p_message text default null, p_link text default null
) returns void
language plpgsql security definer set search_path = public
as $$
begin
  if p_user_id is null then return; end if;

  if p_type = 'mensagem' and exists (
       select 1 from public.user_settings s
        where s.user_id = p_user_id and s.notify_messages = false
     ) then return; end if;

  if p_type = 'interesse' and exists (
       select 1 from public.user_settings s
        where s.user_id = p_user_id and s.notify_interests = false
     ) then return; end if;

  if p_type = 'negociacao' and exists (
       select 1 from public.user_settings s
        where s.user_id = p_user_id and s.notify_negotiations = false
     ) then return; end if;

  insert into public.notifications (user_id, type, title, message, link, read)
  values (p_user_id, p_type, p_title, p_message, p_link, false);
end;
$$;
```

### 5.6 Exclusão de empresa via RPC (substitui `auth.admin.deleteUser`)
```sql
create or replace function public.admin_delete_company(target uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not exists (
    select 1 from public.companies c
     where c.id = auth.uid() and c.role = 'admin'
  ) then
    raise exception 'not authorized';
  end if;

  delete from public.companies where id = target;
  delete from auth.users where id = target;
end;
$$;

revoke all on function public.admin_delete_company(uuid) from public, anon;
grant execute on function public.admin_delete_company(uuid) to authenticated;
```
No client: `await supabase.rpc("admin_delete_company", { target: company.id })`.

### 5.7 Integridade e performance
```sql
-- Unicidade de conversa (assumindo participant_a < participant_b no client)
create unique index if not exists conversations_unique_triplet
  on public.conversations (participant_a, participant_b, product_id)
  where product_id is not null;

create index if not exists favorites_user_idx on public.favorites(user_id);
create index if not exists conversations_a_idx on public.conversations(participant_a);
create index if not exists conversations_b_idx on public.conversations(participant_b);
create index if not exists reviews_company_idx on public.reviews(company_id);
create index if not exists reports_status_idx on public.reports(status);
create index if not exists produtos_created_at_idx on public.produtos(created_at desc);
create index if not exists negotiations_updated_at_idx on public.negotiations(updated_at desc);

-- CHECKs (usar NOT VALID se já houver dados fora do padrão)
alter table public.companies add constraint companies_role_chk
  check (role in ('company','admin')) not valid;
alter table public.produtos add constraint produtos_status_chk
  check (status in ('active','inactive','sold')) not valid;
alter table public.negotiations add constraint negotiations_status_chk
  check (status in ('interesse','em_negociacao','aceito','recusado','cancelado','finalizado')) not valid;
alter table public.reports add constraint reports_status_chk
  check (status in ('pending','reviewing','resolved','rejected')) not valid;
alter table public.notifications add constraint notifications_type_chk
  check (type in ('interesse','mensagem','negociacao','aviso','sistema')) not valid;
```

### 5.8 Corrigir upload de mídia da empresa (client)
Em `storageService.ts:59`, trocar:
```ts
const path = `companies/${userId}/${kind}-${Date.now()}.${extension}`;
```
por:
```ts
const path = `${userId}/company/${kind}-${Date.now()}.${extension}`;
```
Assim a policy existente (`primeira pasta = uid`) passa a valer.

---

## 6. Plano de ação priorizado

### Fase 0 — Restaurar o backend (bloqueador)
1. Criar projeto Supabase novo.
2. Consolidar o schema em um único `supabase/schema.sql` idempotente (com `drop policy if exists`).
3. Rodar seeds de categorias **e subcategorias**.
4. Configurar `.env` e variáveis do deploy; rotacionar chaves.
5. Habilitar Realtime e Storage policies.

### Fase 1 — Segurança
1. C1 trigger de privilégios.
2. C2 revogar RPCs.
3. H6 policy de mensagens.
4. Revisar exposição de `companies` (CNPJ/e-mail/telefone para todo autenticado) — avaliar view pública.
5. Proteger `negotiations` contra alteração de campos (trigger/RPC).

### Fase 2 — Consistência de dados
1. H2 trigger de rating.
2. H5 soft delete de produto.
3. H3 Realtime.
4. H4 RPC de exclusão de empresa.
5. C3 migrations versionadas (`supabase db push`).
6. M5 unique de conversas + validar nomes de FK.

### Fase 3 — Features faltantes
1. M1 UI de denúncia (produto e empresa) + permitir reporter anônimo ou exigir login.
2. M8 sincronizar e-mail e tratar erros de update.
3. M10 aplicar `dark_mode` do banco no login.
4. H7 preferências de notificação.
5. M2 onboarding (ou remover o campo).
6. Upload de documentos do produto.
7. M7 seeds de subcategorias.

### Fase 4 — Polimento
1. Índices e CHECKs.
2. Triggers de `updated_at`.
3. `.env.example` + README real.
4. Remover código morto (`useCompany`, `ImageUploader` se não usado) e unificar CSV.
5. Paginação server-side em Meus Produtos/Negociações/Admin.

---

## 7. O que já está bem integrado

- Auth com Supabase (signup, login, reset de senha, troca de senha/e-mail).
- Perfil da empresa (`companies`) com recuperação de cadastro pendente via `localStorage`.
- CRUD de produtos com upload real para o Storage (bucket `produtos`).
- Favoritos, busca/filtros, paginação do marketplace.
- Negociações com timeline de histórico e notificações via triggers.
- Chat (lista + thread + envio + marcação de lida).
- Notificações (tabela, contexto, página, criação por triggers).
- Avaliações (listagem + criação + distribuição de estrelas).
- Painel admin (empresas, produtos, denúncias, KPIs).
- Relatórios e exportação CSV.
