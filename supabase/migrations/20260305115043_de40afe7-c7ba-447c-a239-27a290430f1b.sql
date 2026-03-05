CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, team_id, team_uuid)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    0,
    COALESCE((NEW.raw_user_meta_data->>'team_uuid')::uuid, NULL)
  );
  RETURN NEW;
END;
$$;