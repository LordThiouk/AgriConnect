# ⚡ Edge Functions

Configuration et utilisation des Edge Functions Supabase dans AgriConnect.

## 🎯 Vue d'ensemble

Les Edge Functions sont utilisées pour exécuter du code côté serveur dans AgriConnect, notamment pour les notifications et le traitement des données.

## 🔧 Configuration

### 1. Installation

```bash
# Installation de Supabase CLI
npm install -g supabase

# Initialisation du projet
supabase init

# Démarrage de Supabase local
supabase start
```

### 2. Structure des Edge Functions

```
supabase/functions/
├── send-notification/
│   ├── index.ts
│   └── package.json
├── process-alerts/
│   ├── index.ts
│   └── package.json
└── generate-report/
    ├── index.ts
    └── package.json
```

## 💻 Implémentation

### 1. Fonction d'Envoi de Notifications

```typescript
// supabase/functions/send-notification/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { phone, message, type } = await req.json();
    
    // Créer le client Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );
    
    // Envoyer le SMS via Twilio
    const twilioResponse = await fetch('https://api.twilio.com/2010-04-01/Accounts/' + 
      Deno.env.get('TWILIO_ACCOUNT_SID') + '/Messages.json', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(
          Deno.env.get('TWILIO_ACCOUNT_SID') + ':' + 
          Deno.env.get('TWILIO_AUTH_TOKEN')
        ),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'From': Deno.env.get('TWILIO_PHONE_NUMBER')!,
        'To': phone,
        'Body': message
      })
    });
    
    const twilioResult = await twilioResponse.json();
    
    // Enregistrer le log de notification
    await supabase.from('notification_logs').insert({
      phone: phone.replace(/(\d{3})\d{6}(\d{3})/, '$1******$2'), // Masquer le numéro
      message: message,
      type: type,
      success: !!twilioResult.sid,
      twilio_sid: twilioResult.sid,
      error: twilioResult.error_message
    });
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        sid: twilioResult.sid,
        message: 'Notification envoyée avec succès'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Error sending notification:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
```

### 2. Fonction de Traitement des Alertes

```typescript
// supabase/functions/process-alerts/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // Récupérer les règles d'alerte actives
    const { data: rules, error: rulesError } = await supabase
      .from('agri_rules')
      .select('*')
      .eq('is_active', true);
    
    if (rulesError) throw rulesError;
    
    const alerts = [];
    
    // Traiter chaque règle
    for (const rule of rules) {
      const alert = await processRule(supabase, rule);
      if (alert) {
        alerts.push(alert);
      }
    }
    
    // Envoyer les alertes
    for (const alert of alerts) {
      await sendAlert(supabase, alert);
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: alerts.length,
        alerts: alerts.map(a => ({ id: a.id, type: a.type }))
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing alerts:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

async function processRule(supabase: any, rule: any) {
  switch (rule.type) {
    case 'emergence_delay':
      return await checkEmergenceDelay(supabase, rule);
    case 'missing_fertilization':
      return await checkMissingFertilization(supabase, rule);
    case 'disease_detection':
      return await checkDiseaseDetection(supabase, rule);
    default:
      return null;
  }
}

async function checkEmergenceDelay(supabase: any, rule: any) {
  const { data: crops, error } = await supabase
    .rpc('get_crops_with_emergence_delay', {
      days_threshold: rule.parameters.days_threshold
    });
  
  if (error) throw error;
  
  if (crops && crops.length > 0) {
    return {
      type: 'emergence_delay',
      severity: 'high',
      message: `${crops.length} cultures avec retard de levée`,
      affected_crops: crops,
      rule_id: rule.id
    };
  }
  
  return null;
}

async function sendAlert(supabase: any, alert: any) {
  // Créer l'alerte dans la base de données
  const { data: alertRecord, error } = await supabase
    .from('alerts')
    .insert({
      type: alert.type,
      severity: alert.severity,
      message: alert.message,
      rule_id: alert.rule_id,
      affected_crops: alert.affected_crops
    })
    .select()
    .single();
  
  if (error) throw error;
  
  // Envoyer les notifications aux producteurs concernés
  for (const crop of alert.affected_crops) {
    const { data: producer } = await supabase
      .from('producers')
      .select('phone, name')
      .eq('id', crop.producer_id)
      .single();
    
    if (producer && producer.phone) {
      await supabase.functions.invoke('send-notification', {
        body: {
          phone: producer.phone,
          message: `🚨 ALERTE: ${alert.message}`,
          type: 'alert'
        }
      });
    }
  }
  
  return alertRecord;
}
```

