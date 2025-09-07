/**
 * Page des Conditions Générales d'Utilisation - AgriConnect
 */

import React from 'react';
import { ArrowLeft, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

const TermsPage: React.FC = () => {
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
            <FileText className="h-8 w-8 text-green-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">
              Conditions Générales d'Utilisation
            </h1>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow p-8">
          <div className="prose max-w-none">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              AgriConnect - Plateforme Numérique Agricole
            </h2>
            
            <p className="text-gray-600 mb-6">
              Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
            </p>

            <section className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                1. Objet et champ d'application
              </h3>
              <p className="text-gray-700 mb-4">
                Les présentes conditions générales d'utilisation (CGU) régissent l'utilisation de la plateforme 
                AgriConnect, une solution numérique destinée à la digitalisation de l'agriculture au Sénégal.
              </p>
              <p className="text-gray-700">
                AgriConnect permet aux producteurs, agents de terrain, superviseurs et administrateurs de 
                gérer et suivre les activités agricoles de manière numérique.
              </p>
            </section>

            <section className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                2. Définitions
              </h3>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li><strong>Plateforme :</strong> L'application web et mobile AgriConnect</li>
                <li><strong>Utilisateur :</strong> Toute personne accédant à la plateforme</li>
                <li><strong>Producteur :</strong> Agriculteur utilisant la plateforme pour suivre ses parcelles</li>
                <li><strong>Agent :</strong> Personnel de terrain collectant les données agricoles</li>
                <li><strong>Superviseur :</strong> Personnel encadrant les agents et analysant les données</li>
                <li><strong>Administrateur :</strong> Personnel gérant la plateforme et les utilisateurs</li>
              </ul>
            </section>

            <section className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                3. Acceptation des conditions
              </h3>
              <p className="text-gray-700 mb-4">
                L'utilisation de la plateforme AgriConnect implique l'acceptation pleine et entière des 
                présentes conditions générales d'utilisation.
              </p>
              <p className="text-gray-700">
                Si vous n'acceptez pas ces conditions, vous ne devez pas utiliser la plateforme.
              </p>
            </section>

            <section className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                4. Utilisation de la plateforme
              </h3>
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                4.1 Accès et authentification
              </h4>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                <li>L'accès à la plateforme nécessite une authentification sécurisée</li>
                <li>Les agents et producteurs utilisent l'authentification OTP SMS</li>
                <li>Les superviseurs et administrateurs utilisent l'authentification email/mot de passe</li>
                <li>Chaque utilisateur est responsable de la confidentialité de ses identifiants</li>
              </ul>

              <h4 className="text-lg font-medium text-gray-900 mb-2">
                4.2 Rôles et permissions
              </h4>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li><strong>Producteur :</strong> Accès à ses propres parcelles et cultures</li>
                <li><strong>Agent :</strong> Collecte de données pour les producteurs assignés</li>
                <li><strong>Superviseur :</strong> Supervision des données de sa coopérative</li>
                <li><strong>Administrateur :</strong> Accès complet à toutes les données</li>
              </ul>
            </section>

            <section className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                5. Protection des données
              </h3>
              <p className="text-gray-700 mb-4">
                AgriConnect s'engage à protéger les données personnelles et agricoles conformément aux 
                réglementations en vigueur au Sénégal.
              </p>
              <p className="text-gray-700">
                Les données collectées sont utilisées exclusivement dans le cadre de l'amélioration 
                des pratiques agricoles et de l'accompagnement des producteurs.
              </p>
            </section>

            <section className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                6. Responsabilités
              </h3>
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                6.1 Responsabilités de l'utilisateur
              </h4>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                <li>Utiliser la plateforme conformément à sa destination</li>
                <li>Respecter les droits de propriété intellectuelle</li>
                <li>Ne pas tenter de contourner les mesures de sécurité</li>
                <li>Signaler tout dysfonctionnement ou problème de sécurité</li>
              </ul>

              <h4 className="text-lg font-medium text-gray-900 mb-2">
                6.2 Responsabilités d'AgriConnect
              </h4>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Assurer la disponibilité et la sécurité de la plateforme</li>
                <li>Protéger les données utilisateur</li>
                <li>Fournir un support technique approprié</li>
                <li>Respecter la confidentialité des informations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                7. Propriété intellectuelle
              </h3>
              <p className="text-gray-700 mb-4">
                La plateforme AgriConnect et tous ses éléments (code, design, contenu) sont protégés 
                par les droits de propriété intellectuelle.
              </p>
              <p className="text-gray-700">
                Les utilisateurs conservent la propriété de leurs données agricoles tout en accordant 
                à AgriConnect les droits nécessaires pour fournir le service.
              </p>
            </section>

            <section className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                8. Modification des conditions
              </h3>
              <p className="text-gray-700">
                AgriConnect se réserve le droit de modifier les présentes conditions à tout moment. 
                Les utilisateurs seront informés des modifications importantes par email ou via la plateforme.
              </p>
            </section>

            <section className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                9. Contact
              </h3>
              <p className="text-gray-700 mb-2">
                Pour toute question concernant ces conditions d'utilisation :
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Email : contact@agriconnect.sn</li>
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

export default TermsPage;
