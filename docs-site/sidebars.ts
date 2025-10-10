import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
const sidebars: SidebarsConfig = {
  mainSidebar: [
    {
      type: 'doc',
      id: 'intro',
      label: '🏠 Accueil',
    },
    {
      type: 'category',
      label: '🚀 Démarrage',
      items: [
        'getting-started/installation',
        'getting-started/supabase-setup',
        'getting-started/first-steps',
        'getting-started/DUAL_AUTHENTICATION_SETUP',
        'getting-started/SUPABASE_AUTH_SETUP',
        'getting-started/TWILIO_SETUP_GUIDE',
      ],
    },
    {
      type: 'category',
      label: '🏗️ Architecture',
      items: [
        'architecture/overview',
        'architecture/tech-stack',
        'architecture/database',
        'architecture/SECURITY',
      ],
    },
    {
      type: 'category',
      label: '📱 Applications',
      items: [
        'mobile/agent-dashboard-mobile-implementation',
        'mobile/dashboard-implementation-update',
        'mobile/mobileDevelopmentStatus',
        'api/MOBILE_AUTH_IMPLEMENTATION_SUMMARY',
        'api/OPENAPI_POSTMAN_GUIDE',
      ],
    },
    {
      type: 'category',
      label: '🔧 Développement',
      items: [
        'development/guide',
        'development/testing',
        'development/contributing',
        'development/doc-standards',
        'development/executive-summary',
        'development/FINAL_MIGRATION_SUMMARY',
        'development/MIGRATION_SUCCESS_SUMMARY',
      ],
    },
    {
      type: 'category',
      label: '🚀 Déploiement',
      items: [
        'deployment/DEPLOY_MIGRATION_GUIDE',
        'deployment/PROTOTYPE_DEPLOYMENT_DELIVERABLE',
      ],
    },
    {
      type: 'category',
      label: '🛠️ Intégrations',
      items: [
        'integrations/APPLICATION_INTEGRATION_SUMMARY',
        'integrations/twilio',
        'integrations/postgis',
        'integrations/edge-functions',
      ],
    },
    {
      type: 'category',
      label: '🔍 Dépannage',
      items: [
        'troubleshooting/DEBUG_VISITS_RLS',
        'troubleshooting/GEOLOCATION_FIX_SUMMARY',
        'troubleshooting/GPS_DISPLAY_FIX_SUMMARY',
        'troubleshooting/ROLE_CONSTRAINT_FIX_GUIDE',
        'troubleshooting/VISITS_CRUD_DEBUG_GUIDE',
      ],
    },
  ],
};

export default sidebars;
