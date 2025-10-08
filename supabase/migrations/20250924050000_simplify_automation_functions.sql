-- Migration: Simplification des fonctions d'automatisation
-- Description: Créer des fonctions plus simples sans ambiguïté

-- 1. Fonction simplifiée pour exécuter une tâche
CREATE OR REPLACE FUNCTION public.execute_automation_task_simple(task_name_param TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  task_record RECORD;
  exec_id UUID;
  start_time TIMESTAMP WITH TIME ZONE;
  end_time TIMESTAMP WITH TIME ZONE;
  duration_seconds INTEGER;
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
    -- Pour l'instant, on simule l'exécution
    -- TODO: Intégrer l'appel à l'Edge Function
    result := jsonb_build_object(
      'message', 'Task executed successfully',
      'task_type', task_record.task_type,
      'execution_id', exec_id
    );
    
    end_time := now();
    duration_seconds := EXTRACT(EPOCH FROM (end_time - start_time))::INTEGER;
    
    -- Mettre à jour le log d'exécution
    UPDATE public.automation_logs 
    SET 
      completed_at = end_time,
      status = 'completed',
      duration_ms = duration_seconds * 1000,
      output_data = result
    WHERE automation_logs.execution_id = exec_id;
    
    -- Mettre à jour les statistiques de la tâche
    UPDATE public.automation_tasks 
    SET 
      status = 'completed',
      success_count = success_count + 1,
      updated_at = now()
    WHERE id = task_record.id;
    
    RETURN jsonb_build_object(
      'success', true,
      'execution_id', exec_id,
      'duration_ms', duration_seconds * 1000,
      'result', result
    );
    
  EXCEPTION WHEN OTHERS THEN
    end_time := now();
    duration_seconds := EXTRACT(EPOCH FROM (end_time - start_time))::INTEGER;
    error_msg := SQLERRM;
    
    -- Mettre à jour le log d'exécution avec l'erreur
    UPDATE public.automation_logs 
    SET 
      completed_at = end_time,
      status = 'failed',
      duration_ms = duration_seconds * 1000,
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
    
    RETURN jsonb_build_object(
      'success', false,
      'execution_id', exec_id,
      'duration_ms', duration_seconds * 1000,
      'error', error_msg
    );
  END;
END;
$$;

-- 2. Fonction pour exécuter toutes les tâches programmées
CREATE OR REPLACE FUNCTION public.run_scheduled_tasks_simple()
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
    result := public.execute_automation_task_simple(task_record.task_name);
    
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
