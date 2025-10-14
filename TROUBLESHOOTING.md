# 🔧 Guide de Dépannage - Amazon Importer TypeScript

## Problèmes Résolus ✅

### ✅ Module Path Resolution (`~` alias)
**Problème :** `Cannot find module '~/shopify.server'`

**Solution :** Ajout de `"paths": { "~/*": ["./app/*"] }` dans `tsconfig.json`

**Statut :** ✅ Résolu

---

### ✅ Prisma Client Export
**Problème :** `Cannot read properties of undefined (reading 'appSettings')`

**Solution :** Ajout de `export { prisma }` dans `db.server.ts`

**Statut :** ✅ Résolu

---

### ✅ Web Components Types
**Problème :** TypeScript errors sur `<s-page>`, `<s-button>`, etc.

**Solution :** Ajout des déclarations de types dans `globals.d.ts`

**Statut :** ✅ Résolu

---

## Problèmes Courants et Solutions

### 🔴 "RapidAPI key is required"

**Cause :** Vous n'avez pas configuré votre clé RapidAPI

**Solution :**
1. Allez sur https://rapidapi.com
2. Inscrivez-vous (gratuit)
3. Cherchez "Real-Time Amazon Data"
4. Abonnez-vous au plan Basic (gratuit - 100 req/mois)
5. Copiez votre API Key
6. Dans l'app Shopify : **Settings** > Collez la clé > **Save**

---

### 🔴 "Terms & Conditions not accepted"

**Cause :** Vous n'avez pas accepté les termes

**Solution :**
1. Allez dans **Settings**
2. Cochez "I accept the Terms & Conditions"
3. Cliquez sur **Save Settings**

---

### 🔴 Erreur lors du fetch Amazon

**Messages possibles :**
- "Failed to fetch product data from Amazon"
- "Could not extract ASIN from URL"
- "Invalid Amazon URL"

**Solutions :**

1. **Vérifier l'URL Amazon**
   - Format correct : `https://www.amazon.com/dp/B08N5WRWNW`
   - Pas d'URL raccourcie (amzn.to)
   - URL publique (pas de compte requis)

2. **Vérifier votre quota RapidAPI**
   - Plan gratuit = 100 requêtes/mois
   - Allez sur https://rapidapi.com/hub pour voir votre usage
   - Si dépassé, attendez le mois prochain ou upgradez

3. **Vérifier la clé API**
   - La clé est valide et active
   - Pas de caractères manquants lors de la copie

---

### 🔴 Produit importé sans variantes

**Cause :** Amazon ne retourne pas toujours les variantes via l'API

**Solution :** C'est normal. Certains produits n'exposent pas leurs variantes publiquement.

**Workaround :** Essayez avec l'URL d'une variante spécifique, l'app tentera de détecter le parent ASIN.

---

### 🔴 Images non assignées aux variantes

**Cause :** Le mapping automatique se fait via les noms de couleurs, parfois les noms ne correspondent pas exactement.

**Solution :**
- L'app essaie 2 méthodes de mapping (filename + color name)
- Si ça ne marche pas, vous pouvez assigner manuellement dans Shopify Admin
- Ou réimporter le produit

---

### 🔴 Erreur "Cannot connect to database"

**Solutions :**

1. **Générer le client Prisma**
   ```bash
   npx prisma generate
   ```

2. **Créer/Migrer la base de données**
   ```bash
   npx prisma migrate dev --name init
   ```

3. **Vérifier le fichier `dev.sqlite`**
   ```bash
   ls -la prisma/
   # Devrait contenir dev.sqlite
   ```

---

### 🔴 TypeScript Errors

**Si vous voyez des erreurs TypeScript :**

```bash
npm run typecheck
```

**Solutions courantes :**

1. **Module not found** : Vérifiez le tsconfig.json
2. **Type errors** : Ignorez-les pour l'instant (mode `any` utilisé pour certains web components)
3. **Import errors** : Utilisez `~/` pour les imports depuis `app/`

---

### 🔴 Serveur ne démarre pas

**Solutions :**

1. **Port déjà utilisé**
   ```bash
   # Tuer le processus sur le port 3000
   lsof -ti:3000 | xargs kill -9
   ```

