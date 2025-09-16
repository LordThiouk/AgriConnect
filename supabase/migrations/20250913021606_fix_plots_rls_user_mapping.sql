-- Fix plots RLS: map auth.uid() via profiles.user_id and tie insert to farm file context

alter table if exists public.plots enable row level security;

-- Optional: drop old policies if they exist (safe guard)
-- Note: Wrap in DO blocks to avoid errors if absent
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='plots' AND policyname='plots_select_agents_owner'
  ) THEN
    DROP POLICY plots_select_agents_owner ON public.plots;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='plots' AND policyname='plots_insert_agents_owner'
  ) THEN
    DROP POLICY plots_insert_agents_owner ON public.plots;
  END IF;
END$$;

-- SELECT: agent can view plots if they belong to a farm_file_plot linked to a farm file created by the same profile user
CREATE POLICY plots_select_agents_owner ON public.plots
FOR SELECT USING (
  EXISTS (
    SELECT 1
    FROM public.farm_file_plots ffp
    JOIN public.farm_files ff ON ff.id = ffp.farm_file_id
    JOIN public.profiles pr ON pr.id = ff.created_by
    WHERE ffp.plot_id = plots.id
      AND pr.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND (p.role::text = 'admin' OR p.role::text = 'supervisor')
  )
);

-- INSERT: agent can create plots when working on their own farm files; ensure plot.producer_id matches a responsible producer of a farm file created by the agent
CREATE POLICY plots_insert_agents_owner ON public.plots
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.farm_files ff
    JOIN public.profiles pr ON pr.id = ff.created_by
    WHERE ff.responsible_producer_id = plots.producer_id
      AND pr.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND (p.role::text = 'admin' OR p.role::text = 'supervisor')
  )
);

COMMENT ON POLICY plots_select_agents_owner ON public.plots IS 'Agents can view plots linked to farm files they created (via profiles.user_id)';
COMMENT ON POLICY plots_insert_agents_owner ON public.plots IS 'Agents can insert plots for responsible producers of farm files they created (via profiles.user_id)';
