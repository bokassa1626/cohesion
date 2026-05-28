# Cohésion fraternelle - Architecture

## Inclus dans cette version

- Frontend React responsive mobile/desktop avec dark mode, dashboard, chat, feed social, événements, finances, RBAC, logs, CRUD et gamification.
- Backend Node/Express sécurisé avec JWT, bcrypt, rate limiting, Helmet, CORS, sessions actives, logs d'activité et Swagger.
- Super Admin créé automatiquement: `bokassantwali@gmail.com` / `20262026`.
- Authentification avec OTP 2FA, vérification email et récupération de mot de passe.
- CRUD archivable/restaurable pour membres, publications, annonces, événements, documents, messages, rôles, permissions, catégories, finances et projets.
- Socket.IO pour événements temps réel: chat, notifications et mises à jour CRUD.
- API IA simulée pour modération, spam, résumé, traduction et suggestions.
- Paiement Mobile Money simulé avec reçu transactionnel.
- QR Code événementiel pour présence.
- Sauvegarde JSON automatique/manuelle dans `data/backups`.

## Production réelle

Cette base est prête à être branchée à Firebase, Firebase Storage, Cloudinary, SMTP, SMS et fournisseurs Mobile Money via les variables `.env.example`.
Sans clés fournisseur réelles, les emails utilisent un transport JSON, les paiements sont simulés et la base utilise `data/db.json`.

## Commandes

```bash
npm run dev:api
npm run dev
npm run dev:full
npm run build
npm start
```

Swagger: `http://127.0.0.1:4000/api/docs`

API health: `http://127.0.0.1:4000/api/health`