### 3. Fonction de Génération de Rapports

```typescript
// supabase/functions/generate-report/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const { reportType, startDate, endDate, cooperativeId } = await req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    let report;
    
    switch (reportType) {
      case 'yield_summary':
        report = await generateYieldSummary(supabase, startDate, endDate, cooperativeId);
        break;
      case 'operations_summary':
        report = await generateOperationsSummary(supabase, startDate, endDate, cooperativeId);
        break;
      case 'producer_performance':
        report = await generateProducerPerformance(supabase, startDate, endDate, cooperativeId);
        break;
      default:
        throw new Error('Type de rapport non supporté');
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        report: report,
        generated_at: new Date().toISOString()
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating report:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

async function generateYieldSummary(supabase: any, startDate: string, endDate: string, cooperativeId?: string) {
  const { data: yields, error } = await supabase
    .from('crops')
    .select(`
      crop_type,
      actual_yield_kg_ha,
      estimated_yield_kg_ha,
      producers!inner(cooperative_id)
    `)
    .gte('harvest_date', startDate)
    .lte('harvest_date', endDate)
    .not('actual_yield_kg_ha', 'is', null);
  
  if (error) throw error;
  
  // Filtrer par coopérative si spécifiée
  const filteredYields = cooperativeId 
    ? yields.filter(y => y.producers.cooperative_id === cooperativeId)
    : yields;
  
  // Calculer les statistiques
  const summary = filteredYields.reduce((acc, crop) => {
    if (!acc[crop.crop_type]) {
      acc[crop.crop_type] = {
        total_actual: 0,
        total_estimated: 0,
        count: 0
      };
    }
    
    acc[crop.crop_type].total_actual += crop.actual_yield_kg_ha;
    acc[crop.crop_type].total_estimated += crop.estimated_yield_kg_ha;
    acc[crop.crop_type].count += 1;
    
    return acc;
  }, {});
  
  // Calculer les moyennes
  Object.keys(summary).forEach(cropType => {
    const data = summary[cropType];
    data.avg_actual = data.total_actual / data.count;
    data.avg_estimated = data.total_estimated / data.count;
    data.yield_gap = data.avg_actual - data.avg_estimated;
  });
  
  return {
    type: 'yield_summary',
    period: { startDate, endDate },
    cooperative_id: cooperativeId,
    summary: summary,
    total_crops: filteredYields.length
  };
}
```

## 🚀 Déploiement

### 1. Déploiement Local

```bash
# Déployer une fonction spécifique
supabase functions deploy send-notification

# Déployer toutes les fonctions
supabase functions deploy

# Vérifier les fonctions déployées
supabase functions list
```

### 2. Configuration des Secrets

```bash
# Ajouter les secrets
supabase secrets set TWILIO_ACCOUNT_SID=your-twilio-sid
supabase secrets set TWILIO_AUTH_TOKEN=your-twilio-token
supabase secrets set TWILIO_PHONE_NUMBER=your-twilio-phone

# Vérifier les secrets
supabase secrets list
```

### 3. Déploiement en Production

```bash
# Lier le projet de production
supabase link --project-ref your-production-project-ref

# Déployer les fonctions
supabase functions deploy

# Configurer les secrets de production
supabase secrets set TWILIO_ACCOUNT_SID=your-production-twilio-sid
supabase secrets set TWILIO_AUTH_TOKEN=your-production-twilio-token
```

