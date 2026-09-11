import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import {
  DatabaseSchema,
  User,
  WebsiteSettings,
  ModuleItem,
  StudyMaterial,
  VideoItem,
  Assignment,
  Quiz,
  QuizSubmission,
  StudentRegistration,
  SchoolPartnership,
  ContactMessage,
  ActivityItem,
  GalleryItem,
  AchievementItem,
  TestimonialItem,
  Announcement,
  CertificateItem,
} from './types';

const INITIAL_MODULES: ModuleItem[] = [
  {
    id: 1,
    number: 1,
    title: 'Introduction to AI',
    iconName: 'Brain',
    topics: [
      'What is Artificial Intelligence?',
      'History of AI',
      'Types of AI',
      'AI around us',
      'Intelligent Agents',
    ],
    learningOutcome:
      'Students will understand foundational AI concepts, historical evolution, everyday applications, and how intelligent agents perceive and act in their environment.',
    description:
      'Core foundations of Artificial Intelligence: definitions, historical breakthroughs, modern real-world presence, and intelligent agent architectures.',
  },
  {
    id: 2,
    number: 2,
    title: 'How AI Thinks',
    iconName: 'Compass',
    topics: [
      'Problem Solving in AI',
      'Search Strategies',
      'Heuristics',
      'Decision Trees',
    ],
    learningOutcome:
      'Students will learn how AI formulates problems, searches state spaces systematically, uses heuristics for optimal choices, and makes decisions using decision trees.',
    description:
      'The reasoning engine of AI: problem formulation, informed and uninformed search strategies, heuristic evaluation, and structured decision trees.',
  },
  {
    id: 3,
    number: 3,
    title: 'Logic & Reasoning',
    iconName: 'Layers',
    topics: [
      'If-Then Rules',
      'Knowledge Representation',
      'Logical Reasoning',
      'Rule-Based Systems',
      'Expert Systems',
    ],
    learningOutcome:
      'Students will understand rule-based deduction, formal knowledge representation, logical inference, and the architecture of expert systems.',
    description:
      'Structured logical thinking: rule formulations, knowledge engineering, inference engines, and industrial expert system implementations.',
  },
  {
    id: 4,
    number: 4,
    title: 'Machine Learning',
    iconName: 'Cpu',
    topics: [
      'What is Machine Learning?',
      'Supervised Learning',
      'Unsupervised Learning',
      'Reinforcement Learning',
      'Neural Networks',
      'Deep Learning',
    ],
    learningOutcome:
      'Students will master core machine learning paradigms, neural network computation, and deep hierarchical representation learning.',
    description:
      'From data to intelligence: supervised, unsupervised, and reinforcement learning paradigms, artificial neural networks, and deep learning models.',
  },
  {
    id: 5,
    number: 5,
    title: 'NLP & Generative AI',
    iconName: 'Sparkles',
    topics: [
      'What is NLP?',
      'Conversational AI Tools',
      'Prompting - Talking to AI Efficiently',
      'Translation & Text Generation',
      'AI Image, Video & Music Generation',
    ],
    learningOutcome:
      'Students will understand natural language processing, efficient prompt engineering, conversational AI agents, and creative multimodal media synthesis.',
    description:
      'Language and creativity: NLP fundamentals, LLMs, prompt craft, translation systems, and multimodal image, video, and audio generation.',
  },
  {
    id: 6,
    number: 6,
    title: 'Computer Vision & Robotics',
    iconName: 'Eye',
    topics: [
      'What is Computer Vision?',
      'Object and Face Recognition',
      'Robotics Fundamentals',
      'How AI and Robotics work together?',
    ],
    learningOutcome:
      'Students will understand visual perception in machines, facial and object detection algorithms, robotic kinematics, and physical AI integration.',
    description:
      'Seeing and acting in the physical world: pixel analysis, object recognition, robot control loops, and embodied artificial intelligence.',
  },
  {
    id: 7,
    number: 7,
    title: 'AI Ethics, Careers & the Future',
    iconName: 'ShieldCheck',
    topics: [
      'AI Ethics - Fairness and Bias',
      'Deepfakes and Misinformation',
      'Responsible AI & Cyber Safety',
      'Careers in AI',
      'The Future of AI',
    ],
    learningOutcome:
      'Students will evaluate ethical implications of AI, combat deepfakes and algorithmic bias, practice cyber safety, and explore emerging AI careers.',
    description:
      'Guiding principles for tomorrow: bias mitigation, misinformation defense, cyber vigilance, career roadmaps, and the future trajectory of AI.',
  },
];

