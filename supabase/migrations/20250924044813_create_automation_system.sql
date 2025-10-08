-- Migration: Système d'automatisation pour AgriConnect
-- Description: Création des tables et fonctions pour l'automatisation des règles agricoles

-- 1. Table pour les tâches automatiques
CREATE TABLE IF NOT EXISTS public.automation_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_name TEXT NOT NULL UNIQUE,
  task_type TEXT NOT NULL CHECK (task_type IN ('rule_evaluation', 'notification', 'sync', 'backup')),
  schedule_cron TEXT,
  is_active BOOLEAN DEFAULT true,
  last_run TIMESTAMP WITH TIME ZONE,
  next_run TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'disabled')),
  error_message TEXT,
  execution_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Table pour les logs d'exécution
CREATE TABLE IF NOT EXISTS public.automation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES public.automation_tasks(id) ON DELETE CASCADE,
  execution_id UUID DEFAULT gen_random_uuid(),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed')),
  duration_ms INTEGER,
  input_data JSONB,
  output_data JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Table pour les statistiques d'automatisation
CREATE TABLE IF NOT EXISTS public.automation_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES public.automation_tasks(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  executions INTEGER DEFAULT 0,
  successes INTEGER DEFAULT 0,
  failures INTEGER DEFAULT 0,
  avg_duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(task_id, date)
);

-- 4. Fonction pour exécuter une tâche automatique
CREATE OR REPLACE FUNCTION public.execute_automation_task(task_name_param TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  task_record RECORD;
  execution_id UUID;
  start_time TIMESTAMP WITH TIME ZONE;
  end_time TIMESTAMP WITH TIME ZONE;
  duration_ms INTEGER;
  result JSONB;
  error_msg TEXT;
BEGIN
  -- Récupérer la tâche
  SELECT * INTO task_record 
  FROM public.automation_tasks 
  WHERE task_name = task_name_param AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Task not found or inactive',
      'task_name', task_name_param
    );
  END IF;
  
  -- Générer un ID d'exécution
  execution_id := gen_random_uuid();
  start_time := now();
  
  -- Mettre à jour le statut de la tâche
  UPDATE public.automation_tasks 
  SET 
    status = 'running',
    last_run = start_time,
    execution_count = execution_count + 1,
    updated_at = now()
  WHERE id = task_record.id;
  
  -- Créer un log d'exécution
  INSERT INTO public.automation_logs (
    task_id, execution_id, started_at, status, input_data
  ) VALUES (
    task_record.id, execution_id, start_time, 'running', 
    jsonb_build_object('task_name', task_name_param)
  );
  
  BEGIN
    -- Exécuter la tâche selon son type
    CASE task_record.task_type
      WHEN 'rule_evaluation' THEN
        -- Appeler l'Edge Function pour l'évaluation des règles
        SELECT content INTO result
        FROM http((
          'POST',
          current_setting('app.settings.supabase_url') || '/functions/v1/evaluate-agricultural-rules',
          ARRAY[
            http_header('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')),
            http_header('Content-Type', 'application/json')
          ],
          'application/json',
          '{}'
        ));
        
      WHEN 'notification' THEN
        -- Logique pour les notifications (à implémenter)
        result := jsonb_build_object('message', 'Notification task executed');
        
      WHEN 'sync' THEN
        -- Logique pour la synchronisation (à implémenter)
        result := jsonb_build_object('message', 'Sync task executed');
        
      ELSE
        result := jsonb_build_object('error', 'Unknown task type');
    END CASE;
    
    end_time := now();
    duration_ms := EXTRACT(EPOCH FROM (end_time - start_time)) * 1000;
    
    -- Mettre à jour le log d'exécution
    UPDATE public.automation_logs 
    SET 
      completed_at = end_time,
      status = 'completed',
      duration_ms = duration_ms,
      output_data = result
    WHERE execution_id = execution_id;
    
    -- Mettre à jour les statistiques de la tâche
    UPDATE public.automation_tasks 
    SET 
      status = 'completed',
      success_count = success_count + 1,
      updated_at = now()
    WHERE id = task_record.id;
    
    -- Mettre à jour les statistiques quotidiennes
    INSERT INTO public.automation_stats (task_id, date, executions, successes, avg_duration_ms)
    VALUES (task_record.id, CURRENT_DATE, 1, 1, duration_ms)
    ON CONFLICT (task_id, date) 
    DO UPDATE SET 
      executions = automation_stats.executions + 1,
      successes = automation_stats.successes + 1,
      avg_duration_ms = (automation_stats.avg_duration_ms + duration_ms) / 2;
    
    RETURN jsonb_build_object(
      'success', true,
      'execution_id', execution_id,
      'duration_ms', duration_ms,
      'result', result
    );
    
  EXCEPTION WHEN OTHERS THEN
    end_time := now();
    duration_ms := EXTRACT(EPOCH FROM (end_time - start_time)) * 1000;
    error_msg := SQLERRM;
    
    -- Mettre à jour le log d'exécution avec l'erreur
    UPDATE public.automation_logs 
    SET 
      completed_at = end_time,
      status = 'failed',
      duration_ms = duration_ms,
      error_message = error_msg
    WHERE execution_id = execution_id;
    
    -- Mettre à jour les statistiques de la tâche
    UPDATE public.automation_tasks 
    SET 
      status = 'failed',
      failure_count = failure_count + 1,
      error_message = error_msg,
      updated_at = now()
    WHERE id = task_record.id;
    
    -- Mettre à jour les statistiques quotidiennes
    INSERT INTO public.automation_stats (task_id, date, executions, failures)
    VALUES (task_record.id, CURRENT_DATE, 1, 1)
    ON CONFLICT (task_id, date) 
    DO UPDATE SET 
      executions = automation_stats.executions + 1,
      failures = automation_stats.failures + 1;
    
    RETURN jsonb_build_object(
      'success', false,
      'execution_id', execution_id,
      'duration_ms', duration_ms,
      'error', error_msg
    );
  END;
