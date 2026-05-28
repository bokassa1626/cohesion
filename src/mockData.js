// Initial Mock Data for Cohésion Fraternelle

export const INITIAL_ROLES = [
  {
    name: "Super Admin",
    description: "Accès total au système et configuration globale.",
    color: "#D4AF37", // Gold
    permissions: {
      viewDashboard: true,
      manageMembers: true,
      manageRoles: true,
      writePosts: true,
      moderateContent: true,
      viewFinances: true,
      manageEvents: true,
      useAI: true,
      manageBackups: true
    }
  },
  {
    name: "Administrateur",
    description: "Gestion quotidienne de la communauté.",
    color: "#E2E8F0",
    permissions: {
      viewDashboard: true,
      manageMembers: true,
      manageRoles: false,
      writePosts: true,
      moderateContent: true,
      viewFinances: true,
      manageEvents: true,
      useAI: true,
      manageBackups: false
    }
  },
  {
    name: "Modérateur",
    description: "Modération du chat et des publications.",
    color: "#3B82F6", // Royal Blue
    permissions: {
      viewDashboard: true,
      manageMembers: false,
      manageRoles: false,
      writePosts: true,
      moderateContent: true,
      viewFinances: false,
      manageEvents: false,
      useAI: true,
      manageBackups: false
    }
  },
  {
    name: "Responsable",
    description: "Gestion des événements et projets.",
    color: "#10B981", // Emerald Green
    permissions: {
      viewDashboard: true,
      manageMembers: false,
      manageRoles: false,
      writePosts: true,
      moderateContent: false,
      viewFinances: false,
      manageEvents: true,
      useAI: false,
      manageBackups: false
    }
  },
  {
    name: "Membre Premium",
    description: "Membre actif ayant accès aux fonctionnalités de chat avancées et finances.",
    color: "#F59E0B", // Amber
    permissions: {
      viewDashboard: true,
      manageMembers: false,
      manageRoles: false,
      writePosts: true,
      moderateContent: false,
      viewFinances: true,
      manageEvents: false,
      useAI: false,
      manageBackups: false
    }
  },
  {
    name: "Membre Standard",
    description: "Membre standard de l'association.",
    color: "#6B7280", // Gray
    permissions: {
      viewDashboard: false,
      manageMembers: false,
      manageRoles: false,
      writePosts: true,
      moderateContent: false,
      viewFinances: false,
      manageEvents: false,
      useAI: false,
      manageBackups: false
    }
  },
  {
    name: "Invité",
    description: "Accès en lecture seule sur certains canaux publics.",
    color: "#9CA3AF",
    permissions: {
      viewDashboard: false,
      manageMembers: false,
      manageRoles: false,
      writePosts: false,
      moderateContent: false,
      viewFinances: false,
      manageEvents: false,
      useAI: false,
      manageBackups: false
    }
  }
];

export const INITIAL_MEMBERS = [
  {
    id: "m1",
    fullName: "Bokassa Ntwali",
    email: "bokassantwali@gmail.com",
    phone: "+243 897 654 321",
    password: "20262026", // Prefilled password (will be hashed simulated)
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    banner: "linear-gradient(135deg, #0b2f64 0%, #d4af37 100%)",
    profession: "Président de l'Association",
    gender: "Homme",
    address: "Kinshasa, RDC",
    bio: "Fondateur principal de la communauté Cohésion Fraternelle. Dévoué au développement social et à la fraternité active.",
    birthDate: "1980-05-15",
    role: "Super Admin",
    status: "online",
    xp: 2450,
    level: 12,
    badges: ["Fondateur", "Mécène", "Pilier"],
    isBlocked: false,
    mfaEnabled: true,
    joinedAt: "2024-01-01"
  },
  {
    id: "m2",
    fullName: "Aminata Diallo",
    email: "aminata.diallo@gmail.com",
    phone: "+221 77 123 45 67",
    password: "password123",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    banner: "linear-gradient(135deg, #3b82f6 0%, #10b981 100%)",
    profession: "Trésorière / Expert Comptable",
    gender: "Femme",
    address: "Dakar, Sénégal",
    bio: "Spécialiste de la gestion financière. J'aide à organiser nos cotisations et dépenses de façon transparente.",
    birthDate: "1988-09-22",
    role: "Administrateur",
    status: "online",
    xp: 1820,
    level: 9,
    badges: ["Trésorier", "Actif"],
    isBlocked: false,
    mfaEnabled: true,
    joinedAt: "2024-02-15"
  },
  {
    id: "m3",
    fullName: "Marc Dubois",
    email: "marc.dubois@gmail.com",
    phone: "+33 6 98 76 54 32",
    password: "password123",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
    banner: "linear-gradient(135deg, #6b7280 0%, #3b82f6 100%)",
    profession: "Développeur Logiciel",
    gender: "Homme",
    address: "Paris, France",
    bio: "Passionné d'informatique et de solutions collaboratives. Toujours disponible pour coder de nouveaux modules !",
    birthDate: "1995-11-04",
    role: "Membre Premium",
    status: "offline",
    xp: 950,
    level: 5,
    badges: ["Bienfaiteur"],
    isBlocked: false,
    mfaEnabled: false,
    joinedAt: "2024-03-01"
  },
  {
    id: "m4",
    fullName: "Sarah Koné",
    email: "sarah.kone@gmail.com",
    phone: "+225 07 45 67 89 01",
    password: "password123",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150",
    banner: "linear-gradient(135deg, #ec4899 0%, #f59e0b 100%)",
    profession: "Responsable Événementiel",
    gender: "Femme",
    address: "Abidjan, Côte d'Ivoire",
    bio: "Organiser des rassemblements inspirants et conviviaux est ma vocation. Let's make things happen together !",
    birthDate: "1991-07-18",
    role: "Responsable",
    status: "online",
    xp: 1320,
    level: 7,
    badges: ["Organisateur", "Bavard"],
    isBlocked: false,
    mfaEnabled: false,
    joinedAt: "2024-02-01"
  }
];