const INITIAL_SETTINGS: WebsiteSettings = {
  websiteName: 'PRAGATHI AI',
  programName: 'Pragathi AI Foundation Program',
  tagline: 'Empowering Students for the AI-Powered Future',
  heroHeading: 'PRAGATHI AI',
  heroTagline: 'Empowering Students for the AI-Powered Future',
  heroDescription:
    'Discover the exciting world of Artificial Intelligence through structured learning, interactive activities, practical understanding, creativity, and future-ready skills.',
  phonePrimary: '+91 9618611522',
  phoneSecondary: '+91 6281738986',
  email: 'hello.pragathiai@gmail.com',
  instagramHandle: '@pragathi_ai',
  instagramUrl: 'https://instagram.com/pragathi_ai',
  aboutOverview:
    'PRAGATHI AI is an Artificial Intelligence education initiative designed to introduce students to Artificial Intelligence in a simple, practical, engaging, and understandable way.',
  missionStatement:
    'To make Artificial Intelligence education accessible, engaging, practical, and understandable for students.',
  visionStatement:
    'To prepare students for an AI-powered future by developing curiosity, creativity, technological awareness, and problem-solving skills.',
  updatedAt: new Date().toISOString(),
};

export function getDatabaseUrl(): string | undefined {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  if (process.env.POSTGRES_URL) return process.env.POSTGRES_URL;
  if (process.env.POSTGRES_PRISMA_URL) return process.env.POSTGRES_PRISMA_URL;
  if (process.env.NEON_DATABASE_URL) return process.env.NEON_DATABASE_URL;
  if (process.env.database_url) return process.env.database_url;

  for (const [key, val] of Object.entries(process.env)) {
    if (key.toUpperCase().includes('DATABASE_URL') && val) {
      return val;
    }
    if (key.includes('postgres') && val && val.startsWith('postgres')) {
      return val;
    }
    if (key.startsWith('DATABASE_URL=') && key.includes('postgres')) {
      const parts = key.split('=');
      return parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
    }
  }
  return undefined;
}

export const noCacheHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
};

function getSqlClient() {
  const databaseUrl = getDatabaseUrl();
  if (!databaseUrl) {
    throw new Error(
      'DATABASE_URL environment variable is not configured. Please define DATABASE_URL in your environment variables.'
    );
  }
  // Enable system CA fallback for local Windows development environments
  if (process.env.VERCEL !== '1' && (process.env.NODE_ENV !== 'production' || process.platform === 'win32')) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }
  return neon(databaseUrl, {
    fetchOptions: {
      cache: 'no-store',
    },
  });
}

