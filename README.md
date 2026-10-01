# 🦜 Voyago — Backend NestJS

> API REST du projet **Voyago** — application mobile de planification de voyage gamifiée. Construite avec **NestJS + MongoDB + Claude AI + Stripe**.

[![NestJS](https://img.shields.io/badge/NestJS-10-E0234E?logo=nestjs)](https://nestjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8-47A248?logo=mongodb)](https://www.mongodb.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Anthropic](https://img.shields.io/badge/Claude-Sonnet%204.5-orange)](https://www.anthropic.com/)

---

## 📋 Table des matières

1. [Concept](#-concept)
2. [Stack technique](#-stack-technique)
3. [Architecture](#-architecture)
4. [Installation locale](#-installation-locale)
5. [Variables d'environnement](#-variables-denvironnement)
6. [Endpoints API](#-endpoints-api)
7. [Modules](#-modules)

---

## 💡 Concept

**Voyago** transforme la planification de voyage en jeu :
- 🃏 Swipe Tinder pour choisir tes envies
- 🤖 IA Claude génère un itinéraire personnalisé avec GPS, photos et météo
- 🏆 Gagne des XP, monte de niveau, débloque des badges
- 👥 Partage tes voyages avec la communauté
- 💎 Voyago Pro pour les voyageurs sérieux

---

## 🛠 Stack technique

| Technologie | Usage |
|---|---|
| **NestJS 10** | Framework API REST |
| **MongoDB + Mongoose** | Base de données |
| **@anthropic-ai/sdk** | Génération d'itinéraires IA |
| **Stripe** | Paiements & abonnements Pro |
| **Resend** | Emails transactionnels |
| **bcrypt** | Hashage des mots de passe |
| **Axios** | Appels HTTP externes |

---

## 🏗 Architecture Multi-Tenant

```
src/
├── tenancy/        # Isolation multi-tenant (Middleware, TenancyService, Dynamic DB pool)
├── ai/             # Service IA haute performance (Gemini 2.0/1.5 Flash + Claude + Wikipedia + Open-Meteo)
├── auth/           # Authentification & sessions sécurisées
├── trips/          # Génération d'itinéraires IA & persistance tenant-aware
├── community/      # Feed public & profils communautaires
├── gamification/   # XP, niveaux, badges
├── pro/            # Abonnements Stripe & offres Pro
├── webhooks/       # Webhooks Stripe bruts
├── interests/      # Catalogue d'intérêts & health check
└── common/         # Guards, décorateurs, constantes multi-tenant
```

### Multi-Tenancy
- **Isolation de données** : Résolution du `tenant_id` via header `x-tenant-id`, session token ou query param.
- **Connexions dynamiques** : `TenancyService` instancie et met en cache les pools de connexions MongoDB par tenant.
- **Connexion Globale** (`MONGO_URI_GLOBAL`) : Utilisateurs, Authentification, Catalogue, Badges, Abonnements.
- **Connexion Tenant** (`MONGO_URI_TENANT`) : Voyages, Profils personnalisés, Préférences.

---

## 🚀 Installation locale

### Prérequis
- Node.js 20+
- MongoDB local ou Atlas
- Clés API (Gemini / Anthropic, Resend, Stripe)

### Étapes

```bash
# Cloner le repo
git clone https://github.com/AndyDev77/voyago-v2-backend.git
cd voyago-v2-backend

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env

# Lancer en développement
npm run start:dev

# Lancer en production
npm run build
npm run start:prod
```

Le serveur démarre sur `http://localhost:3333/api`  
Documentation interactive Swagger disponible sur `http://localhost:3333/api/docs`

---

## 🔑 Variables d'environnement (`.env`)

```env
# --- SERVEUR & RÉSEAU ---
PORT=3333
APP_BASE_URL=http://localhost:3333

# --- BASES DE DONNÉES MULTI-TENANT (MongoDB Atlas ou Local) ---
MONGO_URI_GLOBAL=mongodb+srv://<username>:<password>@cluster0.x0soqqd.mongodb.net/voyago_global?retryWrites=true&w=majority
MONGO_URI_TENANT=mongodb+srv://<username>:<password>@cluster0.x0soqqd.mongodb.net/voyago_tenants?retryWrites=true&w=majority
# Fallback local (optionnel) :
# MONGO_URL=mongodb://localhost:27017
# DB_NAME=voyago_db

# --- AUTHENTIFICATION & SÉCURITÉ ---
JWT_SECRET=dev_secret_key_change_in_prod
GOOGLE_CLIENT_ID=placeholder_google_id

# --- MOTEURS IA (Génération d'Itinéraires & POIs) ---
# gemini (défaut, offre gratuite) ou claude (clé API Console payante, sk-ant-api…)
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key

# --- STOCKAGE MÉDIAS (UploadThing) ---
UPLOADTHING_SECRET=your_uploadthing_secret
UPLOADTHING_APP_ID=your_uploadthing_app_id

# --- EMAILS TRANSACTIONNELS (Resend) ---
RESEND_API_KEY=re_your_resend_api_key

# --- PAIEMENTS & ABONNEMENTS (Stripe) ---
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret
```

---

## 📡 Endpoints API

### Publics (sans auth)

| Méthode | Route | Description |
|---|---|---|
| GET | `/api/` | Health check |
| GET | `/api/docs` | Documentation Swagger / OpenAPI |
| GET | `/api/interests` | 10 catégories d'intérêts |
| GET | `/api/badges` | Catalogue des badges |
| GET | `/api/auth/options` | Pays & emojis avatars |
| POST | `/api/auth/email/signup` | Inscription email |
| POST | `/api/auth/email/login` | Connexion email |
| POST | `/api/auth/google/session` | Connexion Google OAuth |
| POST | `/api/auth/forgot-password` | Envoyer code reset |
| POST | `/api/auth/reset-password` | Réinitialiser mot de passe |
| GET | `/api/trips/:user_id` | Voyages d'un utilisateur (tous pour le propriétaire authentifié, publics sinon) |
| GET | `/api/trip/:trip_id` | Détail d'un voyage |
| GET | `/api/profile/:user_id` | Profil utilisateur |
| GET | `/api/pro/tiers` | Offres Pro |
| GET | `/api/community/feed` | Feed public |
| GET | `/api/community/user/:id` | Profil public |
| GET | `/api/xp/rewards` | Système XP |
| POST | `/api/webhooks/stripe` | Webhook Stripe |

### Authentifiés (Bearer token & x-tenant-id)

| Méthode | Route | Description |
|---|---|---|
| GET | `/api/auth/me` | Utilisateur connecté |
| PUT | `/api/auth/me` | Modifier profil |
| POST | `/api/auth/logout` | Déconnexion |
| POST | `/api/trips/generate` | Générer itinéraire IA (Gemini / Claude) |
| POST | `/api/profile/xp` | Attribuer XP |
| POST | `/api/community/trip/:id/like` | Liker / retirer le like d'un voyage public |
| POST | `/api/pro/checkout` | Créer session Stripe |
| GET | `/api/pro/status/:session_id` | Statut paiement |
| GET | `/api/pro/me` | Statut Pro |

---

## 📦 Modules

### Trips — Génération IA
1. Vérifie limite freemium (3 voyages/mois → 402 si dépassé pour les non-pro)
2. Appelle **Gemini 2.0/1.5 Flash** (ou **Claude Sonnet 4.5**) pour générer les POIs avec coordonnées GPS précises
3. Récupère les images **Wikipedia** en parallèle
4. Récupère la **météo Open-Meteo** (16 jours)
5. Attribue **50 XP** et vérifie les badges
6. Sauvegarde en MongoDB avec contexte de partitionnement `tenant_id`

### Gamification
- XP : 50 pts/voyage, 10 pts/premier swipe
- Niveau : `floor(xp / 100) + 1`
- 6 badges : Premier Swipe, Premier Voyage, Globe-trotter, Explorateur, En Feu, Voyago Pro

### Pro (Stripe)
- 3 offres : Mensuel (4.99€), Annuel (39.99€), À vie (79.99€)
- Checkout Stripe → polling statut → activation automatique

---

## 🧪 Test rapide

```bash
# Health check
curl http://localhost:3333/api/

# Swagger documentation
# Ouvrir http://localhost:3333/api/docs dans le navigateur

# Inscription
curl -X POST http://localhost:3333/api/auth/email/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"pass123","name":"Test"}'
```

---

*Voyago — Voyage. Joue. Découvre. 🦜*
