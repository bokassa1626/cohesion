import { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Shield,
  Users,
  MessageSquare,
  Calendar,
  DollarSign,
  Award,
  TrendingUp,
  LogOut,
  Send,
  Bell,
  Moon,
  Sun,
  Video,
  Phone,
  Share2,
  FileText,
  Plus,
  Sparkles,
  Lock,
  UserPlus,
  Camera,
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  Download,
  AlertTriangle,
  Heart,
  Search,
  Menu,
  Mic,
  PlusCircle,
  FolderOpen,
  UserCheck,
  Check,
  RefreshCw,
  Star,
  Edit3,
  Trash2,
  Settings,
  Upload,
  Paperclip,
  Bookmark
} from 'lucide-react';
import {
  AreaChart,
  Area,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

import {
  INITIAL_ROLES,
  INITIAL_MEMBERS,
  INITIAL_CHATS,
  INITIAL_POSTS,
  INITIAL_STORIES,
  INITIAL_GALLERY,
  INITIAL_EVENTS,
  INITIAL_FINANCES,
  INITIAL_SITE_SETTINGS,
  SECURITY_LOGS
} from './mockData';
import { api, getAuthToken, setAuthToken } from './services/api';
import heroImage from './assets/hero.png';

export default function App() {
  // --- UI & Theme States ---
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('cohesion_theme');
    if (savedTheme) return savedTheme;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  // --- Auth & Security States ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [mfaStep, setMfaStep] = useState('none'); // 'none' | 'otp'
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [securityLogs, setSecurityLogs] = useState(SECURITY_LOGS);
  const [backendStatus, setBackendStatus] = useState('offline');
  
  // SignUp Form States
  const [signUpMode, setSignUpMode] = useState(false);
  const [signUpForm, setSignUpForm] = useState({
    fullName: '', email: '', phone: '', password: '',
    profession: '', gender: 'Homme', address: '', bio: '', birthDate: ''
  });
  const [signUpStep, setSignUpStep] = useState('form'); // 'form' | 'otp'
  const [signUpOtpInput, setSignUpOtpInput] = useState('');
  const [pendingSignUpEmail, setPendingSignUpEmail] = useState('');
  const [pendingSignUpForm, setPendingSignUpForm] = useState(null);

  // --- Database State (Persisted in LocalStorage) ---
  const [roles, setRoles] = useState(INITIAL_ROLES);
  const [members, setMembers] = useState(INITIAL_MEMBERS);
  const [chats, setChats] = useState(INITIAL_CHATS);
  const [activeChatId, setActiveChatId] = useState('c-general');
  const [posts, setPosts] = useState(INITIAL_POSTS);
  const [stories] = useState(INITIAL_STORIES);
  const [galleryPhotos, setGalleryPhotos] = useState(INITIAL_GALLERY);
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [finances, setFinances] = useState(INITIAL_FINANCES);
  const [siteSettings, setSiteSettings] = useState(INITIAL_SITE_SETTINGS);
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'chat' | 'feed' | 'calendar' | 'finance' | 'gamification' | 'members' | 'rbac' | 'security' | 'crud'

  // --- UI Interactive States ---
  const [searchQuery, setSearchQuery] = useState('');
  const [newPostText, setNewPostText] = useState('');
  const [selectedPostFile, setSelectedPostFile] = useState(null);
  const [newCommentTexts, setNewCommentTexts] = useState({}); // postId -> comment
  const [galleryForm, setGalleryForm] = useState({ title: '', description: '', image: '' });
  const [galleryEditId, setGalleryEditId] = useState(null);
  const [galleryCommentTexts, setGalleryCommentTexts] = useState({});
  const [activeStory, setActiveStory] = useState(null);
  const [storyProgress, setStoryProgress] = useState(0);
  const [activeCall, setActiveCall] = useState(null); // { type: 'audio'|'video', memberName, avatar, status: 'ringing'|'connected', selfMuted: false }
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [aiMessages, setAiMessages] = useState([
    { sender: 'bot', text: "Bonjour ! Je suis l'Assistant intelligent de Cohésion Fraternelle. Vous pouvez me poser des questions sur notre communauté, nos valeurs, les cotisations, les événements, les rôles, les règles ou l'histoire du groupe." }
  ]);
  const [aiInput, setAiInput] = useState('');

  // Finances Payment Gateway States
  const [checkoutTransaction, setCheckoutTransaction] = useState(null);
  const [selectedGateway, setSelectedGateway] = useState('orange');
  const [mobileMoneyPhone, setMobileMoneyPhone] = useState('');
  const [payingStep, setPayingStep] = useState('none'); // 'none' | 'gateway' | 'simulating' | 'receipt'
  const [receiptTransaction, setReceiptTransaction] = useState(null);

  // Events & RSVP States
  const [rsvpEvent, setRsvpEvent] = useState(null); // Event selected for RSVP details
  // CRUD Panels & Modal States
  const [crudSelectedTable, setCrudSelectedTable] = useState('members');
  const [crudIsModalOpen, setCrudIsModalOpen] = useState(false);
  const [crudEditObject, setCrudEditObject] = useState(null);
  const [crudFormState, setCrudFormState] = useState({});

  // Chat Actions State
  const [chatInputText, setChatInputText] = useState('');
  const [selectedChatFile, setSelectedChatFile] = useState(null);
  const [isTypingSimulated, setIsTypingSimulated] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({});

  // Toast Notification
  const [toast, setToast] = useState(null);

  // --- Refs ---
  const chatMessagesEndRef = useRef(null);

  // --- Initial Mount Load LocalStorage ---
  useEffect(() => {
    const savedMembers = localStorage.getItem('cohesion_members');
    const savedChats = localStorage.getItem('cohesion_chats');
    const savedPosts = localStorage.getItem('cohesion_posts');
    const savedGallery = localStorage.getItem('cohesion_gallery');
    const savedEvents = localStorage.getItem('cohesion_events');
    const savedFinances = localStorage.getItem('cohesion_finances');
    const savedRoles = localStorage.getItem('cohesion_roles');
    const savedLogs = localStorage.getItem('cohesion_logs');
    const savedSettings = localStorage.getItem('cohesion_site_settings');

    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (savedMembers) setMembers(JSON.parse(savedMembers));
    if (savedChats) setChats(JSON.parse(savedChats));
    if (savedPosts) setPosts(JSON.parse(savedPosts));
    if (savedGallery) setGalleryPhotos(JSON.parse(savedGallery));
    if (savedEvents) setEvents(JSON.parse(savedEvents));
    if (savedFinances) setFinances(JSON.parse(savedFinances));
    if (savedRoles) setRoles(JSON.parse(savedRoles));
    if (savedLogs) setSecurityLogs(JSON.parse(savedLogs));
    if (savedSettings) setSiteSettings({ ...INITIAL_SITE_SETTINGS, ...JSON.parse(savedSettings) });

    api.health()
      .then(async () => {
        setBackendStatus('online');
        if (!getAuthToken()) return null;
        return api.bootstrap();
      })
      .then((data) => {
        if (!data) return;
        if (data.members) setMembers(data.members);
        if (data.chats) setChats(data.chats);
        if (data.posts) setPosts(data.posts);
        if (data.gallery) setGalleryPhotos(data.gallery);
        if (data.events) setEvents(data.events);
        if (data.finances) setFinances(data.finances);
        if (data.roles) setRoles(data.roles);
        if (data.logs) setSecurityLogs(data.logs);
        if (data.settings) setSiteSettings({ ...INITIAL_SITE_SETTINGS, ...data.settings });
      })
      .catch(() => setBackendStatus('offline'));
  }, []);

  useEffect(() => {
    const handleBeforeInstall = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
      setShowInstallBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  useEffect(() => {
    localStorage.setItem('cohesion_theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleGlobalShortcuts = (event) => {
      const isSearchShortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k';
      if (isSearchShortcut && isAuthenticated) {
        event.preventDefault();
        setIsCommandOpen(true);
      }
      if (event.key === 'Escape') {
        setIsCommandOpen(false);
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts);
  }, [isAuthenticated]);

  // --- Helper to save State ---
  const saveState = (key, data, setter) => {
    setter(data);
    localStorage.setItem(key, JSON.stringify(data));
  };

  const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const formatFileSize = (bytes = 0) => `${Math.max(1, Math.round(bytes / 1024))} KB`;

  const getAttachmentKind = (type = '') => {
    if (type.startsWith('image/')) return 'image';
    if (type.startsWith('video/')) return 'video';
    if (type.startsWith('audio/')) return 'audio';
    return 'document';
  };

  const hydrateFromBackend = async () => {
    const data = await api.bootstrap();
    if (data.members) setMembers(data.members);
    if (data.chats) setChats(data.chats);
    if (data.posts) setPosts(data.posts);
    if (data.gallery) setGalleryPhotos(data.gallery);
    if (data.events) setEvents(data.events);
    if (data.finances) setFinances(data.finances);
    if (data.roles) setRoles(data.roles);
    if (data.logs) setSecurityLogs(data.logs);
    if (data.settings) setSiteSettings({ ...INITIAL_SITE_SETTINGS, ...data.settings });
  };

  const syncResource = (resource, id, data) => {
    if (backendStatus !== 'online' || !id) return;
    api.updateResource(resource, id, data).catch(() => {
      showToast("Synchronisation backend reportée.", "error");
    });
  };

  const handleInstallApp = async () => {
    if (!installPrompt) {
      showToast("Installation disponible depuis le menu de votre navigateur.", "gold");
      setShowInstallBanner(false);
      return;
    }
    installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
    setShowInstallBanner(false);
  };

  // --- Toast Trigger ---
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // --- Gamification Points Gain ---
  const gainXp = (amount, reason) => {
    if (!currentUser) return;
    const updatedMembers = members.map(m => {
      if (m.id === currentUser.id) {
        const nextXp = m.xp + amount;
        const nextLevel = Math.floor(nextXp / 500) + 1;
        let leveledUp = false;
        if (nextLevel > m.level) {
          leveledUp = true;
          try {
            confetti({
              particleCount: 150,
              spread: 80,
              origin: { y: 0.6 }
            });
          } catch {
            showToast("Animation de niveau indisponible.", "gold");
          }
        }
        
        const finalMember = {
          ...m,
          xp: nextXp,
          level: nextLevel,
          badges: nextLevel >= 13 ? [...m.badges, "Légende"] : m.badges
        };
        
        if (leveledUp) {
          setTimeout(() => {
            showToast(`Félicitations ! Vous êtes passé au Niveau ${nextLevel} !`, 'gold');
          }, 500);
        } else {
          showToast(`+${amount} XP (${reason})`);
        }
        
        // Also update currentUser context
        setCurrentUser(finalMember);
        return finalMember;
      }
      return m;
    });
    saveState('cohesion_members', updatedMembers, setMembers);
  };

  // --- Story Auto Play Timer ---
  useEffect(() => {
    let timer;
    if (activeStory) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStoryProgress(0);
      timer = setInterval(() => {
        setStoryProgress(prev => {
          if (prev >= 100) {
            setActiveStory(null);
            clearInterval(timer);
            return 0;
          }
          return prev + 2;
        });
      }, 100);
    }
    return () => clearInterval(timer);
  }, [activeStory]);

  // --- Ringing Hangup Timer ---
  useEffect(() => {
    let callTimer;
    if (activeCall && activeCall.status === 'ringing') {
      callTimer = setTimeout(() => {
        setActiveCall(prev => prev ? { ...prev, status: 'connected' } : null);
        showToast("Appel connecté");
      }, 3000);
    }
    return () => clearTimeout(callTimer);
  }, [activeCall]);

  // --- Check Permissions ---
  const hasPermission = (permissionKey) => {
    if (!currentUser) return false;
    const userRoleObj = roles.find(r => r.name === currentUser.role);
    if (!userRoleObj) return false;
    return userRoleObj.permissions[permissionKey] || false;
  };

  // --- Auth Handlers ---
  const handleLogin = async (e) => {
    e.preventDefault();
    if (backendStatus === 'online') {
      try {
        const result = await api.login(loginEmail, loginPassword);
        if (result.requiresOtp) {
          setGeneratedOtp(result.devOtp || '');
          setMfaStep('otp');
          showToast("Code OTP envoyé par email.");
          return;
        }
        setAuthToken(result.token);
        await hydrateFromBackend();
        finalizeLogin(result.user, false);
        return;
      } catch (error) {
        showToast(error.message, "error");
        return;
      }
    }

    const foundUser = members.find(m => m.email.toLowerCase() === loginEmail.toLowerCase());
    
    if (!foundUser || foundUser.password !== loginPassword) {
      const failedLog = {
        id: 'log-' + Date.now(),
        type: 'SUSPECT_ATTEMPT',
        email: loginEmail,
        details: "Échec de connexion : identifiants incorrects",
        ip: "197.242.12.89",
        device: "Chrome / Windows 11",
        timestamp: new Date().toISOString()
      };
      saveState('cohesion_logs', [failedLog, ...securityLogs], setSecurityLogs);
      showToast("Email ou mot de passe incorrect.", "error");
      return;
    }

    if (foundUser.isBlocked) {
      showToast("Votre compte a été suspendu par l'administration.", "error");
      return;
    }

    finalizeLogin(foundUser);
  };

  const verifyOtp = async () => {
    if (backendStatus === 'online') {
      try {
        const result = await api.verifyOtp(loginEmail, otpInput);
        setAuthToken(result.token);
        await hydrateFromBackend();
        finalizeLogin(result.user, false);
      } catch (error) {
        showToast(error.message, "error");
      }
      return;
    }

    if (otpInput === generatedOtp || otpInput === '2026') {
      const foundUser = members.find(m => m.email.toLowerCase() === loginEmail.toLowerCase());
      finalizeLogin(foundUser);
    } else {
      showToast("Code OTP incorrect.", "error");
    }
  };

  const finalizeLogin = (user, shouldGainXp = true) => {
    setCurrentUser(user);
    setProfileForm({ ...user });
    setIsAuthenticated(true);
    setMfaStep('none');
    
    // Add success login security log
    const successLog = {
      id: 'log-' + Date.now(),
      type: 'SUCCESS_LOGIN',
      email: user.email,
      details: `Connexion réussie (${user.role})`,
      ip: "197.242.12.89",
      device: "Chrome / Windows 11",
      timestamp: new Date().toISOString()
    };
    saveState('cohesion_logs', [successLog, ...securityLogs], setSecurityLogs);
    showToast(`Ravi de vous revoir, ${user.fullName} !`);
    
    // Adjust active tab based on dashboard permission
    const userRoleObj = roles.find(r => r.name === user.role);
    if (userRoleObj && !userRoleObj.permissions.viewDashboard) {
      setActiveTab('chat');
    } else {
      setActiveTab('dashboard');
    }
    
    if (shouldGainXp) gainXp(50, "Connexion journalière");
  };

  const handleLogout = () => {
    const logoutLog = {
      id: 'log-' + Date.now(),
      type: 'USER_LOGOUT',
      email: currentUser.email,
      details: "Déconnexion de l'utilisateur",
      ip: "197.242.12.89",
      device: "Chrome / Windows 11",
      timestamp: new Date().toISOString()
    };
    saveState('cohesion_logs', [logoutLog, ...securityLogs], setSecurityLogs);
    if (backendStatus === 'online') {
      api.logout().catch(() => {});
    }
    setAuthToken(null);
    setCurrentUser(null);
    setIsAuthenticated(false);
    showToast("Déconnexion réussie. À bientôt !");
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (backendStatus === 'online') {
      try {
        const result = await api.register(signUpForm);
        saveState('cohesion_members', [...members, result.user], setMembers);
        setPendingSignUpEmail(signUpForm.email);
        setGeneratedOtp(result.devOtp || '');
        setSignUpStep('otp');
        showToast("Code OTP envoyé. Validez votre inscription.");
      } catch (error) {
        showToast(error.message, "error");
      }
      return;
    }

    if (members.some(m => m.email.toLowerCase() === signUpForm.email.toLowerCase())) {
      showToast("Cet email est déjà enregistré.", "error");
      return;
    }

    const newMember = {
      id: 'm-' + Date.now(),
      fullName: signUpForm.fullName,
      email: signUpForm.email,
      phone: signUpForm.phone,
      password: signUpForm.password,
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
      banner: "linear-gradient(135deg, #0b2f64 0%, #1e40af 100%)",
      profession: signUpForm.profession,
      gender: signUpForm.gender,
      address: signUpForm.address,
      bio: signUpForm.bio,
      birthDate: signUpForm.birthDate,
      role: "Membre Standard",
      status: "online",
      xp: 100,
      level: 1,
      badges: ["Nouveau"],
      isBlocked: false,
      mfaEnabled: false,
      joinedAt: new Date().toISOString().split('T')[0]
    };

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setPendingSignUpForm(newMember);
    setPendingSignUpEmail(signUpForm.email);
    setGeneratedOtp(code);
    setSignUpOtpInput('');
    setSignUpStep('otp');
    showToast("Code OTP d'inscription généré.");
  };

  const verifySignUpOtp = async () => {
    if (backendStatus === 'online') {
      try {
        const result = await api.verifyRegistrationOtp(pendingSignUpEmail, signUpOtpInput);
        saveState('cohesion_members', members.map(member => member.id === result.user.id ? result.user : member), setMembers);
        setSignUpMode(false);
        setSignUpStep('form');
        setSignUpOtpInput('');
        setLoginEmail(pendingSignUpEmail);
        setLoginPassword(signUpForm.password);
        showToast(result.message || "Inscription vérifiée. Vous pouvez vous connecter.");
      } catch (error) {
        showToast(error.message, "error");
      }
      return;
    }

    if (signUpOtpInput !== generatedOtp && signUpOtpInput !== '2026') {
      showToast("Code OTP d'inscription incorrect.", "error");
      return;
    }

    if (pendingSignUpForm) {
      saveState('cohesion_members', [...members, pendingSignUpForm], setMembers);
    }
    setSignUpMode(false);
    setSignUpStep('form');
    setSignUpOtpInput('');
    setLoginEmail(pendingSignUpEmail);
    setLoginPassword(pendingSignUpForm?.password || signUpForm.password);
    showToast("Inscription vérifiée ! Vous pouvez vous connecter.");
  };

  const handleProfilePhotoUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setProfileForm(prev => ({ ...prev, avatar: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    const updatedUser = { ...currentUser, ...profileForm };
    const updatedMembers = members.map(member => member.id === currentUser.id ? updatedUser : member);
    saveState('cohesion_members', updatedMembers, setMembers);
    setCurrentUser(updatedUser);
    setProfileForm({ ...updatedUser });
    setIsEditingProfile(false);

    if (backendStatus === 'online') {
      try {
        const result = await api.updateProfile(profileForm);
        setCurrentUser(result.user);
        setProfileForm({ ...result.user });
        saveState('cohesion_members', members.map(member => member.id === result.user.id ? result.user : member), setMembers);
      } catch {
        showToast("Profil enregistré localement, synchronisation différée.", "gold");
        return;
      }
    }
    showToast("Profil mis à jour avec succès.");
  };

  // --- Post / Social Network Handlers ---
  const createPost = (e) => {
    e.preventDefault();
    if (!newPostText.trim()) return;

    const newPostObj = {
      id: 'p-' + Date.now(),
      authorId: currentUser.id,
      authorName: currentUser.fullName,
      authorAvatar: currentUser.avatar,
      authorRole: currentUser.role,
      content: newPostText,
      media: selectedPostFile ? URL.createObjectURL(selectedPostFile) : null,
      likes: [],
      comments: [],
      timestamp: new Date().toISOString()
    };

    // Auto-moderator simulation
    if (newPostText.toLowerCase().includes("spam") || newPostText.toLowerCase().includes("casino") || newPostText.toLowerCase().includes("cryptomoney")) {
      showToast("Publication bloquée par la modération IA (Spam détecté)", "error");
      // Add log
      const spamLog = {
        id: 'log-' + Date.now(),
        type: 'AI_SPAM_DETECT',
        email: currentUser.email,
        details: `Post bloqué : ${newPostText.substring(0, 30)}...`,
        ip: "197.242.12.89",
        device: "Chrome / Windows 11",
        timestamp: new Date().toISOString()
      };
      saveState('cohesion_logs', [spamLog, ...securityLogs], setSecurityLogs);
      return;
    }

    saveState('cohesion_posts', [newPostObj, ...posts], setPosts);
    if (backendStatus === 'online') api.createResource('posts', newPostObj).catch(() => {});
    setNewPostText('');
    setSelectedPostFile(null);
    showToast("Publication mise en ligne !");
    gainXp(100, "Nouvelle publication");
  };

  const handleLikePost = (postId) => {
    const updated = posts.map(p => {
      if (p.id === postId) {
        const alreadyLiked = p.likes.includes(currentUser.id);
        const newLikes = alreadyLiked 
          ? p.likes.filter(id => id !== currentUser.id)
          : [...p.likes, currentUser.id];
        return { ...p, likes: newLikes };
      }
      return p;
    });
    saveState('cohesion_posts', updated, setPosts);
    syncResource('posts', postId, updated.find(p => p.id === postId));
    gainXp(10, "Interaction publication");
  };

  const handleAddComment = (postId) => {
    const commentText = newCommentTexts[postId];
    if (!commentText || !commentText.trim()) return;

    const updated = posts.map(p => {
      if (p.id === postId) {
        const newComment = {
          id: 'c-' + Date.now(),
          authorName: currentUser.fullName,
          authorAvatar: currentUser.avatar,
          content: commentText,
          timestamp: new Date().toISOString()
        };
        return { ...p, comments: [...p.comments, newComment] };
      }
      return p;
    });

    saveState('cohesion_posts', updated, setPosts);
    syncResource('posts', postId, updated.find(p => p.id === postId));
    setNewCommentTexts(prev => ({ ...prev, [postId]: '' }));
    showToast("Commentaire ajouté !");
    gainXp(20, "Nouveau commentaire");
  };

  // --- Gallery Handlers ---
  const canManageGallery = () => currentUser?.role === 'Super Admin' || currentUser?.role === 'Administrateur' || hasPermission('moderateContent');

  const handleGalleryFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const image = await readFileAsDataUrl(file);
    setGalleryForm(prev => ({ ...prev, image }));
  };

  const resetGalleryForm = () => {
    setGalleryForm({ title: '', description: '', image: '' });
    setGalleryEditId(null);
  };

  const handleSaveGalleryPhoto = (event) => {
    event.preventDefault();
    if (!canManageGallery()) {
      showToast("Seuls les administrateurs peuvent gérer la galerie.", "error");
      return;
    }
    if (!galleryForm.title.trim() || !galleryForm.image) {
      showToast("Ajoutez un titre et une photo.", "error");
      return;
    }

    if (galleryEditId) {
      const updated = galleryPhotos.map(photo => (
        photo.id === galleryEditId
          ? { ...photo, ...galleryForm, updatedAt: new Date().toISOString() }
          : photo
      ));
      saveState('cohesion_gallery', updated, setGalleryPhotos);
      syncResource('gallery', galleryEditId, updated.find(photo => photo.id === galleryEditId));
      showToast("Photo de galerie mise à jour.");
      resetGalleryForm();
      return;
    }

    const created = {
      id: 'g-' + Date.now(),
      ...galleryForm,
      authorId: currentUser.id,
      authorName: currentUser.fullName,
      timestamp: new Date().toISOString(),
      likes: [],
      favorites: [],
      comments: []
    };
    saveState('cohesion_gallery', [created, ...galleryPhotos], setGalleryPhotos);
    if (backendStatus === 'online') api.createResource('gallery', created).catch(() => {});
    showToast("Photo ajoutée à la galerie.");
    resetGalleryForm();
    gainXp(80, "Photo ajoutée");
  };

  const handleEditGalleryPhoto = (photo) => {
    setGalleryEditId(photo.id);
    setGalleryForm({
      title: photo.title || '',
      description: photo.description || '',
      image: photo.image || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteGalleryPhoto = (photoId) => {
    if (!canManageGallery()) return;
    if (!window.confirm("Supprimer cette photo de la galerie ?")) return;
    saveState('cohesion_gallery', galleryPhotos.filter(photo => photo.id !== photoId), setGalleryPhotos);
    if (backendStatus === 'online') api.archiveResource('gallery', photoId).catch(() => {});
    showToast("Photo supprimée.");
  };

  const handleToggleGalleryLike = (photoId) => {
    const updated = galleryPhotos.map(photo => {
      if (photo.id !== photoId) return photo;
      const likes = photo.likes || [];
      const nextLikes = likes.includes(currentUser.id)
        ? likes.filter(id => id !== currentUser.id)
        : [...likes, currentUser.id];
      return { ...photo, likes: nextLikes };
    });
    saveState('cohesion_gallery', updated, setGalleryPhotos);
    syncResource('gallery', photoId, updated.find(photo => photo.id === photoId));
  };

  const handleToggleGalleryFavorite = (photoId) => {
    const updated = galleryPhotos.map(photo => {
      if (photo.id !== photoId) return photo;
      const favorites = photo.favorites || [];
      const nextFavorites = favorites.includes(currentUser.id)
        ? favorites.filter(id => id !== currentUser.id)
        : [...favorites, currentUser.id];
      return { ...photo, favorites: nextFavorites };
    });
    saveState('cohesion_gallery', updated, setGalleryPhotos);
    syncResource('gallery', photoId, updated.find(photo => photo.id === photoId));
  };

  const handleAddGalleryComment = (photoId) => {
    const text = galleryCommentTexts[photoId];
    if (!text?.trim()) return;

    const updated = galleryPhotos.map(photo => {
      if (photo.id !== photoId) return photo;
      const nextComment = {
        id: 'gc-' + Date.now(),
        authorName: currentUser.fullName,
        authorAvatar: currentUser.avatar,
        content: text,
        timestamp: new Date().toISOString()
      };
      return { ...photo, comments: [...(photo.comments || []), nextComment] };
    });
    saveState('cohesion_gallery', updated, setGalleryPhotos);
    syncResource('gallery', photoId, updated.find(photo => photo.id === photoId));
    setGalleryCommentTexts(prev => ({ ...prev, [photoId]: '' }));
    gainXp(15, "Commentaire galerie");
  };

  const handleShareGalleryPhoto = async (photo) => {
    const shareText = `${photo.title} - ${siteSettings.groupName}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: photo.title, text: shareText });
      } else {
        await navigator.clipboard.writeText(shareText);
        showToast("Texte de partage copié.");
      }
    } catch {
      showToast("Partage annulé.", "gold");
    }
  };

  const handleDownloadGalleryPhoto = (photo) => {
    if (!siteSettings.allowGalleryDownload) {
      showToast("Le téléchargement est désactivé par l'administration.", "error");
      return;
    }
    const link = document.createElement('a');
    link.href = photo.image;
    link.download = `${photo.title || 'photo-cohesion'}.jpg`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // --- Real-time Chat Handlers ---
  const handleChatFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const url = await readFileAsDataUrl(file);
    setSelectedChatFile({
      name: file.name,
      type: file.type || 'application/octet-stream',
      size: file.size,
      sizeLabel: formatFileSize(file.size),
      url,
      kind: getAttachmentKind(file.type)
    });
    event.target.value = '';
  };

  const sendChatMessage = (e) => {
    e.preventDefault();
    if (!chatInputText.trim() && !selectedChatFile) return;

    const activeChat = chats.find(c => c.id === activeChatId);
    if (!activeChat) return;

    const newMsg = {
      id: 'msg-' + Date.now(),
      senderId: currentUser.id,
      senderName: currentUser.fullName,
      content: chatInputText,
      timestamp: new Date().toISOString(),
      file: selectedChatFile ? {
        name: selectedChatFile.name,
        type: selectedChatFile.type,
        size: selectedChatFile.sizeLabel || formatFileSize(selectedChatFile.size),
        url: selectedChatFile.url,
        kind: selectedChatFile.kind || getAttachmentKind(selectedChatFile.type)
      } : null
    };

    const updatedChats = chats.map(c => {
      if (c.id === activeChatId) {
        return { ...c, messages: [...c.messages, newMsg] };
      }
      return c;
    });

    saveState('cohesion_chats', updatedChats, setChats);
    if (backendStatus === 'online') {
      api.sendMessage(activeChatId, {
        content: chatInputText,
        file: selectedChatFile ? {
          name: selectedChatFile.name,
          type: selectedChatFile.type,
          size: selectedChatFile.sizeLabel || formatFileSize(selectedChatFile.size),
          url: selectedChatFile.url,
          kind: selectedChatFile.kind || getAttachmentKind(selectedChatFile.type)
        } : null
      }).catch(() => {});
    }
    setChatInputText('');
    setSelectedChatFile(null);
    gainXp(15, "Message envoyé");

    // Simulated Active Response from the group/member after 2.5 seconds
    setIsTypingSimulated(true);
    setTimeout(() => {
      setIsTypingSimulated(false);
      const automaticReplies = [
        "C'est un excellent point, merci pour le partage !",
        "Je suis tout à fait d'accord avec cela. Faisons avancer le groupe !",
        "Parfait. Je regarde le dossier de suite.",
        "Merci pour ces précieuses informations !",
        "À quelle heure est fixée notre prochaine rencontre ?",
        "Impressionnant ce niveau de réactivité !"
      ];
      
      const responder = activeChat.isGroup 
        ? members.find(m => m.id !== currentUser.id) 
        : members.find(m => m.fullName === activeChat.name);
      
      const randomReply = automaticReplies[Math.floor(Math.random() * automaticReplies.length)];
      
      const responseMsg = {
        id: 'msg-auto-' + Date.now(),
        senderId: responder ? responder.id : 'm2',
        senderName: responder ? responder.fullName : 'Aminata Diallo',
        content: randomReply,
        timestamp: new Date().toISOString()
      };

      const withResponse = chats.map(c => {
        if (c.id === activeChatId) {
          return { ...c, messages: [...c.messages, responseMsg] };
        }
        return c;
      });
      saveState('cohesion_chats', withResponse, setChats);
    }, 2500);
  };

  useEffect(() => {
    // Scroll chat to bottom
    chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chats, activeChatId, isTypingSimulated]);

  // --- Financial Transaction & Checkout Simulation ---
  const handlePayCotisation = (cotisation) => {
    setCheckoutTransaction(cotisation);
    setPayingStep('gateway');
  };

  const processSimulatedPayment = () => {
    if (!mobileMoneyPhone) {
      showToast("Veuillez saisir votre numéro de téléphone.", "error");
      return;
    }
    
    setPayingStep('simulating');
    
    // Simulate push notification validation window
    setTimeout(() => {
      // Update transaction status
      const updatedCotisations = finances.cotisations.map(c => {
        if (c.id === checkoutTransaction.id) {
          return { ...c, status: 'Payé', date: new Date().toISOString().split('T')[0], gateway: selectedGateway.toUpperCase() };
        }
        return c;
      });

      const updatedFinances = {
        ...finances,
        cotisations: updatedCotisations,
        stats: {
          ...finances.stats,
          totalRecettes: finances.stats.totalRecettes + checkoutTransaction.amount,
          balance: finances.stats.balance + checkoutTransaction.amount
        }
      };

      saveState('cohesion_finances', updatedFinances, setFinances);
      setReceiptTransaction({
        ...checkoutTransaction,
        date: new Date().toISOString().split('T')[0],
        gateway: selectedGateway.toUpperCase(),
        txnId: 'TXN-' + Math.floor(10000000 + Math.random() * 90000000)
      });
      
      setPayingStep('receipt');
      showToast("Paiement validé avec succès ! Reçu financier généré.");
      gainXp(150, "Paiement cotisation");
    }, 4000);
  };

  const downloadReceipt = () => {
    window.print();
  };

  // --- Events RSVP Handlers ---
  const handleEventRsvp = (event) => {
    const updatedEvents = events.map(e => {
      if (e.id === event.id) {
        const isRegistered = e.participants.includes(currentUser.id);
        const nextParticipants = isRegistered 
          ? e.participants.filter(id => id !== currentUser.id)
          : [...e.participants, currentUser.id];
        return { ...e, participants: nextParticipants };
      }
      return e;
    });

    saveState('cohesion_events', updatedEvents, setEvents);
    const registered = !event.participants.includes(currentUser.id);
    if (registered) {
      setRsvpEvent(event);
      showToast("Inscription validée ! Votre QR code d'invitation est prêt.");
      gainXp(80, "Inscription événement");
    } else {
      showToast("Désinscription prise en compte.");
    }
  };

  // Simulate scanning code by marking user present
  const simulateQRScannerPresence = () => {
    showToast("QR Code scanné avec succès ! Présence enregistrée.", "gold");
    gainXp(100, "Présence événement validée par QR");
  };

  // --- Smart AI Assistant Panel Handlers ---
  const sendAiQuery = () => {
    if (!aiInput.trim()) return;

    const userText = aiInput;
    setAiMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setAiInput('');

    setTimeout(() => {
      let botResponse = "Je n'ai pas bien compris votre requête. Pouvez-vous reformuler ?";
      const textLower = userText.toLowerCase();

      if (textLower.includes("qui sommes") || textLower.includes("connaitre") || textLower.includes("connaître") || textLower.includes("cohésion") || textLower.includes("fraternelle") || textLower.includes("groupe")) {
        botResponse = `**${siteSettings.groupName}** : ${siteSettings.about} Notre devise : "${siteSettings.motto}". Vous pouvez me demander nos objectifs, les rôles, les cotisations, les événements, la galerie ou comment contacter l'administration.`;
      } else if (textLower.includes("objectif") || textLower.includes("mission") || textLower.includes("valeur")) {
        botResponse = `**Notre mission** : ${siteSettings.mission} Valeurs principales : ${siteSettings.values}.`;
      } else if (textLower.includes("cotisation") || textLower.includes("payer") || textLower.includes("finance")) {
        botResponse = "Les cotisations permettent de financer les projets, événements et aides communautaires. Dans l'espace Cotisations, chaque membre autorisé peut consulter son statut, payer via Mobile Money simulé ou télécharger son reçu.";
      } else if (textLower.includes("événement") || textLower.includes("evenement") || textLower.includes("agenda")) {
        botResponse = "L'espace Agenda présente les activités de la communauté. Vous pouvez vous inscrire, recevoir des rappels et utiliser un QR Code pour confirmer votre présence.";
      } else if (textLower.includes("galerie") || textLower.includes("photo")) {
        botResponse = "La galerie rassemble les photos importantes du groupe. Les administrateurs peuvent ajouter, modifier ou supprimer des photos; chaque membre peut aimer, commenter, partager, télécharger si autorisé et mettre en favori.";
      } else if (textLower.includes("contact") || textLower.includes("administration")) {
        botResponse = `Vous pouvez contacter l'administration via ${siteSettings.contactEmail}, ${siteSettings.contactPhone}, ou vous rapprocher du bureau à ${siteSettings.location}.`;
      } else if (textLower.includes("résumer") || textLower.includes("budget")) {
        botResponse = "📊 **Résumé Automatique - Budget Orphelinat Juin 2026** :\n\n- **Recettes attendues** : 1 500 € (Cotisations des membres).\n- **Dépenses budgétisées** : 800 € (Achat de fournitures, denrées alimentaires et rénovation de l'espace).\n- **Excédent prévisionnel** : 700 € à reverser dans la caisse de secours.\n- **Statut** : En attente de signature finale par Bokassa Ntwali.";
      } else if (textLower.includes("spam")) {
        botResponse = "🛡️ **Rapport de Sécurité Modération IA** :\n- 0 spam détecté sur le fil d'actualité ce matin.\n- Système de blocage de mots-clés sensible activé.\n- Mots-clés filtrés : crypto, casino, gagner de l'argent facile.";
      } else if (textLower.includes("traduire") || textLower.includes("translate")) {
        botResponse = "📝 **Traduction Assistée** :\n\n*Original (FR)* : 'Bienvenue à tous sur la plateforme Cohésion Fraternelle ! 🎉'\n*Traduit (EN)* : 'Welcome everyone to the Fraternal Cohesion platform! 🎉'";
      } else if (textLower.includes("salut") || textLower.includes("bonjour")) {
        botResponse = "Bonjour ! Comment puis-je assister la communauté Cohésion Fraternelle aujourd'hui ? Je peux résumer des rapports ou valider des contenus suspectés de spam.";
      } else {
        botResponse = "Je reste à votre service pour toute action administrative ou analyse de documents. Choisissez l'un des boutons raccourcis ci-dessous pour lancer une commande IA prédéfinie !";
      }

      setAiMessages(prev => [...prev, { sender: 'bot', text: botResponse }]);
    }, 1500);
  };

  // --- RBAC & Permissions Matrix Toggles ---
  const handlePermissionToggle = (roleName, permissionKey) => {
    const updatedRoles = roles.map(r => {
      if (r.name === roleName) {
        return {
          ...r,
          permissions: {
            ...r.permissions,
            [permissionKey]: !r.permissions[permissionKey]
          }
        };
      }
      return r;
    });
    saveState('cohesion_roles', updatedRoles, setRoles);
    showToast(`Permissions mises à jour pour le rôle ${roleName}`);
  };

  const handleBlockUserToggle = (memberId) => {
    const updatedMembers = members.map(m => {
      if (m.id === memberId) {
        const nextState = !m.isBlocked;
        // Don't block Super Admin
        if (m.role === 'Super Admin') return m;
        return { ...m, isBlocked: nextState };
      }
      return m;
    });
    saveState('cohesion_members', updatedMembers, setMembers);
    const mObj = members.find(m => m.id === memberId);
    showToast(mObj.isBlocked ? "Compte restauré" : "Utilisateur suspendu", "error");
  };

  // --- JSON Backup / Restore Database ---
  const exportDatabase = () => {
    const backupData = {
      members,
      chats,
      posts,
      gallery: galleryPhotos,
      events,
      finances,
      roles,
      logs: securityLogs,
      settings: siteSettings
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Backup_Cohesion_Fraternelle_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast("Sauvegarde Cloud / JSON exportée avec succès !");
  };

  const importDatabase = (e) => {
    const fileReader = new FileReader();
    fileReader.readAsText(e.target.files[0], "UTF-8");
    fileReader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (parsed.members) saveState('cohesion_members', parsed.members, setMembers);
        if (parsed.chats) saveState('cohesion_chats', parsed.chats, setChats);
        if (parsed.posts) saveState('cohesion_posts', parsed.posts, setPosts);
        if (parsed.gallery) saveState('cohesion_gallery', parsed.gallery, setGalleryPhotos);
        if (parsed.events) saveState('cohesion_events', parsed.events, setEvents);
        if (parsed.finances) saveState('cohesion_finances', parsed.finances, setFinances);
        if (parsed.roles) saveState('cohesion_roles', parsed.roles, setRoles);
        if (parsed.logs) saveState('cohesion_logs', parsed.logs, setSecurityLogs);
        if (parsed.settings) saveState('cohesion_site_settings', { ...INITIAL_SITE_SETTINGS, ...parsed.settings }, setSiteSettings);
        showToast("Restauration de la base de données réussie !");
      } catch {
        showToast("Fichier JSON invalide.", "error");
      }
    };
  };

  const canManageSiteSettings = () => currentUser?.role === 'Super Admin' || currentUser?.role === 'Administrateur';

  const handleSaveSiteSettings = async (event) => {
    event.preventDefault();
    if (!canManageSiteSettings()) {
      showToast("Accès réservé à l'administration.", "error");
      return;
    }
    saveState('cohesion_site_settings', siteSettings, setSiteSettings);
    if (backendStatus === 'online') {
      try {
        const result = await api.updateSettings(siteSettings);
        saveState('cohesion_site_settings', { ...INITIAL_SITE_SETTINGS, ...result.settings }, setSiteSettings);
      } catch {
        showToast("Paramètres enregistrés localement, synchronisation différée.", "gold");
        return;
      }
    }
    showToast("Paramètres du site enregistrés.");
  };

  // --- CRUD Operation Actions ---
  const handleOpenCrudModal = (obj = null) => {
    setCrudEditObject(obj);
    if (obj) {
      setCrudFormState({ ...obj });
    } else {
      // Build empty schema based on current model type
      const schemas = {
        members: { fullName: '', email: '', role: 'Membre Standard', profession: '', address: '', xp: 100, level: 1 },
        posts: { authorName: currentUser.fullName, content: '', timestamp: new Date().toISOString() },
        events: { title: '', date: '', time: '', location: '', category: 'Réunion', participants: [] },
        finances: { memberName: '', amount: 0, type: 'Cotisation', date: '', status: 'Payé' }
      };
      setCrudFormState(schemas[crudSelectedTable] || {});
    }
    setCrudIsModalOpen(true);
  };

  const handleSaveCrud = (e) => {
    e.preventDefault();
    if (crudSelectedTable === 'members') {
      if (crudEditObject) {
        const updated = members.map(m => m.id === crudEditObject.id ? { ...m, ...crudFormState } : m);
        saveState('cohesion_members', updated, setMembers);
        showToast("Membre mis à jour");
      } else {
        const newMObj = {
          id: 'm-' + Date.now(),
          avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
          banner: "linear-gradient(135deg, #0b2f64 0%, #1e40af 100%)",
          password: 'password123',
          badges: ["Nouveau"],
          joinedAt: new Date().toISOString().split('T')[0],
          isBlocked: false,
          mfaEnabled: false,
          status: 'offline',
          ...crudFormState
        };
        saveState('cohesion_members', [...members, newMObj], setMembers);
        showToast("Membre créé avec succès");
      }
    } else if (crudSelectedTable === 'posts') {
      if (crudEditObject) {
        const updated = posts.map(p => p.id === crudEditObject.id ? { ...p, ...crudFormState } : p);
        saveState('cohesion_posts', updated, setPosts);
        showToast("Publication mise à jour");
      } else {
        const newP = {
          id: 'p-' + Date.now(),
          authorId: currentUser.id,
          authorAvatar: currentUser.avatar,
          likes: [], comments: [],
          ...crudFormState
        };
        saveState('cohesion_posts', [newP, ...posts], setPosts);
        showToast("Publication créée");
      }
    } else if (crudSelectedTable === 'events') {
      if (crudEditObject) {
        const updated = events.map(ev => ev.id === crudEditObject.id ? { ...ev, ...crudFormState } : ev);
        saveState('cohesion_events', updated, setEvents);
        showToast("Événement mis à jour");
      } else {
        const newEv = {
          id: 'e-' + Date.now(),
          participants: [],
          image: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=600",
          ...crudFormState
        };
        saveState('cohesion_events', [...events, newEv], setEvents);
        showToast("Événement programmé");
      }
    } else if (crudSelectedTable === 'finances') {
      if (crudEditObject) {
        const updatedCotisations = finances.cotisations.map(cot => cot.id === crudEditObject.id ? { ...cot, ...crudFormState } : cot);
        saveState('cohesion_finances', { ...finances, cotisations: updatedCotisations }, setFinances);
        showToast("Cotisation mise à jour");
      } else {
        const newCot = {
          id: 'f-' + Date.now(),
          gateway: 'MANUEL',
          ...crudFormState
        };
        saveState('cohesion_finances', {
          ...finances,
          cotisations: [...finances.cotisations, newCot]
        }, setFinances);
        showToast("Transaction enregistrée");
      }
    }
    setCrudIsModalOpen(false);
    setCrudEditObject(null);
  };

  const handleDeleteCrud = (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet élément ?")) {
      if (crudSelectedTable === 'members') {
        const updated = members.filter(m => m.id !== id);
        saveState('cohesion_members', updated, setMembers);
      } else if (crudSelectedTable === 'posts') {
        const updated = posts.filter(p => p.id !== id);
        saveState('cohesion_posts', updated, setPosts);
      } else if (crudSelectedTable === 'events') {
        const updated = events.filter(e => e.id !== id);
        saveState('cohesion_events', updated, setEvents);
      } else if (crudSelectedTable === 'finances') {
        const updatedCotisations = finances.cotisations.filter(c => c.id !== id);
        saveState('cohesion_finances', { ...finances, cotisations: updatedCotisations }, setFinances);
      }
      showToast("Élément supprimé avec succès");
    }
  };

  // --- Filtering / Search Helper ---
  const filterBySearch = (items, key) => {
    if (!searchQuery) return items;
    return items.filter(item => 
      item[key]?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  // --- Dynamic Color Styles helper ---
  const getRoleBadgeStyle = (roleName) => {
    const roleObj = roles.find(r => r.name === roleName);
    return {
      border: `1.5px solid ${roleObj?.color || '#ccc'}`,
      color: roleObj?.color || '#ccc',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      padding: '2px 8px',
      borderRadius: '999px',
      fontSize: '0.75rem',
      fontWeight: 'bold'
    };
  };

  const getNavigationItems = () => ([
    { id: 'dashboard', label: 'Tableau de bord', icon: TrendingUp, visible: hasPermission('viewDashboard') },
    { id: 'chat', label: 'Messagerie', icon: MessageSquare, visible: true },
    { id: 'feed', label: 'Fil social', icon: Users, visible: true },
    { id: 'gallery', label: 'Galerie', icon: ImageIcon, visible: true },
    { id: 'calendar', label: 'Agenda', icon: Calendar, visible: true },
    { id: 'finance', label: 'Cotisations', icon: DollarSign, visible: hasPermission('viewFinances') },
    { id: 'profile', label: 'Profil', icon: UserPlus, visible: true },
    { id: 'gamification', label: 'Classement', icon: Award, visible: true },
    { id: 'members', label: 'Membres', icon: UserCheck, visible: hasPermission('manageMembers') },
    { id: 'rbac', label: 'Rôles & permissions', icon: Shield, visible: hasPermission('manageRoles') },
    { id: 'crud', label: 'Console admin', icon: FolderOpen, visible: hasPermission('manageBackups') },
    { id: 'settings', label: 'Paramètres', icon: Settings, visible: canManageSiteSettings() },
    { id: 'security', label: 'Sécurité', icon: Lock, visible: currentUser?.role === 'Super Admin' }
  ]).filter(item => item.visible);

  const navigateTo = (tabId) => {
    setActiveTab(tabId);
    setIsCommandOpen(false);
    setMobileMenuOpen(false);
    setCommandQuery('');
  };

  const getGlobalSearchItems = () => {
    const query = commandQuery.trim().toLowerCase();
    const navResults = getNavigationItems().map(item => ({
      id: `nav-${item.id}`,
      label: item.label,
      description: `Ouvrir ${item.label}`,
      type: 'Navigation',
      tab: item.id,
      icon: item.icon
    }));

    const memberResults = members.map(member => ({
      id: `member-${member.id}`,
      label: member.fullName,
      description: `${member.role} · ${member.profession || 'Membre de la communauté'}`,
      type: 'Membre',
      tab: hasPermission('manageMembers') ? 'members' : 'chat',
      icon: UserCheck
    }));

    const eventResults = events.map(event => ({
      id: `event-${event.id}`,
      label: event.title,
      description: `${event.date} · ${event.location}`,
      type: 'Événement',
      tab: 'calendar',
      icon: Calendar,
      event
    }));

    const postResults = posts.map(post => ({
      id: `post-${post.id}`,
      label: post.authorName,
      description: post.content,
      type: 'Publication',
      tab: 'feed',
      icon: FileText
    }));

    const results = [...navResults, ...memberResults, ...eventResults, ...postResults];
    if (!query) return results.slice(0, 8);

    return results
      .filter(item => `${item.label} ${item.description} ${item.type}`.toLowerCase().includes(query))
      .slice(0, 10);
  };

  const handleCommandSelect = (item) => {
    if (item.event) setRsvpEvent(item.event);
    navigateTo(item.tab);
  };

  // --- Rendering UI View ---
  return (
    <div className={`app-container ${isAuthenticated ? 'is-authenticated' : 'is-public'} ${theme === 'dark' ? 'dark-theme' : ''}`}>

      {/* Toast popup */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '80px',
          right: '24px',
          padding: '16px 24px',
          borderRadius: '12px',
          zIndex: 9999,
          color: 'white',
          background: toast.type === 'error' ? '#dc2626' : toast.type === 'gold' ? 'linear-gradient(135deg, #d4af37 0%, #a17c18 100%)' : '#10b981',
          boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          animation: 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          fontWeight: 'bold',
          border: toast.type === 'gold' ? '1.5px solid #ffd700' : 'none'
        }}>
          {toast.type === 'error' ? <AlertTriangle size={20} /> : <CheckCircle size={20} />}
          {toast.message}
        </div>
      )}

      {showInstallBanner && (
        <div className="install-banner">
          <div className="install-banner-copy">
            <img src="/logo-cohesion.jpg" alt="Logo Cohésion Fraternelle" />
            <div>
              <strong>Installer Cohésion Fraternelle</strong>
              <span>Ajoutez l'application sur votre téléphone ou ordinateur pour un accès rapide.</span>
            </div>
          </div>
          <div className="install-banner-actions">
            <button className="btn-install-secondary" onClick={() => setShowInstallBanner(false)}>Plus tard</button>
            <button className="btn-install-primary" onClick={handleInstallApp}>
              <Download size={16} /> Installer
            </button>
          </div>
        </div>
      )}

      {/* HEADER CONTROL BAR */}
      <header className="viewport-header">
        <div className="viewport-logo">
          <img src="/logo-cohesion.jpg" alt="Logo Cohésion Fraternelle JADP Groupe" className="brand-logo" />
          <span>{siteSettings.siteName}</span>
        </div>

        <div className="viewport-actions">
          <span className={`backend-status-pill ${backendStatus}`}>
            <span />
            {backendStatus === 'online' ? 'API active' : 'Mode local'}
          </span>
          {isAuthenticated && (
            <button
              className="global-search-trigger"
              onClick={() => setIsCommandOpen(true)}
              aria-label="Ouvrir la recherche globale"
            >
              <Search size={16} />
              <span>Rechercher</span>
              <kbd>Ctrl K</kbd>
            </button>
          )}
          <button 
            className="btn-theme-toggle"
            onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
            aria-label="Changer de thème"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          {isAuthenticated && (
            <button 
              className="btn-primary" 
              style={{ width: 'auto', padding: '8px 12px' }}
              onClick={handleLogout}
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </header>

      {/* SIDEBAR (Desktop Only) */}
      {isAuthenticated && (
        <aside className="desktop-sidebar">
          <div>
            <div className="flex align-center gap-3">
              <img src={currentUser.avatar} alt="avatar" className="activity-avatar" />
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>{currentUser.fullName}</h4>
                <span style={getRoleBadgeStyle(currentUser.role)}>{currentUser.role}</span>
                <p className="sidebar-status">{currentUser.status || 'online'}</p>
              </div>
            </div>

            <nav className="sidebar-menu">
              {getNavigationItems().map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    type="button"
                    key={item.id}
                    className={`sidebar-link ${activeTab === item.id ? 'active' : ''}`}
                    onClick={() => navigateTo(item.id)}
                  >
                    <Icon size={18} /> {item.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <button
            type="button"
            className="sidebar-link sidebar-logout"
            onClick={handleLogout}
          >
            <LogOut size={18} /> Déconnexion
          </button>
        </aside>
      )}

      {/* MAIN CONTENT AREA */}
      <main className="main-content">
        {!isAuthenticated ? (
          renderPublicPage()
        ) : (
          renderActiveTabContent()
        )}
      </main>

      {/* MOBILE BOTTOM NAV */}
      {isAuthenticated && (
        <nav className="mobile-bottom-nav">
          {getNavigationItems()
            .filter(item => ['dashboard', 'chat', 'feed', 'calendar'].includes(item.id))
            .slice(0, 4)
            .map((item) => {
              const Icon = item.icon;
              return (
                <button
                  type="button"
                  key={item.id}
                  className={`mobile-nav-item ${activeTab === item.id ? 'active' : ''}`}
                  onClick={() => navigateTo(item.id)}
                >
                  <Icon size={20} />
                  {item.id === 'dashboard' ? 'Accueil' : item.label}
                </button>
              );
            })}
          <button
            type="button"
            className={`mobile-nav-item ${mobileMenuOpen ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(prev => !prev)}
          >
            <Menu size={20} />
            Plus
          </button>
        </nav>
      )}

      {isAuthenticated && mobileMenuOpen && (
        <div className="mobile-more-panel">
          {getNavigationItems()
            .filter(item => !['dashboard', 'chat', 'feed', 'calendar'].includes(item.id))
            .map((item) => {
              const Icon = item.icon;
              return (
                <button
                  type="button"
                  key={item.id}
                  className={`mobile-more-item ${activeTab === item.id ? 'active' : ''}`}
                  onClick={() => navigateTo(item.id)}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          <button type="button" className="mobile-more-item danger" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Déconnexion</span>
          </button>
        </div>
      )}

      {isAuthenticated && isCommandOpen && (
        <div className="command-overlay" onMouseDown={() => setIsCommandOpen(false)}>
          <div className="command-panel" onMouseDown={(event) => event.stopPropagation()}>
            <div className="command-input-row">
              <Search size={18} />
              <input
                autoFocus
                value={commandQuery}
                onChange={(event) => setCommandQuery(event.target.value)}
                placeholder="Rechercher une page, un membre, un événement..."
              />
              <button type="button" onClick={() => setIsCommandOpen(false)} aria-label="Fermer">
                <XCircle size={18} />
              </button>
            </div>

            <div className="command-results">
              {getGlobalSearchItems().length > 0 ? (
                getGlobalSearchItems().map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      type="button"
                      key={item.id}
                      className="command-result"
                      onClick={() => handleCommandSelect(item)}
                    >
                      <span className="command-result-icon"><Icon size={17} /></span>
                      <span>
                        <strong>{item.label}</strong>
                        <small>{item.description}</small>
                      </span>
                      <em>{item.type}</em>
                    </button>
                  );
                })
              ) : (
                <div className="command-empty">Aucun résultat trouvé.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FLOATING SMART AI ASSISTANT PANEL */}

      {isAuthenticated && (
        <div className="ai-assistant-wrapper">
          <div className="ai-bubble" onClick={() => setAiPanelOpen(prev => !prev)}>
            <Sparkles size={24} />
          </div>
          
          {aiPanelOpen && (
            <div className="ai-panel">
              <div className="ai-panel-header">
                <div className="flex align-center gap-2">
                  <Sparkles size={18} className="text-gold" />
                  <span style={{ fontWeight: 'bold' }}>Assistant IA du groupe</span>
                </div>
                <button 
                  style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
                  onClick={() => setAiPanelOpen(false)}
                >
                  <XCircle size={18} />
                </button>
              </div>

              <div className="ai-panel-body">
                {aiMessages.map((m, idx) => (
                  <div key={idx} className={`ai-msg ${m.sender}`}>
                    {m.text}
                  </div>
                ))}
              </div>

              {/* Raccourcis IA */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '10px', borderTop: '1px solid var(--border-color)' }}>
                <button 
                  className="badge-item"
                  onClick={() => {
                    setAiInput("Résumer le dernier rapport budgétaire");
                    showToast("Raccourci sélectionné, cliquez sur envoyer.");
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  📝 Résumer budget
                </button>
                <button 
                  className="badge-item" 
                  onClick={() => {
                    setAiInput("Vérifier si le fil d'actualité contient des spams");
                    showToast("Raccourci sélectionné, cliquez sur envoyer.");
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  🛡️ Détecter Spams
                </button>
                <button 
                  className="badge-item"
                  onClick={() => {
                    setAiInput("Traduire la charte de Cohésion en Anglais");
                    showToast("Raccourci sélectionné, cliquez sur envoyer.");
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  🌐 Traduire
                </button>
              </div>

              <div className="ai-panel-footer">
                <input 
                  type="text" 
                  placeholder="Posez une question..." 
                  className="form-control"
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendAiQuery()}
                />
                <button 
                  className="btn-primary" 
                  onClick={sendAiQuery}
                  style={{ width: 'auto', padding: '12px' }}
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* AUDIO / VIDEO CALL SCREEN SIMULATOR */}
      {activeCall && (
        <div className="call-overlay">
          <div className="call-header">
            <h2>Appel en cours...</h2>
            <div className="call-status">{activeCall.status === 'ringing' ? 'Sonnerie...' : 'Connecté'}</div>
          </div>
          
          <div className="call-center">
            {activeCall.type === 'video' && activeCall.status === 'connected' ? (
              <div className="call-stream-mock">
                {/* Caller Screen */}
                <img src={activeCall.avatar} alt="caller" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                {/* User Camera Self View in corner */}
                <div className="call-self-view">
                  <img src={currentUser.avatar} alt="self" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              </div>
            ) : (
              <div className="call-avatar-pulse">
                <img src={activeCall.avatar} alt="caller" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              </div>
            )}
            
            <h3 style={{ marginTop: '24px' }}>{activeCall.memberName}</h3>
          </div>

          <div className="call-controls">
            <button 
              className={`call-btn-ctrl mute ${activeCall.selfMuted ? 'active' : ''}`}
              onClick={() => setActiveCall(prev => prev ? { ...prev, selfMuted: !prev.selfMuted } : null)}
            >
              <Mic size={24} />
            </button>
            
            {activeCall.type === 'video' && (
              <button className="call-btn-ctrl mute">
                <Share2 size={24} />
              </button>
            )}

            <button className="call-btn-ctrl hangup" onClick={() => { setActiveCall(null); showToast("Appel terminé"); }}>
              <Phone size={24} style={{ transform: 'rotate(135deg)' }} />
            </button>
          </div>
        </div>
      )}

      {/* STORIES PLAYBACK OVERLAY */}
      {activeStory && (
        <div className="call-overlay" style={{ background: 'rgba(0,0,0,0.98)', justifyContent: 'center' }}>
          {/* Progress Indicator */}
          <div style={{
            position: 'absolute', top: '24px', left: '24px', right: '24px',
            height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '99px',
            overflow: 'hidden'
          }}>
            <div style={{ height: '100%', width: `${storyProgress}%`, background: 'rgb(var(--accent-rgb))' }}></div>
          </div>

          <div style={{ position: 'absolute', top: '40px', left: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src={activeStory.avatar} alt="avatar" style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid gold' }} />
            <div>
              <h4 style={{ fontWeight: 'bold' }}>{activeStory.authorName}</h4>
              <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>Il y a {activeStory.timestamp}</span>
            </div>
          </div>

          <button 
            style={{ position: 'absolute', top: '40px', right: '24px', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
            onClick={() => setActiveStory(null)}
          >
            <XCircle size={28} />
          </button>

          <img 
            src={activeStory.media} 
            alt="story-large" 
            style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: '16px', border: '2px solid rgba(212, 175, 55, 0.4)' }} 
          />
        </div>
      )}

      {/* MOBILE MONEY GATEWAY INTERACTIVE MODAL */}
      {payingStep !== 'none' && checkoutTransaction && (
        <div className="payment-gateway-modal">
          <div className="payment-gateway-card">
            
            {payingStep === 'gateway' && (
              <div>
                <h3 className="text-gold mb-4" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <DollarSign /> Paiement Mobile & Caisse
                </h3>
                <p className="text-muted mb-4">
                  Régler la cotisation pour <strong>{checkoutTransaction.type}</strong> de <strong>{checkoutTransaction.amount} €</strong>.
                </p>

                <div className="form-group">
                  <label>Mode de Paiement</label>
                  <div 
                    className={`gateway-option ${selectedGateway === 'orange' ? 'selected' : ''}`}
                    onClick={() => setSelectedGateway('orange')}
                  >
                    <span>Orange Money</span>
                    <span style={{ color: '#FF6600', fontWeight: 'bold' }}>Orange</span>
                  </div>
                  <div 
                    className={`gateway-option ${selectedGateway === 'airtel' ? 'selected' : ''}`}
                    onClick={() => setSelectedGateway('airtel')}
                  >
                    <span>Airtel Money</span>
                    <span style={{ color: '#FF0000', fontWeight: 'bold' }}>Airtel</span>
                  </div>
                  <div 
                    className={`gateway-option ${selectedGateway === 'mtn' ? 'selected' : ''}`}
                    onClick={() => setSelectedGateway('mtn')}
                  >
                    <span>MTN Mobile Money</span>
                    <span style={{ color: '#FFCC00', fontWeight: 'bold' }}>MTN</span>
                  </div>
                  <div 
                    className={`gateway-option ${selectedGateway === 'card' ? 'selected' : ''}`}
                    onClick={() => setSelectedGateway('card')}
                  >
                    <span>Carte Bancaire</span>
                    <span>💳 Visa / Mastercard</span>
                  </div>
                </div>

                <div className="form-group">
                  <label>Numéro de Téléphone / Identifiant</label>
                  <input 
                    type="text" 
                    placeholder="+243 ..." 
                    className="form-control" 
                    value={mobileMoneyPhone}
                    onChange={(e) => setMobileMoneyPhone(e.target.value)}
                  />
                </div>

                <div className="flex gap-2 mt-4">
                  <button className="btn-primary" onClick={processSimulatedPayment}>
                    Valider le Paiement ({checkoutTransaction.amount} €)
                  </button>
                  <button 
                    className="btn-primary" 
                    onClick={() => setPayingStep('none')}
                    style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--text-main)', border: '1px solid var(--border-color)', boxShadow: 'none' }}
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}

            {payingStep === 'simulating' && (
              <div className="text-center" style={{ padding: '24px 0' }}>
                <RefreshCw className="text-gold" size={48} style={{ animation: 'spin 2s linear infinite', margin: '0 auto 16px' }} />
                <h3>Validation en cours...</h3>
                <p className="text-muted mt-4" style={{ fontSize: '0.85rem' }}>
                  Une invite Sim Mobile Money a été envoyée sur votre téléphone. Saisissez votre code PIN secret sur votre mobile pour valider la transaction.
                </p>
                <style>{`
                  @keyframes spin { 100% { transform: rotate(360deg); } }
                `}</style>
              </div>
            )}

            {payingStep === 'receipt' && receiptTransaction && (
              <div>
                <div style={{ textAlign: 'center', color: '#10b981', marginBottom: '16px' }}>
                  <CheckCircle size={48} style={{ margin: '0 auto 8px' }} />
                  <h3>Paiement Validé !</h3>
                </div>

                {/* Printable Invoice Card */}
                <div id="print-area" style={{
                  background: 'var(--bg-app)',
                  border: '2px solid rgb(var(--accent-rgb))',
                  borderRadius: '12px',
                  padding: '20px',
                  fontFamily: 'monospace',
                  fontSize: '0.8rem',
                  color: 'black',
                  backgroundColor: 'white'
                }}>
                  <div style={{ textAlign: 'center', borderBottom: '1px dashed #333', paddingBottom: '10px', marginBottom: '10px' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', color: '#0b2f64' }}>COHÉSION FRATERNELLE</h3>
                    <span>Kinshasa, République Démocratique du Congo</span>
                  </div>
                  <div style={{ marginBottom: '8px' }}><strong>Reçu N° :</strong> {receiptTransaction.txnId}</div>
                  <div style={{ marginBottom: '8px' }}><strong>Date :</strong> {receiptTransaction.date}</div>
                  <div style={{ marginBottom: '8px' }}><strong>Membre :</strong> {receiptTransaction.memberName}</div>
                  <div style={{ marginBottom: '8px' }}><strong>Description :</strong> {receiptTransaction.type}</div>
                  <div style={{ marginBottom: '8px' }}><strong>Passerelle :</strong> {receiptTransaction.gateway}</div>
                  <div style={{ fontSize: '1rem', fontWeight: 'bold', borderTop: '1px dashed #333', paddingTop: '10px', marginTop: '10px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>TOTAL :</span>
                    <span>{receiptTransaction.amount} €</span>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <button className="btn-primary" onClick={downloadReceipt}>
                    <Download size={16} /> Imprimer Reçu
                  </button>
                  <button 
                    className="btn-primary" 
                    onClick={() => { setPayingStep('none'); setCheckoutTransaction(null); }}
                    style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--text-main)', border: '1px solid var(--border-color)', boxShadow: 'none' }}
                  >
                    Fermer
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* CRUD ADD/EDIT MODAL OVERLAY */}
      {crudIsModalOpen && (
        <div className="payment-gateway-modal">
          <div className="payment-gateway-card" style={{ maxWidth: '520px' }}>
            <h3 className="text-gold mb-4">
              {crudEditObject ? "Modifier l'enregistrement" : "Ajouter un enregistrement"}
            </h3>

            <form onSubmit={handleSaveCrud}>
              {crudSelectedTable === 'members' && (
                <>
                  <div className="form-group">
                    <label>Nom Complet</label>
                    <input 
                      type="text" required className="form-control" 
                      value={crudFormState.fullName || ''}
                      onChange={(e) => setCrudFormState({ ...crudFormState, fullName: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input 
                      type="email" required className="form-control" 
                      value={crudFormState.email || ''}
                      onChange={(e) => setCrudFormState({ ...crudFormState, email: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Rôle</label>
                    <select 
                      className="form-control"
                      value={crudFormState.role || 'Membre Standard'}
                      onChange={(e) => setCrudFormState({ ...crudFormState, role: e.target.value })}
                    >
                      {roles.map(r => <option key={r.name} value={r.name}>{r.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Profession</label>
                    <input 
                      type="text" className="form-control" 
                      value={crudFormState.profession || ''}
                      onChange={(e) => setCrudFormState({ ...crudFormState, profession: e.target.value })}
                    />
                  </div>
                </>
              )}

              {crudSelectedTable === 'posts' && (
                <>
                  <div className="form-group">
                    <label>Auteur</label>
                    <input 
                      type="text" required className="form-control" 
                      value={crudFormState.authorName || ''}
                      onChange={(e) => setCrudFormState({ ...crudFormState, authorName: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Contenu</label>
                    <textarea 
                      required className="form-control" style={{ minHeight: '80px' }}
                      value={crudFormState.content || ''}
                      onChange={(e) => setCrudFormState({ ...crudFormState, content: e.target.value })}
                    />
                  </div>
                </>
              )}

              {crudSelectedTable === 'events' && (
                <>
                  <div className="form-group">
                    <label>Titre de l'événement</label>
                    <input 
                      type="text" required className="form-control" 
                      value={crudFormState.title || ''}
                      onChange={(e) => setCrudFormState({ ...crudFormState, title: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Date</label>
                    <input 
                      type="date" required className="form-control" 
                      value={crudFormState.date || ''}
                      onChange={(e) => setCrudFormState({ ...crudFormState, date: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Lieu</label>
                    <input 
                      type="text" className="form-control" 
                      value={crudFormState.location || ''}
                      onChange={(e) => setCrudFormState({ ...crudFormState, location: e.target.value })}
                    />
                  </div>
                </>
              )}

              {crudSelectedTable === 'finances' && (
                <>
                  <div className="form-group">
                    <label>Nom du membre</label>
                    <input 
                      type="text" required className="form-control" 
                      value={crudFormState.memberName || ''}
                      onChange={(e) => setCrudFormState({ ...crudFormState, memberName: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Montant (€)</label>
                    <input 
                      type="number" required className="form-control" 
                      value={crudFormState.amount || 0}
                      onChange={(e) => setCrudFormState({ ...crudFormState, amount: parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Type de cotisation</label>
                    <input 
                      type="text" required className="form-control" 
                      value={crudFormState.type || 'Cotisation'}
                      onChange={(e) => setCrudFormState({ ...crudFormState, type: e.target.value })}
                    />
                  </div>
                </>
              )}

              <div className="flex gap-2 mt-4">
                <button type="submit" className="btn-primary">Enregistrer</button>
                <button 
                  type="button" 
                  className="btn-primary" 
                  onClick={() => setCrudIsModalOpen(false)}
                  style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--text-main)', border: '1px solid var(--border-color)', boxShadow: 'none' }}
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );

  // --- SUB-RENDERS ---

  function renderPublicPage() {
    const landingStats = [
      { value: `${members.length}+`, label: 'membres suivis' },
      { value: `${events.length}`, label: 'événements actifs' },
      { value: `${finances.stats.balance} €`, label: 'solde transparent' }
    ];

    const scrollToAccess = () => {
      document.getElementById('public-access')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
      <div className="public-landing">
        <section
          className="landing-hero"
          style={{ backgroundImage: `linear-gradient(90deg, rgba(5, 10, 24, 0.88) 0%, rgba(5, 10, 24, 0.66) 48%, rgba(5, 10, 24, 0.2) 100%), url(${heroImage})` }}
        >
          <div className="landing-hero-content">
            <span className="landing-eyebrow">
              <Shield size={16} />
              Communauté privée, finances claires, décisions mieux suivies
            </span>
            <h1>Cohésion Fraternelle</h1>
            <p>
              Une plateforme moderne pour réunir les membres, organiser les événements,
              suivre les cotisations et sécuriser l'administration de votre association.
            </p>
            <div className="landing-actions">
              <button type="button" className="btn-primary" onClick={scrollToAccess}>
                <Lock size={17} /> Se connecter
              </button>
              <button type="button" className="btn-secondary-landing" onClick={() => { setSignUpMode(true); scrollToAccess(); }}>
                <UserPlus size={17} /> Rejoindre
              </button>
            </div>
          </div>
        </section>

        <section className="landing-overview" aria-label="Points forts de Cohésion Fraternelle">
          {landingStats.map((stat) => (
            <div key={stat.label} className="landing-stat">
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </div>
          ))}
        </section>

        <section id="public-access" className="public-access-section">
          <div className="public-feature-grid">
            <div className="public-feature">
              <MessageSquare size={20} />
              <strong>Messagerie centralisée</strong>
              <span>Salons, fichiers, appels simulés et échanges rapides pour chaque équipe.</span>
            </div>
            <div className="public-feature">
              <DollarSign size={20} />
              <strong>Cotisations maîtrisées</strong>
              <span>Suivi des paiements, reçus, dépenses et caisse commune au même endroit.</span>
            </div>
            <div className="public-feature">
              <Shield size={20} />
              <strong>Administration protégée</strong>
              <span>Rôles, permissions, journaux de sécurité et accès Super Admin principal.</span>
            </div>
          </div>

          {signUpMode ? renderSignUpScreen() : renderLoginScreen()}
        </section>
      </div>
    );
  }

  function renderLoginScreen() {
    return (
        <div className="auth-card card public-auth-card">
          <div className="auth-header">
            <div className="auth-logo">Accès membre</div>
            <p className="auth-subtitle">Connectez-vous à votre espace privé Cohésion Fraternelle.</p>
          </div>

          {mfaStep === 'none' ? (
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label>Adresse Email</label>
                <input 
                  type="email" 
                  required 
                  className="form-control"
                  placeholder="exemple@cohesion.com" 
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Mot de passe</label>
                <input 
                  type="password" 
                  required 
                  className="form-control"
                  placeholder="••••••••" 
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '24px' }}>
                <span className="text-gold cursor-pointer" onClick={() => {
                  const demoCode = "582910";
                  setGeneratedOtp(demoCode);
                  setMfaStep('otp');
                  showToast("Code de récupération envoyé par email.");
                }}>Mot de passe oublié ?</span>
                {siteSettings.allowPublicSignup ? (
                  <span className="text-gold cursor-pointer" onClick={() => setSignUpMode(true)}>Créer un compte</span>
                ) : (
                  <span className="text-muted">Inscription sur invitation</span>
                )}
              </div>

              <button type="submit" className="btn-primary">
                <Lock size={16} /> Se Connecter
              </button>
            </form>
          ) : (
            <div>
              <h3 className="text-gold">🔒 Double Authentification (2FA)</h3>
              <p className="text-muted mt-4" style={{ fontSize: '0.85rem' }}>
                Un code OTP de sécurité a été envoyé sur votre adresse email. Veuillez le saisir pour finaliser votre connexion.
              </p>

              <div className="otp-simulated-notification">
                <Bell size={16} />
                <span>Code de sécurité : <strong>{generatedOtp}</strong></span>
              </div>

              <div className="otp-box">
                <input 
                  type="text" 
                  maxLength={6} 
                  className="form-control" 
                  style={{ width: '180px', letterSpacing: '8px', fontSize: '1.4rem', fontWeight: 'bold', textAlign: 'center' }} 
                  placeholder="000000"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && verifyOtp()}
                />
              </div>

              <button className="btn-primary" onClick={verifyOtp}>
                Valider et Entrer
              </button>

              <button 
                className="btn-primary mt-4" 
                onClick={() => setMfaStep('none')}
                style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--text-main)', border: '1px solid var(--border-color)', boxShadow: 'none' }}
              >
                Retour
              </button>
            </div>
          )}
        </div>
    );
  }

  function renderSignUpScreen() {
    return (
        <div className="auth-card card public-auth-card public-signup-card">
          <div className="auth-header">
            <div className="auth-logo">Rejoindre Cohésion</div>
            <p className="auth-subtitle">
              {signUpStep === 'otp' ? "Validez votre inscription avec le code reçu" : "Créez votre compte en quelques instants"}
            </p>
          </div>

          {signUpStep === 'otp' ? (
            <div>
              <h3 className="text-gold">Double authentification à l'inscription</h3>
              <p className="text-muted mt-4" style={{ fontSize: '0.9rem' }}>
                Un code OTP a été envoyé à {pendingSignUpEmail}. Cette vérification intervient uniquement à la création du compte.
              </p>

              {generatedOtp && (
                <div className="otp-simulated-notification">
                  <Bell size={16} />
                  <span>Code de sécurité : <strong>{generatedOtp}</strong></span>
                </div>
              )}

              <div className="otp-box">
                <input
                  type="text"
                  maxLength={6}
                  className="form-control otp-input"
                  placeholder="000000"
                  value={signUpOtpInput}
                  onChange={(e) => setSignUpOtpInput(e.target.value.replace(/\D/g, ''))}
                  onKeyDown={(e) => e.key === 'Enter' && verifySignUpOtp()}
                />
              </div>

              <button className="btn-primary" onClick={verifySignUpOtp}>
                <CheckCircle size={18} /> Valider l'inscription
              </button>

              <button
                className="btn-primary mt-4"
                onClick={() => setSignUpStep('form')}
                style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--text-main)', border: '1px solid var(--border-color)', boxShadow: 'none' }}
              >
                Retour au formulaire
              </button>
            </div>
          ) : (
          <form onSubmit={handleSignUp}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label>Nom complet</label>
                <input 
                  type="text" required className="form-control" placeholder="Marc Dubois"
                  value={signUpForm.fullName}
                  onChange={(e) => setSignUpForm({ ...signUpForm, fullName: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input 
                  type="email" required className="form-control" placeholder="marc@exemple.com"
                  value={signUpForm.email}
                  onChange={(e) => setSignUpForm({ ...signUpForm, email: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label>Téléphone</label>
                <input 
                  type="text" required className="form-control" placeholder="+33 6 ..."
                  value={signUpForm.phone}
                  onChange={(e) => setSignUpForm({ ...signUpForm, phone: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Mot de passe</label>
                <input 
                  type="password" required className="form-control" placeholder="••••••••"
                  value={signUpForm.password}
                  onChange={(e) => setSignUpForm({ ...signUpForm, password: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label>Profession</label>
                <input 
                  type="text" required className="form-control" placeholder="Médecin, Avocat..."
                  value={signUpForm.profession}
                  onChange={(e) => setSignUpForm({ ...signUpForm, profession: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Sexe</label>
                <select 
                  className="form-control"
                  value={signUpForm.gender}
                  onChange={(e) => setSignUpForm({ ...signUpForm, gender: e.target.value })}
                >
                  <option value="Homme">Homme</option>
                  <option value="Femme">Femme</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Adresse complète</label>
              <input 
                type="text" required className="form-control" placeholder="Abidjan, Côte d'Ivoire"
                value={signUpForm.address}
                onChange={(e) => setSignUpForm({ ...signUpForm, address: e.target.value })}
              />
            </div>

            <button type="submit" className="btn-primary">
              <UserPlus size={16} /> S'inscrire
            </button>

            <div style={{ marginTop: '16px', fontSize: '0.85rem' }}>
              Déjà membre ? <span className="text-gold cursor-pointer" onClick={() => setSignUpMode(false)}>Connectez-vous</span>
            </div>
          </form>
          )}
        </div>
    );
  }

  function renderActiveTabContent() {
    switch (activeTab) {
      case 'profile':
        return renderProfile();
      case 'dashboard':
        return renderDashboard();
      case 'chat':
        return renderChat();
      case 'feed':
        return renderFeed();
      case 'gallery':
        return renderGallery();
      case 'calendar':
        return renderCalendar();
      case 'finance':
        return renderFinance();
      case 'gamification':
        return renderGamification();
      case 'members':
        return renderMembers();
      case 'rbac':
        return renderRbac();
      case 'security':
        return renderSecurityLogs();
      case 'crud':
        return renderCrud();
      case 'settings':
        return renderSiteSettings();
      default:
        return renderDashboard();
    }
  }

  function renderProfile() {
    const statusOptions = ['online', 'occupé', 'absent', 'hors ligne'];
    const completionItems = [
      currentUser.avatar,
      currentUser.phone,
      currentUser.profession,
      currentUser.address,
      currentUser.bio,
      currentUser.birthDate,
    ];
    const completionScore = Math.round((completionItems.filter(Boolean).length / completionItems.length) * 100);
    const nextLevelXp = 500 - (currentUser.xp % 500);

    return (
      <div className="profile-page">
        <div className="profile-topbar">
          <div>
            <h1 className="section-title">
              Mon Profil
              <UserCheck className="text-gold" size={24} />
            </h1>
            <p className="text-muted">Vos informations, votre statut et votre progression dans la communauté.</p>
          </div>
          <button className="btn-primary profile-edit-btn" onClick={() => setIsEditingProfile(prev => !prev)}>
            {isEditingProfile ? <XCircle size={18} /> : <Camera size={18} />}
            {isEditingProfile ? 'Annuler' : 'Modifier'}
          </button>
        </div>

        <div className="profile-hero-modern">
          <div className="profile-banner-modern" style={{ background: profileForm.banner || currentUser.banner }}>
            <img src="/logo-cohesion.jpg" alt="Logo Cohésion Fraternelle" className="profile-brand-watermark" />
          </div>
          <div className="profile-hero-content">
            <div className="profile-avatar-stack">
              <img src={profileForm.avatar || currentUser.avatar} alt="avatar profil" className="profile-large-avatar" />
              {isEditingProfile && (
                <label className="avatar-upload-btn" title="Changer la photo">
                  <Camera size={16} />
                  <input type="file" accept="image/*" onChange={handleProfilePhotoUpload} />
                </label>
              )}
            </div>

            <div className="profile-identity">
              <div className="profile-name-row">
                <h2>{currentUser.fullName}</h2>
                <span style={getRoleBadgeStyle(currentUser.role)}>{currentUser.role}</span>
              </div>
              <p>{currentUser.bio || "Aucune biographie renseignée."}</p>
              <div className="profile-meta-row">
                <div className="profile-status-pill">
                  <span className={`status-dot status-${currentUser.status || 'online'}`}></span>
                  {currentUser.status || 'online'}
                </div>
                <span>{currentUser.profession || 'Profession non renseignée'}</span>
                <span>Membre depuis {currentUser.joinedAt || '-'}</span>
              </div>
            </div>
          </div>
        </div>

        {isEditingProfile ? (
          <form className="profile-edit-panel" onSubmit={handleSaveProfile}>
            <div className="form-group">
              <label>Nom complet</label>
              <input className="form-control" value={profileForm.fullName || ''} onChange={(e) => setProfileForm(prev => ({ ...prev, fullName: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Téléphone</label>
              <input className="form-control" value={profileForm.phone || ''} onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Profession</label>
              <input className="form-control" value={profileForm.profession || ''} onChange={(e) => setProfileForm(prev => ({ ...prev, profession: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Statut</label>
              <select className="form-control" value={profileForm.status || 'online'} onChange={(e) => setProfileForm(prev => ({ ...prev, status: e.target.value }))}>
                {statusOptions.map(status => <option key={status} value={status}>{status}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Adresse</label>
              <input className="form-control" value={profileForm.address || ''} onChange={(e) => setProfileForm(prev => ({ ...prev, address: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Date de naissance</label>
              <input type="date" className="form-control" value={profileForm.birthDate || ''} onChange={(e) => setProfileForm(prev => ({ ...prev, birthDate: e.target.value }))} />
            </div>
            <div className="form-group profile-bio-field">
              <label>Biographie</label>
              <textarea className="form-control" rows="4" value={profileForm.bio || ''} onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}></textarea>
            </div>
            <button className="btn-primary profile-save-btn" type="submit">
              <CheckCircle size={18} /> Enregistrer le profil
            </button>
          </form>
        ) : (
          <div className="profile-modern-grid">
            <section className="profile-panel profile-progress-panel">
              <div className="profile-panel-title">
                <Award size={18} />
                Progression
              </div>
              <div className="profile-level-row">
                <strong>Niveau {currentUser.level}</strong>
                <span>{currentUser.xp} XP</span>
              </div>
              <div className="profile-xp-bar-wrapper">
                <div className="profile-xp-bar" style={{ width: `${(currentUser.xp % 500) / 5}%` }}></div>
              </div>
              <p className="text-muted">Encore {nextLevelXp} XP avant le niveau {currentUser.level + 1}.</p>
              <div className="badges-container">
                {(currentUser.badges || []).map(badge => (
                  <span key={badge} className="badge-item">{badge}</span>
                ))}
              </div>
            </section>

            <section className="profile-panel">
              <div className="profile-panel-title">
                <Shield size={18} />
                Profil complété
              </div>
              <div className="profile-completion">
                <span>{completionScore}%</span>
                <div>
                  <div style={{ width: `${completionScore}%` }}></div>
                </div>
              </div>
              <p className="text-muted">Ajoutez une bio, une adresse et une date de naissance pour enrichir votre fiche membre.</p>
            </section>

            <section className="profile-panel profile-details-panel">
              <div className="profile-panel-title">
                <FileText size={18} />
                Informations
              </div>
              {[
                ['Email', currentUser.email],
                ['Téléphone', currentUser.phone],
                ['Profession', currentUser.profession],
                ['Adresse', currentUser.address],
                ['Naissance', currentUser.birthDate],
              ].map(([label, value]) => (
                <div className="profile-detail-row" key={label}>
                  <span>{label}</span>
                  <strong>{value || '-'}</strong>
                </div>
              ))}
            </section>
          </div>
        )}

        <div className="profile-ai-card">
          <Sparkles className="text-gold" size={24} />
          <div>
            <h3>Questions à notre IA</h3>
            <p className="text-muted">Demandez : "Qui sommes-nous ?", "Quelle est notre mission ?", "Comment payer ma cotisation ?" ou "Comment participer aux événements ?"</p>
          </div>
          <button className="btn-primary" onClick={() => { setAiPanelOpen(true); setAiInput("Qui sommes-nous et quelle est notre mission ?"); }}>
            Poser une question
          </button>
        </div>
      </div>
    );
  }

  // --- ANALYTICS DASHBOARD RENDERING ---
  function renderDashboard() {
    const activeMembersCount = members.filter(m => m.status === 'online').length;
    const pendingCotisations = finances.cotisations.filter(item => item.status !== 'Payé');
    const nextEvent = [...events]
      .filter(event => new Date(`${event.date}T${event.time || '00:00'}`) >= new Date())
      .sort((a, b) => new Date(`${a.date}T${a.time || '00:00'}`) - new Date(`${b.date}T${b.time || '00:00'}`))[0];
    const engagementRate = members.length ? Math.round((activeMembersCount / members.length) * 100) : 0;

    // Charts Data
    const monthlyFinances = [
      { name: 'Mars', Recettes: 1500, Depenses: 800 },
      { name: 'Avr', Recettes: 3000, Depenses: 1200 },
      { name: 'Mai', Recettes: 4250, Depenses: 1050 }
    ];

    return (
      <div className="dashboard-bento">
        <div className="dashboard-header-modern">
          <h1 className="section-title">
            Tableau de Bord
            <Sparkles className="text-gold" size={24} />
          </h1>
          <p className="text-muted">Vue d'ensemble de la communauté Cohésion.</p>
        </div>

        <div className="executive-strip">
          <button className="insight-card" onClick={() => navigateTo('members')}>
            <span className="insight-kicker">Engagement</span>
            <strong>{engagementRate}% actifs</strong>
            <small>{activeMembersCount} membres connectés maintenant</small>
          </button>
          <button className="insight-card warning" onClick={() => navigateTo(hasPermission('viewFinances') ? 'finance' : 'chat')}>
            <span className="insight-kicker">Cotisations</span>
            <strong>{pendingCotisations.length} à relancer</strong>
            <small>{pendingCotisations.map(item => item.memberName).join(', ') || 'Tout est réglé'}</small>
          </button>
          <button className="insight-card" onClick={() => navigateTo('calendar')}>
            <span className="insight-kicker">Prochain rendez-vous</span>
            <strong>{nextEvent?.title || 'Aucun événement'}</strong>
            <small>{nextEvent ? `${nextEvent.date} à ${nextEvent.time} · ${nextEvent.location}` : 'Ajoutez une activité communautaire'}</small>
          </button>
        </div>

        <div className="bento-grid">
          {/* Main Stat Card - Bento Big */}
          <div className="card bento-item bento-stat-main">
            <div className="bento-stat-info">
              <h3>Statut Communauté</h3>
              <div className="bento-main-value">{members.length}</div>
              <p className="text-muted">Membres inscrits au total</p>
            </div>
            <div className="bento-badge-group">
              <span className="badge online">{activeMembersCount} en ligne</span>
              <span className="badge new">+12 ce mois</span>
            </div>
            <Users className="bento-bg-icon" size={120} />
          </div>

          {/* Finance Card - Bento Wide */}
          <div className="card bento-item bento-finance">
            <div className="flex justify-between align-center mb-4">
              <h3>Flux Financier</h3>
              <DollarSign className="text-gold" />
            </div>
            <div style={{ width: '100%', height: '180px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyFinances}>
                  <defs>
                    <linearGradient id="colorRecettesBento" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d4af37" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#d4af37" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                  <Area type="monotone" dataKey="Recettes" stroke="#d4af37" strokeWidth={3} fillOpacity={1} fill="url(#colorRecettesBento)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="bento-finance-footer">
              <div className="finance-mini-stat">
                <span>Solde Total</span>
                <strong>{finances.stats.balance} €</strong>
              </div>
              <div className="finance-mini-stat">
                <span>Dépenses</span>
                <strong style={{ color: '#ef4444' }}>{finances.stats.totalDepenses} €</strong>
              </div>
            </div>
          </div>

          {/* Quick Actions - Bento Tall */}
          <div className="card bento-item bento-actions">
            <h3 className="mb-4">Actions Rapides</h3>
            <div className="bento-action-list">
              <button className="bento-btn" onClick={() => setActiveTab('chat')}>
                <MessageSquare size={20} />
                <span>Nouveau Message</span>
              </button>
              <button className="bento-btn" onClick={() => setActiveTab('feed')}>
                <PlusCircle size={20} />
                <span>Publier Annonce</span>
              </button>
              <button className="bento-btn" onClick={() => setActiveTab('calendar')}>
                <Calendar size={20} />
                <span>Événement</span>
              </button>
              <button className="bento-btn" onClick={exportDatabase}>
                <Download size={20} />
                <span>Backup JSON</span>
              </button>
            </div>
          </div>

          {/* Recent Activity - Bento Bottom Wide */}
          <div className="card bento-item bento-activity">
            <h3 className="mb-4">Dernière Activité</h3>
            <div className="bento-activity-list">
              {posts.slice(0, 2).map((post) => (
                <div key={post.id} className="bento-activity-item">
                  <div className="story-ring active sm">
                    <img src={post.authorAvatar} alt="avatar" className="activity-avatar-mini" />
                  </div>
                  <div className="activity-content-mini">
                    <p><strong>{post.authorName}</strong> a posté :</p>
                    <p className="text-muted truncate">{post.content.substring(0, 60)}...</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- MESSAGERIE TEMP RÉEL RENDERING ---
  function renderChat() {
    const activeChat = chats.find(c => c.id === activeChatId) || chats[0];
    const filteredChats = filterBySearch(chats, 'name');

    return (
      <div className="chat-container-modern">
        <div className="chat-layout-modern">
          {/* Chat Side Menu */}
          <div className="chat-sidebar-modern">
            <div className="chat-sidebar-header">
              <h2 className="chat-title">Discussions</h2>
              <div className="chat-search-modern">
                <input
                  type="text"
                  placeholder="Rechercher..."
                  className="chat-search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="chat-list-modern">
              {filteredChats.map((chat) => (
                <div
                  key={chat.id}
                  className={`chat-item-modern ${chat.id === activeChatId ? 'active' : ''}`}
                  onClick={() => { setActiveChatId(chat.id); setSearchQuery(''); }}
                >
                  <div className="chat-avatar-container">
                    <img src={chat.avatar} alt="avatar" className="chat-list-avatar" />
                    {!chat.isGroup && <div className="online-indicator"></div>}
                  </div>

                  <div className="chat-item-body">
                    <div className="chat-item-top">
                      <span className="chat-item-name">{chat.name}</span>
                      <span className="chat-item-time">12:30</span>
                    </div>
                    <div className="chat-item-preview">
                      {chat.messages[chat.messages.length - 1]?.content || 'Aucun message'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Messaging Window */}
          {activeChat && (
            <div className="chat-window-modern">
              <div className="chat-header-modern">
                <div className="chat-user-header">
                  <img src={activeChat.avatar} alt="avatar" className="chat-header-avatar" />
                  <div className="chat-header-info">
                    <h4 className="chat-header-name">{activeChat.name}</h4>
                    <span className="chat-header-status">
                      {activeChat.isGroup ? `${activeChat.members.length} membres` : "En ligne"}
                    </span>
                  </div>
                </div>

                <div className="chat-header-actions">
                  <button className="chat-icon-btn" onClick={() => setActiveCall({ type: 'audio', memberName: activeChat.name, avatar: activeChat.avatar, status: 'ringing' })}>
                    <Phone size={20} />
                  </button>
                  <button className="chat-icon-btn" onClick={() => setActiveCall({ type: 'video', memberName: activeChat.name, avatar: activeChat.avatar, status: 'ringing' })}>
                    <Video size={20} />
                  </button>
                  <button className="chat-icon-btn"><PlusCircle size={20} /></button>
                </div>
              </div>

              {/* Message List */}
              <div className="chat-messages-modern">
                {activeChat.messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`message-row ${msg.senderId === currentUser.id ? 'sent' : 'received'}`}
                  >
                    <div className="message-bubble-modern">
                      {activeChat.isGroup && msg.senderId !== currentUser.id && (
                        <div className="message-sender-name">{msg.senderName}</div>
                      )}

                      <div className="message-text">{msg.content}</div>

                      {msg.file && (
                        <div className="message-file-attachment">
                          {msg.file.kind === 'image' && msg.file.url ? (
                            <img src={msg.file.url} alt={msg.file.name} className="message-media-preview" />
                          ) : msg.file.kind === 'video' && msg.file.url ? (
                            <video src={msg.file.url} controls className="message-media-preview" />
                          ) : msg.file.kind === 'audio' && msg.file.url ? (
                            <div className="message-audio-preview">
                              <Mic size={18} />
                              <audio src={msg.file.url} controls />
                            </div>
                          ) : (
                            <>
                              <FileText size={20} />
                              <div className="file-info">
                                <div className="file-name">{msg.file.name}</div>
                                <span className="file-size">{msg.file.size}</span>
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      <div className="message-meta-modern">
                        <span>12:35</span>
                        {msg.senderId === currentUser.id && <Check size={14} className="check-icon" />}
                      </div>
                    </div>
                  </div>
                ))}

                {isTypingSimulated && (
                  <div className="message-row received">
                    <div className="message-bubble-modern typing">
                      <span className="typing-dot"></span>
                      <span className="typing-dot"></span>
                      <span className="typing-dot"></span>
                    </div>
                  </div>
                )}

                <div ref={chatMessagesEndRef} />
              </div>

              {/* Chat Input Footer */}
              <form onSubmit={sendChatMessage} className="chat-footer-modern">
                <label className="chat-input-btn" title="Joindre photo, document, audio ou vidéo">
                  <Paperclip size={22} />
                  <input
                    type="file"
                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                    onChange={handleChatFileSelect}
                  />
                </label>

                <div className="chat-input-container">
                  {selectedChatFile && (
                    <div className="chat-file-chip">
                      <span>{selectedChatFile.kind === 'image' ? 'Photo' : selectedChatFile.kind === 'video' ? 'Vidéo' : selectedChatFile.kind === 'audio' ? 'Audio' : 'Document'} · {selectedChatFile.name}</span>
                      <button type="button" onClick={() => setSelectedChatFile(null)}><XCircle size={14} /></button>
                    </div>
                  )}

                  <input 
                    type="text" 
                    placeholder="Message..." 
                    className="chat-text-input"
                    value={chatInputText}
                    onChange={(e) => setChatInputText(e.target.value)}
                  />
                </div>

                <button type="submit" className="chat-send-btn">
                  <Send size={20} />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    );
  }
  // --- SOCIAL FEED & STORIES RENDERING ---
  function renderFeed() {
    return (
      <div className="feed-layout">
        <div className="feed-header-section">
          <h1 className="section-title">
            Communauté
            <Users className="text-gold" size={24} />
          </h1>
          <p className="text-muted">Partagez vos moments et histoires avec la fraternité.</p>
        </div>

        {/* IG-STYLE STORIES SECTION */}
        <div className="stories-container">
          <div className="stories-carousel">
            {/* Create new story placeholder */}
            <div className="story-item" onClick={() => showToast("Veuillez sélectionner une photo pour votre story !")}>
              <div className="story-ring empty">
                <div className="story-avatar-wrapper">
                  <PlusCircle size={24} className="text-gold" />
                </div>
              </div>
              <div className="story-label">Ma Story</div>
            </div>
            
            {stories.map((story) => (
              <div key={story.id} className="story-item" onClick={() => setActiveStory(story)}>
                <div className="story-ring active">
                  <div className="story-avatar-wrapper">
                    <img src={story.avatar} alt="author" className="story-img" />
                  </div>
                </div>
                <div className="story-label">{story.authorName.split(' ')[0]}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="feed-main-grid">
          <div className="feed-posts-column">
            {/* POST CREATOR BOX */}
            {hasPermission('writePosts') && (
              <div className="card post-creator-card">
                <form onSubmit={createPost} className="post-creator-form">
                  <img src={currentUser.avatar} alt="avatar" className="post-avatar-mini" />
                  <div className="post-input-wrapper">
                    <textarea 
                      placeholder="Quoi de neuf aujourd'hui ?" 
                      className="post-textarea-modern"
                      value={newPostText}
                      onChange={(e) => setNewPostText(e.target.value)}
                    />
                    <div className="post-creator-footer">
                      <label className="post-media-btn">
                        <Camera size={20} />
                        <span>Média</span>
                        <input 
                          type="file" accept="image/*,video/*" 
                          style={{ display: 'none' }}
                          onChange={(e) => setSelectedPostFile(e.target.files[0])}
                        />
                      </label>
                      <button type="submit" className="btn-primary-sm">Publier</button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* POSTS LIST (IG-Style) */}
            <div className="posts-list-modern">
              {posts.map((post) => (
                <div key={post.id} className="card post-card-modern">
                  <div className="post-header-modern">
                    <div className="post-author-modern">
                      <div className="story-ring active sm">
                        <img src={post.authorAvatar} alt="avatar" className="post-avatar-sm" />
                      </div>
                      <div className="post-meta-modern">
                        <span className="post-author-name">{post.authorName}</span>
                        <span className="post-time-meta">Il y a quelques heures</span>
                      </div>
                    </div>
                    <button className="post-more-btn"><Share2 size={18} /></button>
                  </div>

                  {post.media && (
                    <div className="post-media-modern">
                      <img src={post.media} alt="media" onDoubleClick={() => handleLikePost(post.id)} />
                    </div>
                  )}

                  <div className="post-content-modern">
                    {post.content && (
                      <div className="post-text-content">
                        <strong>{post.authorName}</strong> {post.content}
                      </div>
                    )}
                  </div>

                  <div className="post-actions-modern">
                    <div className="actions-left">
                      <button 
                        className={`action-btn-modern ${post.likes.includes(currentUser.id) ? 'liked' : ''}`}
                        onClick={() => handleLikePost(post.id)}
                      >
                        <Heart size={24} fill={post.likes.includes(currentUser.id) ? '#ef4444' : 'none'} stroke={post.likes.includes(currentUser.id) ? '#ef4444' : 'currentColor'} />
                      </button>
                      <button className="action-btn-modern"><MessageSquare size={24} /></button>
                      <button className="action-btn-modern"><Send size={24} /></button>
                    </div>
                    <span className="likes-count-modern">{post.likes.length} J'aime</span>
                  </div>

                  {/* COMMENTS SECTION */}
                  <div className="post-comments-section" style={{ padding: '0 16px 16px 16px' }}>
                    {post.comments.length > 0 && (
                      <div className="comments-list" style={{ marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
                        {post.comments.map((comm) => (
                          <div key={comm.id} className="comment-item" style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                            <img src={comm.authorAvatar} alt="avatar" style={{ width: '28px', height: '28px', borderRadius: '50%' }} />
                            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '12px', flex: 1 }}>
                              <span style={{ fontWeight: 'bold', fontSize: '12px', display: 'block' }}>{comm.authorName}</span>
                              <p style={{ marginTop: '2px', fontSize: '13px', margin: 0 }}>{comm.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Comment Form */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                      <input 
                        type="text" 
                        placeholder="Écrire un commentaire..." 
                        style={{ 
                          flex: 1, 
                          background: 'rgba(255,255,255,0.05)', 
                          border: '1px solid rgba(255,255,255,0.1)', 
                          borderRadius: '20px', 
                          padding: '8px 16px', 
                          color: 'white',
                          fontSize: '13px'
                        }}
                        value={newCommentTexts[post.id] || ''}
                        onChange={(e) => setNewCommentTexts({ ...newCommentTexts, [post.id]: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                      />
                      <button 
                        className="btn-primary" 
                        style={{ width: 'auto', padding: '8px 12px', borderRadius: '20px' }}
                        onClick={() => handleAddComment(post.id)}
                      >
                        <Send size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SIDEBAR WIDGETS (Suggessions) */}
          <div className="feed-sidebar-widgets">
            <div className="card suggestion-card">
              <h4 className="widget-title">Suggestions</h4>
              <div className="suggestion-list">
                {members.slice(0, 4).map(m => (
                  <div key={m.id} className="suggestion-item">
                    <img src={m.avatar} alt="avatar" className="suggestion-avatar" />
                    <div className="suggestion-info">
                      <span className="suggestion-name">{m.fullName}</span>
                      <span className="suggestion-reason">Nouveau membre</span>
                    </div>
                    <button className="follow-btn">Suivre</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- MODERN GROUP GALLERY ---
  function renderGallery() {
    const favoriteCount = galleryPhotos.filter(photo => (photo.favorites || []).includes(currentUser.id)).length;
    const totalLikes = galleryPhotos.reduce((sum, photo) => sum + (photo.likes?.length || 0), 0);

    return (
      <div className="gallery-page">
        <div className="gallery-hero">
          <div>
            <span className="insight-kicker">Souvenirs du groupe</span>
            <h1>Galerie Cohésion</h1>
            <p>{siteSettings.motto}</p>
          </div>
          <div className="gallery-stats">
            <div>
              <strong>{galleryPhotos.length}</strong>
              <span>Photos</span>
            </div>
            <div>
              <strong>{totalLikes}</strong>
              <span>J'aime</span>
            </div>
            <div>
              <strong>{favoriteCount}</strong>
              <span>Favoris</span>
            </div>
          </div>
        </div>

        {canManageGallery() && (
          <form className="gallery-admin-panel" onSubmit={handleSaveGalleryPhoto}>
            <div>
              <h2>{galleryEditId ? 'Modifier une photo' : 'Ajouter une photo'}</h2>
              <p className="text-muted">Les admins peuvent enrichir, corriger ou retirer les photos du groupe.</p>
            </div>
            <div className="gallery-admin-grid">
              <div className="form-group">
                <label>Titre</label>
                <input
                  className="form-control"
                  value={galleryForm.title}
                  onChange={(e) => setGalleryForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ex: Rencontre mensuelle"
                />
              </div>
              <div className="form-group">
                <label>Photo</label>
                <label className="gallery-upload-drop">
                  <Upload size={18} />
                  <span>{galleryForm.image ? 'Changer la photo' : 'Importer une photo'}</span>
                  <input type="file" accept="image/*" onChange={handleGalleryFileChange} />
                </label>
              </div>
              <div className="form-group gallery-description-field">
                <label>Description</label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={galleryForm.description}
                  onChange={(e) => setGalleryForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Ajoutez le contexte de ce moment..."
                />
              </div>
              {galleryForm.image && (
                <img src={galleryForm.image} alt="Prévisualisation galerie" className="gallery-form-preview" />
              )}
            </div>
            <div className="gallery-admin-actions">
              <button type="submit" className="btn-primary">
                <CheckCircle size={18} /> {galleryEditId ? 'Enregistrer' : 'Publier'}
              </button>
              {galleryEditId && (
                <button type="button" className="btn-quiet" onClick={resetGalleryForm}>
                  Annuler
                </button>
              )}
            </div>
          </form>
        )}

        <div className="gallery-grid">
          {galleryPhotos.map((photo) => {
            const liked = (photo.likes || []).includes(currentUser.id);
            const favorited = (photo.favorites || []).includes(currentUser.id);
            return (
              <article key={photo.id} className="gallery-card">
                <div className="gallery-image-wrap">
                  <img src={photo.image} alt={photo.title} className="gallery-image" />
                  {favorited && (
                    <span className="gallery-favorite-badge">
                      <Star size={14} fill="currentColor" /> Favori
                    </span>
                  )}
                </div>
                <div className="gallery-card-body">
                  <div className="gallery-card-title-row">
                    <div>
                      <h3>{photo.title}</h3>
                      <span>Par {photo.authorName}</span>
                    </div>
                    {canManageGallery() && (
                      <div className="gallery-admin-tools">
                        <button type="button" title="Modifier" onClick={() => handleEditGalleryPhoto(photo)}>
                          <Edit3 size={16} />
                        </button>
                        <button type="button" title="Supprimer" onClick={() => handleDeleteGalleryPhoto(photo.id)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                  <p>{photo.description}</p>

                  <div className="gallery-actions">
                    <button type="button" className={liked ? 'active' : ''} onClick={() => handleToggleGalleryLike(photo.id)} title="Aimer">
                      <Heart size={18} fill={liked ? 'currentColor' : 'none'} /> {photo.likes?.length || 0}
                    </button>
                    <button type="button" className={favorited ? 'active' : ''} onClick={() => handleToggleGalleryFavorite(photo.id)} title="Mettre en favori">
                      <Bookmark size={18} fill={favorited ? 'currentColor' : 'none'} />
                    </button>
                    <button type="button" onClick={() => handleShareGalleryPhoto(photo)} title="Partager">
                      <Share2 size={18} />
                    </button>
                    <button type="button" onClick={() => handleDownloadGalleryPhoto(photo)} title="Télécharger">
                      <Download size={18} />
                    </button>
                  </div>

                  <div className="gallery-comments">
                    {(photo.comments || []).slice(-2).map(comment => (
                      <div key={comment.id} className="gallery-comment">
                        <img src={comment.authorAvatar} alt="" />
                        <div>
                          <strong>{comment.authorName}</strong>
                          <span>{comment.content}</span>
                        </div>
                      </div>
                    ))}
                    <div className="gallery-comment-form">
                      <input
                        value={galleryCommentTexts[photo.id] || ''}
                        onChange={(e) => setGalleryCommentTexts(prev => ({ ...prev, [photo.id]: e.target.value }))}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddGalleryComment(photo.id)}
                        placeholder="Commenter..."
                      />
                      <button type="button" onClick={() => handleAddGalleryComment(photo.id)}>
                        <Send size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    );
  }

  function renderSiteSettings() {
    if (!canManageSiteSettings()) {
      return <div className="card text-center">Accès réservé à l'administration.</div>;
    }

    return (
      <form className="settings-page" onSubmit={handleSaveSiteSettings}>
        <div>
          <h1 className="section-title">
            Paramètres du site
            <Settings className="text-gold" size={24} />
          </h1>
          <p className="text-muted">Ces informations alimentent l'identité du site et les réponses de l'assistant IA.</p>
        </div>

        <section className="settings-grid">
          <div className="card settings-panel">
            <h3>Identité</h3>
            <div className="form-group">
              <label>Nom du site</label>
              <input className="form-control" value={siteSettings.siteName} onChange={(e) => setSiteSettings(prev => ({ ...prev, siteName: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Nom officiel du groupe</label>
              <input className="form-control" value={siteSettings.groupName} onChange={(e) => setSiteSettings(prev => ({ ...prev, groupName: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Devise</label>
              <input className="form-control" value={siteSettings.motto} onChange={(e) => setSiteSettings(prev => ({ ...prev, motto: e.target.value }))} />
            </div>
          </div>

          <div className="card settings-panel">
            <h3>Informations du groupe</h3>
            <div className="form-group">
              <label>Présentation</label>
              <textarea className="form-control" rows="4" value={siteSettings.about} onChange={(e) => setSiteSettings(prev => ({ ...prev, about: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Mission</label>
              <textarea className="form-control" rows="3" value={siteSettings.mission} onChange={(e) => setSiteSettings(prev => ({ ...prev, mission: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Valeurs</label>
              <input className="form-control" value={siteSettings.values} onChange={(e) => setSiteSettings(prev => ({ ...prev, values: e.target.value }))} />
            </div>
          </div>

          <div className="card settings-panel">
            <h3>Contact et règles</h3>
            <div className="form-group">
              <label>Email de contact</label>
              <input className="form-control" value={siteSettings.contactEmail} onChange={(e) => setSiteSettings(prev => ({ ...prev, contactEmail: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Téléphone</label>
              <input className="form-control" value={siteSettings.contactPhone} onChange={(e) => setSiteSettings(prev => ({ ...prev, contactPhone: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Localisation</label>
              <input className="form-control" value={siteSettings.location} onChange={(e) => setSiteSettings(prev => ({ ...prev, location: e.target.value }))} />
            </div>
            <label className="settings-toggle">
              <input type="checkbox" checked={siteSettings.allowPublicSignup} onChange={(e) => setSiteSettings(prev => ({ ...prev, allowPublicSignup: e.target.checked }))} />
              <span>Inscriptions publiques ouvertes</span>
            </label>
            <label className="settings-toggle">
              <input type="checkbox" checked={siteSettings.allowGalleryDownload} onChange={(e) => setSiteSettings(prev => ({ ...prev, allowGalleryDownload: e.target.checked }))} />
              <span>Téléchargement des photos autorisé</span>
            </label>
          </div>

          <div className="card settings-panel">
            <h3>Assistant IA</h3>
            <div className="form-group">
              <label>Message d'accueil</label>
              <textarea className="form-control" rows="5" value={siteSettings.aiWelcome} onChange={(e) => setSiteSettings(prev => ({ ...prev, aiWelcome: e.target.value }))} />
            </div>
            <div className="settings-ai-preview">
              <Sparkles size={18} />
              <span>{siteSettings.aiWelcome}</span>
            </div>
          </div>
        </section>

        <button className="btn-primary settings-save-btn" type="submit">
          <CheckCircle size={18} /> Enregistrer les paramètres
        </button>
      </form>
    );
  }

  // --- CALENDAR & RSVP RENDERING ---
  function renderCalendar() {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <h1 className="section-title">
            Agenda Communautaire & RSVPs
            <Calendar className="text-gold" size={24} />
          </h1>
          <p className="text-muted">Réservez vos places et obtenez votre QR Code d'invitation officiel.</p>
        </div>

        <div className="calendar-layout">
          {/* Calendar Table Grid */}
          <div className="card">
            <h3 style={{ marginBottom: '16px' }}>Juin 2026</h3>
            <div className="calendar-grid">
              {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(h => (
                <div key={h} className="calendar-day-header">{h}</div>
              ))}
              
              {/* Empty days spacing */}
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={`empty-${idx}`} className="calendar-day" style={{ opacity: 0.2 }}></div>
              ))}

              {/* Days of June */}
              {Array.from({ length: 30 }).map((_, idx) => {
                const dayNum = idx + 1;
                const dateStr = `2026-06-${dayNum < 10 ? '0' + dayNum : dayNum}`;
                const dayEvents = events.filter(ev => ev.date === dateStr);
                const isCurrent = dayNum === 10;

                return (
                  <div key={idx} className={`calendar-day ${isCurrent ? 'current' : ''}`}>
                    <span className="calendar-day-num">{dayNum}</span>
                    {dayEvents.map(e => (
                      <div key={e.id} className="calendar-event-tag" onClick={() => setRsvpEvent(e)}>
                        {e.title}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Event details card */}
          <div className="card event-details-card">
            {rsvpEvent ? (
              <>
                <img src={rsvpEvent.image} alt="event" style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '12px' }} />
                <h3>{rsvpEvent.title}</h3>
                <p className="text-muted" style={{ fontSize: '0.85rem' }}>{rsvpEvent.description}</p>
                
                <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                  <div>📅 <strong>Date :</strong> {rsvpEvent.date} à {rsvpEvent.time}</div>
                  <div>📍 <strong>Lieu :</strong> {rsvpEvent.location}</div>
                  <div>👥 <strong>Participants :</strong> {rsvpEvent.participants.length} / {rsvpEvent.maxParticipants}</div>
                </div>

                <div className="flex-column gap-2 mt-4" style={{ display: 'flex' }}>
                  <button 
                    className="btn-primary"
                    onClick={() => handleEventRsvp(rsvpEvent)}
                  >
                    {rsvpEvent.participants.includes(currentUser.id) ? "Se Désinscrire" : "S'inscrire à l'événement"}
                  </button>

                  {/* QR Code generator */}
                  {rsvpEvent.participants.includes(currentUser.id) && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', marginTop: '16px' }}>
                      <span className="text-gold" style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>🎟️ Votre QR Code Invitation :</span>
                      
                      <div className="qr-code-holder">
                        {/* High-fidelity Canvas QR code simulator */}
                        <canvas 
                          id="qr-canvas" 
                          width="120" 
                          height="120"
                          ref={(canvas) => {
                            if (canvas) {
                              const ctx = canvas.getContext('2d');
                              ctx.clearRect(0,0,120,120);
                              ctx.fillStyle = '#0b2f64';
                              // Draw square patterns mimicking a QR Code
                              ctx.fillRect(0, 0, 30, 30);
                              ctx.clearRect(6, 6, 18, 18);
                              ctx.fillRect(10, 10, 10, 10);

                              ctx.fillRect(90, 0, 30, 30);
                              ctx.clearRect(96, 6, 18, 18);
                              ctx.fillRect(100, 10, 10, 10);

                              ctx.fillRect(0, 90, 30, 30);
                              ctx.clearRect(6, 96, 18, 18);
                              ctx.fillRect(10, 100, 10, 10);

                              // Random data matrices
                              for (let i = 35; i < 85; i += 8) {
                                for (let j = 0; j < 120; j += 8) {
                                  if (Math.random() > 0.4) {
                                    ctx.fillRect(i, j, 5, 5);
                                  }
                                }
                              }
                            }
                          }}
                        />
                      </div>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Ticket N° SEAT-{Math.floor(100 + Math.random() * 900)}</span>
                      
                      {currentUser.role === 'Super Admin' && (
                        <button className="btn-primary" style={{ fontSize: '0.75rem', padding: '8px 12px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }} onClick={simulateQRScannerPresence}>
                          Simuler scan de présence
                        </button>
                      )}
                    </div>
                  )}
                </div>
                </>
            ) : (
              <div className="text-center" style={{ padding: '40px 0' }}>
                <Calendar size={48} className="text-gold" style={{ margin: '0 auto 16px' }} />
                <h3>Aucun événement sélectionné</h3>
                <p className="text-muted mt-4" style={{ fontSize: '0.85rem' }}>Sélectionnez un événement sur le calendrier pour voir ses détails ou réserver.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- COTISATIONS & FINANCIAL MODULE RENDERING ---
  function renderFinance() {
    // Only premium and admins can view
    if (!hasPermission('viewFinances')) {
      return <div className="card text-center">Vous n'avez pas l'autorisation d'accéder aux finances.</div>;
    }

    return (
      <div className="finance-dashboard">
        <div>
          <h1 className="section-title">
            Cotisations & Comptabilité
            <DollarSign className="text-gold" size={24} />
          </h1>
          <p className="text-muted">Gérez les cotisations, effectuez des règlements Mobiles (Orange/MTN) et téléchargez vos reçus.</p>
        </div>

        {/* KPI Financial stats */}
        <div className="finance-stats">
          <div className="card kpi-card">
            <div className="kpi-details">
              <h3>Total Recettes</h3>
              <div className="value" style={{ color: '#10b981' }}>{finances.stats.totalRecettes} €</div>
            </div>
            <div className="kpi-icon-wrapper" style={{ color: '#10b981' }}>
              <TrendingUp />
            </div>
          </div>

          <div className="card kpi-card">
            <div className="kpi-details">
              <h3>Total Dépenses</h3>
              <div className="value" style={{ color: '#ef4444' }}>{finances.stats.totalDepenses} €</div>
            </div>
            <div className="kpi-icon-wrapper" style={{ color: '#ef4444' }}>
              <TrendingUp style={{ transform: 'rotate(180deg)' }} />
            </div>
          </div>

          <div className="card kpi-card">
            <div className="kpi-details">
              <h3>Solde net</h3>
              <div className="value">{finances.stats.balance} €</div>
            </div>
            <div className="kpi-icon-wrapper">
              <DollarSign />
            </div>
          </div>
        </div>

        {/* Cotisations list for member payment */}
        <div className="card">
          <h3 style={{ marginBottom: '16px' }}>Suivi des Cotisations Annuelles</h3>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Membre</th>
                  <th>Montant</th>
                  <th>Type</th>
                  <th>Date</th>
                  <th>Statut</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {finances.cotisations.map((cot) => (
                  <tr key={cot.id}>
                    <td><strong>{cot.memberName}</strong></td>
                    <td>{cot.amount} €</td>
                    <td>{cot.type}</td>
                    <td>{cot.date || '-'}</td>
                    <td>
                      <span style={{
                        padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold',
                        background: cot.status === 'Payé' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: cot.status === 'Payé' ? '#10b981' : '#ef4444'
                      }}>
                        {cot.status}
                      </span>
                    </td>
                    <td>
                      {cot.status === 'Payé' ? (
                        <button 
                          className="btn-primary" 
                          style={{ width: 'auto', padding: '6px 12px', fontSize: '0.75rem', background: 'rgba(255,255,255,0.08)', color: 'var(--text-main)', border: '1px solid var(--border-color)', boxShadow: 'none' }}
                          onClick={() => {
                            setReceiptTransaction({ ...cot, txnId: 'TXN-' + Math.floor(10000000 + Math.random()*90000000) });
                            setCheckoutTransaction(cot);
                            setPayingStep('receipt');
                          }}
                        >
                          Afficher reçu
                        </button>
                      ) : (
                        cot.memberName === currentUser.fullName ? (
                          <button className="btn-primary" style={{ width: 'auto', padding: '6px 12px', fontSize: '0.75rem' }} onClick={() => handlePayCotisation(cot)}>
                            Régler par Mobile
                          </button>
                        ) : (
                          <span className="text-muted" style={{ fontSize: '0.75rem' }}>Attente</span>
                        )
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Association Expenses Ledger */}
        <div className="card">
          <h3 style={{ marginBottom: '16px' }}>Registre des Dépenses Récentes</h3>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Intitulé Dépense</th>
                  <th>Bénéficiaire</th>
                  <th>Date</th>
                  <th>Catégorie</th>
                  <th>Montant</th>
                </tr>
              </thead>
              <tbody>
                {finances.depenses.map((exp) => (
                  <tr key={exp.id}>
                    <td><strong>{exp.label}</strong></td>
                    <td>{exp.receiver}</td>
                    <td>{exp.date}</td>
                    <td>{exp.category}</td>
                    <td style={{ color: '#ef4444', fontWeight: 'bold' }}>-{exp.amount} €</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    );
  }

  // --- GAMIFICATION LEADERBOARD RENDERING ---
  function renderGamification() {
    // Sort members by XP desc
    const sorted = [...members].sort((a,b) => b.xp - a.xp);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <h1 className="section-title">
            Gamification & Classement Actif
            <Award className="text-gold" size={24} />
          </h1>
          <p className="text-muted">Gagnez de l'XP en publiant, en chatant ou en réglant vos cotisations !</p>
        </div>

        {/* Connected user points details */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <img src={currentUser.avatar} alt="avatar" className="story-img" style={{ width: '80px', height: '80px', border: '3px solid gold' }} />
          <div style={{ flex: 1 }}>
            <div className="flex justify-between align-center">
              <h3>Niveau Actuel: {currentUser.level}</h3>
              <span className="text-gold" style={{ fontWeight: 'bold' }}>{currentUser.xp} XP total</span>
            </div>
            
            {/* XP progress bar */}
            <div className="profile-xp-bar-wrapper">
              <div className="profile-xp-bar" style={{ width: `${(currentUser.xp % 500) / 5}%` }}></div>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '6px' }}>
              Plus que {500 - (currentUser.xp % 500)} XP avant le niveau {currentUser.level + 1} !
            </span>
          </div>
        </div>

        {/* Leaderboard list */}
        <div className="card">
          <h3 style={{ marginBottom: '16px' }}>Classement des Frères & Sœurs</h3>
          
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>Rang</th>
                <th>Membre</th>
                <th>Niveau</th>
                <th>XP Total</th>
                <th>Badges</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((m, idx) => (
                <tr key={m.id} className="leaderboard-row">
                  <td>
                    <div className={`rank-badge rank-${idx + 1}`}>{idx + 1}</div>
                  </td>
                  <td>
                    <div className="flex align-center gap-3">
                      <img src={m.avatar} alt="avatar" className="activity-avatar" style={{ width: '32px', height: '32px' }} />
                      <strong>{m.fullName}</strong>
                    </div>
                  </td>
                  <td><strong>Niv. {m.level}</strong></td>
                  <td className="text-gold">{m.xp} XP</td>
                  <td>
                    <div className="badges-container">
                      {m.badges.map(b => (
                        <span key={b} className="badge-item">{b}</span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // --- MEMBER PROFILES DIRECTORY ---
  function renderMembers() {
    if (!hasPermission('manageMembers')) {
      return <div className="card text-center">Vous n'avez pas l'autorisation d'accéder à la liste des membres.</div>;
    }

    const filtered = filterBySearch(members, 'fullName');

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="flex justify-between align-center" style={{ display: 'flex' }}>
          <div>
            <h1 className="section-title">
              Annuaire des Membres
              <UserCheck className="text-gold" size={24} />
            </h1>
            <p className="text-muted">Visualisez, modifiez les profils et attribuez les rôles.</p>
          </div>
          
          <button className="btn-primary" style={{ width: 'auto' }} onClick={() => handleOpenCrudModal()}>
            <Plus size={16} /> Ajouter Membre
          </button>
        </div>

        <div className="chat-search" style={{ padding: 0 }}>
          <input 
            type="text" 
            placeholder="Rechercher par nom..." 
            className="form-control"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {filtered.map((m) => (
            <div key={m.id} className="card text-center" style={{ display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative' }}>
              
              {/* Profile banner color mock */}
              <div style={{
                height: '60px',
                background: m.banner || 'linear-gradient(135deg, #0b2f64 0%, #1e40af 100%)',
                borderRadius: '12px 12px 0 0',
                position: 'absolute', top: 0, left: 0, right: 0
              }} />

              <img 
                src={m.avatar} 
                alt="avatar" 
                className="story-img" 
                style={{ width: '70px', height: '70px', border: '3px solid gold', margin: '20px auto 0', zIndex: 2 }} 
              />
              
              <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{m.fullName}</h3>
              <span style={getRoleBadgeStyle(m.role)}>{m.role}</span>
              
              <p className="text-muted" style={{ fontSize: '0.8rem', minHeight: '36px' }}>{m.bio || 'Aucune biographie rédigée.'}</p>
              
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
                <div>💼 <strong>Job :</strong> {m.profession || '-'}</div>
                <div>📍 <strong>Adresse :</strong> {m.address || '-'}</div>
                <div>📞 <strong>Tél :</strong> {m.phone || '-'}</div>
              </div>

              {currentUser.role === 'Super Admin' && (
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <button className="btn-primary" style={{ fontSize: '0.75rem', padding: '6px' }} onClick={() => handleOpenCrudModal(m)}>
                    Modifier
                  </button>
                  <button 
                    className="btn-primary" 
                    onClick={() => handleBlockUserToggle(m.id)}
                    style={{
                      fontSize: '0.75rem', padding: '6px',
                      background: m.isBlocked ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                    }}
                  >
                    {m.isBlocked ? "Débloquer" : "Suspendre"}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --- DYNAMIC RBAC & PERMISSIONS MATRIX ---
  function renderRbac() {
    if (!hasPermission('manageRoles')) {
      return <div className="card text-center">Vous n'avez pas l'autorisation d'accéder au panneau RBAC.</div>;
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <h1 className="section-title">
            Contrôle d'Accès & Rôles (RBAC)
            <Shield className="text-gold" size={24} />
          </h1>
          <p className="text-muted">Cochez ou décochez les cases pour modifier instantanément les privilèges des rôles de la plateforme.</p>
        </div>

        {/* Roles Details */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {roles.map((r) => (
            <div key={r.name} className="card">
              <h3 style={{ color: r.color, fontWeight: 'bold' }}>{r.name}</h3>
              <p className="text-muted mt-4" style={{ fontSize: '0.85rem' }}>{r.description}</p>
            </div>
          ))}
        </div>

        {/* Dynamic Permissions Matrix Grid */}
        <div className="card">
          <h3>Matrice des Permissions Dynamiques</h3>
          
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Permission / Rôle</th>
                  {roles.map(r => (
                    <th key={r.name} style={{ color: r.color }}>{r.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { key: 'viewDashboard', label: '📊 Accéder au Dashboard' },
                  { key: 'manageMembers', label: '👥 Gérer les Membres' },
                  { key: 'manageRoles', label: '🛡️ Modifier les Rôles' },
                  { key: 'writePosts', label: '📝 Rédiger des posts' },
                  { key: 'moderateContent', label: '🚫 Modérer du contenu' },
                  { key: 'viewFinances', label: '💵 Voir la caisse' },
                  { key: 'manageEvents', label: '📅 Organiser événements' },
                  { key: 'useAI', label: '🤖 Utiliser Modérateur IA' },
                  { key: 'manageBackups', label: '💾 Gérer les sauvegardes' }
                ].map((perm) => (
                  <tr key={perm.key}>
                    <td><strong>{perm.label}</strong></td>
                    {roles.map(r => (
                      <td key={r.name} style={{ textAlign: 'center' }}>
                        <input 
                          type="checkbox" 
                          className="perm-checkbox"
                          checked={r.permissions[perm.key] || false}
                          disabled={r.name === 'Super Admin'} // Super Admin has total access always
                          onChange={() => handlePermissionToggle(r.name, perm.key)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // --- SECURITY LOGS & SESSION AUDIT RENDERING ---
  function renderSecurityLogs() {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <h1 className="section-title">
            Journal de Sécurité & Audits
            <Lock className="text-gold" size={24} />
          </h1>
          <p className="text-muted">Historique des tentatives de brute-force bloquées, 2FA validés et sessions actives.</p>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '16px' }}>Journal des Activités Réseau</h3>
          
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Événement</th>
                  <th>Utilisateur</th>
                  <th>Appareil</th>
                  <th>IP</th>
                  <th>Date & Heure</th>
                </tr>
              </thead>
              <tbody>
                {securityLogs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <span style={{
                        padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold',
                        background: log.type === 'SUSPECT_ATTEMPT' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                        color: log.type === 'SUSPECT_ATTEMPT' ? '#ef4444' : '#10b981'
                      }}>
                        {log.type}
                      </span>
                    </td>
                    <td>{log.email}</td>
                    <td style={{ fontSize: '0.85rem' }}>{log.device}</td>
                    <td style={{ fontFamily: 'monospace' }}>{log.ip}</td>
                    <td style={{ fontSize: '0.8rem' }}>{log.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // --- MASTER CRUD CONSOLE RENDERING ---
  function renderCrud() {
    let currentDataset = [];
    if (crudSelectedTable === 'members') currentDataset = members;
    else if (crudSelectedTable === 'posts') currentDataset = posts;
    else if (crudSelectedTable === 'events') currentDataset = events;
    else if (crudSelectedTable === 'finances') currentDataset = finances.cotisations;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="flex justify-between align-center" style={{ display: 'flex' }}>
          <div>
            <h1 className="section-title">
              Console CRUD Administrative
              <FolderOpen className="text-gold" size={24} />
            </h1>
            <p className="text-muted">Gérez les tables physiques de l'application et effectuez des sauvegardes JSON.</p>
          </div>
        </div>

        {/* Database backup selectors */}
        <div className="card" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
          <button className="btn-primary" style={{ width: 'auto' }} onClick={exportDatabase}>
            💾 Sauvegarder la base de données (JSON)
          </button>
          
          <label className="btn-primary" style={{ width: 'auto', background: 'rgba(255,255,255,0.08)', color: 'var(--text-main)', border: '1px solid var(--border-color)', boxShadow: 'none', cursor: 'pointer' }}>
            📥 Restaurer depuis fichier JSON
            <input type="file" accept=".json" style={{ display: 'none' }} onChange={importDatabase} />
          </label>
        </div>

        {/* Table Selector */}
        <div style={{ display: 'flex', gap: '12px' }}>
          {['members', 'posts', 'events', 'finances'].map((table) => (
            <button 
              key={table}
              className={`btn-view-toggle ${crudSelectedTable === table ? 'active' : ''}`}
              onClick={() => setCrudSelectedTable(table)}
              style={{ textTransform: 'capitalize' }}
            >
              Table : {table}
            </button>
          ))}
        </div>

        {/* Dynamic tabular listing of selected Table */}
        <div className="card">
          <div className="flex justify-between align-center mb-4" style={{ display: 'flex' }}>
            <h3 style={{ textTransform: 'capitalize' }}>Liste de la Table: {crudSelectedTable}</h3>
            <button className="btn-primary" style={{ width: 'auto', padding: '8px 16px' }} onClick={() => handleOpenCrudModal()}>
              <Plus size={16} /> Créer Entrée
            </button>
          </div>

          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                {crudSelectedTable === 'members' && (
                  <tr>
                    <th>Nom Complet</th>
                    <th>Email</th>
                    <th>Rôle</th>
                    <th>Profession</th>
                    <th>Niveau</th>
                    <th>Action</th>
                  </tr>
                )}
                {crudSelectedTable === 'posts' && (
                  <tr>
                    <th>Auteur</th>
                    <th>Contenu</th>
                    <th>Likes</th>
                    <th>Commentaires</th>
                    <th>Action</th>
                  </tr>
                )}
                {crudSelectedTable === 'events' && (
                  <tr>
                    <th>Titre</th>
                    <th>Date</th>
                    <th>Lieu</th>
                    <th>Participants</th>
                    <th>Action</th>
                  </tr>
                )}
                {crudSelectedTable === 'finances' && (
                  <tr>
                    <th>Nom du Membre</th>
                    <th>Montant</th>
                    <th>Description</th>
                    <th>Date</th>
                    <th>Statut</th>
                    <th>Action</th>
                  </tr>
                )}
              </thead>
              <tbody>
                {currentDataset.map((item) => (
                  <tr key={item.id}>
                    {crudSelectedTable === 'members' && (
                      <>
                        <td><strong>{item.fullName}</strong></td>
                        <td>{item.email}</td>
                        <td><span style={getRoleBadgeStyle(item.role)}>{item.role}</span></td>
                        <td>{item.profession || '-'}</td>
                        <td>Niv. {item.level}</td>
                      </>
                    )}
                    {crudSelectedTable === 'posts' && (
                      <>
                        <td><strong>{item.authorName}</strong></td>
                        <td style={{ fontSize: '0.85rem' }}>{item.content.substring(0, 50)}...</td>
                        <td>❤️ {item.likes?.length || 0}</td>
                        <td>💬 {item.comments?.length || 0}</td>
                      </>
                    )}
                    {crudSelectedTable === 'events' && (
                      <>
                        <td><strong>{item.title}</strong></td>
                        <td>{item.date} à {item.time}</td>
                        <td>{item.location}</td>
                        <td>👥 {item.participants?.length || 0}</td>
                      </>
                    )}
                    {crudSelectedTable === 'finances' && (
                      <>
                        <td><strong>{item.memberName}</strong></td>
                        <td style={{ fontWeight: 'bold', color: '#10b981' }}>{item.amount} €</td>
                        <td>{item.type}</td>
                        <td>{item.date || '-'}</td>
                        <td>{item.status}</td>
                      </>
                    )}
                    <td>
                      <div className="flex gap-2">
                        <button className="btn-primary" style={{ width: 'auto', padding: '6px 12px', fontSize: '0.75rem' }} onClick={() => handleOpenCrudModal(item)}>
                          Éditer
                        </button>
                        <button 
                          className="btn-primary" 
                          style={{ width: 'auto', padding: '6px 12px', fontSize: '0.75rem', background: '#ef4444' }} 
                          onClick={() => handleDeleteCrud(item.id)}
                        >
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }
}
