create table if not exists users (
  id text primary key,
  email text not null unique,
  password_hash text not null,
  password_salt text not null,
  role text not null default 'learner',
  age_confirmed_at timestamptz not null,
  stripe_customer_id text,
  created_at timestamptz not null default now()
);

create table if not exists sessions (
  id text primary key,
  user_id text not null references users (id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists sessions_user_idx on sessions (user_id);

create table if not exists subscriptions (
  user_id text primary key references users (id) on delete cascade,
  tier text not null,
  status text not null,
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists courses (
  id text primary key,
  slug text not null unique,
  title text not null,
  summary text not null,
  min_tier text not null,
  is_sample boolean not null default false,
  position integer not null,
  created_at timestamptz not null default now()
);

create table if not exists modules (
  id text primary key,
  course_id text not null references courses (id) on delete cascade,
  title text not null,
  summary text not null,
  position integer not null
);

create index if not exists modules_course_idx on modules (course_id, position);

create table if not exists lessons (
  id text primary key,
  module_id text not null references modules (id) on delete cascade,
  title text not null,
  body text not null,
  sensitive boolean not null default false,
  position integer not null
);

create index if not exists lessons_module_idx on lessons (module_id, position);

create table if not exists progress (
  user_id text not null references users (id) on delete cascade,
  lesson_id text not null references lessons (id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

create table if not exists stripe_events (
  id text primary key,
  received_at timestamptz not null default now()
);

create table if not exists stripe_prices (
  tier text not null,
  interval text not null,
  price_id text not null,
  product_id text not null,
  primary key (tier, interval)
);

create table if not exists rate_limits (
  bucket text primary key,
  hits integer not null,
  window_start timestamptz not null
);

create table if not exists app_flags (
  key text primary key,
  value text not null
);

create index if not exists users_stripe_customer_idx on users (stripe_customer_id);
