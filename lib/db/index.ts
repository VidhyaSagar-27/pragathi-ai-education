import fs from 'fs';
import path from 'path';
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

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

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

function getInitialDatabase(): DatabaseSchema {
  // Master Administrator credentials seed: admin@pragathiai.com / PragathiAdmin2026!
  const adminSalt = bcrypt.genSaltSync(10);
  const adminPasswordHash = bcrypt.hashSync('PragathiAdmin2026!', adminSalt);

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

let cachedDb: DatabaseSchema | null = null;

function ensureDbExists(): DatabaseSchema {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    const initialData = getInitialDatabase();
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    cachedDb = initialData;
    return initialData;
  }

  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as DatabaseSchema;
    // ensure required keys exist
    if (!parsed.modules || parsed.modules.length === 0) {
      parsed.modules = INITIAL_MODULES;
      saveDatabase(parsed);
    }
    if (!parsed.settings) {
      parsed.settings = INITIAL_SETTINGS;
      saveDatabase(parsed);
    }
    cachedDb = parsed;
    return parsed;
  } catch (err) {
    console.error('Error reading database file, re-initializing...', err);
    const initialData = getInitialDatabase();
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    cachedDb = initialData;
    return initialData;
  }
}

function saveDatabase(data: DatabaseSchema): void {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
  fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tempFile, DB_FILE);
  cachedDb = data;
}

export function getDb(): DatabaseSchema {
  return ensureDbExists();
}

export function updateDb(updater: (db: DatabaseSchema) => void): DatabaseSchema {
  const db = ensureDbExists();
  updater(db);
  saveDatabase(db);
  return db;
}
