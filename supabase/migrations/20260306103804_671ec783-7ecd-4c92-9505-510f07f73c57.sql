-- Delete the orphaned user data
DELETE FROM public.availabilities WHERE user_id = '9969c801-65f8-4af8-b02e-5cf8d038ff18';
DELETE FROM public.user_roles WHERE user_id = '9969c801-65f8-4af8-b02e-5cf8d038ff18';
DELETE FROM public.profiles WHERE user_id = '9969c801-65f8-4af8-b02e-5cf8d038ff18';