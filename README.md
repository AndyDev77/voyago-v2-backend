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

## 🏗 Architecture

```
src/
├── auth/           # Authentification (email, Google OAuth, guest)
├── trips/          # Génération d'itinéraires avec Claude AI
├── community/      # Feed public & profils utilisateurs
├── gamification/   # XP, niveaux, badges
├── pro/            # Abonnements Stripe
├── webhooks/       # Stripe webhooks
├── interests/      # Catégories d'intérêts & health check
└── common/         # Guards, décorateurs partagés
```

### Authentification

Tokens de session 48 caractères aléatoires stockés en MongoDB (pas JWT).
Header requis : `Authorization: Bearer <token>`

3 providers : `email` | `google` | `guest`

---

## 🚀 Installation locale

### Prérequis
- Node.js 20+
- MongoDB local ou Atlas
- Clés API : Anthropic, Resend, Stripe

### Étapes

```bash
# Cloner le repo
git clone https://github.com/AndyDev77/voyago-v2-backend.git
cd voyago-v2-backend

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos clés

# Lancer en développement
npm run start:dev

# Lancer en production
npm run build
npm run start:prod
```

Le serveur démarre sur `http://localhost:8001`

---

## 🔑 Variables d'environnement

```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=voyago_db

# Anthropic (https://console.anthropic.com)
ANTHROPIC_API_KEY=sk-ant-...

# Resend (https://resend.com)
RESEND_API_KEY=re_...

# Stripe (https://dashboard.stripe.com)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

APP_BASE_URL=http://localhost:8001
PORT=8001
```

---

## 📡 Endpoints API

### Publics (sans auth)

| Méthode | Route | Description |
|---|---|---|
| GET | `/api/` | Health check |
| GET | `/api/interests` | 10 catégories d'intérêts |
| GET | `/api/badges` | Catalogue des badges |
| GET | `/api/auth/options` | Pays & emojis avatars |
| POST | `/api/auth/email/signup` | Inscription email |
| POST | `/api/auth/email/login` | Connexion email |
| POST | `/api/auth/google/session` | Connexion Google OAuth |
| POST | `/api/auth/forgot-password` | Envoyer code reset |
| POST | `/api/auth/reset-password` | Réinitialiser mot de passe |
| GET | `/api/trips/:user_id` | Voyages d'un utilisateur |
| GET | `/api/trip/:trip_id` | Détail d'un voyage |
| GET | `/api/profile/:user_id` | Profil utilisateur |
| GET | `/api/pro/tiers` | Offres Pro |
| GET | `/api/community/feed` | Feed public |
| GET | `/api/community/user/:id` | Profil public |
| GET | `/api/xp/rewards` | Système XP |
| POST | `/api/webhooks/stripe` | Webhook Stripe |

### Authentifiés (Bearer token)

| Méthode | Route | Description |
|---|---|---|
| GET | `/api/auth/me` | Utilisateur connecté |
| PUT | `/api/auth/me` | Modifier profil |
| POST | `/api/auth/logout` | Déconnexion |
| POST | `/api/trips/generate` | Générer itinéraire IA |
| POST | `/api/profile/xp` | Attribuer XP |
| POST | `/api/pro/checkout` | Créer session Stripe |
| GET | `/api/pro/status/:session_id` | Statut paiement |
| GET | `/api/pro/me` | Statut Pro |

---

## 📦 Modules

### Trips — Génération IA
1. Vérifie limite freemium (3 voyages/mois → 402 si dépassé)
2. Appelle **Claude Sonnet 4.5** pour générer les POIs avec coordonnées GPS
3. Récupère les images **Wikipedia** en parallèle
4. Récupère la **météo Open-Meteo** (16 jours)
5. Attribue **50 XP** et vérifie les badges
6. Sauvegarde en MongoDB

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
curl http://localhost:8001/api/

# Inscription
curl -X POST http://localhost:8001/api/auth/email/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"pass123","name":"Test"}'
```

---

*Voyago — Voyage. Joue. Découvre. 🦜*
