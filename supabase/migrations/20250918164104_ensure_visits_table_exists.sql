-- Ensure visits table exists with proper structure
-- This migration will create the visits table if it doesn't exist

-- Create visits table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.profiles(id),
  producer_id UUID NOT NULL REFERENCES public.producers(id),
  plot_id UUID REFERENCES public.plots(id),
  cooperative_id UUID REFERENCES public.cooperatives(id),
  visit_date TIMESTAMP WITH TIME ZONE NOT NULL,
  visit_type TEXT CHECK (visit_type IN ('planned', 'follow_up', 'emergency', 'routine')) DEFAULT 'planned',
  status TEXT CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show')) DEFAULT 'scheduled',
  duration_minutes INTEGER,
  location_latitude DECIMAL(10, 8),
  location_longitude DECIMAL(11, 8),
  notes TEXT,
  weather_conditions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Constraint: at least one location reference (plot or cooperative)
  CONSTRAINT visits_location_check 
    CHECK (plot_id IS NOT NULL OR cooperative_id IS NOT NULL),
    
  -- Constraint: valid coordinates if provided
  CONSTRAINT visits_latitude_check 
    CHECK (location_latitude IS NULL OR (location_latitude >= -90 AND location_latitude <= 90)),
    
  CONSTRAINT visits_longitude_check 
    CHECK (location_longitude IS NULL OR (location_longitude >= -180 AND location_longitude <= 180))
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_visits_agent_id ON public.visits(agent_id);
CREATE INDEX IF NOT EXISTS idx_visits_producer_id ON public.visits(producer_id);
CREATE INDEX IF NOT EXISTS idx_visits_plot_id ON public.visits(plot_id);
CREATE INDEX IF NOT EXISTS idx_visits_cooperative_id ON public.visits(cooperative_id);
CREATE INDEX IF NOT EXISTS idx_visits_date ON public.visits(visit_date);
CREATE INDEX IF NOT EXISTS idx_visits_status ON public.visits(status);
CREATE INDEX IF NOT EXISTS idx_visits_type ON public.visits(visit_type);
CREATE INDEX IF NOT EXISTS idx_visits_agent_date ON public.visits(agent_id, visit_date);
CREATE INDEX IF NOT EXISTS idx_visits_producer_date ON public.visits(producer_id, visit_date);
CREATE INDEX IF NOT EXISTS idx_visits_status_date ON public.visits(status, visit_date);

-- Enable RLS if not already enabled
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;

-- Create policies if they don't exist
DO $$
BEGIN
  -- Policy: Agents can view their own visits
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'visits' 
    AND policyname = 'Agents can view their own visits'
  ) THEN
    CREATE POLICY "Agents can view their own visits"
    ON public.visits
    FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.id = visits.agent_id
      )
    );
  END IF;

  -- Policy: Agents can insert their own visits
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'visits' 
    AND policyname = 'Agents can insert their own visits'
  ) THEN
    CREATE POLICY "Agents can insert their own visits"
    ON public.visits
    FOR INSERT
    TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.id = visits.agent_id
      )
    );
  END IF;

  -- Policy: Agents can update their own visits
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'visits' 
    AND policyname = 'Agents can update their own visits'
  ) THEN
    CREATE POLICY "Agents can update their own visits"
    ON public.visits
    FOR UPDATE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.id = visits.agent_id
      )
    );
  END IF;

  -- Policy: Supervisors and admins can view all visits
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'visits' 
    AND policyname = 'Supervisors and admins can view all visits'
  ) THEN
    CREATE POLICY "Supervisors and admins can view all visits"
    ON public.visits
    FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.role IN ('supervisor', 'admin')
      )
    );
  END IF;

  -- Policy: Supervisors and admins can insert visits
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'visits' 
    AND policyname = 'Supervisors and admins can insert visits'
  ) THEN
    CREATE POLICY "Supervisors and admins can insert visits"
    ON public.visits
    FOR INSERT
    TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.role IN ('supervisor', 'admin')
      )
    );
  END IF;

  -- Policy: Supervisors and admins can update visits
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'visits' 
    AND policyname = 'Supervisors and admins can update visits'
  ) THEN
    CREATE POLICY "Supervisors and admins can update visits"
    ON public.visits
    FOR UPDATE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.role IN ('supervisor', 'admin')
      )
    );
  END IF;
END $$;

-- Create trigger for updated_at if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_visits_updated_at'
  ) THEN
    CREATE TRIGGER trigger_visits_updated_at
      BEFORE UPDATE ON public.visits
      FOR EACH ROW
      EXECUTE FUNCTION public.update_visits_updated_at();
  END IF;
END $$;

-- Create the update function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_visits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add comments
COMMENT ON TABLE public.visits IS 'Tracks agent visits to producers, plots, and cooperatives';
COMMENT ON COLUMN public.visits.agent_id IS 'Agent who performed the visit';
COMMENT ON COLUMN public.visits.producer_id IS 'Producer being visited';
COMMENT ON COLUMN public.visits.plot_id IS 'Specific plot visited (optional)';
COMMENT ON COLUMN public.visits.cooperative_id IS 'Cooperative visited (optional)';
COMMENT ON COLUMN public.visits.visit_date IS 'Date and time of the visit';
COMMENT ON COLUMN public.visits.visit_type IS 'Type of visit: planned, follow_up, emergency, routine';
COMMENT ON COLUMN public.visits.status IS 'Status of the visit: scheduled, in_progress, completed, cancelled, no_show';
COMMENT ON COLUMN public.visits.duration_minutes IS 'Duration of the visit in minutes';
COMMENT ON COLUMN public.visits.location_latitude IS 'Actual latitude where the visit took place';
COMMENT ON COLUMN public.visits.location_longitude IS 'Actual longitude where the visit took place';
COMMENT ON COLUMN public.visits.notes IS 'Notes about the visit';
COMMENT ON COLUMN public.visits.weather_conditions IS 'Weather conditions during the visit';
