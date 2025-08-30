-- Comprehensive Agricultural Database Schema for AgriConnect
-- This migration creates all core tables needed for agricultural data management

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create cooperatives table
CREATE TABLE public.cooperatives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  region TEXT,
  department TEXT,
  commune TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  contact_person TEXT,
  geom GEOMETRY(POINT, 4326), -- GPS coordinates
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create seasons table for agricultural campaigns
CREATE TABLE public.seasons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  label TEXT NOT NULL UNIQUE, -- e.g., "Campagne 2025-2026"
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create producers table (farmers)
CREATE TABLE public.producers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  cooperative_id UUID REFERENCES public.cooperatives(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  email TEXT,
  birth_date DATE,
  gender TEXT CHECK (gender IN ('M', 'F', 'O')),
  village TEXT,
  commune TEXT,
  department TEXT,
  region TEXT,
  address TEXT,
  household_size INTEGER,
  farming_experience_years INTEGER,
  primary_language TEXT DEFAULT 'fr',
  education_level TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create plots table (agricultural parcels)
CREATE TABLE public.plots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  producer_id UUID NOT NULL REFERENCES public.producers(id) ON DELETE CASCADE,
  cooperative_id UUID REFERENCES public.cooperatives(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  area_hectares DECIMAL(8,2) NOT NULL CHECK (area_hectares > 0),
  soil_type TEXT CHECK (soil_type IN ('sandy', 'clay', 'loam', 'silt', 'organic', 'other')),
  soil_ph DECIMAL(3,1) CHECK (soil_ph >= 0 AND soil_ph <= 14),
  water_source TEXT CHECK (water_source IN ('rain', 'irrigation', 'well', 'river', 'other')),
  irrigation_type TEXT CHECK (irrigation_type IN ('none', 'drip', 'sprinkler', 'flood', 'other')),
  slope_percent INTEGER CHECK (slope_percent >= 0 AND slope_percent <= 100),
  elevation_meters INTEGER,
  geom GEOMETRY(POLYGON, 4326), -- GPS polygon of the plot
  center_point GEOMETRY(POINT, 4326), -- Center point for easy access
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'abandoned')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create crops table (crops planted on plots)
CREATE TABLE public.crops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plot_id UUID NOT NULL REFERENCES public.plots(id) ON DELETE CASCADE,
  season_id UUID NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  crop_type TEXT NOT NULL CHECK (crop_type IN ('maize', 'millet', 'sorghum', 'rice', 'peanuts', 'cotton', 'vegetables', 'fruits', 'other')),
  variety TEXT,
  sowing_date DATE NOT NULL,
  expected_harvest_date DATE,
  actual_harvest_date DATE,
  expected_yield_kg DECIMAL(10,2),
  actual_yield_kg DECIMAL(10,2),
  status TEXT DEFAULT 'en_cours' CHECK (status IN ('en_cours', 'recolte', 'abandonne')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create operations table (agricultural operations)
CREATE TABLE public.operations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  crop_id UUID NOT NULL REFERENCES public.crops(id) ON DELETE CASCADE,
  plot_id UUID NOT NULL REFERENCES public.plots(id) ON DELETE CASCADE,
  operation_type TEXT NOT NULL CHECK (operation_type IN ('semis', 'fertilisation', 'irrigation', 'desherbage', 'phytosanitaire', 'recolte', 'labour', 'reconnaissance')),
  operation_date DATE NOT NULL,
  description TEXT,
  product_used TEXT,
  dose_per_hectare DECIMAL(8,2),
  total_dose DECIMAL(8,2),
  unit TEXT CHECK (unit IN ('kg', 'l', 'pieces', 'other')),
  cost_per_hectare DECIMAL(10,2),
  total_cost DECIMAL(10,2),
  performed_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create observations table (field observations and monitoring)
CREATE TABLE public.observations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  crop_id UUID NOT NULL REFERENCES public.crops(id) ON DELETE CASCADE,
  plot_id UUID NOT NULL REFERENCES public.plots(id) ON DELETE CASCADE,
  observation_date DATE NOT NULL,
  observation_type TEXT NOT NULL CHECK (observation_type IN ('levée', 'maladie', 'ravageur', 'stress_hydrique', 'stress_nutritionnel', 'développement', 'other')),
  emergence_percent INTEGER CHECK (emergence_percent >= 0 AND emergence_percent <= 100),
  pest_disease_name TEXT,
  severity INTEGER CHECK (severity >= 1 AND severity <= 5), -- 1=low, 5=critical
  affected_area_percent DECIMAL(5,2) CHECK (affected_area_percent >= 0 AND affected_area_percent <= 100),
  description TEXT,
  recommendations TEXT,
  observed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create media table for photos and documents
CREATE TABLE public.media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_profile_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('plot', 'crop', 'operation', 'observation', 'producer')),
  entity_id UUID NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size_bytes BIGINT,
  gps_coordinates GEOMETRY(POINT, 4326),
  taken_at TIMESTAMP WITH TIME ZONE,
  description TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create agricultural rules table for automated recommendations
CREATE TABLE public.agri_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  condition_sql TEXT NOT NULL, -- SQL condition to evaluate
  action_type TEXT NOT NULL CHECK (action_type IN ('notification', 'recommendation', 'alert', 'reminder')),
  action_message TEXT NOT NULL,
  severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  is_active BOOLEAN DEFAULT true,
  applicable_crops TEXT[], -- Array of crop types this rule applies to
  applicable_regions TEXT[], -- Array of regions this rule applies to
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create recommendations table (generated by rules or manual)
CREATE TABLE public.recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  crop_id UUID REFERENCES public.crops(id) ON DELETE CASCADE,
  plot_id UUID REFERENCES public.plots(id) ON DELETE CASCADE,
  producer_id UUID REFERENCES public.producers(id) ON DELETE CASCADE,
  rule_code TEXT REFERENCES public.agri_rules(code),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  recommendation_type TEXT NOT NULL CHECK (recommendation_type IN ('fertilisation', 'irrigation', 'pest_control', 'harvest', 'other')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'acknowledged', 'completed', 'dismissed')),
  sent_at TIMESTAMP WITH TIME ZONE,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create notifications table for tracking sent notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('sms', 'whatsapp', 'push', 'email', 'inapp')),
  provider TEXT, -- e.g., 'twilio', 'expo'
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  metadata JSONB, -- Additional provider-specific data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create audit log table for tracking important changes
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_values JSONB,
  new_values JSONB,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_producers_cooperative_id ON public.producers(cooperative_id);
