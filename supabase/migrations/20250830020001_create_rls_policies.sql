-- Row Level Security Policies for AgriConnect
-- This migration creates security policies for all agricultural tables

-- Cooperative policies
CREATE POLICY "Cooperatives are viewable by authenticated users" ON public.cooperatives
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Cooperatives can be created by admins and supervisors" ON public.cooperatives
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.profiles 
      WHERE role IN ('admin', 'superviseur')
    )
  );

CREATE POLICY "Cooperatives can be updated by admins and supervisors" ON public.cooperatives
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM public.profiles 
      WHERE role IN ('admin', 'superviseur')
    )
  );

-- Season policies
CREATE POLICY "Seasons are viewable by all authenticated users" ON public.seasons
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Seasons can be managed by admins and supervisors" ON public.seasons
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM public.profiles 
      WHERE role IN ('admin', 'superviseur')
    )
  );

-- Producer policies
CREATE POLICY "Producers are viewable by their cooperative members and admins" ON public.producers
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.profiles 
      WHERE role IN ('admin', 'superviseur')
    ) OR
    profile_id = auth.uid() -- Producers can view their own profile
  );

CREATE POLICY "Producers can be created by agents, supervisors and admins" ON public.producers
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.profiles 
      WHERE role IN ('admin', 'superviseur', 'agent')
    )
  );

CREATE POLICY "Producers can be updated by their cooperative agents and admins" ON public.producers
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM public.profiles 
      WHERE role IN ('admin', 'superviseur')
    ) OR
    profile_id = auth.uid() -- Producers can update their own profile
  );

-- Plot policies
CREATE POLICY "Plots are viewable by their producer, cooperative members and admins" ON public.plots
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.profiles 
      WHERE role IN ('admin', 'superviseur')
    ) OR
    producer_id IN (
      SELECT id FROM public.producers WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Plots can be created by agents, supervisors and admins" ON public.plots
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.profiles 
      WHERE role IN ('admin', 'superviseur', 'agent')
    )
  );

CREATE POLICY "Plots can be updated by their cooperative agents and admins" ON public.plots
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM public.profiles 
      WHERE role IN ('admin', 'superviseur')
    )
  );

-- Crop policies
CREATE POLICY "Crops are viewable by their plot's producer and admins" ON public.crops
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.profiles 
      WHERE role IN ('admin', 'superviseur')
    ) OR
    plot_id IN (
      SELECT p.id FROM public.plots p
      JOIN public.producers pr ON p.producer_id = pr.id
      WHERE pr.profile_id = auth.uid()
    )
  );

CREATE POLICY "Crops can be created by agents, supervisors and admins" ON public.crops
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.profiles 
      WHERE role IN ('admin', 'superviseur', 'agent')
    )
  );

CREATE POLICY "Crops can be updated by admins and supervisors" ON public.crops
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM public.profiles 
      WHERE role IN ('admin', 'superviseur')
    )
  );

-- Operation policies
CREATE POLICY "Operations are viewable by their crop's plot's producer and admins" ON public.operations
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.profiles 
      WHERE role IN ('admin', 'superviseur')
    ) OR
    plot_id IN (
      SELECT p.id FROM public.plots p
      JOIN public.producers pr ON p.producer_id = pr.id
      WHERE pr.profile_id = auth.uid()
    )
  );

CREATE POLICY "Operations can be created by agents, supervisors and admins" ON public.operations
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.profiles 
      WHERE role IN ('admin', 'superviseur', 'agent')
    )
  );

CREATE POLICY "Operations can be updated by admins and supervisors" ON public.operations
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM public.profiles 
      WHERE role IN ('admin', 'superviseur')
    )
  );

-- Observation policies
CREATE POLICY "Observations are viewable by their crop's plot's producer and admins" ON public.observations
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.profiles 
      WHERE role IN ('admin', 'superviseur')
    ) OR
    plot_id IN (
      SELECT p.id FROM public.plots p
      JOIN public.producers pr ON p.producer_id = pr.id
      WHERE pr.profile_id = auth.uid()
    )
  );

CREATE POLICY "Observations can be created by agents, supervisors and admins" ON public.observations
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.profiles 
      WHERE role IN ('admin', 'superviseur', 'agent')
    )
  );

CREATE POLICY "Observations can be updated by admins and supervisors" ON public.observations
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM public.profiles 
      WHERE role IN ('admin', 'superviseur')
    )
  );

-- Media policies
CREATE POLICY "Media is viewable by the owner and admins" ON public.media
  FOR SELECT USING (
    owner_profile_id = auth.uid() OR
    auth.uid() IN (
      SELECT user_id FROM public.profiles WHERE role = 'admin'
    )
  );

CREATE POLICY "Media can be created by authenticated users" ON public.media
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Media can be updated by the owner and admins" ON public.media
  FOR UPDATE USING (
    owner_profile_id = auth.uid() OR
    auth.uid() IN (
      SELECT user_id FROM public.profiles WHERE role = 'admin'
    )
  );

-- Agri rules policies
CREATE POLICY "Agri rules are viewable by all authenticated users" ON public.agri_rules
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Agri rules can be managed by admins and supervisors" ON public.agri_rules
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM public.profiles 
      WHERE role IN ('admin', 'superviseur')
    )
  );

-- Recommendations policies
CREATE POLICY "Recommendations are viewable by their target producer and admins" ON public.recommendations
  FOR SELECT USING (
    producer_id IN (
      SELECT id FROM public.producers WHERE profile_id = auth.uid()
    ) OR
    auth.uid() IN (
      SELECT user_id FROM public.profiles 
      WHERE role IN ('admin', 'superviseur')
    )
  );

CREATE POLICY "Recommendations can be created by agents, supervisors and admins" ON public.recommendations
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.profiles 
      WHERE role IN ('admin', 'superviseur', 'agent')
    )
  );

CREATE POLICY "Recommendations can be updated by their target producer and admins" ON public.recommendations
  FOR UPDATE USING (
    producer_id IN (
      SELECT id FROM public.producers WHERE profile_id = auth.uid()
    ) OR
    auth.uid() IN (
      SELECT user_id FROM public.profiles 
      WHERE role IN ('admin', 'superviseur')
    )
  );

-- Notifications policies
CREATE POLICY "Notifications are viewable by their target profile" ON public.notifications
  FOR SELECT USING (
    profile_id = auth.uid() OR
    auth.uid() IN (
      SELECT user_id FROM public.profiles WHERE role = 'admin'
    )
  );

CREATE POLICY "Notifications can be created by the system and admins" ON public.notifications
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.profiles WHERE role = 'admin'
    ) OR
    auth.uid() IS NULL -- System-generated notifications
  );

CREATE POLICY "Notifications can be updated by their target profile and admins" ON public.notifications
  FOR UPDATE USING (
    profile_id = auth.uid() OR
    auth.uid() IN (
      SELECT user_id FROM public.profiles WHERE role = 'admin'
    )
  );

-- Audit logs policies (admin only)
CREATE POLICY "Audit logs are viewable by admins only" ON public.audit_logs
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.profiles WHERE role = 'admin'
    )
  );

-- Function to get user's cooperative ID
CREATE OR REPLACE FUNCTION public.get_user_cooperative_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT cooperative_id 
    FROM public.producers 
    WHERE profile_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Function to check if user is admin or supervisor
CREATE OR REPLACE FUNCTION public.is_admin_or_supervisor()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role IN ('admin', 'superviseur')
    FROM public.profiles 
    WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
