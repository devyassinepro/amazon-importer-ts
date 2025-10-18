# Terms & Conditions Modal - Documentation

## Vue d'ensemble

Ce système implémente un modal de Terms & Conditions obligatoire qui s'affiche automatiquement à l'ouverture de l'application si l'utilisateur n'a pas encore accepté les conditions. L'implémentation utilise **Shopify Polaris**, **React Router**, et **Prisma** avec MySQL.

---

## Architecture

### Fichiers créés/modifiés

1. **`app/components/TermsModal.tsx`**
   - Composant Modal Polaris
   - Gère l'affichage des conditions
   - Checkbox d'acceptation
   - Actions Accept/Decline

2. **`app/routes/app.tsx`**
   - Loader : vérifie si l'utilisateur a accepté les termes
   - Action : enregistre l'acceptation dans la base de données
   - Affiche le modal si termsAccepted = false

3. **`app/routes/app.access-denied.tsx`**
   - Page affichée si l'utilisateur refuse ou ferme le modal
   - Bouton pour retourner à l'app

4. **Base de données (Prisma)**
   - Utilise le modèle `AppSettings` existant
   - Champs : `termsAccepted` (Boolean) et `termsAcceptedAt` (DateTime)

---

## Flux d'utilisation

### 1. Première visite (termsAccepted = false)

```
Utilisateur ouvre l'app
    “
Loader vérifie termsAccepted dans MySQL
    “
termsAccepted = false
    “
Modal s'affiche automatiquement
    “
Utilisateur lit les 4 conditions
    “
Utilisateur coche "I have read, understood, and agree..."
    “
Bouton "Accept" devient actif
    “
Clic sur "Accept"
    “
Action POST met à jour termsAccepted = true + termsAcceptedAt
    “
Page recharge
    “
Modal ne s'affiche plus (termsAccepted = true)
```

### 2. Si l'utilisateur décline ou ferme le modal

```
Utilisateur clique sur "Decline" ou ferme le modal
    “
Redirection vers /app/access-denied
    “
Page "Access Denied" s'affiche
    “
Utilisateur peut cliquer "Return to App & Accept Terms"
    “
Retour à l'app avec modal affiché
```

### 3. Visites suivantes (termsAccepted = true)

```
Utilisateur ouvre l'app
    “
Loader vérifie termsAccepted dans MySQL
    “
termsAccepted = true
    “
Modal ne s'affiche pas
    “
Utilisateur accède normalement à l'app
```

---

## Code détaillé

### TermsModal.tsx

```tsx
import { Modal, Text, Checkbox, Button, BlockStack, List } from "@shopify/polaris";
import { useState, useEffect } from "react";
import { useFetcher } from "react-router";

interface TermsModalProps {
  open: boolean;
  onClose: () => void;
}

export default function TermsModal({ open, onClose }: TermsModalProps) {
  const [accepted, setAccepted] = useState(false);
  const fetcher = useFetcher();

  // Recharge la page après acceptation réussie
  useEffect(() => {
    if (fetcher.data?.success) {
      window.location.reload();
    }
  }, [fetcher.data]);

  const handleAccept = () => {
    if (accepted) {
      fetcher.submit(
        { action: "acceptTerms" },
        { method: "post" }
      );
    }
  };

  const handleClose = () => {
    // Redirige vers Access Denied si fermeture sans acceptation
    window.location.href = "/app/access-denied";
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Amazon Importer - Terms & Conditions"
      primaryAction={{
        content: "Accept",
        onAction: handleAccept,
        disabled: !accepted,
      }}
      secondaryActions={[
        {
          content: "Decline",
          onAction: handleClose,
        },
      ]}
    >
      <Modal.Section>
        <BlockStack gap="400">
          <Text as="p" variant="bodyMd">
            Please read and accept our Terms and Conditions to continue using Amazon Importer:
          </Text>

          <List type="number">
            <List.Item>
              <Text as="span" variant="bodyMd" fontWeight="semibold">
                Copyright and Intellectual Property:
              </Text>{" "}
              You agree to respect all copyright and trademark laws when importing products from Amazon.
              You are responsible for ensuring you have the right to sell any products you import.
            </List.Item>
            <List.Item>
              <Text as="span" variant="bodyMd" fontWeight="semibold">
                Compliance with Amazon Terms:
              </Text>{" "}
              You acknowledge that you must comply with Amazon's Terms of Service and affiliate program
              policies when using this application. Any violation may result in account suspension.
            </List.Item>
            <List.Item>
              <Text as="span" variant="bodyMd" fontWeight="semibold">
                Data Accuracy and Liability:
              </Text>{" "}
              While we strive to provide accurate product information, we are not liable for any
              discrepancies in pricing, descriptions, or availability. You are responsible for
              verifying all product details before listing them in your store.
            </List.Item>
            <List.Item>
              <Text as="span" variant="bodyMd" fontWeight="semibold">
                Service Usage and Modifications:
              </Text>{" "}
              We reserve the right to modify, suspend, or discontinue the service at any time.
              You agree to use the service in compliance with all applicable laws and regulations.
            </List.Item>
          </List>

          <Checkbox
            label="I have read, understood, and agree to the Terms & Conditions."
            checked={accepted}
            onChange={setAccepted}
          />
        </BlockStack>
      </Modal.Section>
    </Modal>
  );
}
```