2. **Dépendances manquantes**
   ```bash
   rm -rf node_modules
   npm install
   ```

3. **Cache Vite corrompu**
   ```bash
   rm -rf .react-router node_modules/.vite
   npm run dev
   ```

---

### 🔴 "Product created but not visible in Shopify"

**Cause :** Produit importé en mode **Draft**

**Solution :**
1. Le produit existe mais est invisible aux clients
2. Allez dans Shopify Admin > Products
3. Trouvez le produit (statut "Draft")
4. Changez le statut en "Active"

**Ou :** Lors du prochain import, choisissez "Active" au lieu de "Draft"

---

### 🔴 Bouton "Buy on Amazon" ne s'affiche pas

**Causes possibles :**

1. **Mode Dropshipping** : Le bouton n'apparaît qu'en mode Affiliate
2. **Extension non activée** : L'extension de thème n'est pas activée
3. **Affiliate ID manquant** : Configurez votre Amazon Affiliate ID dans Settings

**Solutions :**

1. **Vérifier le mode d'import**
   - Allez dans **History**
   - Vérifiez que le produit est en mode "AFFILIATE"

2. **Activer l'extension**
   - Shopify Admin > **Online Store** > **Themes**
   - Cliquez sur **Customize**
   - Allez sur une page produit
   - Ajoutez le bloc "Amazon Buy Button"

3. **Vérifier le metafield**
   - Le produit doit avoir un metafield `amazon_importer.amazon_url`
   - Visible dans Shopify Admin > Product > Metafields

---

### 🔴 Erreur "Too many requests"

**Cause :** Vous avez dépassé votre quota RapidAPI (100 req/mois en gratuit)

**Solutions :**

1. **Attendre le mois prochain** (quota se réinitialise)
2. **Upgrader votre plan RapidAPI**
3. **Utiliser un autre compte RapidAPI** (attention aux ToS)

---

### 🔴 Prix incorrects

**Cause :** Les prix Amazon changent fréquemment

**Solutions :**

1. **Réimporter le produit** pour avoir le prix à jour
2. **Modifier manuellement** dans Shopify Admin
3. **Vérifier le markup** dans Settings (default pricing)

---

## Commandes Utiles

### Base de Données

```bash
# Voir la base de données
npx prisma studio

# Générer le client
npx prisma generate

# Créer une migration
npx prisma migrate dev --name nom_migration

# Reset la base de données (⚠️ efface tout)
npx prisma migrate reset
```

### Développement

```bash
# Lancer le serveur
npm run dev

# Vérifier les types
npm run typecheck

# Build pour production
npm run build

# Linter
npm run lint
```

### Debug

```bash
# Voir les logs Prisma
export DEBUG="prisma:*"
npm run dev

# Voir les logs React Router
export DEBUG="react-router:*"
npm run dev
```

---

## Logs Importants

### Où trouver les logs ?

1. **Terminal où vous avez lancé `npm run dev`**
2. **Console du navigateur** (F12 > Console)
3. **Shopify Admin** > Apps > Votre app > Logs (si déployée)

### Logs à surveiller

- ✅ `Product created: gid://...` = Succès
- ✅ `Successfully fetched parent ASIN data` = Variantes récupérées
- ⚠️ `Error fetching parent ASIN` = Fallback aux données enfant
- ❌ `Failed to create product` = Échec de création
- ❌ `API_ERROR` = Problème RapidAPI

---

## Besoin d'Aide ?

### Avant de demander de l'aide

1. ✅ Vérifiez ce guide de dépannage
2. ✅ Lisez `QUICK_START.md`
3. ✅ Vérifiez les logs du serveur
4. ✅ Vérifiez votre configuration dans Settings

### Informations à fournir

- Message d'erreur exact
- Commande qui a échoué
- Logs du serveur
- Version de Node.js (`node --version`)
- Système d'exploitation

---

## Ressources

- **Documentation Shopify** : https://shopify.dev/docs/apps
- **React Router** : https://reactrouter.com/
- **Prisma** : https://www.prisma.io/docs
- **RapidAPI** : https://rapidapi.com/hub

---

**Ce guide sera mis à jour avec de nouveaux problèmes et solutions au fur et à mesure.**

**Dernière mise à jour :** 2025-10-13
