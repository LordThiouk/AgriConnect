-- =================================================================
-- RLS Policies for the new 'plots' referential table
-- =================================================================

-- 1. Allow producers to view their own plots.
CREATE POLICY "Allow producers to view their own plots"
ON public.plots
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM public.producers p
        WHERE p.id = plots.producer_id AND p.profile_id = auth.uid()
    )
);

-- 2. Allow agents to view plots of their assigned producers.
CREATE POLICY "Allow agents to view plots of assigned producers"
ON public.plots
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM public.agent_producer_assignments apa
        WHERE apa.producer_id = plots.producer_id AND apa.agent_id = auth.uid()
    )
);

-- 3. Allow agents to create new plots for their assigned producers.
-- Note: This requires the agent to know the producer_id when inserting.
CREATE POLICY "Allow agents to create plots for assigned producers"
ON public.plots
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.user_id = auth.uid() AND p.role = 'agent'
    ) AND
    EXISTS (
        SELECT 1
        FROM public.agent_producer_assignments apa
        WHERE apa.producer_id = plots.producer_id AND apa.agent_id = auth.uid()
    )
);

-- 4. Allow admins and supervisors full access.
CREATE POLICY "Allow admins/supervisors full access to plots"
ON public.plots
FOR ALL
USING (
    EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.user_id = auth.uid() AND (p.role = 'admin' OR p.role = 'supervisor')
    )
);


-- =================================================================
-- RLS Policies for the renamed 'farm_file_plots' table
-- =================================================================

-- 1. Agents can manage seasonal plot data for farm files they created.
CREATE POLICY "Agents can manage seasonal plots for their own farm files"
ON public.farm_file_plots
FOR ALL
USING (
    EXISTS (
        SELECT 1
        FROM public.farm_files ff
        WHERE ff.id = farm_file_plots.farm_file_id AND ff.created_by = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.farm_files ff
        WHERE ff.id = farm_file_plots.farm_file_id AND ff.created_by = auth.uid()
    )
);

-- 2. Allow admins and supervisors full access.
CREATE POLICY "Allow admins/supervisors full access to seasonal plots"
ON public.farm_file_plots
FOR ALL
USING (
    EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.user_id = auth.uid() AND (p.role = 'admin' OR p.role = 'supervisor')
    )
);