export const INITIAL_CHATS = [
  {
    id: "c-general",
    name: "Salon #Général",
    isGroup: true,
    avatar: "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=150",
    description: "Canal de discussion principal pour l'ensemble des membres.",
    members: ["m1", "m2", "m3", "m4"],
    messages: [
      {
        id: "msg1",
        senderId: "m1",
        senderName: "Bokassa Ntwali",
        content: "Bienvenue à tous sur la plateforme Cohésion Fraternelle ! 🎉 Mettons en avant nos valeurs communes de solidarité.",
        timestamp: "2026-05-27T10:00:00Z",
        reactions: { "❤️": ["m2", "m3"], "👍": ["m4"] }
      },
      {
        id: "msg2",
        senderId: "m2",
        senderName: "Aminata Diallo",
        content: "Absolument Monsieur le Président. Le module financier et le suivi des cotisations sont désormais en ligne !",
        timestamp: "2026-05-27T10:05:00Z",
        reactions: { "👏": ["m1"] }
      },
      {
        id: "msg3",
        senderId: "m3",
        senderName: "Marc Dubois",
        content: "Super travail d'équipe. Le chat en temps réel est incroyablement fluide.",
        timestamp: "2026-05-27T10:10:00Z"
      }
    ]
  },
  {
    id: "c-projets",
    name: "Groupe #Projets-Sociaux",
    isGroup: true,
    avatar: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=150",
    description: "Planification des œuvres de charité et projets de développement.",
    members: ["m1", "m2", "m4"],
    messages: [
      {
        id: "msg_p1",
        senderId: "m4",
        senderName: "Sarah Koné",
        content: "Bonjour l'équipe ! Nous devons valider le budget du projet d'orphelinat pour le mois prochain.",
        timestamp: "2026-05-27T14:30:00Z"
      },
      {
        id: "msg_p2",
        senderId: "m2",
        senderName: "Aminata Diallo",
        content: "Le rapport d'estimation budgétaire est prêt. Je le partage ci-dessous.",
        timestamp: "2026-05-27T14:32:00Z",
        file: {
          name: "Budget_Orphelinat_Juin_2026.pdf",
          type: "application/pdf",
          size: "480 KB"
        }
      }
    ]
  },
  {
    id: "c-dm-m2",
    name: "Aminata Diallo",
    isGroup: false,
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    members: ["m1", "m2"],
    messages: [
      {
        id: "msg_d1",
        senderId: "m2",
        senderName: "Aminata Diallo",
        content: "Monsieur le Président, j'ai comptabilisé 95% des cotisations mensuelles reçues.",
        timestamp: "2026-05-28T05:30:00Z"
      },
      {
        id: "msg_d2",
        senderId: "m1",
        senderName: "Bokassa Ntwali",
        content: "Excellent travail Aminata ! Le tableau de bord affiche bien ces statistiques en temps réel.",
        timestamp: "2026-05-28T05:35:00Z"
      }
    ]
  }
];

