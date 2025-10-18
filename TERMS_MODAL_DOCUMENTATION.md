# Terms & Conditions Modal - Documentation

## Vue d'ensemble

Ce syst�me impl�mente un modal de Terms & Conditions obligatoire qui s'affiche automatiquement � l'ouverture de l'application si l'utilisateur n'a pas encore accept� les conditions. L'impl�mentation utilise **Shopify Polaris**, **React Router**, et **Prisma** avec MySQL.

---

## Architecture

### Fichiers cr��s/modifi�s

1. **`app/components/TermsModal.tsx`**
   - Composant Modal Polaris
   - G�re l'affichage des conditions
   - Checkbox d'acceptation
   - Actions Accept/Decline

2. **`app/routes/app.tsx`**
   - Loader : v�rifie si l'utilisateur a accept� les termes
   - Action : enregistre l'acceptation dans la base de donn�es
   - Affiche le modal si termsAccepted = false

3. **`app/routes/app.access-denied.tsx`**
   - Page affich�e si l'utilisateur refuse ou ferme le modal
   - Bouton pour retourner � l'app

4. **Base de donn�es (Prisma)**
   - Utilise le mod�le `AppSettings` existant
   - Champs : `termsAccepted` (Boolean) et `termsAcceptedAt` (DateTime)

---

## Flux d'utilisation

### 1. Premi�re visite (termsAccepted = false)

```
Utilisateur ouvre l'app
    �
Loader v�rifie termsAccepted dans MySQL
    �
termsAccepted = false
    �
Modal s'affiche automatiquement
    �
Utilisateur lit les 4 conditions
    �
Utilisateur coche "I have read, understood, and agree..."
    �
Bouton "Accept" devient actif
    �
Clic sur "Accept"
    �
Action POST met � jour termsAccepted = true + termsAcceptedAt
    �
Page recharge
    �
Modal ne s'affiche plus (termsAccepted = true)
```

### 2. Si l'utilisateur d�cline ou ferme le modal

```
Utilisateur clique sur "Decline" ou ferme le modal
    �
Redirection vers /app/access-denied
    �
Page "Access Denied" s'affiche
    �
Utilisateur peut cliquer "Return to App & Accept Terms"
    �
Retour � l'app avec modal affich�
```

### 3. Visites suivantes (termsAccepted = true)

```
Utilisateur ouvre l'app
    �
Loader v�rifie termsAccepted dans MySQL
    �
termsAccepted = true
    �
Modal ne s'affiche pas
    �
Utilisateur acc�de normalement � l'app
```

---

## Code d�taill�

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

  // Recharge la page apr�s acceptation r�ussie
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

  // V�rifie si l'utilisateur a accept� les termes
  let appSettings = await prisma.appSettings.findUnique({
    where: { shop },
    select: { termsAccepted: true },
  });

  // Cr�e les settings s'ils n'existent pas
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
    // Met � jour ou cr�e les settings avec acceptation des termes
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

## Base de donn�es

Le syst�me utilise le mod�le `AppSettings` existant dans `prisma/schema.prisma`:

```prisma
model AppSettings {
  id                       String   @id @default(uuid())
  shop                     String   @unique
  termsAccepted            Boolean  @default(false)
  termsAcceptedAt          DateTime?
  // ... autres champs
}
```

### Champs utilis�s

- **`shop`** : Identifiant unique du magasin Shopify
- **`termsAccepted`** : Boolean indiquant si les termes ont �t� accept�s
- **`termsAcceptedAt`** : Date/heure de l'acceptation

---

## Personnalisation

### Modifier les conditions

�ditez `app/components/TermsModal.tsx` et modifiez les `<List.Item>` dans le composant.

### Modifier le comportement de refus

Par d�faut, refuser redirige vers `/app/access-denied`. Vous pouvez changer ce comportement dans la fonction `handleClose()` du TermsModal.

### Ajouter plus de validations

Vous pouvez ajouter des validations suppl�mentaires dans l'action de `app.tsx`, par exemple :
- V�rifier l'IP de l'utilisateur
- Logger l'acceptation dans une table s�par�e
- Envoyer un email de confirmation

---

## Tests

### Tester le flux complet

1. **R�initialiser l'acceptation** (MySQL):
   ```sql
   UPDATE AppSettings SET termsAccepted = false WHERE shop = 'votre-shop.myshopify.com';
   ```

2. **Ouvrir l'app** : Le modal devrait s'afficher

3. **Tester le refus** : Cliquez sur "Decline" � Redirection vers Access Denied

4. **Tester l'acceptation** :
   - Cochez la checkbox
   - Cliquez sur "Accept"
   - La page recharge
   - Le modal ne s'affiche plus

5. **V�rifier la base de donn�es**:
   ```sql
   SELECT termsAccepted, termsAcceptedAt FROM AppSettings WHERE shop = 'votre-shop.myshopify.com';
   ```

---

## S�curit�

-  Les termes sont v�rifi�s c�t� serveur (loader)
-  L'acceptation est enregistr�e c�t� serveur (action)
-  Impossible de bypasser le modal en modifiant le code client
-  Chaque magasin (shop) a son propre �tat d'acceptation

---

## Prochaines am�liorations possibles

1. Ajouter un versioning des termes (termsVersion)
2. Forcer l'acceptation si les termes changent
3. Ajouter un historique des acceptations
4. Permettre de re-consulter les termes depuis les settings
5. Ajouter une option "Print Terms" pour sauvegarder une copie PDF

---

## Support

Pour toute question ou probl�me, contactez l'�quipe de d�veloppement.