function getInitialDatabase(): DatabaseSchema {
  const initialPassword =
    process.env.ADMIN_INITIAL_PASSWORD ||
    process.env.admin_initial_password ||
    process.env.ADMIN_PASSWORD ||
    'PragathiAdmin2026!';

  const adminSalt = bcrypt.genSaltSync(10);
  const adminPasswordHash = bcrypt.hashSync(initialPassword, adminSalt);

  const masterAdmin: User = {
    id: 'usr_admin_master',
    name: 'Pragathi AI Admin',
    email: 'admin@pragathiai.com',
    passwordHash: adminPasswordHash,
    role: 'ADMIN',
    status: 'ACTIVE',
    phone: '+91 9618611522',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return {
    settings: INITIAL_SETTINGS,
    users: [masterAdmin],
    modules: INITIAL_MODULES,
    materials: [],
    videos: [],
    assignments: [],
    quizzes: [],
    quizSubmissions: [],
    registrations: [],
    partnerships: [],
    messages: [],
    activities: [],
    gallery: [],
    achievements: [],
    testimonials: [],
    announcements: [],
    certificates: [],
    assignmentSubmissions: [],
    notifications: [],
  };
}

// High-concurrency In-Memory Read Cache
let memoryCache: { data: DatabaseSchema; timestamp: number } | null = null;
const CACHE_TTL_MS = 3000; // 3 seconds TTL (drastically reduces Neon queries during traffic spikes)
let writeQueue: Promise<any> = Promise.resolve();

export function invalidateDbCache() {
  memoryCache = null;
}

async function saveDatabase(data: DatabaseSchema): Promise<void> {
  memoryCache = { data, timestamp: Date.now() };
  const sql = getSqlClient();
  const jsonStr = JSON.stringify(data);
  await sql`
    INSERT INTO app_database (id, data, updated_at)
    VALUES (1, ${jsonStr}::jsonb, NOW())
    ON CONFLICT (id) DO UPDATE
    SET data = EXCLUDED.data, updated_at = NOW()
  `;
}

export async function getDb(forceFresh = false): Promise<DatabaseSchema> {
  const now = Date.now();
  if (!forceFresh && memoryCache && (now - memoryCache.timestamp < CACHE_TTL_MS)) {
    return memoryCache.data;
  }

  const sql = getSqlClient();
  const rows = await sql`SELECT data FROM app_database WHERE id = 1 LIMIT 1`;

  if (rows && rows.length > 0) {
    let rawData = rows[0].data;
    if (typeof rawData === 'string') {
      rawData = JSON.parse(rawData);
    }
    const db = rawData as DatabaseSchema;

    // ensure required modules and settings exist and syllabus is up to date
    let needsUpdate = false;
    if (
      !db.modules ||
      db.modules.length === 0 ||
      db.modules[0]?.title === 'Introduction to Artificial Intelligence' ||
      db.modules[1]?.title === 'Types and Applications of AI'
    ) {
      db.modules = INITIAL_MODULES;
      needsUpdate = true;
    }
    if (!db.assignmentSubmissions) {
      db.assignmentSubmissions = [];
      needsUpdate = true;
    }
    if (!db.notifications) {
      db.notifications = [];
      needsUpdate = true;
    }
    if (!db.certificates) {
      db.certificates = [];
      needsUpdate = true;
    }
    if (!db.settings) {
      db.settings = INITIAL_SETTINGS;
      needsUpdate = true;
    }
    if (needsUpdate) {
      await saveDatabase(db);
    }
    memoryCache = { data: db, timestamp: Date.now() };
    return db;
  }

  // Row does not exist: initialize with master admin and default data
  const initialData = getInitialDatabase();
  await saveDatabase(initialData);
  memoryCache = { data: initialData, timestamp: Date.now() };
  return initialData;
}

export async function updateDb(
  updater: (db: DatabaseSchema) => void | DatabaseSchema | Promise<void | DatabaseSchema>
): Promise<DatabaseSchema> {
  const executeUpdate = async () => {
    const db = await getDb(true);
    const result = await updater(db);
    const dataToSave = (result && typeof result === 'object') ? result : db;
    if (dataToSave.notifications && dataToSave.notifications.length > 300) {
      dataToSave.notifications = dataToSave.notifications.slice(0, 300);
    }
    await saveDatabase(dataToSave);
    return dataToSave;
  };

  writeQueue = writeQueue.then(executeUpdate, executeUpdate);
  return writeQueue;
}

export async function saveDb(db: DatabaseSchema): Promise<void> {
  await saveDatabase(db);
}

export function getFallbackPublicData() {
  return {
    settings: INITIAL_SETTINGS,
    modules: INITIAL_MODULES,
    activities: [],
    gallery: [],
    achievements: [],
    testimonials: [],
  };
}
