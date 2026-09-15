-- Permite resolver "nome ou apelido" -> e-mail interno antes da autenticação,
-- sem expor a tabela profiles inteira ao papel anon (ver seção 3.3 da spec:
-- login por nome/apelido, não por e-mail).
create or replace function public.obter_email_login(identificador text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select email_interno from profiles
  where lower(apelido) = lower(identificador) or lower(nome) = lower(identificador)
  limit 1
$$;

grant execute on function public.obter_email_login(text) to anon, authenticated;
