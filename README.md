# Biso Express CRM

Application CRM interne pour Biso Express — gestion centralisée de la base de données clients.

## Stack

- **Framework:** Next.js 15 (App Router, Turbopack)
- **Runtime:** React 19
- **Langage:** TypeScript (strict)
- **Styling:** Tailwind CSS v4 + Shadcn UI
- **Auth:** Firebase Authentication
- **Base de données:** Cloud Firestore
- **Validation:** Zod + React Hook Form
- **Tableaux:** TanStack Table
- **Animations:** Framer Motion
- **Icônes:** Lucide React

## Architecture

Architecture **Feature First** avec séparation stricte entre UI et logique métier.

```
src/
├── app/              # Pages et layouts Next.js (App Router)
├── actions/          # Server Actions
├── components/       # Composants UI réutilisables
├── features/         # Modules métier (clients, dashboard, auth, settings)
├── repositories/     # Accès aux données Firestore
├── services/         # Logique métier
├── schemas/          # Schémas de validation Zod
├── hooks/            # Hooks React
├── lib/              # Fonctions génériques
├── firebase/         # Configuration Firebase
├── types/            # Types TypeScript
├── constants/        # Constantes
├── utils/            # Utilitaires
├── providers/        # React Providers (Auth, etc.)
└── styles/           # Styles globaux
```

**Flux de données:** UI → Server Action → Service → Repository → Firestore

## Installation

```bash
# Cloner le dépôt
git clone <repo-url>

# Installer les dépendances
npm install

# Copier les variables d'environnement
cp .env.example .env.local
# Remplir les clés Firebase dans .env.local
```

## Développement

```bash
npm run dev      # Lancer le serveur de développement (Turbopack)
npm run build    # Build de production
npm run start    # Démarrer en production
npm run lint     # Lint
```

## Variables d'environnement

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Clé API Firebase |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Domaine d'authentification |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | ID du projet Firebase |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Bucket de stockage |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | ID d'envoi de messages |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | ID de l'application |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | ID Analytics |
| `NEXT_PUBLIC_APP_URL` | URL de l'application |

## Fonctionnalités (MVP)

- Authentification (Firebase)
- Dashboard avec statistiques
- CRUD clients
- Recherche instantanée
- Filtres
- Notes clients
- Import/Export CSV
- Paramètres

## Rôles

- **Administrateur** — Accès complet (CRUD, import, export, paramètres)
- **Employé** — Consultation, création, modification, notes

## Licence

Privé — Usage interne Biso Express.
# biso-crm
