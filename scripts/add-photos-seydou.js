const { createClient } = require('@supabase/supabase-js');
const { decode } = require('base64-arraybuffer');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addPhotosForSeydou() {
  console.log('📸 Ajout de photos pour l\'agent Seydou Sene');
  console.log('============================================\n');

  try {
    // 1. Récupérer l'agent Seydou Sene
    console.log('1️⃣ Recherche de l\'agent Seydou Sene...');
    const { data: agents, error: agentsError } = await supabase
      .from('profiles')
      .select('user_id, display_name, phone')
      .ilike('display_name', '%Seydou%')
      .eq('role', 'agent');

    if (agentsError) {
      console.error('❌ Erreur récupération agents:', agentsError);
      return;
    }

    if (!agents || agents.length === 0) {
      console.error('❌ Agent Seydou Sene non trouvé');
      return;
    }

    const seydou = agents[0];
    console.log(`✅ Agent trouvé: ${seydou.display_name} (${seydou.user_id})`);

    // 2. Récupérer les parcelles de Seydou
    console.log('\n2️⃣ Récupération des parcelles de Seydou...');
    const { data: plots, error: plotsError } = await supabase
      .from('plots')
      .select('id, name_season_snapshot, area_hectares')
      .limit(5);

    if (plotsError) {
      console.error('❌ Erreur récupération parcelles:', plotsError);
      return;
    }

    if (!plots || plots.length === 0) {
      console.error('❌ Aucune parcelle trouvée');
      return;
    }

    console.log(`✅ ${plots.length} parcelles trouvées`);

    // 3. Créer des images de test (différentes tailles et types)
    const testImages = [
      {
        name: 'parcelle-riz-1.jpg',
        base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        description: 'Vue d\'ensemble de la parcelle de riz - Saison 2024',
        tags: ['riz', 'parcelle', 'vue-ensemble'],
        lat: 14.7167,
        lon: -17.46768
      },
      {
        name: 'parcelle-riz-2.jpg',
        base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        description: 'Détail des plants de riz en croissance',
        tags: ['riz', 'plants', 'croissance'],
        lat: 14.7168,
        lon: -17.46769
      },
      {
        name: 'observation-maladie.jpg',
        base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        description: 'Observation de maladie sur les feuilles de riz',
        tags: ['maladie', 'observation', 'feuilles'],
        lat: 14.7169,
        lon: -17.46770
      },
      {
        name: 'irrigation-système.jpg',
        base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        description: 'Système d\'irrigation de la parcelle',
        tags: ['irrigation', 'système', 'eau'],
        lat: 14.7170,
        lon: -17.46771
      },
      {
        name: 'récolte-partielle.jpg',
        base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        description: 'Récolte partielle du riz - Première coupe',
        tags: ['récolte', 'riz', 'première-coupe'],
        lat: 14.7171,
        lon: -17.46772
      }
    ];

    // 4. Ajouter des photos pour chaque parcelle
    console.log('\n3️⃣ Ajout de photos pour les parcelles...');
    let totalPhotosAdded = 0;

    for (let i = 0; i < plots.length && i < testImages.length; i++) {
      const plot = plots[i];
      const imageData = testImages[i];
      
      console.log(`\n📸 Ajout de photos pour la parcelle: ${plot.name_season_snapshot}`);
      
      // Photo pour la parcelle (plot)
      const plotPhotoPath = `plots/${plot.id}/${Date.now()}_${imageData.name}`;
      const plotPhotoBuffer = decode(imageData.base64);
      
      const { data: plotUploadData, error: plotUploadError } = await supabase.storage
        .from('media')
        .upload(plotPhotoPath, plotPhotoBuffer, {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (plotUploadError) {
        console.error(`❌ Erreur upload photo parcelle ${plot.name_season_snapshot}:`, plotUploadError);
        continue;
      }

      // Créer l'enregistrement média pour la parcelle
      const { data: plotMediaId, error: plotMediaError } = await supabase.rpc('create_media', {
        p_entity_type: 'plot',
        p_entity_id: plot.id,
        p_file_path: plotPhotoPath,
        p_file_name: imageData.name,
        p_mime_type: 'image/jpeg',
        p_owner_profile_id: seydou.user_id,
        p_file_size_bytes: plotPhotoBuffer.length,
        p_gps_lat: imageData.lat,
        p_gps_lon: imageData.lon,
        p_taken_at: new Date().toISOString(),
        p_description: imageData.description,
        p_tags: imageData.tags
      });

      if (plotMediaError) {
        console.error(`❌ Erreur création média parcelle ${plot.name_season_snapshot}:`, plotMediaError);
      } else {
        console.log(`✅ Photo parcelle ajoutée: ${imageData.name} (ID: ${plotMediaId})`);
        totalPhotosAdded++;
      }

      // Photo pour observation (simulation)
      const obsPhotoPath = `observations/${plot.id}/${Date.now()}_obs_${imageData.name}`;
      const obsPhotoBuffer = decode(imageData.base64);
      
      const { data: obsUploadData, error: obsUploadError } = await supabase.storage
        .from('media')
        .upload(obsPhotoPath, obsPhotoBuffer, {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (obsUploadError) {
        console.error(`❌ Erreur upload photo observation ${plot.name_season_snapshot}:`, obsUploadError);
        continue;
      }

      // Créer l'enregistrement média pour l'observation
      const { data: obsMediaId, error: obsMediaError } = await supabase.rpc('create_media', {
        p_entity_type: 'observation',
        p_entity_id: plot.id, // Pour simplifier, on lie l'observation à la parcelle
        p_file_path: obsPhotoPath,
        p_file_name: `obs_${imageData.name}`,
        p_mime_type: 'image/jpeg',
        p_owner_profile_id: seydou.user_id,
        p_file_size_bytes: obsPhotoBuffer.length,
        p_gps_lat: imageData.lat + 0.0001, // Légère variation GPS
        p_gps_lon: imageData.lon + 0.0001,
        p_taken_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(), // Date aléatoire dans les 7 derniers jours
        p_description: `Observation: ${imageData.description}`,
        p_tags: [...imageData.tags, 'observation']
      });

      if (obsMediaError) {
        console.error(`❌ Erreur création média observation ${plot.name_season_snapshot}:`, obsMediaError);
      } else {
        console.log(`✅ Photo observation ajoutée: obs_${imageData.name} (ID: ${obsMediaId})`);
        totalPhotosAdded++;
      }
    }

    // 5. Vérifier les photos ajoutées
    console.log('\n4️⃣ Vérification des photos ajoutées...');
    const { data: seydouMedia, error: seydouMediaError } = await supabase.rpc('get_agent_media', {
      p_agent_id: seydou.user_id,
      p_limit_count: 20
    });

    if (seydouMediaError) {
      console.error('❌ Erreur récupération médias Seydou:', seydouMediaError);
    } else {
      console.log(`✅ ${seydouMedia.length} photos trouvées pour Seydou Sene`);
      console.log('\n📋 Détail des photos:');
      seydouMedia.forEach((media, index) => {
        console.log(`   ${index + 1}. ${media.file_name} (${media.entity_type})`);
        console.log(`      - Description: ${media.description || 'N/A'}`);
        console.log(`      - GPS: ${media.gps_coordinates ? 'Oui' : 'Non'}`);
        console.log(`      - Date: ${new Date(media.taken_at).toLocaleDateString('fr-FR')}`);
        console.log(`      - URL: ${media.public_url}`);
        console.log('');
      });
    }

    // 6. Statistiques finales
    console.log('\n5️⃣ Statistiques finales...');
    const { data: stats, error: statsError } = await supabase.rpc('get_agent_media_stats', {
      p_agent_id: seydou.user_id
    });

    if (statsError) {
      console.error('❌ Erreur statistiques:', statsError);
    } else {
      console.log('📊 Statistiques des médias de Seydou Sene:');
      console.log(`   - Total médias: ${stats[0]?.total_media || 0}`);
      console.log(`   - Médias par type: ${JSON.stringify(stats[0]?.media_by_type || {})}`);
      console.log(`   - Taille totale: ${((stats[0]?.total_size_bytes || 0) / 1024 / 1024).toFixed(2)} MB`);
      console.log(`   - Photos avec GPS: ${stats[0]?.photos_with_gps || 0}`);
      console.log(`   - Uploads récents (7j): ${stats[0]?.recent_uploads || 0}`);
    }

    console.log('\n🎉 Photos ajoutées avec succès pour Seydou Sene !');
    console.log(`📸 Total: ${totalPhotosAdded} photos ajoutées`);
    console.log('\n💡 Seydou peut maintenant voir ses photos dans l\'application mobile !');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le script
addPhotosForSeydou();
