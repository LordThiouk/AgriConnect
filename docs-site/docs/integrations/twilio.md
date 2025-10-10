# 📱 Intégration Twilio

Configuration et utilisation de Twilio pour les notifications SMS dans AgriConnect.

## 🎯 Vue d'ensemble

Twilio est utilisé pour envoyer des notifications SMS aux producteurs et agents dans AgriConnect.

## 🔧 Configuration

### 1. Création du Compte

1. Créer un compte sur [Twilio](https://www.twilio.com/)
2. Vérifier le numéro de téléphone
3. Obtenir les credentials :
   - Account SID
   - Auth Token
   - Numéro de téléphone Twilio

### 2. Variables d'Environnement

```bash
# Variables d'environnement
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

### 3. Installation

```bash
# Installation du SDK Twilio
npm install twilio

# Types TypeScript
npm install @types/twilio
```

## 💻 Implémentation

### 1. Configuration du Client

```typescript
import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export default client;
```

### 2. Service SMS

```typescript
// Service SMS
export class SMSService {
  private client: twilio.Twilio;
  
  constructor() {
    this.client = twilio(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!
    );
  }
  
  async sendSMS(to: string, message: string) {
    try {
      const result = await this.client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER!,
        to: to
      });
      
      console.log('SMS sent successfully:', result.sid);
      return result;
    } catch (error) {
      console.error('SMS failed:', error);
      throw error;
    }
  }
  
  async sendBulkSMS(recipients: string[], message: string) {
    const results = [];
    
    for (const recipient of recipients) {
      try {
        const result = await this.sendSMS(recipient, message);
        results.push({ recipient, success: true, sid: result.sid });
      } catch (error) {
        results.push({ recipient, success: false, error: error.message });
      }
    }
    
    return results;
  }
}
```

### 3. Edge Function

```typescript
// Supabase Edge Function
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
    const { phone, message } = await req.json();
    
    // Envoyer le SMS
    const response = await fetch('https://api.twilio.com/2010-04-01/Accounts/' + 
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
    
    const result = await response.json();
    
    return new Response(
      JSON.stringify({ success: true, sid: result.sid }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
```

## 📱 Types de Notifications

### 1. Notifications d'Alerte

```typescript
// Notifications d'alerte agricole
export const sendAlertNotification = async (producer: Producer, alert: Alert) => {
  const message = `
🚨 ALERTE AGRICOLE
Bonjour ${producer.name},

${alert.message}

Action recommandée: ${alert.recommendedAction}

AgriConnect
  `.trim();
  
  await smsService.sendSMS(producer.phone, message);
};
```

### 2. Notifications de Rappel

```typescript
// Rappels d'opérations agricoles
export const sendReminderNotification = async (producer: Producer, operation: Operation) => {
  const message = `
📅 RAPPEL AGRICOLE
Bonjour ${producer.name},

Il est temps d'effectuer l'opération: ${operation.operation_type}
Parcelle: ${operation.plot_name}
Date recommandée: ${operation.recommended_date}

AgriConnect
  `.trim();
  
  await smsService.sendSMS(producer.phone, message);
};
```

### 3. Notifications de Confirmation

```typescript
// Confirmations de commande
export const sendConfirmationNotification = async (producer: Producer, order: Order) => {
  const message = `
✅ COMMANDE CONFIRMÉE
Bonjour ${producer.name},

Votre commande a été confirmée:
- Produit: ${order.product_name}
- Quantité: ${order.quantity}
- Prix: ${order.total_price} FCFA

AgriConnect
  `.trim();
  
  await smsService.sendSMS(producer.phone, message);
};
```

## 🔔 Gestion des Notifications

### 1. Queue de Notifications

```typescript
// Queue de notifications
export class NotificationQueue {
  private queue: Notification[] = [];
  private processing = false;
  
  add(notification: Notification) {
    this.queue.push(notification);
    this.process();
  }
  
  private async process() {
    if (this.processing) return;
    
    this.processing = true;
    
    while (this.queue.length > 0) {
      const notification = this.queue.shift();
      if (notification) {
        await this.sendNotification(notification);
      }
    }
    
    this.processing = false;
  }
  
  private async sendNotification(notification: Notification) {
    try {
      await smsService.sendSMS(notification.phone, notification.message);
      console.log('Notification sent:', notification.id);
    } catch (error) {
      console.error('Notification failed:', notification.id, error);
      // Retry logic
    }
  }
}
```

### 2. Rate Limiting

```typescript
// Rate limiting pour éviter les limites Twilio
export class RateLimiter {
  private requests: number[] = [];
  private maxRequests = 100; // 100 SMS par heure
  private windowMs = 60 * 60 * 1000; // 1 heure
  
  async checkLimit(): Promise<boolean> {
    const now = Date.now();
    
    // Nettoyer les requêtes anciennes
    this.requests = this.requests.filter(
      timestamp => now - timestamp < this.windowMs
    );
    
    if (this.requests.length >= this.maxRequests) {
      return false; // Limite atteinte
    }
    
    this.requests.push(now);
    return true;
  }
  
  async waitForLimit(): Promise<void> {
    while (!(await this.checkLimit())) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}
```

## 📊 Monitoring et Logs

### 1. Logs des SMS

```typescript
// Logging des SMS
export const logSMS = async (phone: string, message: string, result: any) => {
  const log = {
    timestamp: new Date().toISOString(),
    phone: phone.replace(/(\d{3})\d{6}(\d{3})/, '$1******$2'), // Masquer le numéro
    messageLength: message.length,
    success: !!result.sid,
    sid: result.sid,
    error: result.error
  };
  
  // Sauvegarder dans la base de données
  await supabase.from('sms_logs').insert(log);
  
  console.log('SMS logged:', log);
};
```

### 2. Métriques de Performance

```typescript
// Métriques SMS
export const getSMSMetrics = async () => {
  const { data, error } = await supabase
    .from('sms_logs')
    .select('*')
    .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
  
  if (error) throw error;
  
  const metrics = {
    total: data.length,
    successful: data.filter(log => log.success).length,
    failed: data.filter(log => !log.success).length,
    successRate: (data.filter(log => log.success).length / data.length) * 100
  };
  
  return metrics;
};
```

## 🧪 Tests

### 1. Tests Unitaires

```typescript
// Tests du service SMS
describe('SMSService', () => {
  let smsService: SMSService;
  
  beforeEach(() => {
    smsService = new SMSService();
  });
  
  it('should send SMS successfully', async () => {
    const mockResult = { sid: 'SM123456789' };
    jest.spyOn(smsService['client'].messages, 'create').mockResolvedValue(mockResult);
    
    const result = await smsService.sendSMS('+221701234567', 'Test message');
    
    expect(result).toEqual(mockResult);
  });
  
  it('should handle SMS failure', async () => {
    const mockError = new Error('SMS failed');
    jest.spyOn(smsService['client'].messages, 'create').mockRejectedValue(mockError);
    
    await expect(smsService.sendSMS('+221701234567', 'Test message'))
      .rejects.toThrow('SMS failed');
  });
});
```

### 2. Tests d'Intégration

```typescript
// Tests d'intégration
describe('SMS Integration', () => {
  it('should send SMS via Edge Function', async () => {
    const response = await fetch('https://your-project.supabase.co/functions/v1/send-sms', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phone: '+221701234567',
        message: 'Test message'
      })
    });
    
    const result = await response.json();
    expect(result.success).toBe(true);
    expect(result.sid).toBeDefined();
  });
});
```

## 🔒 Sécurité

### 1. Validation des Numéros

```typescript
// Validation des numéros de téléphone
export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^\+221[0-9]{9}$/;
  return phoneRegex.test(phone);
};

// Sanitisation des messages
export const sanitizeMessage = (message: string): string => {
  return message
    .replace(/[<>]/g, '') // Supprimer les balises HTML
    .substring(0, 1600); // Limiter la longueur
};
```

### 2. Gestion des Erreurs

```typescript
// Gestion des erreurs Twilio
export const handleTwilioError = (error: any) => {
  if (error.code === 21211) {
    return 'Numéro de téléphone invalide';
  } else if (error.code === 21614) {
    return 'Numéro de téléphone non valide';
  } else if (error.code === 21408) {
    return 'Permission refusée pour ce numéro';
  } else {
    return 'Erreur lors de l\'envoi du SMS';
  }
};
```

## 📚 Ressources

- [Documentation Twilio](https://www.twilio.com/docs)
- [SDK Twilio Node.js](https://www.twilio.com/docs/libraries/node)
- [API Twilio SMS](https://www.twilio.com/docs/sms/api)
- [Twilio Pricing](https://www.twilio.com/pricing)

## 🆘 Support

En cas de problème :
- Consultez les [problèmes courants](../troubleshooting/common-issues.md)
- Ouvrez une [issue GitHub](https://github.com/agriconnect/agriconnect/issues)
- Contactez : pirlothiouk@gmail.com