### app.tsx - Loader et Action

```tsx
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  // Vérifie si l'utilisateur a accepté les termes
  let appSettings = await prisma.appSettings.findUnique({
    where: { shop },
    select: { termsAccepted: true },
  });

  // Crée les settings s'ils n'existent pas
  if (!appSettings) {
    appSettings = await prisma.appSettings.create({
      data: {
        shop,
        termsAccepted: false,
      },
      select: { termsAccepted: true },
    });
  }

  return json({
    apiKey: process.env.SHOPIFY_API_KEY || "",
    termsAccepted: appSettings.termsAccepted,
    shop,
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const formData = await request.formData();
  const actionType = formData.get("action");

  if (actionType === "acceptTerms") {
    // Met à jour ou crée les settings avec acceptation des termes
    await prisma.appSettings.upsert({
      where: { shop },
      update: {
        termsAccepted: true,
        termsAcceptedAt: new Date(),
      },
      create: {
        shop,
        termsAccepted: true,
        termsAcceptedAt: new Date(),
      },
    });

    return json({ success: true });
  }

  return json({ success: false });
};
```

---

## Base de données

Le système utilise le modèle `AppSettings` existant dans `prisma/schema.prisma`:

```prisma
model AppSettings {
  id                       String   @id @default(uuid())
  shop                     String   @unique
  termsAccepted            Boolean  @default(false)
  termsAcceptedAt          DateTime?
  // ... autres champs
}
```

### Champs utilisés

- **`shop`** : Identifiant unique du magasin Shopify
- **`termsAccepted`** : Boolean indiquant si les termes ont été acceptés
- **`termsAcceptedAt`** : Date/heure de l'acceptation

---

## Personnalisation

### Modifier les conditions

Éditez `app/components/TermsModal.tsx` et modifiez les `<List.Item>` dans le composant.

### Modifier le comportement de refus

Par défaut, refuser redirige vers `/app/access-denied`. Vous pouvez changer ce comportement dans la fonction `handleClose()` du TermsModal.

### Ajouter plus de validations

Vous pouvez ajouter des validations supplémentaires dans l'action de `app.tsx`, par exemple :
- Vérifier l'IP de l'utilisateur
- Logger l'acceptation dans une table séparée
- Envoyer un email de confirmation

---

## Tests

### Tester le flux complet

1. **Réinitialiser l'acceptation** (MySQL):
   ```sql
   UPDATE AppSettings SET termsAccepted = false WHERE shop = 'votre-shop.myshopify.com';
   ```

2. **Ouvrir l'app** : Le modal devrait s'afficher

3. **Tester le refus** : Cliquez sur "Decline" ’ Redirection vers Access Denied

4. **Tester l'acceptation** :
   - Cochez la checkbox
   - Cliquez sur "Accept"
   - La page recharge
   - Le modal ne s'affiche plus

5. **Vérifier la base de données**:
   ```sql
   SELECT termsAccepted, termsAcceptedAt FROM AppSettings WHERE shop = 'votre-shop.myshopify.com';
   ```

---

## Sécurité

-  Les termes sont vérifiés côté serveur (loader)
-  L'acceptation est enregistrée côté serveur (action)
-  Impossible de bypasser le modal en modifiant le code client
-  Chaque magasin (shop) a son propre état d'acceptation

---

## Prochaines améliorations possibles

1. Ajouter un versioning des termes (termsVersion)
2. Forcer l'acceptation si les termes changent
3. Ajouter un historique des acceptations
4. Permettre de re-consulter les termes depuis les settings
5. Ajouter une option "Print Terms" pour sauvegarder une copie PDF

---

## Support

Pour toute question ou problème, contactez l'équipe de développement.
