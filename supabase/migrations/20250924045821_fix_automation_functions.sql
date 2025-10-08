-- Migration: Correction des fonctions d'automatisation
-- Description: Corriger l'ambiguïté dans les requêtes SQL

-- 1. Recréer la fonction execute_automation_task avec des noms de variables uniques
CREATE OR REPLACE FUNCTION public.execute_automation_task(task_name_param TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  task_record RECORD;
  exec_id UUID;
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
  exec_id := gen_random_uuid();
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
    task_record.id, exec_id, start_time, 'running', 
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
    WHERE automation_logs.execution_id = exec_id;
    
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
      'execution_id', exec_id,
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
    WHERE automation_logs.execution_id = exec_id;
    
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
      'execution_id', exec_id,
      'duration_ms', duration_ms,
      'error', error_msg
    );
  END;
END;
$$;
