# 🚀 Démarrage Rapide - Amazon Importer TypeScript

## ✅ Votre application est prête !

Toutes les routes et fonctionnalités ont été créées avec succès.

---

## 📋 Checklist Avant de Commencer

- ✅ **Node.js 20+** installé
- ✅ **npm** installé
- ✅ **Shopify CLI** installé (`npm i -g @shopify/cli`)
- ✅ **Compte RapidAPI** (pour l'API Amazon)

---

## 🎯 Étape 1 : Configuration Initiale

### 1.1 Navigation vers le projet

```bash
cd /Users/touzani/Desktop/amazon-importer/amazon-importer-ts
```

### 1.2 Installer les dépendances (si pas déjà fait)

```bash
npm install
```

### 1.3 Générer le client Prisma

```bash
npx prisma generate
```

### 1.4 Créer la base de données

```bash
npx prisma migrate dev --name init
```

---

## 🚀 Étape 2 : Lancer l'Application

```bash
npm run dev
```

Vous verrez quelque chose comme :

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                                                                               │
│  Using development store: votre-boutique.myshopify.com                       │
│                                                                               │
│  Preview URL: https://admin.shopify.com/store/...                            │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```

Cliquez sur le **Preview URL** pour ouvrir l'application dans Shopify Admin.

---

## ⚙️ Étape 3 : Configuration de l'App

### 3.1 Obtenir une RapidAPI Key

1. Allez sur https://rapidapi.com
2. Créez un compte (gratuit)
3. Cherchez **"Real-Time Amazon Data"** par letscrape
4. Cliquez sur **"Subscribe to Test"**
5. Choisissez le plan **Basic (FREE)** - 100 requêtes/mois
6. Copiez votre **API Key** (X-RapidAPI-Key)

### 3.2 Configurer l'App

Dans Shopify Admin, l'app devrait s'ouvrir. Vous verrez 3 pages dans le menu :

1. **Import Products** - Page d'import
2. **History** - Historique des imports
3. **Settings** - Paramètres

**🔧 Allez dans Settings et configurez :**

1. **RapidAPI Key** : Collez votre clé RapidAPI (obligatoire)
2. **Terms & Conditions** : Cochez "I accept" (obligatoire)
3. **Amazon Affiliate ID** : Si vous voulez utiliser le mode Affiliate (optionnel)
4. **Default Pricing** : Configurez votre pricing par défaut
5. Cliquez sur **Save Settings**

---

## 🎉 Étape 4 : Importer Votre Premier Produit

### 4.1 Aller sur la page Import

Cliquez sur **Import Products** dans le menu.

### 4.2 Coller une URL Amazon

Exemple d'URLs supportées :
- `https://www.amazon.com/dp/B08N5WRWNW`
- `https://www.amazon.fr/dp/B08N5WRWNW`
- `https://www.amazon.co.uk/dp/B08N5WRWNW`

### 4.3 Cliquer sur "Fetch Product Data"

L'app va :
- ✅ Extraire l'ASIN du produit
- ✅ Détecter le marketplace Amazon
- ✅ Fetch les données via RapidAPI
- ✅ Récupérer toutes les variantes
- ✅ Mapper les images aux variantes

### 4.4 Choisir le Mode d'Import

**🟢 Mode Affiliate :**
- Prix Amazon original conservé
- Ajoute un bouton "Buy on Amazon" sur la page produit
- Vous gagnez des commissions via Amazon Associates

**🛒 Mode Dropshipping :**
- Prix personnalisé avec markup
- Pas de bouton Amazon
- Vous vendez le produit directement

### 4.5 Configurer le Pricing (si Dropshipping)

- **Multiplier** : `1.5` = 50% de markup (prix × 1.5)
- **Fixed** : `10` = +$10 sur le prix

### 4.6 Publier

- **Draft** : Invisible pour les clients (vous pouvez vérifier avant)
- **Active** : Visible immédiatement sur votre boutique

Cliquez sur **"Save as Draft"** ou **"Publish to Store"** !

---

## 📊 Étape 5 : Voir l'Historique

Allez dans **History** pour voir :
- Tous vos produits importés
- Statistiques (total, modes, valeur)
- Recherche et filtres
- Liens vers Shopify et Amazon

---

## 🎨 Étape 6 : Personnaliser le Bouton Amazon (Mode Affiliate)

Si vous utilisez le mode Affiliate, un bouton "Buy on Amazon" sera ajouté sur vos pages produit.

### Pour le personnaliser :

1. Allez dans **Shopify Admin** > **Online Store** > **Themes**
2. Cliquez sur **Customize**
3. Allez sur une page produit
4. Dans les sections/blocs, cherchez **"Amazon Buy Button"**
5. Personnalisez :
   - Texte du bouton
   - Couleurs
   - Position
   - Bordures
   - Tailles
   - Disclaimer

---

## 🔍 Fonctionnalités Disponibles

### ✅ Ce que vous pouvez faire

1. **Import de produits Amazon**
   - 12+ marchés (US, UK, DE, FR, IT, ES, CA, JP, IN, MX, BR, AU)
   - Jusqu'à 250 variantes par produit
   - Images automatiquement mappées aux variantes
   - Support ASIN parent/enfant

2. **Dual Mode**
   - Affiliate (commissions)
   - Dropshipping (marge)

3. **Pricing Flexible**
   - Multiplier (pourcentage)
   - Fixed (montant fixe)

4. **Collections**
   - Ajout automatique à une collection

5. **Historique**
   - Tous vos imports
   - Stats & analytics
   - Recherche & filtres

6. **Settings**
   - Configuration complète
   - Defaults personnalisables

---

## ⚠️ Limites & Quotas

### RapidAPI (Plan Gratuit)
- **100 requêtes/mois**
- Après 100 produits, vous devrez upgrader

### Shopify
- **3 options maximum** par produit (Color, Size, Style)
- **100 variantes maximum** recommandé (API supporte 250)
- **10 images maximum** par produit

---

## 🐛 Problèmes Courants

### "RapidAPI key is required"
➡️ Allez dans Settings et ajoutez votre clé

### "Terms & Conditions not accepted"
➡️ Allez dans Settings et acceptez les termes

### Erreur lors du fetch
➡️ Vérifiez :
- Clé RapidAPI valide
- Quota non dépassé
- URL Amazon correcte

### Produit sans variantes
➡️ Normal, certains produits Amazon n'exposent pas leurs variantes

### Images non assignées aux variantes
➡️ Le mapping se fait automatiquement par couleur. Si ça ne marche pas, c'est que les couleurs ne correspondent pas exactement.

---

## 📚 Documentation

- **README.md** : Guide complet
- **MIGRATION_SUMMARY.md** : Détails de la migration
- **Shopify Docs** : https://shopify.dev
- **React Router v7** : https://reactrouter.com
- **Prisma** : https://prisma.io

---

## 🎯 Prochaines Étapes

1. ✅ Configurez votre RapidAPI key
2. ✅ Acceptez les termes
3. ✅ Importez votre premier produit
4. ✅ Vérifiez dans Shopify Admin
5. ✅ Testez sur votre boutique
6. ✅ Personnalisez le bouton Amazon (si Affiliate)
7. ✅ Importez plus de produits !

---

## 💡 Conseils Pro

- **Testez en Draft** avant de publier
- **Vérifiez les prix** Amazon régulièrement
- **Utilisez des collections** pour organiser vos produits
- **Mode Affiliate** = bon pour drive traffic vers Amazon
- **Mode Dropshipping** = meilleur pour marges directes
- **Regardez l'historique** régulièrement pour voir vos stats

---

## 🎉 C'est Parti !

Votre application est **100% fonctionnelle** et prête à importer des produits Amazon !

```bash
npm run dev
```

**Bon import ! 🚀**
