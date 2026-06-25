-- First-user-becomes-super-admin: extend handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  existing_super INT;
  is_first BOOLEAN;
BEGIN
  SELECT COUNT(*) INTO existing_super FROM public.user_roles WHERE role = 'super_admin';
  is_first := existing_super = 0;

  INSERT INTO public.profiles (id, email, full_name, employee_code, department, username, status, campaign_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name',''),
    NEW.raw_user_meta_data->>'employee_code',
    NEW.raw_user_meta_data->>'department',
    NEW.raw_user_meta_data->>'username',
    CASE WHEN is_first THEN 'active' ELSE 'pending' END,
    NULLIF(NEW.raw_user_meta_data->>'campaign_id','')::uuid
  );

  IF is_first THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'super_admin') ON CONFLICT DO NOTHING;
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'employee') ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END $function$;

-- Ensure the auth trigger exists (idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
