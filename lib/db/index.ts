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
    title: 'Introduction to Artificial Intelligence',
    iconName: 'Brain',
    topics: [
      'Introduction to Artificial Intelligence',
      'History of AI',
      'AI Around Us',
      'Importance of Artificial Intelligence',
      'Advantages and Limitations of AI',
    ],
    learningOutcome:
      'Students will understand the basic concept and importance of Artificial Intelligence.',
    description:
      'Foundation concepts, historical milestones, and how AI interacts with modern human life.',
  },
  {
    id: 2,
    number: 2,
    title: 'Types and Applications of AI',
    iconName: 'Layers',
    topics: [
      'Types of Artificial Intelligence',
      'Narrow AI',
      'General AI',
      'Applications of AI',
      'AI in Everyday Life',
    ],
    learningOutcome:
      'Students will understand different types and applications of Artificial Intelligence.',
    description:
      'Distinguishing Narrow vs General AI and exploring real-world applications across various sectors.',
  },
  {
    id: 3,
    number: 3,
    title: 'AI Problem Solving and Search Strategies',
    iconName: 'Compass',
    topics: [
      'Problem Solving in AI',
      'Search Strategies',
      'Breadth-First Search',
      'Depth-First Search',
      'Heuristics',
      'Informed Search',
    ],
    learningOutcome:
      'Students will understand how AI searches for solutions and solves problems.',
    description:
      'Systematic problem formulation, state spaces, and graph search algorithms that drive AI reasoning.',
  },
  {
    id: 4,
    number: 4,
    title: 'Machine Learning',
    iconName: 'Cpu',
    topics: [
      'Introduction to Machine Learning',
      'How Machines Learn',
      'Data and Patterns',
      'Supervised Learning',
      'Unsupervised Learning',
      'Reinforcement Learning',
    ],
    learningOutcome:
      'Students will understand how machines learn from data and patterns.',
    description:
      'The core paradigms of machine learning: discovering patterns, training models, and predicting outcomes.',
  },
  {
    id: 5,
    number: 5,
    title: 'Deep Learning and Neural Networks',
    iconName: 'Network',
    topics: [
      'Introduction to Deep Learning',
      'Neural Networks',
      'Artificial Neurons',
      'How Neural Networks Work',
      'Image Recognition',
      'Voice Recognition',
    ],
    learningOutcome:
      'Students will understand the basics of Deep Learning and Neural Networks.',
    description:
      'Biologically inspired computing, perceptrons, multi-layer architectures, and perceptual intelligence.',
  },
  {
    id: 6,
    number: 6,
    title: 'Generative AI and Modern AI Tools',
    iconName: 'Sparkles',
    topics: [
      'Introduction to Generative AI',
      'AI Chatbots',
      'Text Generation',
      'Image Generation',
      'Modern AI Tools',
      'Responsible Use of Generative AI',
    ],
    learningOutcome:
      'Students will understand Generative AI and modern AI tools.',
    description:
      'Large language models, diffusion systems, prompt engineering, and ethical creative exploration.',
  },
  {
    id: 7,
    number: 7,
    title: 'AI Ethics, Future and Projects',
    iconName: 'ShieldCheck',
    topics: [
      'AI Ethics',
      'Responsible AI',
      'AI Privacy and Bias',
      'Benefits and Risks of AI',
      'AI and Future Careers',
      'Student Projects and Presentations',
    ],
    learningOutcome:
      'Students will understand responsible AI and explore future opportunities.',
    description:
      'Fairness, privacy, bias mitigation, emerging career paths, and hands-on capstone project synthesis.',
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
  };
}

async function saveDatabase(data: DatabaseSchema): Promise<void> {
  const sql = getSqlClient();
  const jsonStr = JSON.stringify(data);
  await sql`
    INSERT INTO app_database (id, data, updated_at)
    VALUES (1, ${jsonStr}::jsonb, NOW())
    ON CONFLICT (id) DO UPDATE
    SET data = EXCLUDED.data, updated_at = NOW()
  `;
}

export async function getDb(): Promise<DatabaseSchema> {
  const sql = getSqlClient();
  const rows = await sql`SELECT data FROM app_database WHERE id = 1 LIMIT 1`;

  if (rows && rows.length > 0) {
    let rawData = rows[0].data;
    if (typeof rawData === 'string') {
      rawData = JSON.parse(rawData);
    }
    const db = rawData as DatabaseSchema;

    // ensure required modules and settings exist
    let needsUpdate = false;
    if (!db.modules || db.modules.length === 0) {
      db.modules = INITIAL_MODULES;
      needsUpdate = true;
    }
    if (!db.settings) {
      db.settings = INITIAL_SETTINGS;
      needsUpdate = true;
    }
    if (needsUpdate) {
      await saveDatabase(db);
    }
    return db;
  }

  // Row does not exist: initialize with master admin and default data
  const initialData = getInitialDatabase();
  await saveDatabase(initialData);
  return initialData;
}

export async function updateDb(
  updater: (db: DatabaseSchema) => void | DatabaseSchema | Promise<void | DatabaseSchema>
): Promise<DatabaseSchema> {
  const db = await getDb();
  const result = await updater(db);
  const dataToSave = (result && typeof result === 'object') ? result : db;
  await saveDatabase(dataToSave);
  return dataToSave;
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
