-- Fix visits table without moddatetime function
-- Drop and recreate visits table with correct structure

DROP TABLE IF EXISTS public.visits CASCADE;

-- Recreate visits table with correct structure
CREATE TABLE public.visits (
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

-- Add constraint
ALTER TABLE public.visits
ADD CONSTRAINT visits_location_check
CHECK (plot_id IS NOT NULL OR cooperative_id IS NOT NULL);

-- Add indexes
CREATE INDEX idx_visits_agent_id ON public.visits(agent_id);
CREATE INDEX idx_visits_producer_id ON public.visits(producer_id);
CREATE INDEX idx_visits_plot_id ON public.visits(plot_id);
CREATE INDEX idx_visits_cooperative_id ON public.visits(cooperative_id);
CREATE INDEX idx_visits_date ON public.visits(visit_date);
CREATE INDEX idx_visits_status ON public.visits(status);
CREATE INDEX idx_visits_type ON public.visits(visit_type);

-- Enable RLS
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Agents can view their own visits"
ON public.visits
FOR SELECT
TO authenticated
USING (agent_id = auth.uid());

CREATE POLICY "Supervisors and Admins can view all visits"
ON public.visits
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('admin', 'supervisor')
  )
);

CREATE POLICY "Agents can create their own visits"
ON public.visits
FOR INSERT
TO authenticated
WITH CHECK (agent_id = auth.uid());

CREATE POLICY "Agents can update their own visits"
ON public.visits
FOR UPDATE
TO authenticated
USING (agent_id = auth.uid())
WITH CHECK (agent_id = auth.uid());

CREATE POLICY "Supervisors and Admins can update any visit"
ON public.visits
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('admin', 'supervisor')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('admin', 'supervisor')
  )
);

CREATE POLICY "Supervisors and Admins can delete any visit"
ON public.visits
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('admin', 'supervisor')
  )
);

-- Create a simple trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for updated_at
CREATE TRIGGER handle_visits_updated_at 
BEFORE UPDATE ON public.visits
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add some sample data for testing
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
LIMIT 3
ON CONFLICT DO NOTHING;
