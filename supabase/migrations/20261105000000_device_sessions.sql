-- Device-to-device session transfer for Azhar Med Quiz.
-- Recovery codes are 256-bit random bearer secrets. Only SHA-256 hashes are stored.
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.device_sessions (
  id uuid primary key default gen_random_uuid(),
  recovery_code_hash text not null unique,
  payload jsonb not null default '{}'::jsonb,
  version bigint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint device_sessions_payload_size check (pg_column_size(payload) <= 1048576)
);

alter table public.device_sessions enable row level security;
revoke all on public.device_sessions from anon, authenticated;
grant usage on schema public to anon, authenticated;

create or replace function public.create_device_session(
  p_recovery_code text,
  p_payload jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if p_recovery_code is null or length(p_recovery_code) < 40 then
    raise exception 'Invalid recovery code';
  end if;
  if p_payload is null or pg_column_size(p_payload) > 1048576 then
    raise exception 'Session payload is too large';
  end if;

  insert into public.device_sessions (recovery_code_hash, payload)
  values (
    encode(extensions.digest(convert_to(p_recovery_code, 'UTF8'), 'sha256'), 'hex'),
    p_payload
  )
  returning id into v_id;

  return jsonb_build_object('ok', true, 'session_id', v_id, 'version', 1);
end;
$$;

create or replace function public.save_device_session(
  p_recovery_code text,
  p_payload jsonb,
  p_expected_version bigint
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_version bigint;
begin
  if p_recovery_code is null or p_payload is null
     or pg_column_size(p_payload) > 1048576 then
    raise exception 'Invalid session payload';
  end if;

  update public.device_sessions
     set payload = p_payload,
         version = version + 1,
         updated_at = now()
   where recovery_code_hash = encode(extensions.digest(convert_to(p_recovery_code, 'UTF8'), 'sha256'), 'hex')
     and version = p_expected_version
  returning version into v_version;

  if v_version is null then
    return jsonb_build_object('ok', false, 'reason', 'not_owner_or_conflict');
  end if;
  return jsonb_build_object('ok', true, 'version', v_version);
end;
$$;

create or replace function public.transfer_device_session(
  p_recovery_code text,
  p_new_recovery_code text
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_payload jsonb;
  v_version bigint;
begin
  if p_recovery_code is null or p_new_recovery_code is null
     or length(p_recovery_code) < 40 or length(p_new_recovery_code) < 40
     or p_recovery_code = p_new_recovery_code then
    raise exception 'Invalid recovery code';
  end if;

  -- One atomic UPDATE rotates the bearer code. The old device immediately loses ownership.
  update public.device_sessions
     set recovery_code_hash = encode(extensions.digest(convert_to(p_new_recovery_code, 'UTF8'), 'sha256'), 'hex'),
         version = version + 1,
         updated_at = now()
   where recovery_code_hash = encode(extensions.digest(convert_to(p_recovery_code, 'UTF8'), 'sha256'), 'hex')
  returning payload, version into v_payload, v_version;

  if v_version is null then
    return jsonb_build_object('ok', false, 'reason', 'invalid_or_already_transferred');
  end if;
  return jsonb_build_object('ok', true, 'payload', v_payload, 'version', v_version);
end;
$$;

revoke all on function public.create_device_session(text, jsonb) from public;
revoke all on function public.save_device_session(text, jsonb, bigint) from public;
revoke all on function public.transfer_device_session(text, text) from public;
grant execute on function public.create_device_session(text, jsonb) to anon, authenticated;
grant execute on function public.save_device_session(text, jsonb, bigint) to anon, authenticated;
grant execute on function public.transfer_device_session(text, text) to anon, authenticated;
