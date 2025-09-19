-- Verify and ensure visits table has correct structure
-- This migration ensures the visits table exists with all required columns

-- First, let's check if the table exists and create it if it doesn't
CREATE TABLE IF NOT EXISTS public.visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  producer_id UUID NOT NULL REFERENCES public.producers(id) ON DELETE CASCADE,
  plot_id UUID REFERENCES public.plots(id) ON DELETE SET NULL,
  cooperative_id UUID REFERENCES public.cooperatives(id) ON DELETE SET NULL,
  visit_date TIMESTAMP WITH TIME ZONE NOT NULL,
  visit_type TEXT NOT NULL CHECK (visit_type IN ('planned', 'follow_up', 'emergency', 'routine')),
  status TEXT NOT NULL CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show')),
  duration_minutes INTEGER,
  location_latitude DECIMAL(10, 8),
  location_longitude DECIMAL(11, 8),
  notes TEXT,
  weather_conditions TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add the location constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'visits_location_check'
  ) THEN
    ALTER TABLE public.visits
    ADD CONSTRAINT visits_location_check
    CHECK (plot_id IS NOT NULL OR cooperative_id IS NOT NULL);
  END IF;
END
$$;

-- Add indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_visits_agent_id ON public.visits(agent_id);
CREATE INDEX IF NOT EXISTS idx_visits_producer_id ON public.visits(producer_id);
CREATE INDEX IF NOT EXISTS idx_visits_plot_id ON public.visits(plot_id);
CREATE INDEX IF NOT EXISTS idx_visits_cooperative_id ON public.visits(cooperative_id);
CREATE INDEX IF NOT EXISTS idx_visits_date ON public.visits(visit_date);
CREATE INDEX IF NOT EXISTS idx_visits_status ON public.visits(status);
CREATE INDEX IF NOT EXISTS idx_visits_type ON public.visits(visit_type);

-- Enable RLS if not already enabled
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;

-- Add some sample data for testing if the table is empty
INSERT INTO public.visits (
  agent_id, 
  producer_id, 
  plot_id, 
  visit_date, 
  visit_type, 
  status, 
  duration_minutes,
  notes
)
SELECT 
  p.id as agent_id,
  pr.id as producer_id,
  fp.plot_id,
  now() - interval '1 day' as visit_date,
  'routine' as visit_type,
  'completed' as status,
  30 as duration_minutes,
  'Visite de routine pour suivi des cultures' as notes
FROM public.profiles p
CROSS JOIN public.producers pr
CROSS JOIN public.farm_file_plots fp
WHERE p.role = 'agent' 
  AND p.is_active = true
  AND fp.producer_id = pr.id
LIMIT 5
ON CONFLICT DO NOTHING; -- Only insert if no conflicts
