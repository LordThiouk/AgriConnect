import { supabase } from '../supabase-client';
import { FicheCreationData, SaveResult, Cooperative, FicheCreationSchema } from '../../types/fiche-creation';

export class FicheCreationService {
  private static supabase = supabase;

  // Récupérer les coopératives disponibles
  static async getCooperatives(): Promise<Cooperative[]> {
    try {
      const { data, error } = await this.supabase
        .from('cooperatives')
        .select('id, name, region, department')
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur récupération coopératives:', error);
      return [];
    }
  }

  // Calculer l'âge à partir de la date de naissance
  static calculateAge(birthDate: string): number {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }

  // Vérifier si c'est un jeune producteur (< 30 ans)
  static isYoungProducer(age: number): boolean {
    return age < 30;
  }

  // Obtenir la géolocalisation GPS
  static async getCurrentLocation(): Promise<{ latitude: number; longitude: number } | null> {
    try {
      if (!navigator.geolocation) {
        throw new Error('Géolocalisation non supportée');
      }

      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          },
          (error) => {
            console.warn('Erreur géolocalisation:', error);
            resolve(null);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000, // 5 minutes
          }
        );
      });
    } catch (error) {
      console.error('Erreur géolocalisation:', error);
      return null;
    }
  }

  // Sauvegarder en brouillon
  static async saveDraft(
    agentId: string,
    data: Partial<FicheCreationData>,
    farmFileId?: string
  ): Promise<SaveResult> {
    try {
      const now = new Date().toISOString();
      
      if (farmFileId) {
        // Mise à jour d'un brouillon existant
        const { error } = await this.supabase
          .from('farm_files')
          .update({
            data: data,
            updated_at: now,
            status: 'draft',
          })
          .eq('id', farmFileId);

        if (error) throw error;

        return {
          success: true,
          farmFileId,
          isDraft: true,
        };
      } else {
        // Création d'un nouveau brouillon
        const { data: newFarmFile, error } = await this.supabase
          .from('farm_files')
          .insert({
            name: data.organizationalData?.name || 'Nouvelle fiche',
            agent_id: agentId,
            data: data,
            status: 'draft',
            created_at: now,
            updated_at: now,
          })
          .select('id')
          .single();

        if (error) throw error;

        return {
          success: true,
          farmFileId: newFarmFile.id,
          isDraft: true,
        };
      }
    } catch (error) {
      console.error('Erreur sauvegarde brouillon:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  // Sauvegarder définitivement
  static async saveFinal(
    agentId: string,
    data: FicheCreationData,
    farmFileId?: string
  ): Promise<SaveResult> {
    try {
      const now = new Date().toISOString();

      // 1. Créer ou mettre à jour la fiche d'exploitation
      let finalFarmFileId = farmFileId;
      
      if (!farmFileId) {
        const { data: newFarmFile, error: farmFileError } = await this.supabase
          .from('farm_files')
          .insert({
            name: data.organizationalData.name,
            agent_id: agentId,
            cooperative_id: data.organizationalData.cooperativeId,
            data: data,
            status: 'completed',
            created_at: now,
            updated_at: now,
          })
          .select('id')
          .single();

        if (farmFileError) throw farmFileError;
        finalFarmFileId = newFarmFile.id;
      } else {
        const { error: updateError } = await this.supabase
          .from('farm_files')
          .update({
            name: data.organizationalData.name,
            cooperative_id: data.organizationalData.cooperativeId,
            data: data,
            status: 'completed',
            updated_at: now,
          })
          .eq('id', farmFileId);

        if (updateError) throw updateError;
      }

      // 2. Créer le producteur
      const { data: producer, error: producerError } = await this.supabase
        .from('producers')
        .insert({
          first_name: data.producerData.firstName,
          last_name: data.producerData.lastName,
          birth_date: data.producerData.birthDate,
          sex: data.producerData.sex,
          cni_number: data.producerData.cniNumber,
          literacy: data.producerData.literacy === 'Oui',
          languages: data.producerData.languages,
          is_trained_relay: data.producerData.isTrainedRelay === 'Oui',
          is_young_producer: data.producerData.isYoungProducer,
          cooperative_id: data.organizationalData.cooperativeId,
          created_at: now,
          updated_at: now,
        })
        .select('id')
        .single();

      if (producerError) throw producerError;

      // 3. Associer le producteur à la fiche
      const { error: associationError } = await this.supabase
        .from('farm_file_producers')
        .insert({
          farm_file_id: finalFarmFileId,
          producer_id: producer.id,
          created_at: now,
        });

      if (associationError) throw associationError;

      return {
        success: true,
        farmFileId: finalFarmFileId,
        isDraft: false,
      };
    } catch (error) {
      console.error('Erreur sauvegarde finale:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  // Charger un brouillon existant
  static async loadDraft(farmFileId: string): Promise<FicheCreationData | null> {
    try {
      const { data, error } = await this.supabase
        .from('farm_files')
        .select('data')
        .eq('id', farmFileId)
        .eq('status', 'draft')
        .single();

      if (error) throw error;
      return data?.data as FicheCreationData || null;
    } catch (error) {
      console.error('Erreur chargement brouillon:', error);
      return null;
    }
  }

  // Valider les données d'une section
  static validateSection(
    section: keyof FicheCreationData,
    data: any
  ): { isValid: boolean; errors: string[] } {
    try {
      const schema = FicheCreationSchema.shape[section];
      schema.parse(data);
      return { isValid: true, errors: [] };
    } catch (error) {
      if (error instanceof Error) {
        return { isValid: false, errors: [error.message] };
      }
      return { isValid: false, errors: ['Erreur de validation'] };
    }
  }

  // Auto-save avec debounce
  static createAutoSave(
    agentId: string,
    data: Partial<FicheCreationData>,
    farmFileId?: string,
    delay: number = 2000
  ): () => void {
    let timeoutId: NodeJS.Timeout;

    return () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        this.saveDraft(agentId, data, farmFileId);
      }, delay);
    };
  }
}