## 📱 Utilisation depuis l'Application

### 1. Appel depuis React Native

```typescript
// Service pour appeler les Edge Functions
export class EdgeFunctionService {
  private supabase: SupabaseClient;
  
  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }
  
  async sendNotification(phone: string, message: string, type: string) {
    const { data, error } = await this.supabase.functions.invoke('send-notification', {
      body: {
        phone,
        message,
        type
      }
    });
    
    if (error) throw error;
    return data;
  }
  
  async processAlerts() {
    const { data, error } = await this.supabase.functions.invoke('process-alerts', {
      body: {}
    });
    
    if (error) throw error;
    return data;
  }
  
  async generateReport(reportType: string, startDate: string, endDate: string, cooperativeId?: string) {
    const { data, error } = await this.supabase.functions.invoke('generate-report', {
      body: {
        reportType,
        startDate,
        endDate,
        cooperativeId
      }
    });
    
    if (error) throw error;
    return data;
  }
}
```

### 2. Utilisation dans les Composants

```typescript
// Composant d'envoi de notification
const NotificationSender = () => {
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleSend = async () => {
    setLoading(true);
    
    try {
      await edgeFunctionService.sendNotification(phone, message, 'manual');
      alert('Notification envoyée avec succès');
    } catch (error) {
      alert('Erreur lors de l\'envoi de la notification');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <View>
      <TextInput
        placeholder="Numéro de téléphone"
        value={phone}
        onChangeText={setPhone}
      />
      <TextInput
        placeholder="Message"
        value={message}
        onChangeText={setMessage}
        multiline
      />
      <Button
        title="Envoyer"
        onPress={handleSend}
        loading={loading}
      />
    </View>
  );
};
```

## 🧪 Tests

### 1. Tests des Edge Functions

```typescript
// Tests des Edge Functions
describe('Edge Functions', () => {
  it('should send notification successfully', async () => {
    const response = await fetch('https://your-project.supabase.co/functions/v1/send-notification', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phone: '+221701234567',
        message: 'Test message',
        type: 'test'
      })
    });
    
    const result = await response.json();
    expect(result.success).toBe(true);
    expect(result.sid).toBeDefined();
  });
  
  it('should process alerts successfully', async () => {
    const response = await fetch('https://your-project.supabase.co/functions/v1/process-alerts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    expect(result.success).toBe(true);
    expect(result.processed).toBeGreaterThanOrEqual(0);
  });
});
```

### 2. Tests de Performance

```typescript
// Tests de performance
describe('Edge Functions Performance', () => {
  it('should process alerts in less than 5 seconds', async () => {
    const start = Date.now();
    
    await edgeFunctionService.processAlerts();
    
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(5000);
  });
  
  it('should send notification in less than 2 seconds', async () => {
    const start = Date.now();
    
    await edgeFunctionService.sendNotification('+221701234567', 'Test', 'test');
    
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(2000);
  });
});
```

## 📊 Monitoring

### 1. Logs des Edge Functions

```typescript
// Configuration des logs
const logger = {
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, data);
  },
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error);
  }
};
```

### 2. Métriques de Performance

```typescript
// Collecte de métriques
const collectMetrics = (functionName: string, duration: number, success: boolean) => {
  const metrics = {
    function: functionName,
    duration: duration,
    success: success,
    timestamp: new Date().toISOString()
  };
  
  // Envoyer vers un service de monitoring
  console.log('Metrics:', JSON.stringify(metrics));
};
```

## 📚 Ressources

- [Documentation Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Deno Documentation](https://deno.land/manual)
- [Supabase Edge Functions Examples](https://github.com/supabase/supabase/tree/master/examples/edge-functions)

## 🆘 Support

En cas de problème :
- Consultez les [problèmes courants](../troubleshooting/common-issues.md)
- Ouvrez une [issue GitHub](https://github.com/agriconnect/agriconnect/issues)
- Contactez : pirlothiouk@gmail.com
