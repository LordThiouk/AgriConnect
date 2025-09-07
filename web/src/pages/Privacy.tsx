/**
 * Page de Politique de Confidentialité - AgriConnect
 */

import React from 'react';
import { ArrowLeft, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            to="/login" 
            className="inline-flex items-center text-green-600 hover:text-green-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à la connexion
          </Link>
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-green-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">
              Politique de Confidentialité
            </h1>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow p-8">
          <div className="prose max-w-none">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Protection de vos données personnelles
            </h2>
            
            <p className="text-gray-600 mb-6">
              Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
            </p>

            <section className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                1. Introduction
              </h3>
              <p className="text-gray-700 mb-4">
                AgriConnect s'engage à protéger votre vie privée et vos données personnelles. Cette politique 
                explique comment nous collectons, utilisons, stockons et protégeons vos informations.
              </p>
              <p className="text-gray-700">
                En utilisant notre plateforme, vous acceptez les pratiques décrites dans cette politique 
                de confidentialité.
              </p>
            </section>

            <section className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                2. Données collectées
              </h3>
              
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                2.1 Données d'authentification
              </h4>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                <li><strong>Agents et Producteurs :</strong> Numéro de téléphone pour l'authentification OTP SMS</li>
                <li><strong>Superviseurs et Administrateurs :</strong> Adresse email et mot de passe</li>
                <li>Informations de session et tokens d'authentification</li>
              </ul>

              <h4 className="text-lg font-medium text-gray-900 mb-2">
                2.2 Données de profil
              </h4>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                <li>Nom complet et informations de contact</li>
                <li>Rôle et permissions dans le système</li>
                <li>Coopérative d'appartenance</li>
                <li>Préférences linguistiques et paramètres</li>
              </ul>

              <h4 className="text-lg font-medium text-gray-900 mb-2">
                2.3 Données agricoles
              </h4>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Informations sur les parcelles et cultures</li>
                <li>Données de géolocalisation (GPS)</li>
                <li>Photos et observations terrain</li>
                <li>Historique des opérations agricoles</li>
                <li>Données de rendement et production</li>
              </ul>
            </section>

            <section className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                3. Utilisation des données
              </h3>
              
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                3.1 Finalités principales
              </h4>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                <li>Fournir et améliorer les services de la plateforme</li>
                <li>Faciliter la collecte et le suivi des données agricoles</li>
                <li>Générer des recommandations personnalisées</li>
                <li>Assurer la sécurité et l'authentification</li>
                <li>Analyser les tendances agricoles</li>
              </ul>

              <h4 className="text-lg font-medium text-gray-900 mb-2">
                3.2 Finalités secondaires
              </h4>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Améliorer l'expérience utilisateur</li>
                <li>Développer de nouvelles fonctionnalités</li>
                <li>Générer des rapports et statistiques agrégées</li>
                <li>Assurer la maintenance et le support technique</li>
              </ul>
            </section>

            <section className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                4. Partage des données
              </h3>
              <p className="text-gray-700 mb-4">
                Nous ne vendons jamais vos données personnelles. Nous pouvons partager vos informations 
                uniquement dans les cas suivants :
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li><strong>Avec votre consentement :</strong> Lorsque vous nous donnez explicitement votre accord</li>
                <li><strong>Prestataires de services :</strong> Avec des partenaires de confiance qui nous aident à fournir le service</li>
                <li><strong>Obligations légales :</strong> Lorsque requis par la loi ou les autorités compétentes</li>
                <li><strong>Protection des droits :</strong> Pour protéger nos droits, votre sécurité ou celle d'autrui</li>
              </ul>
            </section>

            <section className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                5. Sécurité des données
              </h3>
              
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                5.1 Mesures techniques
              </h4>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                <li>Chiffrement des données en transit (TLS/SSL)</li>
                <li>Chiffrement des données au repos (AES-256)</li>
                <li>Authentification multi-facteurs</li>
                <li>Contrôle d'accès basé sur les rôles (RBAC)</li>
                <li>Surveillance et audit des accès</li>
              </ul>

              <h4 className="text-lg font-medium text-gray-900 mb-2">
                5.2 Mesures organisationnelles
              </h4>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Formation du personnel à la protection des données</li>
                <li>Accords de confidentialité avec tous les employés</li>
                <li>Procédures de gestion des incidents de sécurité</li>
                <li>Audits réguliers de sécurité</li>
              </ul>
            </section>

            <section className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                6. Conservation des données
              </h3>
              <p className="text-gray-700 mb-4">
                Nous conservons vos données personnelles aussi longtemps que nécessaire pour les finalités 
                décrites dans cette politique :
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li><strong>Données de compte :</strong> Tant que votre compte est actif</li>
                <li><strong>Données agricoles :</strong> 7 ans pour les besoins de traçabilité</li>
                <li><strong>Données de session :</strong> 30 jours maximum</li>
                <li><strong>Logs de sécurité :</strong> 1 an</li>
              </ul>
            </section>

            <section className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                7. Vos droits
              </h3>
              <p className="text-gray-700 mb-4">
                Conformément aux réglementations en vigueur, vous disposez des droits suivants :
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li><strong>Droit d'accès :</strong> Consulter vos données personnelles</li>
                <li><strong>Droit de rectification :</strong> Corriger des informations inexactes</li>
                <li><strong>Droit d'effacement :</strong> Demander la suppression de vos données</li>
                <li><strong>Droit de limitation :</strong> Restreindre le traitement de vos données</li>
                <li><strong>Droit de portabilité :</strong> Récupérer vos données dans un format structuré</li>
                <li><strong>Droit d'opposition :</strong> Vous opposer au traitement de vos données</li>
              </ul>
            </section>

            <section className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                8. Cookies et technologies similaires
              </h3>
              <p className="text-gray-700 mb-4">
                Nous utilisons des cookies et technologies similaires pour :
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Maintenir votre session de connexion</li>
                <li>Mémoriser vos préférences</li>
                <li>Améliorer les performances de la plateforme</li>
                <li>Analyser l'utilisation de nos services</li>
              </ul>
              <p className="text-gray-700">
                Vous pouvez contrôler l'utilisation des cookies via les paramètres de votre navigateur.
              </p>
            </section>

            <section className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                9. Transferts internationaux
              </h3>
              <p className="text-gray-700">
                Vos données sont principalement stockées et traitées au Sénégal. Si des transferts 
                internationaux sont nécessaires, nous nous assurons qu'ils respectent les standards 
                de protection des données appropriés.
              </p>
            </section>

            <section className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                10. Modifications de cette politique
              </h3>
              <p className="text-gray-700">
                Nous pouvons modifier cette politique de confidentialité pour refléter les changements 
                dans nos pratiques ou pour d'autres raisons opérationnelles, légales ou réglementaires. 
                Nous vous informerons de tout changement important.
              </p>
            </section>

            <section className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                11. Contact
              </h3>
              <p className="text-gray-700 mb-2">
                Pour toute question concernant cette politique de confidentialité ou pour exercer vos droits :
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Email : privacy@agriconnect.sn</li>
                <li>Téléphone : +221 XX XXX XX XX</li>
                <li>Adresse : Dakar, Sénégal</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