CREATE INDEX idx_producers_phone ON public.producers(phone);
CREATE INDEX idx_plots_producer_id ON public.plots(producer_id);
CREATE INDEX idx_plots_cooperative_id ON public.plots(cooperative_id);
CREATE INDEX idx_plots_geom ON public.plots USING GIST(geom);
CREATE INDEX idx_crops_plot_id ON public.crops(plot_id);
CREATE INDEX idx_crops_season_id ON public.crops(season_id);
CREATE INDEX idx_operations_crop_id ON public.operations(crop_id);
CREATE INDEX idx_operations_plot_id ON public.operations(plot_id);
CREATE INDEX idx_observations_crop_id ON public.observations(crop_id);
CREATE INDEX idx_observations_plot_id ON public.observations(plot_id);
CREATE INDEX idx_media_entity ON public.media(entity_type, entity_id);
CREATE INDEX idx_recommendations_crop_id ON public.recommendations(crop_id);
CREATE INDEX idx_recommendations_producer_id ON public.recommendations(producer_id);
CREATE INDEX idx_notifications_profile_id ON public.notifications(profile_id);
CREATE INDEX idx_audit_logs_table_record ON public.audit_logs(table_name, record_id);

-- Enable Row Level Security on all tables
ALTER TABLE public.cooperatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.producers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agri_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Create triggers for updated_at columns
CREATE TRIGGER update_cooperatives_updated_at BEFORE UPDATE ON public.cooperatives FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_seasons_updated_at BEFORE UPDATE ON public.seasons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_producers_updated_at BEFORE UPDATE ON public.producers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_plots_updated_at BEFORE UPDATE ON public.plots FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_crops_updated_at BEFORE UPDATE ON public.crops FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_operations_updated_at BEFORE UPDATE ON public.operations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_observations_updated_at BEFORE UPDATE ON public.observations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_media_updated_at BEFORE UPDATE ON public.media FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_agri_rules_updated_at BEFORE UPDATE ON public.agri_rules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_recommendations_updated_at BEFORE UPDATE ON public.recommendations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON public.notifications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create audit trigger function
CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (table_name, record_id, action, new_values, changed_by)
    VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', to_jsonb(NEW), auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (table_name, record_id, action, old_values, new_values, changed_by)
    VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (table_name, record_id, action, old_values, changed_by)
    VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', to_jsonb(OLD), auth.uid());
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Create audit triggers for critical tables
CREATE TRIGGER audit_producers_trigger AFTER INSERT OR UPDATE OR DELETE ON public.producers FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();
CREATE TRIGGER audit_plots_trigger AFTER INSERT OR UPDATE OR DELETE ON public.plots FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();
CREATE TRIGGER audit_crops_trigger AFTER INSERT OR UPDATE OR DELETE ON public.crops FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();
CREATE TRIGGER audit_operations_trigger AFTER INSERT OR UPDATE OR DELETE ON public.operations FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Insert default season
INSERT INTO public.seasons (label, start_date, end_date, is_active) 
VALUES ('Campagne 2025-2026', '2025-06-01', '2026-05-31', true);

-- Insert sample cooperative
INSERT INTO public.cooperatives (name, description, region, department, commune, address, phone, email, contact_person)
VALUES ('Coopérative Agricole de Thiès', 'Coopérative principale de la région de Thiès', 'Thiès', 'Thiès', 'Thiès', 'Route de Dakar, Thiès', '+221 33 123 45 67', 'contact@coop-thies.sn', 'Mamadou Diallo');
