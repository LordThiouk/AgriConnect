Flow de l'Application HeberSenegal
€ Vue d'Ensemble
Application mobile/web pour le recensement et suivi des producteurs agricoles (cotonculteurs)
Objectifs :
e Digitaliser la collecte et gestion des données agricoles
e Accompagner les producteurs avec un suivi temps réel

e Analyser performances et dettes paysannes
E Flow Principal de Navigation
&3 ACCUEIL - Fiche Exploitation (Point d'entrée obligatoire)
Étape

1a : Données Organisationnelles
r
r— Nom de la fiche * (requis)
-- Localisation géographique *
| + Département *
| Commune *
| + Village *
| 1 Secteur *
-- Géolocalisation GPS (coordonnées)
H- Coopérative *
F- GPC (Groupement Producteurs Coton)
L_ Date de recensement * L
Étape 1b : Chef d'Exploitation 
r— Informations personnelles
| + Nom*
| Statut : Chef d'exploitation / Producteur
| + Date naissance/âge * — Classification auto (16-35 | 36-50 | +50 ans)
| + M Jeune producteur (< 30 ans)
| + Sexe (M/F) *
| 1 Numéro CNI
|
L_ Compétences & Formation
-- Alphabétisation : Oui / Non
-- Langues (multi-sélection) : Pular | Mandingue | Wolof | Français L_ Relais agricole formé : Oui / Non
L
Étape 1c : Inventaire Matériel (si chef = gestionnaire) 

r-— Pulvérisateurs
| Bon état (nombre)
| 1 Réparable (nombre)
|
+ Matériel agricole
| + Tracteur | Motoculteur | UCF
| Arara | Arara + 3 dents
| L Autres (spécifier)
|
+ Outils manuels
| Houe Sine | Houes Occidentales
| + Charrues | Semoir | Corps butteur
| L- Charrettes
|
L— Animaux de trait
-— Bovins | Équins | Âsins L_ (quantités pour chaque type)
L
— VALIDATION & SAUVEGARDE — Débloquer Niveau 2


#3 GESTION PARCELLES (Accessible après création fiche)
Navigation : Menu principal — "Parcelles" — "Ajouter nouvelle parcelle"
r— Identification parcelle
| Identifiant parcelle *
| + Surface recensée (toutes cultures - ha)
| Surface piquetée (ha)
| 1 Vague de plantation
|
+ Classification
| Typologie : A[B|C|D|CC|EAM
| Taille producteur :
| | Standard (< 3 ha)
| | HGros(>3ha)
| | 1 Super gros (> 10 ha)
| 1 Variété cultivée : CE | CM | SH | NAW
|
L_ Responsable parcelle L_ (Mêmes champs que Chef d'exploitation - Niveau 1b)
L
— SAUVEGARDE PARCELLE — Débloquer Niveau 3 pour cette parcelle


EF DONNÉES DÉTAILLÉES PAR PARCELLE (Dashboard avec icônes)
Navigation : Sélectionner parcelle — Dashboard avec 4 sections principales
E] Section A : Gestion des Intervenants
Æ SECTION RÉPÉTABLE - Ajouter plusieurs intervenants
Pour chaque intervenant :
r-— Identité
+ Nom *
H- Profil : Producteur | Chef exploitation | Chef ménage |
| Cotoncultrice | Sourga | Nawetane
+ Sexe (M/F)
| | |
| + Date naissance/âge — Classification auto
|
| 1 Numéro CNI
|
L_ Compétences
+ Alphabétisation : Oui / Non
- Langues : Pular | Mandingue | Wolof | Français
L_ M Jeune producteur (< 30 ans) [+ Ajouter autre intervenant] [A Sauvegarder]
Ne
Æ Section B : Intrants et Consommations 
[— Semences
| + Délintées (kg)
| + Vêtues (kg)
| 1 Total — Calcul automatique
|
+- Traitements
| - Fongicides/Insecticides : Spinox (sachet) | Spisem (sachet) | Autre
| HH Engrais : NPK (sac) | Urée (sac)
| L_ Herbicides : Callifor G (1) | Kalach (1) | Autre
|
L_ Matériel/Fournitures
-- Piles | Corde piquetage | Disques
+ Protection : Masque | Gants | Lunettes
-- Pièces détachées (FCFA)
+ Vivres de soudure (sac)
L_ Sacs de récolte
[M Sauvegarder intrants]
a& Section C : Opérations Culturales 
[- Fertilisation & Entretien (Oui/Non pour chaque)
| + M Sarclage
| +" Herbicidé
| + M Fertilisé NPK
| + M Fertilisé Urée
| LM Buttage
|
L_ Traitements Phytosanitaires
L Pour chaque rotation (1 à 8) :
-- M Traitée (Oui/Non)
H- Date début traitement
H- Date fin traitement
L_ Produit utilisé (optionnel) [M Sauvegarder opérations]
L
Ml Section D : Suivi Campagne & Conseils 
i CRÉATION CAMPAGNE (Prérequis)
r— Paramètres généraux
| HT Date début campagne
| + Variété — Récupérée de la parcelle
| Surface — Récupérée de la parcelle
| L_ Cycle prévu (jours selon variété)
[#° Démarrer campagne]
22 SUIVI PROGRESSIF - Étapes séquentielles
r- Étape 1 : Préparation du Sol
| + T Date réalisation
| + Type préparation
| + Matériel utilisé
| État du sol
| + > Observations
| + den Photos
| L Statut : En cours | Terminé | Reporté
|
H- Étape 2 : Semis/Plantation
| + Date semis
| + Quantité utilisée
| + Type : Manuel | Mécanique
| HEspacement
| +% Conditions météo
| FH % Observations
| + £en Photos
| L Statut : En cours | Terminé | Reporté
|
L_ Étape 3 : Levée
H- Date constatation
H- Taux levée (%) 
H- Homogénéité
-- Problèmes observés
+ Actions correctives
+ > Observations
+ da Photos
L- Statut : Validé | À surveiller
[pb Étape suivante] [A Sauvegarder étape]

©) Navigation et Workflow
Flow

utilisateur type :
/
DÉMARRAGE
|
1. Créer Fiche Exploitation (obligatoire)
| (validation réussie)
2. Ajouter Parcelle(s)
L (pour chaque parcelle)
3. Remplir sections détaillées :
+ À. Intervenants
+ B. intrants
H- C. Opérations
L_ D, Suivi campagne SAUVEGARDE CONTINUE à chaque étape
Points de contrôle :
e Champs obligatoires (*) bloquent la progression
e Validation automatique des classifications d'âge 
° Calculs automatiques (totaux semences, cycles)
e Géolocalisation GPS en arrière-plan
e Photos facultatives pour documentation
Sortie/Reprise :
e Sauvegarde automatique à chaque section
e Reprise possible à tout moment
e Données synchronisées multi-appareils