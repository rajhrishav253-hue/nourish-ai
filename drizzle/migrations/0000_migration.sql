
-- PROFILES
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  age int,
  gender text,
  height_cm numeric,
  weight_kg numeric,
  start_weight_kg numeric,
  target_weight_kg numeric,
  activity_level text default 'moderate',
  goal text default 'general',
  diet_pref text default 'non_veg',
  custom_diet text,
  restrictions text,
  likes text,
  dislikes text,
  budget_inr int,
  calorie_target int default 2200,
  protein_target int default 100,
  carb_target int default 250,
  fat_target int default 70,
  fiber_target int default 30,
  water_target_ml int default 2500,
  reminders jsonb not null default '{"water":true,"meals":true,"weight":false}'::jsonb,
  onboarded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "own profile select" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "own profile insert" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "own profile update" on public.profiles for update to authenticated using (auth.uid() = id);

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name) values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email,'@',1)))
  on conflict (id) do nothing;
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();

-- FOODS (global when user_id is null, custom when set)
create table public.foods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  name text not null,
  category text not null default 'Other',
  kcal numeric not null,
  protein numeric not null default 0,
  carbs numeric not null default 0,
  fat numeric not null default 0,
  fiber numeric not null default 0,
  is_veg boolean not null default true,
  is_vegan boolean not null default false,
  servings jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index foods_name_idx on public.foods (lower(name));
create index foods_user_idx on public.foods (user_id);
grant select, insert, update, delete on public.foods to authenticated;
grant all on public.foods to service_role;
alter table public.foods enable row level security;
create policy "read global or own foods" on public.foods for select to authenticated using (user_id is null or user_id = auth.uid());
create policy "insert own foods" on public.foods for insert to authenticated with check (user_id = auth.uid());
create policy "update own foods" on public.foods for update to authenticated using (user_id = auth.uid());
create policy "delete own foods" on public.foods for delete to authenticated using (user_id = auth.uid());

-- FOOD LOGS
create table public.food_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  log_date date not null default current_date,
  meal_type text not null default 'other',
  food_id uuid references public.foods(id) on delete set null,
  food_name text not null,
  quantity numeric not null default 100,
  unit text not null default 'g',
  grams numeric not null default 100,
  kcal numeric not null default 0,
  protein numeric not null default 0,
  carbs numeric not null default 0,
  fat numeric not null default 0,
  fiber numeric not null default 0,
  created_at timestamptz not null default now()
);
create index food_logs_user_date_idx on public.food_logs (user_id, log_date);
grant select, insert, update, delete on public.food_logs to authenticated;
grant all on public.food_logs to service_role;
alter table public.food_logs enable row level security;
create policy "own logs all" on public.food_logs for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Server-side nutrition recalculation: per-100g x grams / 100
create or replace function public.compute_food_log_nutrition() returns trigger
language plpgsql security definer set search_path = public as $$
declare f public.foods;
begin
  if new.food_id is not null then
    select * into f from public.foods where id = new.food_id and (user_id is null or user_id = new.user_id);
    if found then
      new.kcal := round(f.kcal * new.grams / 100, 1);
      new.protein := round(f.protein * new.grams / 100, 1);
      new.carbs := round(f.carbs * new.grams / 100, 1);
      new.fat := round(f.fat * new.grams / 100, 1);
      new.fiber := round(f.fiber * new.grams / 100, 1);
    end if;
  end if;
  return new;
end; $$;
create trigger food_logs_compute before insert or update on public.food_logs for each row execute function public.compute_food_log_nutrition();

create view public.daily_nutrition with (security_invoker = on) as
  select user_id, log_date, round(sum(kcal),0) as kcal, round(sum(protein),1) as protein, round(sum(carbs),1) as carbs,
         round(sum(fat),1) as fat, round(sum(fiber),1) as fiber, count(*) as items
  from public.food_logs group by user_id, log_date;
grant select on public.daily_nutrition to authenticated;