export const INITIAL_POSTS = [
  {
    id: "p1",
    authorId: "m1",
    authorName: "Bokassa Ntwali",
    authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    authorRole: "Super Admin",
    content: "Chers membres de la Cohésion Fraternelle, je suis fier de vous présenter notre nouvelle charte associative. Ensemble, nous bâtissons un réseau solidaire et prospère. Jetez un œil aux nouveaux statuts officiels en pièce jointe.",
    media: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800",
    file: {
      name: "Charte_Association_Cohesion.pdf",
      type: "application/pdf"
    },
    likes: ["m2", "m3", "m4"],
    comments: [
      {
        id: "c1",
        authorName: "Aminata Diallo",
        authorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
        content: "Un document d'une importance capitale ! Bravo pour la rédaction rigoureuse.",
        timestamp: "2026-05-28T02:00:00Z"
      },
      {
        id: "c2",
        authorName: "Marc Dubois",
        authorAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
        content: "Signé et approuvé !",
        timestamp: "2026-05-28T03:15:00Z"
      }
    ],
    timestamp: "2026-05-28T01:30:00Z"
  },
  {
    id: "p2",
    authorId: "m4",
    authorName: "Sarah Koné",
    authorAvatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150",
    authorRole: "Responsable Événementiel",
    content: "Ne manquez pas notre Grand Gala de Solidarité qui aura lieu le 10 Juin prochain à l'hôtel Serena ! Un calendrier interactif est disponible pour réserver vos places directement. Récupérez votre QR Code d'invitation après inscription.",
    media: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800",
    likes: ["m1", "m2"],
    comments: [],
    timestamp: "2026-05-28T04:00:00Z"
  }
];

export const INITIAL_STORIES = [
  {
    id: "s1",
    authorName: "Sarah Koné",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150",
    media: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400",
    type: "photo",
    timestamp: "2s"
  },
  {
    id: "s2",
    authorName: "Bokassa Ntwali",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    media: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400",
    type: "photo",
    timestamp: "1h"
  },
  {
    id: "s3",
    authorName: "Aminata Diallo",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    media: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=400",
    type: "photo",
    timestamp: "4h"
  }
];

export const INITIAL_EVENTS = [
  {
    id: "e1",
    title: "Gala de Solidarité Annuel",
    description: "Notre grand rendez-vous annuel pour lever des fonds et célébrer nos réussites communautaires.",
    date: "2026-06-10",
    time: "19:00",
    location: "Hôtel Serena, Kinshasa",
    category: "Gala",
    organizer: "Sarah Koné",
    participants: ["m1", "m2", "m3"],
    maxParticipants: 100,
    image: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=600"
  },
  {
    id: "e2",
    title: "Assemblée Générale Ordinaire",
    description: "Présentation du rapport financier annuel, vote des résolutions et renouvellement du bureau.",
    date: "2026-06-25",
    time: "14:30",
    location: "Salle des Fêtes Fraternité",
    category: "Réunion Officielle",
    organizer: "Bokassa Ntwali",
    participants: ["m1", "m2"],
    maxParticipants: 50,
    image: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=600"
  }
];

export const INITIAL_FINANCES = {
  stats: {
    totalRecettes: 8750, // in EUR or USD equivalent
    totalDepenses: 3200,
    balance: 5550
  },
  cotisations: [
    { id: "f1", memberId: "m1", memberName: "Bokassa Ntwali", amount: 150, type: "Cotisation Annuelle", date: "2026-05-10", status: "Payé", gateway: "Orange Money" },
    { id: "f2", memberId: "m2", memberName: "Aminata Diallo", amount: 150, type: "Cotisation Annuelle", date: "2026-05-12", status: "Payé", gateway: "Airtel Money" },
    { id: "f3", memberId: "m3", memberName: "Marc Dubois", amount: 150, type: "Cotisation Annuelle", date: "2026-05-15", status: "En Attente", gateway: "" },
    { id: "f4", memberId: "m4", memberName: "Sarah Koné", amount: 150, type: "Cotisation Annuelle", date: "2026-05-18", status: "Payé", gateway: "Carte Bancaire" }
  ],
  depenses: [
    { id: "exp1", label: "Location de salle Assemblée", amount: 800, date: "2026-05-05", category: "Événement", receiver: "Hôtel Serena" },
    { id: "exp2", label: "Impression des brochures", amount: 450, date: "2026-05-08", category: "Administration", receiver: "Imprimerie Nationale" },
    { id: "exp3", label: "Hébergement Cloud Plateforme", amount: 150, date: "2026-05-20", category: "Technique", receiver: "Firebase & Cloud Services" }
  ]
};

export const SECURITY_LOGS = [
  { id: "log1", type: "SUCCESS_LOGIN", email: "bokassantwali@gmail.com", details: "Connexion réussie Super Admin", ip: "197.242.12.89", device: "Chrome / Windows 11", timestamp: "2026-05-28T05:59:00Z" },
  { id: "log2", type: "MFA_VERIFIED", email: "bokassantwali@gmail.com", details: "Validation double facteur réussie", ip: "197.242.12.89", device: "Chrome / Windows 11", timestamp: "2026-05-28T05:59:30Z" },
  { id: "log3", type: "SUCCESS_LOGIN", email: "aminata.diallo@gmail.com", details: "Connexion réussie Administrateur", ip: "41.82.110.14", device: "Safari / iOS 17", timestamp: "2026-05-28T05:10:00Z" },
  { id: "log4", type: "SUSPECT_ATTEMPT", email: "unknown@danger.com", details: "Tentative de connexion suspecte bloquée", ip: "203.0.113.5", device: "Firefox / Linux", timestamp: "2026-05-27T23:14:00Z" }
];
