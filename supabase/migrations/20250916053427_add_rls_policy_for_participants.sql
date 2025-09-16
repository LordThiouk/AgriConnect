-- Enable RLS on participants table
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;

-- Allow agents to insert participants for plots they have access to
CREATE POLICY "Agents can insert participants for their plots" ON public.participants
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.farm_file_plots ffp
            JOIN public.farm_files ff ON ffp.farm_file_id = ff.id
            WHERE ffp.id = participants.plot_id
            AND ff.created_by = auth.uid()
        )
    );

-- Allow agents to select participants for plots they have access to
CREATE POLICY "Agents can select participants for their plots" ON public.participants
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.farm_file_plots ffp
            JOIN public.farm_files ff ON ffp.farm_file_id = ff.id
            WHERE ffp.id = participants.plot_id
            AND ff.created_by = auth.uid()
        )
    );

-- Allow agents to update participants for plots they have access to
CREATE POLICY "Agents can update participants for their plots" ON public.participants
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.farm_file_plots ffp
            JOIN public.farm_files ff ON ffp.farm_file_id = ff.id
            WHERE ffp.id = participants.plot_id
            AND ff.created_by = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.farm_file_plots ffp
            JOIN public.farm_files ff ON ffp.farm_file_id = ff.id
            WHERE ffp.id = participants.plot_id
            AND ff.created_by = auth.uid()
        )
    );

-- Allow agents to delete participants for plots they have access to
CREATE POLICY "Agents can delete participants for their plots" ON public.participants
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.farm_file_plots ffp
            JOIN public.farm_files ff ON ffp.farm_file_id = ff.id
            WHERE ffp.id = participants.plot_id
            AND ff.created_by = auth.uid()
        )
    );

-- Allow admins and supervisors to access all participants
CREATE POLICY "Admins and supervisors can access all participants" ON public.participants
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('admin', 'supervisor')
        )
    );