-- WEIGHT
create table public.weight_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  log_date date not null default current_date,
  weight_kg numeric not null,
  notes text,
  created_at timestamptz not null default now()
);
create index weight_logs_user_idx on public.weight_logs (user_id, log_date);
grant select, insert, update, delete on public.weight_logs to authenticated;
grant all on public.weight_logs to service_role;
alter table public.weight_logs enable row level security;
create policy "own weight all" on public.weight_logs for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- WATER
create table public.water_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  log_date date not null default current_date,
  amount_ml int not null,
  target_ml int,
  created_at timestamptz not null default now()
);
create index water_logs_user_idx on public.water_logs (user_id, log_date);
grant select, insert, update, delete on public.water_logs to authenticated;
grant all on public.water_logs to service_role;
alter table public.water_logs enable row level security;
create policy "own water all" on public.water_logs for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- FAVORITES
create table public.favorite_foods (
  user_id uuid not null default auth.uid(),
  food_id uuid not null references public.foods(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, food_id)
);
grant select, insert, delete on public.favorite_foods to authenticated;
grant all on public.favorite_foods to service_role;
alter table public.favorite_foods enable row level security;
create policy "own fav all" on public.favorite_foods for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- CUSTOM MEALS / TEMPLATES
create table public.custom_meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  name text not null,
  meal_type text not null default 'other',
  kcal numeric not null default 0,
  protein numeric not null default 0,
  carbs numeric not null default 0,
  fat numeric not null default 0,
  fiber numeric not null default 0,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.custom_meals to authenticated;
