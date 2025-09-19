-- Corriger les données existantes dans la table crops

-- D'abord, mettre à jour les enregistrements existants où farm_file_plot_id est NULL
-- en utilisant plot_id comme référence
UPDATE public.crops 
SET farm_file_plot_id = plot_id 
WHERE farm_file_plot_id IS NULL AND plot_id IS NOT NULL;

-- Pour les enregistrements où plot_id est NULL mais farm_file_plot_id existe,
-- essayer de trouver le plot_id correspondant
UPDATE public.crops 
SET plot_id = (
  SELECT p.id 
  FROM public.plots p 
  WHERE p.id = crops.farm_file_plot_id
)
WHERE plot_id IS NULL AND farm_file_plot_id IS NOT NULL;

-- Supprimer les enregistrements orphelins qui n'ont ni plot_id ni farm_file_plot_id valide
DELETE FROM public.crops 
WHERE plot_id IS NULL AND farm_file_plot_id IS NULL;

-- Maintenant, appliquer les contraintes
-- D'abord, supprimer la contrainte NOT NULL sur plot_id
ALTER TABLE public.crops 
ALTER COLUMN plot_id DROP NOT NULL;

-- Ajouter une contrainte NOT NULL sur farm_file_plot_id
ALTER TABLE public.crops 
ALTER COLUMN farm_file_plot_id SET NOT NULL;

-- Ajouter une contrainte pour s'assurer qu'au moins un des deux IDs est présent
ALTER TABLE public.crops 
ADD CONSTRAINT crops_plot_reference_check 
CHECK (plot_id IS NOT NULL OR farm_file_plot_id IS NOT NULL);
