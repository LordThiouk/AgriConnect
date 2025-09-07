-- Add User Role Enum for AgriConnect
-- This migration adds an enum type and keeps the existing TEXT column for compatibility

-- Create the user role enum type
CREATE TYPE public.user_role AS ENUM (
  'admin',
  'supervisor', 
  'agent',
  'producer',
  'coop_admin'
);

-- Add a comment to document the enum values
COMMENT ON TYPE public.user_role IS 'User roles in AgriConnect system: admin (full access), supervisor (regional oversight), agent (field data collection), producer (farmer), coop_admin (cooperative management)';

-- Add a function to validate role values
CREATE OR REPLACE FUNCTION public.validate_user_role(role_text TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN role_text IN ('admin', 'supervisor', 'agent', 'producer', 'coop_admin');
END;
$$;

-- Add a comment to the function
COMMENT ON FUNCTION public.validate_user_role(TEXT) 
IS 'Validates if a role text value is a valid user role';

-- Add a function to convert role text to enum
CREATE OR REPLACE FUNCTION public.role_text_to_enum(role_text TEXT)
RETURNS public.user_role
LANGUAGE plpgsql
AS $$
BEGIN
  CASE role_text
    WHEN 'admin' THEN RETURN 'admin'::public.user_role;
    WHEN 'supervisor' THEN RETURN 'supervisor'::public.user_role;
    WHEN 'agent' THEN RETURN 'agent'::public.user_role;
    WHEN 'producer' THEN RETURN 'producer'::public.user_role;
    WHEN 'coop_admin' THEN RETURN 'coop_admin'::public.user_role;
    ELSE RETURN 'agent'::public.user_role;
  END CASE;
END;
$$;

-- Add a comment to the function
COMMENT ON FUNCTION public.role_text_to_enum(TEXT) 
IS 'Converts role text to user_role enum';

-- Add a function to convert enum to role text
CREATE OR REPLACE FUNCTION public.role_enum_to_text(role_enum public.user_role)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN role_enum::TEXT;
END;
$$;

-- Add a comment to the function
COMMENT ON FUNCTION public.role_enum_to_text(public.user_role) 
IS 'Converts user_role enum to text';

-- Create a view to show role statistics using the enum
CREATE OR REPLACE VIEW public.role_statistics AS
SELECT 
  public.role_text_to_enum(role) as role_enum,
  role as role_text,
  COUNT(*) as user_count,
  COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as new_users_last_30_days
FROM public.profiles
GROUP BY role
ORDER BY user_count DESC;

-- Add RLS policy for role statistics (only admins can see)
-- Note: Views don't support RLS policies directly, so we'll handle this in the application layer

-- Grant access to the view
GRANT SELECT ON public.role_statistics TO authenticated;

-- Create a function to get role permissions
CREATE OR REPLACE FUNCTION public.get_role_permissions(role_text TEXT)
RETURNS TABLE(
  can_manage_users BOOLEAN,
  can_manage_cooperatives BOOLEAN,
  can_manage_producers BOOLEAN,
  can_manage_plots BOOLEAN,
  can_manage_crops BOOLEAN,
  can_manage_operations BOOLEAN,
  can_manage_observations BOOLEAN,
  can_manage_recommendations BOOLEAN,
  can_view_analytics BOOLEAN,
  can_manage_system BOOLEAN
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE role_text
      WHEN 'admin' THEN TRUE
      WHEN 'supervisor' THEN TRUE
      ELSE FALSE
    END as can_manage_users,
    
    CASE role_text
      WHEN 'admin' THEN TRUE
      WHEN 'supervisor' THEN TRUE
      WHEN 'coop_admin' THEN TRUE
      ELSE FALSE
    END as can_manage_cooperatives,
    
    CASE role_text
      WHEN 'admin' THEN TRUE
      WHEN 'supervisor' THEN TRUE
      WHEN 'agent' THEN TRUE
      ELSE FALSE
    END as can_manage_producers,
    
    CASE role_text
      WHEN 'admin' THEN TRUE
      WHEN 'supervisor' THEN TRUE
      WHEN 'agent' THEN TRUE
      ELSE FALSE
    END as can_manage_plots,
    
    CASE role_text
      WHEN 'admin' THEN TRUE
      WHEN 'supervisor' THEN TRUE
      WHEN 'agent' THEN TRUE
      ELSE FALSE
    END as can_manage_crops,
    
    CASE role_text
      WHEN 'admin' THEN TRUE
      WHEN 'supervisor' THEN TRUE
      WHEN 'agent' THEN TRUE
      ELSE FALSE
    END as can_manage_operations,
    
    CASE role_text
      WHEN 'admin' THEN TRUE
      WHEN 'supervisor' THEN TRUE
      WHEN 'agent' THEN TRUE
      ELSE FALSE
    END as can_manage_observations,
    
    CASE role_text
      WHEN 'admin' THEN TRUE
      WHEN 'supervisor' THEN TRUE
      WHEN 'agent' THEN TRUE
      ELSE FALSE
    END as can_manage_recommendations,
    
    CASE role_text
      WHEN 'admin' THEN TRUE
      WHEN 'supervisor' THEN TRUE
      ELSE FALSE
    END as can_view_analytics,
    
    CASE role_text
      WHEN 'admin' THEN TRUE
      ELSE FALSE
    END as can_manage_system;
END;
$$;

-- Add a comment to the function
COMMENT ON FUNCTION public.get_role_permissions(TEXT) 
IS 'Returns permissions for a given role';

-- Create a function to check if a role can access a platform
CREATE OR REPLACE FUNCTION public.can_access_platform(role_text TEXT, platform TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  IF platform = 'web' THEN
    RETURN role_text IN ('admin', 'supervisor');
  ELSIF platform = 'mobile' THEN
    RETURN role_text IN ('agent', 'producer');
  ELSE
    RETURN FALSE;
  END IF;
END;
$$;

-- Add a comment to the function
COMMENT ON FUNCTION public.can_access_platform(TEXT, TEXT) 
IS 'Checks if a role can access a specific platform (web or mobile)';

-- Create a function to get role display name
CREATE OR REPLACE FUNCTION public.get_role_display_name(role_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  CASE role_text
    WHEN 'admin' THEN RETURN 'Administrateur';
    WHEN 'supervisor' THEN RETURN 'Superviseur';
    WHEN 'agent' THEN RETURN 'Agent de terrain';
    WHEN 'producer' THEN RETURN 'Producteur';
    WHEN 'coop_admin' THEN RETURN 'Administrateur de coopérative';
    ELSE RETURN 'Rôle inconnu';
  END CASE;
END;
$$;

-- Add a comment to the function
COMMENT ON FUNCTION public.get_role_display_name(TEXT) 
IS 'Returns the display name for a role in French';

-- Create a trigger to validate role values on insert/update
CREATE OR REPLACE FUNCTION public.validate_profile_role()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT public.validate_user_role(NEW.role) THEN
    RAISE EXCEPTION 'Invalid role: %', NEW.role;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_validate_profile_role ON public.profiles;
CREATE TRIGGER trigger_validate_profile_role
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_profile_role();

-- Add a comment to the trigger
COMMENT ON TRIGGER trigger_validate_profile_role ON public.profiles 
IS 'Validates role values on insert/update';
