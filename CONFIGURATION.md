# Configuration de l'Application Amazon Importer

## Configuration RapidAPI

La clé RapidAPI est maintenant gérée côté serveur via les variables d'environnement, et n'est plus exposée aux utilisateurs.

### Étapes de configuration :

1. **Obtenir une clé RapidAPI** :
   - Créez un compte sur [RapidAPI](https://rapidapi.com)
   - Recherchez l'API **"Real-Time Amazon Data"** par letscrape
   - Abonnez-vous au plan gratuit (100 requêtes/mois)
   - Copiez votre clé API

2. **Configurer la variable d'environnement** :
   - Ouvrez le fichier `.env` à la racine du projet
   - Ajoutez votre clé : `RAPIDAPI_KEY=votre_cle_ici`

   Exemple :
   ```env
   RAPIDAPI_KEY=abc123def456ghi789jkl012mno345pqr678
   ```

3. **Redémarrer l'application** :
   ```bash
   npm run dev
   ```

## Structure de l'application

- **Variables d'environnement** : La clé RapidAPI est stockée dans `.env` (non versionnée)
- **Interface utilisateur** : Les utilisateurs ne voient plus le champ RapidAPI dans les paramètres
- **Sécurité** : La clé est uniquement accessible côté serveur

## Fonctionnalités

L'application permet maintenant aux utilisateurs de :
- Importer des produits Amazon via une URL
- Configurer leurs paramètres d'affiliation Amazon
- Définir des stratégies de prix par défaut
- Gérer l'historique des importations

Tous les appels API vers Amazon sont gérés de manière sécurisée côté serveur.