END;
$$;

-- 5. Fonction pour planifier la prochaine exécution
CREATE OR REPLACE FUNCTION public.schedule_next_execution(task_id_param UUID)
RETURNS TIMESTAMP WITH TIME ZONE
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  task_record RECORD;
  next_run_time TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT * INTO task_record 
  FROM public.automation_tasks 
  WHERE id = task_id_param;
  
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  
  -- Calculer la prochaine exécution basée sur le cron
  -- Pour simplifier, on utilise des intervalles fixes
  CASE task_record.schedule_cron
    WHEN '0 6 * * *' THEN -- Quotidien à 6h
      next_run_time := (CURRENT_DATE + INTERVAL '1 day') + INTERVAL '6 hours';
    WHEN '0 */6 * * *' THEN -- Toutes les 6 heures
      next_run_time := now() + INTERVAL '6 hours';
    WHEN '0 0 * * 0' THEN -- Hebdomadaire le dimanche
      next_run_time := (CURRENT_DATE + INTERVAL '7 days') + INTERVAL '0 hours';
    ELSE
      next_run_time := now() + INTERVAL '1 day'; -- Par défaut, quotidien
  END CASE;
  
  -- Mettre à jour la tâche
  UPDATE public.automation_tasks 
  SET next_run = next_run_time, updated_at = now()
  WHERE id = task_id_param;
  
  RETURN next_run_time;
END;
$$;

-- 6. Fonction pour exécuter toutes les tâches programmées
CREATE OR REPLACE FUNCTION public.run_scheduled_tasks()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  task_record RECORD;
  result JSONB;
  results JSONB[] := '{}';
  total_executed INTEGER := 0;
  total_success INTEGER := 0;
  total_failed INTEGER := 0;
BEGIN
  -- Récupérer toutes les tâches programmées
  FOR task_record IN 
    SELECT * FROM public.automation_tasks 
    WHERE is_active = true 
      AND status IN ('pending', 'completed', 'failed')
      AND (next_run IS NULL OR next_run <= now())
  LOOP
    -- Exécuter la tâche
    result := public.execute_automation_task(task_record.task_name);
    
    -- Ajouter le résultat
    results := array_append(results, result);
    total_executed := total_executed + 1;
    
    -- Compter les succès/échecs
    IF (result->>'success')::boolean THEN
      total_success := total_success + 1;
    ELSE
      total_failed := total_failed + 1;
    END IF;
    
    -- Planifier la prochaine exécution
    PERFORM public.schedule_next_execution(task_record.id);
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'total_executed', total_executed,
    'total_success', total_success,
    'total_failed', total_failed,
    'results', to_jsonb(results),
    'timestamp', now()
  );
END;
$$;

-- 7. RLS pour les tables d'automatisation
ALTER TABLE public.automation_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_stats ENABLE ROW LEVEL SECURITY;

-- Politiques pour automation_tasks
CREATE POLICY "Admins et superviseurs peuvent gérer les tâches" ON automation_tasks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'superviseur')
    )
  );

-- Politiques pour automation_logs
CREATE POLICY "Admins et superviseurs peuvent voir les logs" ON automation_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'superviseur')
    )
  );

-- Politiques pour automation_stats
CREATE POLICY "Admins et superviseurs peuvent voir les stats" ON automation_stats
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'superviseur')
    )
  );

-- 8. Insérer la tâche d'évaluation quotidienne des règles
INSERT INTO public.automation_tasks (
  task_name,
  task_type,
  schedule_cron,
  is_active,
  next_run
) VALUES (
  'Évaluation quotidienne des règles agricoles',
  'rule_evaluation',
  '0 6 * * *', -- Tous les jours à 6h00
  true,
  now() + INTERVAL '1 hour' -- Première exécution dans 1 heure pour test
) ON CONFLICT (task_name) DO UPDATE SET
  schedule_cron = EXCLUDED.schedule_cron,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- 9. Créer des index pour les performances
CREATE INDEX IF NOT EXISTS idx_automation_tasks_active ON public.automation_tasks(is_active, next_run);
CREATE INDEX IF NOT EXISTS idx_automation_logs_task_id ON public.automation_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_automation_logs_started_at ON public.automation_logs(started_at);
CREATE INDEX IF NOT EXISTS idx_automation_stats_task_date ON public.automation_stats(task_id, date);

-- 10. Commentaires sur les tables
COMMENT ON TABLE public.automation_tasks IS 'Tâches automatiques programmées pour AgriConnect';
COMMENT ON TABLE public.automation_logs IS 'Logs d''exécution des tâches automatiques';
COMMENT ON TABLE public.automation_stats IS 'Statistiques d''exécution des tâches automatiques';

COMMENT ON FUNCTION public.execute_automation_task(TEXT) IS 'Exécute une tâche automatique spécifique';
COMMENT ON FUNCTION public.schedule_next_execution(UUID) IS 'Planifie la prochaine exécution d''une tâche';
COMMENT ON FUNCTION public.run_scheduled_tasks() IS 'Exécute toutes les tâches programmées';
