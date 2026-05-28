export const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Cohésion fraternelle API',
    version: '1.0.0',
    description: 'API REST sécurisée pour la plateforme communautaire, sociale et administrative.',
  },
  servers: [{ url: '/api' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/health': { get: { security: [], summary: 'Statut API', responses: { 200: { description: 'OK' } } } },
    '/auth/register': { post: { security: [], summary: 'Inscription membre', responses: { 201: { description: 'Compte créé' } } } },
    '/auth/login': { post: { security: [], summary: 'Connexion JWT + 2FA si activée', responses: { 200: { description: 'Token ou OTP requis' } } } },
    '/auth/verify-otp': { post: { security: [], summary: 'Validation OTP 2FA', responses: { 200: { description: 'Token JWT' } } } },
    '/auth/forgot-password': { post: { security: [], summary: 'Demande OTP mot de passe oublié', responses: { 200: { description: 'OTP envoyé' } } } },
    '/auth/reset-password': { post: { security: [], summary: 'Réinitialisation mot de passe', responses: { 200: { description: 'Mot de passe modifié' } } } },
    '/bootstrap': { get: { summary: 'Données initiales autorisées', responses: { 200: { description: 'Données application' } } } },
    '/dashboard': { get: { summary: 'Statistiques temps réel', responses: { 200: { description: 'KPI et graphiques' } } } },
    '/crud/{resource}': {
      get: { summary: 'Lister une ressource CRUD', responses: { 200: { description: 'Liste' } } },
      post: { summary: 'Créer une ressource CRUD', responses: { 201: { description: 'Créée' } } },
    },
    '/crud/{resource}/{id}': {
      put: { summary: 'Modifier une ressource CRUD', responses: { 200: { description: 'Modifiée' } } },
      delete: { summary: 'Archiver une ressource CRUD', responses: { 200: { description: 'Archivée' } } },
    },
    '/crud/{resource}/{id}/restore': { post: { summary: 'Restaurer une ressource archivée', responses: { 200: { description: 'Restaurée' } } } },
    '/chat/{chatId}/messages': { post: { summary: 'Envoyer un message temps réel', responses: { 201: { description: 'Message envoyé' } } } },
    '/payments/mobile-money': { post: { summary: 'Paiement Mobile Money simulé', responses: { 200: { description: 'Paiement validé' } } } },
    '/ai/assistant': { post: { summary: 'Assistant IA, résumé, traduction, modération', responses: { 200: { description: 'Réponse IA' } } } },
    '/search': { get: { summary: 'Recherche globale intelligente', responses: { 200: { description: 'Résultats' } } } },
    '/backups': { post: { summary: 'Créer une sauvegarde', responses: { 201: { description: 'Sauvegarde créée' } } } },
  },
};
