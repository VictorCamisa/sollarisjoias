-- Adiciona colunas extras ao profile
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cpf text,
  ADD COLUMN IF NOT EXISTS birthday date,
  ADD COLUMN IF NOT EXISTS email text;

-- Index único parcial em CPF (quando preenchido)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_cpf_unique
  ON public.profiles ((regexp_replace(cpf, '[^0-9]', '', 'g')))
  WHERE cpf IS NOT NULL AND length(regexp_replace(cpf, '[^0-9]', '', 'g')) = 11;

-- Função enriquecida: busca por CPF (prioritário), depois telefone, ou cria novo
CREATE OR REPLACE FUNCTION public.get_or_create_customer_full(
  _name text,
  _phone text DEFAULT NULL,
  _cpf text DEFAULT NULL,
  _email text DEFAULT NULL,
  _address text DEFAULT NULL,
  _birthday date DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  pid uuid;
  cpf_digits text;
  phone_digits text;
BEGIN
  cpf_digits := CASE
    WHEN _cpf IS NULL THEN NULL
    ELSE regexp_replace(_cpf, '[^0-9]', '', 'g')
  END;
  phone_digits := CASE
    WHEN _phone IS NULL THEN NULL
    ELSE regexp_replace(_phone, '[^0-9]', '', 'g')
  END;

  -- 1. Tenta achar por CPF (mais único)
  IF cpf_digits IS NOT NULL AND length(cpf_digits) = 11 THEN
    SELECT id INTO pid FROM profiles
    WHERE regexp_replace(COALESCE(cpf,''), '[^0-9]', '', 'g') = cpf_digits
    LIMIT 1;
  END IF;

  -- 2. Tenta achar por telefone
  IF pid IS NULL AND phone_digits IS NOT NULL AND length(phone_digits) >= 10 THEN
    SELECT id INTO pid FROM profiles
    WHERE regexp_replace(COALESCE(phone,''), '[^0-9]', '', 'g') = phone_digits
    LIMIT 1;
  END IF;

  -- 3. Cria novo se não achou
  IF pid IS NULL THEN
    pid := gen_random_uuid();
    INSERT INTO profiles (id, full_name, phone, cpf, email, address, birthday, credit_limit, credit_score)
    VALUES (
      pid,
      COALESCE(NULLIF(_name,''), 'Cliente'),
      _phone,
      _cpf,
      _email,
      _address,
      _birthday,
      0,
      100
    );
  ELSE
    -- 4. Enriquece o existente sem sobrescrever dados não vazios
    UPDATE profiles SET
      full_name = COALESCE(NULLIF(full_name,''), _name),
      phone     = COALESCE(NULLIF(phone,''), _phone),
      cpf       = COALESCE(NULLIF(cpf,''), _cpf),
      email     = COALESCE(NULLIF(email,''), _email),
      address   = COALESCE(NULLIF(address,''), _address),
      birthday  = COALESCE(birthday, _birthday),
      updated_at = now()
    WHERE id = pid;
  END IF;

  RETURN pid;
END;
$$;