grant all on public.custom_meals to service_role;
alter table public.custom_meals enable row level security;
create policy "own meals all" on public.custom_meals for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create table public.custom_meal_items (
  id uuid primary key default gen_random_uuid(),
  meal_id uuid not null references public.custom_meals(id) on delete cascade,
  user_id uuid not null default auth.uid(),
  food_id uuid references public.foods(id) on delete set null,
  food_name text not null,
  quantity numeric not null,
  unit text not null,
  grams numeric not null,
  kcal numeric not null default 0,
  protein numeric not null default 0,
  carbs numeric not null default 0,
  fat numeric not null default 0,
  fiber numeric not null default 0
);
create index custom_meal_items_meal_idx on public.custom_meal_items (meal_id);
grant select, insert, update, delete on public.custom_meal_items to authenticated;
grant all on public.custom_meal_items to service_role;
alter table public.custom_meal_items enable row level security;
create policy "own meal items all" on public.custom_meal_items for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- AI MEAL PLANS & RECOMMENDATIONS
create table public.ai_meal_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  params jsonb not null default '{}'::jsonb,
  plan jsonb not null,
  created_at timestamptz not null default now()
);
create index ai_meal_plans_user_idx on public.ai_meal_plans (user_id, created_at desc);
grant select, insert, delete on public.ai_meal_plans to authenticated;
grant all on public.ai_meal_plans to service_role;
alter table public.ai_meal_plans enable row level security;
create policy "own plans all" on public.ai_meal_plans for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create table public.ai_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  kind text not null default 'insight',
  log_date date not null default current_date,
  content text not null,
  context jsonb,
  created_at timestamptz not null default now()
);
create index ai_recs_user_idx on public.ai_recommendations (user_id, created_at desc);
grant select, insert, delete on public.ai_recommendations to authenticated;
grant all on public.ai_recommendations to service_role;
alter table public.ai_recommendations enable row level security;
create policy "own recs all" on public.ai_recommendations for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- CHAT
create table public.chat_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  title text not null default 'New chat',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index chat_threads_user_idx on public.chat_threads (user_id, updated_at desc);
grant select, insert, update, delete on public.chat_threads to authenticated;
grant all on public.chat_threads to service_role;
alter table public.chat_threads enable row level security;
create policy "own threads all" on public.chat_threads for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.chat_threads(id) on delete cascade,
  user_id uuid not null default auth.uid(),
  ui_id text not null,
  role text not null,
  message jsonb not null,
  created_at timestamptz not null default now(),
  unique (thread_id, ui_id)
);
create index chat_messages_thread_idx on public.chat_messages (thread_id, created_at);
grant select, insert, update, delete on public.chat_messages to authenticated;
grant all on public.chat_messages to service_role;
alter table public.chat_messages enable row level security;
create policy "own messages all" on public.chat_messages for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- SEED FOOD DATABASE (nutrition per 100 g; servings in grams)
insert into public.foods (name, category, kcal, protein, carbs, fat, fiber, is_veg, is_vegan, servings) values
('Chicken Breast (cooked)','Meat',165,31,0,3.6,0,false,false,'[{"unit":"piece","label":"1 piece","grams":120},{"unit":"serving","label":"1 serving","grams":150}]'),
('Chicken Curry','Meat',150,14,5,8,1,false,false,'[{"unit":"cup","label":"1 cup","grams":240},{"unit":"serving","label":"1 serving","grams":200}]'),
('Chicken Thigh (cooked)','Meat',209,26,0,10.9,0,false,false,'[{"unit":"piece","label":"1 piece","grams":100}]'),
('Mutton Curry','Meat',190,16,4,12,1,false,false,'[{"unit":"serving","label":"1 serving","grams":200}]'),
('Fish (Rohu, cooked)','Seafood',130,22,0,4,0,false,false,'[{"unit":"piece","label":"1 piece","grams":100}]'),
('Salmon (cooked)','Seafood',206,22,0,12,0,false,false,'[{"unit":"serving","label":"1 fillet","grams":150}]'),
('Tuna (canned in water)','Seafood',116,26,0,1,0,false,false,'[{"unit":"cup","label":"1 can","grams":140}]'),
('Prawns (cooked)','Seafood',99,24,0.2,0.3,0,false,false,'[{"unit":"serving","label":"1 serving","grams":100}]'),
('Egg (whole, boiled)','Eggs',155,13,1.1,11,0,false,false,'[{"unit":"egg","label":"1 egg","grams":50},{"unit":"piece","label":"1 piece","grams":50}]'),
('Egg White','Eggs',52,11,0.7,0.2,0,false,false,'[{"unit":"egg","label":"1 egg white","grams":33}]'),
('Omelette (2 eggs)','Eggs',154,11,1,12,0,false,false,'[{"unit":"serving","label":"1 omelette","grams":120}]'),
('White Rice (cooked)','Grains',130,2.7,28,0.3,0.4,true,true,'[{"unit":"cup","label":"1 cup","grams":158},{"unit":"serving","label":"1 bowl","grams":200}]'),
('White Rice (raw)','Grains',365,7.1,80,0.7,1.3,true,true,'[{"unit":"cup","label":"1 cup","grams":185}]'),
('Brown Rice (cooked)','Grains',123,2.7,25.6,1,1.6,true,true,'[{"unit":"cup","label":"1 cup","grams":195}]'),
('Basmati Rice (cooked)','Grains',121,3.5,25,0.4,0.4,true,true,'[{"unit":"cup","label":"1 cup","grams":163}]'),
('Jeera Rice','Grains',160,3,28,4,0.6,true,true,'[{"unit":"cup","label":"1 cup","grams":160}]'),
('Vegetable Biryani','Grains',160,3.5,25,5,1.5,true,false,'[{"unit":"serving","label":"1 plate","grams":250}]'),
('Chicken Biryani','Grains',180,9,22,6,1,false,false,'[{"unit":"serving","label":"1 plate","grams":300}]'),
('Rolled Oats (dry)','Grains',389,16.9,66,6.9,10.6,true,true,'[{"unit":"cup","label":"1 cup","grams":80},{"unit":"tbsp","label":"1 tablespoon","grams":5}]'),
('Poha','Grains',130,2.5,26,2.5,1,true,true,'[{"unit":"cup","label":"1 plate","grams":150}]'),
('Upma','Grains',140,3.5,22,4.5,1.5,true,false,'[{"unit":"cup","label":"1 bowl","grams":200}]'),
('Quinoa (cooked)','Grains',120,4.4,21,1.9,2.8,true,true,'[{"unit":"cup","label":"1 cup","grams":185}]'),
('Roti / Chapati','Breads',297,9.8,46,7.5,4.9,true,true,'[{"unit":"piece","label":"1 roti","grams":40}]'),
('Paratha (plain)','Breads',326,7,45,13,4,true,false,'[{"unit":"piece","label":"1 paratha","grams":80}]'),
('Aloo Paratha','Breads',260,5,36,10,3,true,false,'[{"unit":"piece","label":"1 paratha","grams":130}]'),
('Naan','Breads',310,9,50,8,2,true,false,'[{"unit":"piece","label":"1 naan","grams":90}]'),
('Whole Wheat Bread','Breads',247,13,41,3.4,7,true,true,'[{"unit":"piece","label":"1 slice","grams":30}]'),
('White Bread','Breads',265,9,49,3.2,2.7,true,true,'[{"unit":"piece","label":"1 slice","grams":25}]'),
('Idli','Breads',146,4.5,30,0.4,1.5,true,true,'[{"unit":"piece","label":"1 idli","grams":40}]'),
('Dosa (plain)','Breads',168,3.9,29,3.7,1,true,true,'[{"unit":"piece","label":"1 dosa","grams":85}]'),
('Masala Dosa','Breads',190,4,28,7,2,true,false,'[{"unit":"piece","label":"1 dosa","grams":150}]'),
('Toor Dal (cooked)','Legumes',116,6.8,19,0.4,5,true,true,'[{"unit":"cup","label":"1 bowl","grams":200}]'),
('Moong Dal (cooked)','Legumes',105,7,19,0.4,7.6,true,true,'[{"unit":"cup","label":"1 bowl","grams":200}]'),
('Chana / Chickpeas (cooked)','Legumes',164,8.9,27,2.6,7.6,true,true,'[{"unit":"cup","label":"1 cup","grams":164}]'),
('Rajma (cooked)','Legumes',127,8.7,22.8,0.5,6.4,true,true,'[{"unit":"cup","label":"1 bowl","grams":180}]'),
('Soya Chunks (dry)','Legumes',345,52,33,0.5,13,true,true,'[{"unit":"cup","label":"1 cup","grams":50},{"unit":"tbsp","label":"1 tablespoon","grams":8}]'),
('Tofu (firm)','Legumes',144,17,3,9,2,true,true,'[{"unit":"serving","label":"1 serving","grams":100}]'),
('Peanuts','Nuts & Seeds',567,25.8,16,49,8.5,true,true,'[{"unit":"tbsp","label":"1 tablespoon","grams":9},{"unit":"cup","label":"1 handful","grams":30}]'),
('Peanut Butter','Nuts & Seeds',588,25,20,50,6,true,true,'[{"unit":"tbsp","label":"1 tablespoon","grams":16}]'),
('Almonds','Nuts & Seeds',579,21,22,50,12.5,true,true,'[{"unit":"piece","label":"1 almond","grams":1.2},{"unit":"cup","label":"1 handful","grams":28}]'),
('Walnuts','Nuts & Seeds',654,15,14,65,6.7,true,true,'[{"unit":"cup","label":"1 handful","grams":28}]'),
('Chia Seeds','Nuts & Seeds',486,17,42,31,34,true,true,'[{"unit":"tbsp","label":"1 tablespoon","grams":12}]'),
('Paneer','Dairy',265,18.3,1.2,20.8,0,true,false,'[{"unit":"cup","label":"1 cup cubes","grams":150},{"unit":"piece","label":"1 cube","grams":20}]'),
('Paneer Butter Masala','Dairy',220,8,8,17,1,true,false,'[{"unit":"serving","label":"1 bowl","grams":200}]'),
('Milk (toned)','Dairy',58,3.1,4.7,3,0,true,false,'[{"unit":"cup","label":"1 glass","grams":250}]'),
('Milk (full cream)','Dairy',61,3.2,4.8,3.3,0,true,false,'[{"unit":"cup","label":"1 glass","grams":250}]'),
('Curd / Yogurt','Dairy',61,3.5,4.7,3.3,0,true,false,'[{"unit":"cup","label":"1 bowl","grams":150},{"unit":"tbsp","label":"1 tablespoon","grams":15}]'),
('Greek Yogurt (plain, low-fat)','Dairy',73,10,3.9,1.9,0,true,false,'[{"unit":"cup","label":"1 cup","grams":170}]'),
('Cheese Slice','Dairy',330,18,6,26,0,true,false,'[{"unit":"piece","label":"1 slice","grams":20}]'),
('Butter','Dairy',717,0.9,0.1,81,0,true,false,'[{"unit":"tbsp","label":"1 tablespoon","grams":14}]'),
('Ghee','Dairy',900,0,0,100,0,true,false,'[{"unit":"tbsp","label":"1 tablespoon","grams":13}]'),
('Whey Protein (scoop)','Supplements',400,80,8,6,0,true,false,'[{"unit":"serving","label":"1 scoop","grams":30}]'),
('Banana','Fruits',89,1.1,23,0.3,2.6,true,true,'[{"unit":"banana","label":"1 banana","grams":118},{"unit":"piece","label":"1 piece","grams":118}]'),
('Apple','Fruits',52,0.3,14,0.2,2.4,true,true,'[{"unit":"piece","label":"1 apple","grams":182}]'),
('Orange','Fruits',47,0.9,12,0.1,2.4,true,true,'[{"unit":"piece","label":"1 orange","grams":130}]'),
('Mango','Fruits',60,0.8,15,0.4,1.6,true,true,'[{"unit":"piece","label":"1 mango","grams":200},{"unit":"cup","label":"1 cup","grams":165}]'),
('Papaya','Fruits',43,0.5,11,0.3,1.7,true,true,'[{"unit":"cup","label":"1 cup","grams":145}]'),
('Grapes','Fruits',69,0.7,18,0.2,0.9,true,true,'[{"unit":"cup","label":"1 cup","grams":151}]'),
('Watermelon','Fruits',30,0.6,8,0.2,0.4,true,true,'[{"unit":"cup","label":"1 cup","grams":152}]'),
('Dates','Fruits',282,2.5,75,0.4,8,true,true,'[{"unit":"piece","label":"1 date","grams":8}]'),
('Mixed Vegetables (cooked)','Vegetables',65,2.5,11,1.5,3.5,true,true,'[{"unit":"cup","label":"1 cup","grams":150}]'),
('Broccoli','Vegetables',34,2.8,7,0.4,2.6,true,true,'[{"unit":"cup","label":"1 cup","grams":91}]'),
('Spinach','Vegetables',23,2.9,3.6,0.4,2.2,true,true,'[{"unit":"cup","label":"1 cup","grams":30}]'),
('Potato (boiled)','Vegetables',87,1.9,20,0.1,1.8,true,true,'[{"unit":"piece","label":"1 potato","grams":150}]'),
('Sweet Potato (boiled)','Vegetables',86,1.6,20,0.1,3,true,true,'[{"unit":"piece","label":"1 sweet potato","grams":130}]'),
('Cucumber','Vegetables',15,0.7,3.6,0.1,0.5,true,true,'[{"unit":"piece","label":"1 cucumber","grams":200}]'),
('Tomato','Vegetables',18,0.9,3.9,0.2,1.2,true,true,'[{"unit":"piece","label":"1 tomato","grams":120}]'),
('Green Salad','Vegetables',20,1.2,3.5,0.2,1.8,true,true,'[{"unit":"cup","label":"1 bowl","grams":100}]'),
('Aloo Sabzi','Vegetables',110,2,15,5,2,true,true,'[{"unit":"cup","label":"1 bowl","grams":150}]'),
('Palak Paneer','Vegetables',160,8,6,12,2,true,false,'[{"unit":"serving","label":"1 bowl","grams":200}]'),
('Chole Masala','Legumes',150,7,20,5,6,true,true,'[{"unit":"serving","label":"1 bowl","grams":200}]'),
('Sambar','Legumes',65,3,9,2,2.5,true,true,'[{"unit":"cup","label":"1 bowl","grams":200}]'),
('Samosa','Snacks',262,4.5,32,13,2.5,true,true,'[{"unit":"piece","label":"1 samosa","grams":100}]'),
('Biscuits (Marie)','Snacks',440,7,76,11,2,true,false,'[{"unit":"piece","label":"1 biscuit","grams":7}]'),
('Potato Chips','Snacks',536,7,53,35,4.8,true,true,'[{"unit":"serving","label":"1 small pack","grams":30}]'),
('Dark Chocolate (70%)','Snacks',598,7.8,46,43,11,true,false,'[{"unit":"piece","label":"1 square","grams":10}]'),
('Pasta (cooked)','Grains',131,5,25,1.1,1.8,true,true,'[{"unit":"cup","label":"1 cup","grams":140}]'),
('Pizza (cheese)','Fast Food',266,11,33,10,2.3,true,false,'[{"unit":"piece","label":"1 slice","grams":107}]'),
('Burger (veg)','Fast Food',250,7,32,10,3,true,false,'[{"unit":"piece","label":"1 burger","grams":150}]'),
('Sugar','Other',387,0,100,0,0,true,true,'[{"unit":"tbsp","label":"1 teaspoon","grams":4}]'),
('Honey','Other',304,0.3,82,0,0.2,true,false,'[{"unit":"tbsp","label":"1 tablespoon","grams":21}]'),
('Olive Oil','Other',884,0,0,100,0,true,true,'[{"unit":"tbsp","label":"1 tablespoon","grams":13.5}]'),
('Tea with Milk & Sugar','Beverages',40,1,6.5,1,0,true,false,'[{"unit":"cup","label":"1 cup","grams":150}]'),
('Coffee with Milk','Beverages',38,1.9,4,1.6,0,true,false,'[{"unit":"cup","label":"1 cup","grams":200}]'),
('Banana Shake','Beverages',90,3,15,2.5,0.8,true,false,'[{"unit":"cup","label":"1 glass","grams":300}]'),
('Buttermilk (Chaas)','Beverages',40,3.3,4.8,0.9,0,true,false,'[{"unit":"cup","label":"1 glass","grams":250}]'),
('Coconut Water','Beverages',19,0.7,3.7,0.2,1.1,true,true,'[{"unit":"cup","label":"1 glass","grams":240}]');
