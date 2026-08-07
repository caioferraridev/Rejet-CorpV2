-- =====================================================================
--  REJEC CORP — Marketplace B2B de economia circular
--  Schema completo do Supabase (PostgreSQL)
--  Execute este arquivo no SQL Editor do seu projeto Supabase.
-- =====================================================================

create extension if not exists pgcrypto;

-- =====================================================================
--  EMPRESAS (perfil do usuário B2B — id = auth.users.id)
-- =====================================================================
create table if not exists public.companies (
  id            uuid primary key,
  company_name  text not null,
  trade_name    text,
  cnpj          text unique,
  email         text,
  phone         text,
  address       text,
  city          text,
  state         text,
  cep           text,
  segment       text,
  description   text,
  website       text,
  instagram     text,
  linkedin      text,
  logo_url      text,
  banner_url    text,
  role          text not null default 'company',
  verified      boolean not null default false,
  active        boolean not null default true,
  onboarding_done boolean not null default false,
  rating        numeric(3,2) not null default 0,
  review_count  integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.companies enable row level security;

create policy "companies_select_auth" on public.companies
  for select using (auth.role() = 'authenticated');

create policy "companies_insert_self" on public.companies
  for insert with check (id = auth.uid());

create policy "companies_update_self" on public.companies
  for update using (id = auth.uid());

-- =====================================================================
--  CATEGORIAS E SUBCATEGORIAS
-- =====================================================================
create table if not exists public.categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  slug       text not null unique,
  icon       text,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;

create policy "categories_select_auth" on public.categories
  for select using (auth.role() = 'authenticated');

create policy "categories_insert_admin" on public.categories
  for insert with check (
    exists (select 1 from public.companies c where c.id = auth.uid() and c.role = 'admin')
  );

create policy "categories_update_admin" on public.categories
  for update using (
    exists (select 1 from public.companies c where c.id = auth.uid() and c.role = 'admin')
  );

create policy "categories_delete_admin" on public.categories
  for delete using (
    exists (select 1 from public.companies c where c.id = auth.uid() and c.role = 'admin')
  );

create table if not exists public.subcategories (
  id          uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete cascade,
  name        text not null
);

alter table public.subcategories enable row level security;

create policy "subcategories_select_auth" on public.subcategories
  for select using (auth.role() = 'authenticated');

create policy "subcategories_insert_admin" on public.subcategories
  for insert with check (
    exists (select 1 from public.companies c where c.id = auth.uid() and c.role = 'admin')
  );

create policy "subcategories_delete_admin" on public.subcategories
  for delete using (
    exists (select 1 from public.companies c where c.id = auth.uid() and c.role = 'admin')
  );

-- =====================================================================
--  PRODUTOS
-- =====================================================================
create table if not exists public.produtos (
  id            uuid primary key default gen_random_uuid(),
  product       text not null,
  description   text,
  category      text,
  subcategory   text,
  material_type text,
  quantities    numeric,
  unit          text not null default 'kg',
  weight        numeric,
  price         numeric,
  is_free       boolean not null default false,
  condition     text,
  locationc     text,
  cep           text,
  city          text,
  state         text,
  has_pickup    boolean not null default true,
  has_delivery  boolean not null default false,
  main_image    text,
  images        text[] not null default '{}',
  documents     text[] not null default '{}',
  status        text not null default 'active',
  views         integer not null default 0,
  created_by    uuid references public.companies(id) on delete cascade,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists produtos_created_by_idx on public.produtos(created_by);
create index if not exists produtos_status_idx on public.produtos(status);
create index if not exists produtos_category_idx on public.produtos(category);

alter table public.produtos enable row level security;

create policy "produtos_select_auth" on public.produtos
  for select using (auth.role() = 'authenticated');

create policy "produtos_insert_owner" on public.produtos
  for insert with check (created_by = auth.uid());

create policy "produtos_update_owner" on public.produtos
  for update using (created_by = auth.uid());

create policy "produtos_delete_owner" on public.produtos
  for delete using (created_by = auth.uid());

-- =====================================================================
--  FAVORITOS
-- =====================================================================
create table if not exists public.favorites (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.companies(id) on delete cascade,
  product_id uuid not null references public.produtos(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

alter table public.favorites enable row level security;

create policy "favorites_select_self" on public.favorites
  for select using (user_id = auth.uid());

create policy "favorites_insert_self" on public.favorites
  for insert with check (user_id = auth.uid());

create policy "favorites_delete_self" on public.favorites
  for delete using (user_id = auth.uid());

-- =====================================================================
--  CONVERSAS E MENSAGENS
-- =====================================================================
create table if not exists public.conversations (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid references public.produtos(id) on delete set null,
  participant_a uuid not null references public.companies(id) on delete cascade,
  participant_b uuid not null references public.companies(id) on delete cascade,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.conversations enable row level security;

create policy "conversations_select_self" on public.conversations
  for select using (participant_a = auth.uid() or participant_b = auth.uid());

create policy "conversations_insert_self" on public.conversations
  for insert with check (participant_a = auth.uid() or participant_b = auth.uid());

create policy "conversations_update_self" on public.conversations
  for update using (participant_a = auth.uid() or participant_b = auth.uid());

create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id       uuid not null references public.companies(id) on delete cascade,
  content         text not null,
  read            boolean not null default false,
  created_at      timestamptz not null default now()
);

create index if not exists messages_conversation_idx on public.messages(conversation_id, created_at);

alter table public.messages enable row level security;

create policy "messages_select_self" on public.messages
  for select using (
    exists (
      select 1 from public.conversations cv
      where cv.id = messages.conversation_id
        and (cv.participant_a = auth.uid() or cv.participant_b = auth.uid())
    )
  );

create policy "messages_insert_self" on public.messages
  for insert with check (sender_id = auth.uid());

create policy "messages_update_self" on public.messages
  for update using (
    exists (
      select 1 from public.conversations cv
      where cv.id = messages.conversation_id
        and (cv.participant_a = auth.uid() or cv.participant_b = auth.uid())
    )
  );

-- =====================================================================
--  NEGOCIAÇÕES
-- =====================================================================
create table if not exists public.negotiations (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid not null references public.produtos(id) on delete cascade,
  buyer_id      uuid not null references public.companies(id) on delete cascade,
  seller_id     uuid not null references public.companies(id) on delete cascade,
  status        text not null default 'interesse',
  quantity      numeric,
  offered_price numeric,
  message       text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists negotiations_buyer_idx on public.negotiations(buyer_id);
create index if not exists negotiations_seller_idx on public.negotiations(seller_id);

alter table public.negotiations enable row level security;

create policy "negotiations_select_self" on public.negotiations
  for select using (buyer_id = auth.uid() or seller_id = auth.uid());

create policy "negotiations_insert_self" on public.negotiations
  for insert with check (buyer_id = auth.uid());

create policy "negotiations_update_self" on public.negotiations
  for update using (buyer_id = auth.uid() or seller_id = auth.uid());

create policy "negotiations_delete_self" on public.negotiations
  for delete using (buyer_id = auth.uid());

-- =====================================================================
--  NOTIFICAÇÕES
-- =====================================================================
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.companies(id) on delete cascade,
  type       text not null default 'aviso',
  title      text not null,
  message    text,
  link       text,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_idx on public.notifications(user_id, read);

alter table public.notifications enable row level security;

create policy "notifications_select_self" on public.notifications
  for select using (user_id = auth.uid());

create policy "notifications_insert_self" on public.notifications
  for insert with check (user_id = auth.uid());

create policy "notifications_update_self" on public.notifications
  for update using (user_id = auth.uid());

create policy "notifications_delete_self" on public.notifications
  for delete using (user_id = auth.uid());

-- =====================================================================
--  AVALIAÇÕES
-- =====================================================================
create table if not exists public.reviews (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  reviewer_id uuid not null references public.companies(id) on delete cascade,
  rating      integer not null check (rating between 1 and 5),
  comment     text,
  created_at  timestamptz not null default now(),
  unique (company_id, reviewer_id)
);

alter table public.reviews enable row level security;

create policy "reviews_select_auth" on public.reviews
  for select using (auth.role() = 'authenticated');

create policy "reviews_insert_self" on public.reviews
  for insert with check (reviewer_id = auth.uid());

create policy "reviews_update_self" on public.reviews
  for update using (reviewer_id = auth.uid());

-- =====================================================================
--  DENÚNCIAS
-- =====================================================================
create table if not exists public.reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.companies(id) on delete set null,
  target_type text not null default 'product',
  target_id   text not null,
  reason      text not null,
  status      text not null default 'pending',
  created_at  timestamptz not null default now(),
  resolved_at timestamptz
);

alter table public.reports enable row level security;

create policy "reports_select_admin" on public.reports
  for select using (
    exists (select 1 from public.companies c where c.id = auth.uid() and c.role = 'admin')
  );

create policy "reports_insert_self" on public.reports
  for insert with check (reporter_id = auth.uid());

create policy "reports_update_admin" on public.reports
  for update using (
    exists (select 1 from public.companies c where c.id = auth.uid() and c.role = 'admin')
  );

-- =====================================================================
--  LOGS DE ATIVIDADE
-- =====================================================================
create table if not exists public.activity_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.companies(id) on delete set null,
  action     text not null,
  details    text,
  created_at timestamptz not null default now()
);

alter table public.activity_logs enable row level security;

create policy "activity_logs_select_admin" on public.activity_logs
  for select using (
    exists (select 1 from public.companies c where c.id = auth.uid() and c.role = 'admin')
  );

create policy "activity_logs_insert_self" on public.activity_logs
  for insert with check (user_id = auth.uid());

-- =====================================================================
--  PREFERÊNCIAS / CONFIGURAÇÕES DO USUÁRIO
-- =====================================================================
create table if not exists public.user_settings (
  user_id             uuid primary key references public.companies(id) on delete cascade,
  dark_mode           boolean not null default false,
  language            text not null default 'pt-BR',
  notify_messages     boolean not null default true,
  notify_interests    boolean not null default true,
  notify_negotiations boolean not null default true,
  notify_news         boolean not null default false,
  privacy_profile     boolean not null default true,
  updated_at          timestamptz not null default now()
);

alter table public.user_settings enable row level security;

create policy "user_settings_select_self" on public.user_settings
  for select using (user_id = auth.uid());

create policy "user_settings_insert_self" on public.user_settings
  for insert with check (user_id = auth.uid());

create policy "user_settings_update_self" on public.user_settings
  for update using (user_id = auth.uid());

-- =====================================================================
--  SEEDS — categorias padrão
-- =====================================================================
insert into public.categories (name, slug, icon) values
  ('Plástico', 'plastico', '♻️'),
  ('Metal', 'metal', '🏗️'),
  ('Papel e Papelão', 'papel-papelao', '📦'),
  ('Vidro', 'vidro', '🫙'),
  ('Madeira', 'madeira', '🪵'),
  ('Eletrônicos', 'eletronicos', '🔌'),
  ('Químicos', 'quimicos', '⚗️'),
  ('Orgânicos', 'organicos', '🌱'),
  ('Têxteis', 'texteis', '🧵'),
  ('Outros', 'outros', '📦')
on conflict (name) do nothing;

-- =====================================================================
--  STORAGE — bucket para imagens e documentos
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('produtos', 'produtos', true)
on conflict (id) do nothing;
