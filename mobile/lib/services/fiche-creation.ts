import { supabase } from '../supabase-client';
import { 
  FicheCreationData, 
  FicheCreationCompleteData,
  SaveResult, 
  Cooperative, 
  FicheCreationSchema,
  ParcelData,
  ProducerData
} from '../../types/fiche-creation';
import { ProducerService } from './producer';

export class FicheCreationService {
  private static supabase = supabase;

  // Calculer l'âge à partir de la date de naissance, avec date de référence (censusDate) optionnelle
  static calculateAge(birthDate: string | undefined, referenceDate?: string | Date): number {
    if (!birthDate) return 0;
    const birth = new Date(birthDate);
    const ref = referenceDate ? (typeof referenceDate === 'string' ? new Date(referenceDate) : referenceDate) : new Date();
    if (isNaN(birth.getTime()) || isNaN(ref.getTime())) return 0;
    let age = ref.getFullYear() - birth.getFullYear();
    const monthDiff = ref.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && ref.getDate() < birth.getDate())) {
      age--;
    }
    return Math.max(age, 0);
  }

  // Vérifier si c'est un jeune producteur (< 30 ans)
  static isYoungProducer(age: number): boolean {
    return age < 30;
  }

  // Sauvegarder en brouillon
  static async saveDraft(
    data: Partial<FicheCreationCompleteData>,
    farmFileId?: string
  ): Promise<SaveResult> {
    const { data: authData, error: authError } = await this.supabase.auth.getUser();
    if (authError) return { success: false, error: authError.message };
    const userId = authData?.user?.id;
    if (!userId) return { success: false, error: 'Utilisateur non authentifié' };

    const now = new Date().toISOString();

    try {
      let producerId: string | undefined;
      let currentFarmFile: { responsible_producer_id?: string | null } | null = null;

      // Si un farmFileId existe, récupérer l'ID du producteur actuel
      if (farmFileId) {
        const { data: fileData, error: fileError } = await this.supabase
          .from('farm_files')
          .select('responsible_producer_id')
          .eq('id', farmFileId)
          .single();
        if (fileError) console.warn(`Impossible de trouver la fiche existante: ${fileError.message}`);
        else currentFarmFile = fileData;
        producerId = currentFarmFile?.responsible_producer_id ?? undefined;
      }

      // 1. Mettre à jour ou créer le producteur
      if (data.producerData?.firstName && data.producerData?.lastName) {
        const rawBirth = data.producerData.birthDate || null;
        const normalizedBirth = rawBirth && /^\d{4}-\d{2}-\d{2}$/.test(rawBirth) ? rawBirth : null;
        const rawSex = (data.producerData as any).sex as string | undefined;
        const mappedGender = rawSex === 'Homme' ? 'M' : rawSex === 'Femme' ? 'F' : null;
        const phoneFromForm = (data as any)?.producerData?.phone ?? null;

        if (producerId) {
          // Déléguer la mise à jour au ProducerService
          const ok = await ProducerService.updateProducerById(producerId, {
            firstName: data.producerData.firstName,
            lastName: data.producerData.lastName,
            phone: phoneFromForm,
            birthDate: normalizedBirth,
            gender: mappedGender as any,
            cooperativeId: data.organizationalData?.cooperativeId || null,
          });
          if (!ok) throw new Error('Échec mise à jour producteur');
        } else {
          // Déléguer la création au ProducerService
          const created = await ProducerService.createProducerByAgent({
            firstName: data.producerData.firstName,
            lastName: data.producerData.lastName,
            phone: phoneFromForm,
            birthDate: normalizedBirth,
            gender: mappedGender as any,
            cooperativeId: data.organizationalData?.cooperativeId || null,
          });
          if (!created?.id) throw new Error('Échec création producteur');
          producerId = created.id;
        }
      }

      // 2. Préparer les données pour la table farm_files
      const farmFileData = {
        name: data.organizationalData?.name || 'Brouillon sans nom',
        region: (data.organizationalData as any)?.region,
        department: data.organizationalData?.department,
        commune: data.organizationalData?.commune,
        village: data.organizationalData?.village,
        sector: data.organizationalData?.sector,
        cooperative_id: data.organizationalData?.cooperativeId,
        gpc: data.organizationalData?.gpc,
        census_date: data.organizationalData?.censusDate || now,
        material_inventory: {
          producerData: data.producerData,
          equipmentData: data.equipmentData,
          parcels: data.parcels,
        },
        created_by: userId,
        updated_at: now,
        responsible_producer_id: producerId,
      };

      if (farmFileId) {
        const { error } = await this.supabase.from('farm_files').update(farmFileData).eq('id', farmFileId);
        if (error) throw error;
        return { success: true, farmFileId };
      } else {
        const { data: newFarmFile, error } = await this.supabase.from('farm_files').insert(farmFileData).select('id').single();
        if (error) throw error;
        return { success: true, farmFileId: newFarmFile.id };
      }

    } catch (e: any) {
      console.error('Erreur sauvegarde brouillon:', e?.message || e);
      return { success: false, error: e?.message || 'Erreur inconnue' };
    }
  }

  // Sauvegarder définitivement (version complète avec parcelles)
  static async saveFinal(
    data: FicheCreationCompleteData,
    farmFileId: string
  ): Promise<SaveResult> {
    const { data: authData, error: authError } = await this.supabase.auth.getUser();
    if (authError) return { success: false, error: authError.message };
    const userId = authData?.user?.id;
    if (!userId) return { success: false, error: 'Utilisateur non authentifié' };

    try {
      const now = new Date().toISOString();

      // 1. Mettre à jour la fiche pour la passer en 'completed'
      const { error: farmFileError } = await this.supabase
        .from('farm_files')
        .update({ status: 'completed', updated_at: now })
        .eq('id', farmFileId);
      
      if (farmFileError) throw farmFileError;

      // 2. Supprimer les anciennes cultures pour éviter les doublons
      const { error: deleteCropsError } = await this.supabase.rpc('delete_crops_for_farm_file', { p_farm_file_id: farmFileId });
      if (deleteCropsError) throw new Error(`Erreur suppression anciennes cultures: ${deleteCropsError.message}`);
      
      const { error: deletePlotsError } = await this.supabase.from('plots').delete().eq('farm_file_id', farmFileId);
      if (deletePlotsError) throw new Error(`Erreur suppression anciennes parcelles: ${deletePlotsError.message}`);

      // 3. Récupérer l'ID du producteur depuis la fiche
      const { data: farmFileData, error: ffDataError } = await this.supabase
        .from('farm_files')
        .select('responsible_producer_id, cooperative_id')
        .eq('id', farmFileId)
        .single();
      
      if (ffDataError || !farmFileData?.responsible_producer_id) {
        throw new Error("Impossible de trouver le producteur responsable pour cette fiche.");
      }
      
      const producerId = farmFileData.responsible_producer_id;
      const cooperativeId = (farmFileData as any).cooperative_id;

      // 3.b. Récupérer la saison active (si nécessaire pour crops.season_id)
      const { data: activeSeason } = await this.supabase
        .from('seasons')
        .select('id')
        .eq('is_active', true)
        .order('start_date', { ascending: false })
        .limit(1)
        .single();

      // 4. Créer/mettre à jour les parcelles dans le référentiel et lier dans farm_file_plots
      for (const parcel of data.parcels) {
        // Étape 4.1: Chercher ou créer la parcelle dans le référentiel 'plots'
        let { data: plot, error: plotFetchError } = await this.supabase
          .from('plots')
          .select('id')
          .eq('producer_id', producerId)
          .eq('name', parcel.name)
          .single();

        if (plotFetchError && plotFetchError.code !== 'PGRST116') { // PGRST116 = 0 rows
          throw new Error(`Erreur recherche parcelle: ${plotFetchError.message}`);
        }

        if (!plot) {
          const { data: newPlotId, error: rpcError } = await this.supabase
            .rpc('create_plot_for_agent', {
              plot_name: parcel.name,
              p_producer_id: producerId,
              p_cooperative_id: cooperativeId,
              p_area_hectares: typeof parcel.totalArea === 'number' ? parcel.totalArea : 0,
            });

          if (rpcError || !newPlotId) {
            // Fallback: direct insert into plots if RPC is missing or signature mismatch
            const { data: inserted, error: insertErr } = await this.supabase
              .from('plots')
              .insert({ name: parcel.name, producer_id: producerId, cooperative_id: cooperativeId })
              .select('id')
              .single();
            if (insertErr || !inserted?.id) throw new Error(`Erreur création parcelle: ${(rpcError?.message || insertErr?.message)}`);
            plot = { id: inserted.id } as any;
          } else {
            // Since the RPC returns only the ID, we create a partial plot object for local use.
            plot = { id: newPlotId };
          }
        }

        if (!plot?.id) throw new Error("Impossible de récupérer l'ID de la parcelle.");

        const plotId = plot.id;

        // Étape 4.2: Mettre à jour les données de la parcelle
        const { data: updatedPlot, error: plotUpdateError } = await this.supabase
          .from('plots')
          .update({
            farm_file_id: farmFileId,
            producer_id: producerId,
            cooperative_id: cooperativeId,
            name_season_snapshot: parcel.name,
            area_hectares: parcel.totalArea,
            typology: parcel.typology,
            producer_size: parcel.producerSize,
            cotton_variety: parcel.cottonVariety,
            soil_type: 'unknown', // Valeur par défaut
            water_source: 'rain', // Valeur par défaut
            status: 'active'
          })
          .eq('id', plotId)
          .select('id')
          .single();

        if (plotUpdateError) throw new Error(`Erreur mise à jour parcelle: ${plotUpdateError.message}`);
        if (!updatedPlot?.id) throw new Error("Impossible de récupérer l'ID de la parcelle mise à jour.");
        
        // Étape 4.3: Insérer les cultures liées à la parcelle
        if (parcel.crops && parcel.crops.length > 0) {
          const cropsToInsert = parcel.crops.map(crop => ({
            plot_id: plotId, // Les cultures sont liées à la parcelle
            crop_type: crop.type,
            variety: crop.variety,
            sowing_date: crop.sowingDate,
            season_id: activeSeason?.id || farmFileId, // fallback to farmFileId if no season
            area_hectares: typeof crop.area === 'number' ? crop.area : null,
            status: 'en_cours' as const,
          }));
          const { error: cropError } = await this.supabase.from('crops').insert(cropsToInsert);
          if (cropError) throw cropError;
        }
      }

      return { success: true, farmFileId };

    } catch (e: any) {
      console.error('Erreur sauvegarde finale:', e);
      return { success: false, error: e.message };
    }
  }

  // Charger un brouillon existant
  static async loadDraft(farmFileId: string): Promise<Partial<FicheCreationCompleteData> | null> {
    try {
      // 1. Charger les données de base de la farm_file et du producteur associé
      const { data: farmFileData, error: farmFileError } = await this.supabase
        .from('farm_files')
        .select('*, responsible_producer:producers!farm_files_responsible_producer_id_fkey(*)')
        .eq('id', farmFileId)
        .single();

      if (farmFileError) throw farmFileError;
      
      // 2. Charger les parcelles et les cultures associées
      const { data: farmFilePlotsData, error: farmFilePlotsError } = await this.supabase
        .from('plots')
        .select(`
          *,
          crops!crops_plot_id_fkey(*)
        `)
        .eq('farm_file_id', farmFileId);

      if (farmFilePlotsError) throw farmFilePlotsError;

      // 3. Mapper les données dans le format attendu par le formulaire
      const inv = farmFileData.material_inventory || {};
      const responsibleProducerRaw = (farmFileData as any).responsible_producer || {};
      
      const producerData: any = {
        firstName: responsibleProducerRaw?.first_name || '',
        lastName: responsibleProducerRaw?.last_name || '',
        status: "Chef d'exploitation",
        sex: responsibleProducerRaw?.gender === 'M' ? 'Homme' : responsibleProducerRaw?.gender === 'F' ? 'Femme' : 'Homme',
        birthDate: responsibleProducerRaw?.birth_date || '',
        phone: responsibleProducerRaw?.phone || '',
        // Les champs suivants sont généralement dans `material_inventory`, on les pré-remplit si possible
        cniNumber: (inv as any).producerData?.cniNumber,
        literacy: (inv as any).producerData?.literacy || 'Analphabète',
        languages: (inv as any).producerData?.languages || [],
        isRelayFarmer: (inv as any).producerData?.isRelayFarmer || false,
      };
      
      if (producerData.birthDate) {
          producerData.age = this.calculateAge(producerData.birthDate, farmFileData.census_date);
          producerData.isYoungProducer = this.isYoungProducer(producerData.age);
      }

      const parcels: ParcelData[] = Array.isArray(farmFilePlotsData) ? farmFilePlotsData.map((ffp: any) => ({
        id: ffp.id, // ID de la parcelle
        plotId: ffp.id, // Même ID (pas de séparation plot/farm_file_plot)
        name: ffp.name_season_snapshot || '',
        totalArea: ffp.area_hectares ?? 0,
        typology: ffp.typology,
        producerSize: ffp.producer_size || 'Standard (< 3 ha)',
        cottonVariety: ffp.cotton_variety,
        plantingWave: (ffp as any).planting_wave || '', // Assurez-vous que ce champ existe ou est géré
        responsible: producerData, // Le producteur est le même pour toutes les parcelles de la fiche
        crops: (ffp.crops || []).map((crop: any) => ({
          id: crop.id,
          type: crop.crop_type,
          variety: crop.variety,
          sowingDate: crop.sowing_date,
          area: crop.area_hectares ?? 0,
        })),
      })) : [];

      // 4. Assembler l'objet final
      const organizationalData = {
        name: farmFileData.name || '',
        region: farmFileData.region || '',
        department: farmFileData.department || '',
        commune: farmFileData.commune || '',
        village: farmFileData.village || '',
        sector: farmFileData.sector || '',
        cooperativeId: farmFileData.cooperative_id || '',
        gpc: farmFileData.gpc || undefined,
        censusDate: farmFileData.census_date || '',
      };

      const result = {
        organizationalData,
        producerData: { ...producerData },
        equipmentData: (inv as any).equipmentData || undefined,
        parcels,
      };

      return result;
    } catch (error) {
      console.error('❌ [FicheCreationService.loadDraft] Erreur chargement brouillon:', error);
      return null;
    }
  }

  // Valider les données d'une section
  static validateSection(
    section: keyof FicheCreationData,
    data: any
  ): { isValid: boolean; errors: string[] } {
    console.log(`🔍 FicheCreationService.validateSection - Section: ${section}`);
    console.log(`  - Données reçues:`, data);
    
    try {
      const schema = FicheCreationSchema.shape[section];
      console.log(`  - Schéma utilisé:`, schema);
      
      const result = schema.parse(data);
      console.log(`  - Validation réussie:`, result);
      return { isValid: true, errors: [] };
    } catch (error) {
      console.log(`  - Erreur de validation:`, error);
      if (error instanceof Error) {
        return { isValid: false, errors: [error.message] };
      }
      return { isValid: false, errors: ['Erreur de validation'] };
    }
  }
}
