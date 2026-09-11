import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

const SYLLABUS_KNOWLEDGE = `
PRAGATHI AI ACADEMY - 7 MODULE CURRICULUM SYLLABUS:
Module 1: Introduction to AI
- What is Artificial Intelligence? (Machines exhibiting human-like cognitive abilities)
- History of AI (From Alan Turing and Dartmouth Conference 1956 to modern foundation models)
- Types of AI (Narrow/Weak AI, General AI/AGI, Super AI)
- AI around us (Recommendation systems, voice assistants, smart cameras, maps)
- Intelligent Agents (Sensors, actuators, perception-action cycle, environment models)

Module 2: How AI Thinks
- Problem Solving in AI (State-space representation, goal-directed search)
- Search Strategies (Breadth-First Search BFS, Depth-First Search DFS, A* search)
- Heuristics (Heuristic functions, distance estimation, optimization)
- Decision Trees (Attribute splits, classification, entropy, information gain)

Module 3: Logic & Reasoning
- If-Then Rules (Condition-action pairs, declarative knowledge)
- Knowledge Representation (Semantic nets, frames, propositional logic)
- Logical Reasoning (Deductive, inductive, and abductive inference)
- Rule-Based Systems (Inference engines, forward chaining, backward chaining)
- Expert Systems (MYCIN, DENDRAL, knowledge engineering architectures)

Module 4: Machine Learning
- What is Machine Learning? (Learning algorithms from statistical data patterns)
- Supervised Learning (Labeled training sets, regression, classification)
- Unsupervised Learning (Clustering, k-means, dimensionality reduction, anomaly detection)
- Reinforcement Learning (Agent, environment, reward signals, policy optimization)
- Neural Networks (Perceptrons, hidden layers, weights, biases, activation functions)
- Deep Learning (Convolutional CNNs, recurrent RNNs, transformers, hierarchical representation)

Module 5: NLP & Generative AI
- What is NLP? (Natural Language Processing, tokenization, embeddings, syntax, semantics)
- Conversational AI Tools (ChatGPT, Claude, Gemini, conversational architecture)
- Prompting - Talking to AI Efficiently (Zero-shot, few-shot, chain-of-thought, system role engineering)
- Translation & Text Generation (Sequence-to-sequence, attention mechanisms, beam search)
- AI Image, Video & Music Generation (Diffusion models, GANs, Stable Diffusion, multimodal synthesis)

Module 6: Computer Vision & Robotics
- What is Computer Vision? (Pixel arrays, image filtering, edge detection, feature extraction)
- Object and Face Recognition (Bounding boxes, YOLO, facial landmarks, biometric verification)
- Robotics Fundamentals (Actuators, kinematics, sensor fusion, LiDAR, navigation)
- How AI and Robotics work together? (Embodied AI, autonomous navigation, robotic grasping)

Module 7: AI Ethics, Careers & the Future
- AI Ethics - Fairness and Bias (Algorithmic bias, training dataset imbalances, fairness metrics)
- Deepfakes and Misinformation (Synthetic media detection, watermarking, provenance verification)
- Responsible AI & Cyber Safety (Privacy, data security, adversarial attacks, safety guardrails)
- Careers in AI (AI Research Scientist, ML Engineer, Prompt Engineer, Robotics Specialist, Data Analyst)
- The Future of AI (AGI, quantum computing integration, human-AI collaborative intelligence)
`;

export async function POST(req: NextRequest) {
  try {
    const { message, conversationHistory } = await req.json();
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const query = message.trim().toLowerCase();

    // Contextual answer builder
    let reply = '';

    if (query.includes('module 1') || query.includes('intro') || query.includes('what is ai')) {
      reply = `**Module 1: Introduction to AI** covers the core foundational building blocks of artificial intelligence:
- **What is Artificial Intelligence?**: Systems capable of performing cognitive tasks typically requiring human intelligence (learning, reasoning, problem solving).
- **History of AI**: From Alan Turing's Imitation Game (1950) and John McCarthy's 1956 Dartmouth conference through AI winters to deep learning breakthroughs.
- **Types of AI**: Narrow AI (specialized for specific tasks like Siri or chess engines), General AI (AGI with human-level across all domains), and Super AI.
- **AI Around Us**: Algorithmic recommendations on YouTube/Netflix, Google Maps navigation, smartphone cameras, predictive keyboards.
- **Intelligent Agents**: Autonomous entities perceiving environments through sensors and acting upon them through actuators.`;
    } else if (query.includes('module 2') || query.includes('thinks') || query.includes('search') || query.includes('decision tree')) {
      reply = `**Module 2: How AI Thinks** explores classical computational intelligence and heuristic decision-making:
- **Problem Solving in AI**: Defining problems as states, initial states, goal tests, and transition actions.
- **Search Strategies**: Uninformed search (Breadth-First Search & Depth-First Search) vs Informed heuristic search (A* Search, Greedy Best-First).
- **Heuristics**: Mathematical rules of thumb that guide search algorithms towards solutions faster without exhaustive computation.
- **Decision Trees**: Hierarchical branching models using decision nodes and leaf classifications to partition data based on information gain.`;
    } else if (query.includes('module 3') || query.includes('logic') || query.includes('expert system') || query.includes('rule')) {
      reply = `**Module 3: Logic & Reasoning** teaches formal representations of human expertise and logical deduction:
- **If-Then Rules**: Declarative knowledge structures linking conditions to actions or conclusions.
- **Knowledge Representation**: Structuring real-world knowledge using propositional logic, predicates, and semantic graphs.
- **Logical Reasoning**: Deductive reasoning (general to specific), Inductive reasoning (specific observations to general principles), and Abductive reasoning (most likely explanations).
- **Rule-Based Systems**: Knowledge bases paired with forward-chaining (data-driven) and backward-chaining (goal-driven) inference engines.
- **Expert Systems**: Classical AI systems like MYCIN and DENDRAL designed to emulate human specialist decision-making.`;
    } else if (query.includes('module 4') || query.includes('machine learning') || query.includes('neural') || query.includes('supervised')) {
      reply = `**Module 4: Machine Learning & Neural Computation** is the mathematical core of modern AI:
- **What is Machine Learning?**: Algorithms that learn statistical representations directly from training data without being explicitly programmed.
- **Supervised Learning**: Training models on labeled inputs (Linear Regression, Support Vector Machines, Random Forests).
- **Unsupervised Learning**: Discovering intrinsic groupings and patterns in unlabeled datasets (K-Means Clustering, PCA).
- **Reinforcement Learning**: Training autonomous agents via environmental rewards and penalties (Q-Learning, Policy Gradients).
- **Neural Networks**: Artificial networks modeled after biological brains comprising input layers, hidden layers, weights, biases, and activation functions (ReLU, Sigmoid).
- **Deep Learning**: Deep multi-layer architectures capable of hierarchical feature learning from raw data.`;
    } else if (query.includes('module 5') || query.includes('nlp') || query.includes('generative') || query.includes('prompt')) {
      reply = `**Module 5: NLP & Generative AI** covers modern language modeling and creative synthesis:
- **What is NLP?**: Natural Language Processing techniques enabling computers to read, interpret, and generate human languages (tokenization, word embeddings, transformer attention).
- **Conversational AI Tools**: Large language models powering ChatGPT, Claude, and Gemini.
- **Prompting - Talking to AI Efficiently**: Strategic prompt engineering including few-shot prompting, persona steering, chain-of-thought decomposition, and temperature control.
- **Translation & Text Generation**: Sequence-to-sequence transformers and neural machine translation.
- **AI Image, Video & Music Generation**: Latent diffusion models, Stable Diffusion, Midjourney, and generative audiovisual media synthesis.`;
    } else if (query.includes('module 6') || query.includes('computer vision') || query.includes('robot')) {
      reply = `**Module 6: Computer Vision & Robotics** connects perception with physical action:
- **What is Computer Vision?**: Processing multidimensional digital pixel data for feature detection, convolutions, and image segmentation.
- **Object and Face Recognition**: Bounding-box localization, real-time YOLO object detectors, and facial landmark biometric recognition.
- **Robotics Fundamentals**: Mechanical actuators, forward and inverse kinematics, sensory feedback loops, and LiDAR mapping.
- **How AI and Robotics Work Together**: Embodied artificial intelligence, autonomous mobile robot (AMR) pathfinding, and vision-guided robotic manipulation.`;
    } else if (query.includes('module 7') || query.includes('ethics') || query.includes('career') || query.includes('future') || query.includes('deepfake')) {
      reply = `**Module 7: AI Ethics, Careers & the Future** prepares students for the societal impact of intelligent technologies:
- **AI Ethics - Fairness and Bias**: Preventing algorithmic discrimination, addressing training dataset biases, and ensuring demographic parity.
- **Deepfakes and Misinformation**: Synthetic media generation risks, cryptographic provenance verification, and digital watermarking.
- **Responsible AI & Cyber Safety**: Data privacy rights, guardrails against prompt injection, and cyber hygiene.
- **Careers in AI**: High-demand trajectories including Machine Learning Engineer, AI Research Scientist, Computer Vision Specialist, and AI Ethics Auditor.
- **The Future of AI**: Artificial General Intelligence (AGI), autonomous agents, quantum AI, and symbiotic human-machine intelligence.`;
    } else if (query.includes('syllabus') || query.includes('modules') || query.includes('course') || query.includes('topics')) {
      reply = `**PRAGATHI AI Comprehensive 7-Module Curriculum**:
1. **Module 1**: Introduction to AI *(What is AI, History, Types, AI around us, Intelligent Agents)*
2. **Module 2**: How AI Thinks *(Problem Solving, Search Strategies, Heuristics, Decision Trees)*
3. **Module 3**: Logic & Reasoning *(If-Then Rules, Knowledge Representation, Logical Reasoning, Rule-Based & Expert Systems)*
4. **Module 4**: Machine Learning *(Supervised, Unsupervised, Reinforcement Learning, Neural Networks, Deep Learning)*
5. **Module 5**: NLP & Generative AI *(NLP, Conversational Tools, Prompt Engineering, Translation, Generative Media)*
6. **Module 6**: Computer Vision & Robotics *(Computer Vision, Object/Face Recognition, Robotics, Embodied AI)*
7. **Module 7**: AI Ethics, Careers & the Future *(Ethics & Bias, Deepfakes, Responsible AI, Career Paths, Future of AI)*

Ask me about any specific module to learn more!`;
    } else if (query.includes('exam') || query.includes('quiz') || query.includes('score') || query.includes('result') || query.includes('test')) {
      reply = `**Examinations & Assessments in PRAGATHI AI**:
- **Multi-Mode Question Formats**: Our platform supports **MCQs (Multiple Choice)**, **Fill-in-the-Blanks**, **Theory Conceptual Essays**, and **Practical Assignments**.
- **Instant Automatic Evaluation**: When you submit your exam, our automatic evaluation engine grades your responses immediately using rubric keyword matching and answer validation.
- **Instant Scorecard**: Your detailed scorecard displays your score, percentage, pass/fail status, and feedback with model reference answers.
- **Retake Options**: You can retake assessments to improve your score.
Visit the **Assessments** tab on your student navigation to start an exam!`;
    } else if (query.includes('photo') || query.includes('picture') || query.includes('avatar') || query.includes('profile')) {
      reply = `**Student Photo Integration**:
- You can add or update your student photo anytime from your **Student Profile** page (\`/student/profile\`).
- Simply click the camera icon on your profile avatar to upload an image from your device, or paste an image link into the photo field and click **Save Photo**.
- Your photo will immediately appear on your student card and be visible to your instructors and school administrators.`;
    } else if (query.includes('mobile') || query.includes('app') || query.includes('download') || query.includes('install')) {
      reply = `**PRAGATHI AI Mobile App (PWA)**:
- PRAGATHI AI is fully built as a **Progressive Web App (PWA)**!
- You can install it directly on your Android phone, iPhone, or iPad without downloading from an app store:
  - **On Android**: Tap the browser menu (three dots) and select **"Add to Home screen"** or **"Install App"**.
  - **On iPhone/iPad**: Tap the Share button in Safari and select **"Add to Home Screen"**.
- It provides a native full-screen experience with fast offline loading!`;
    } else {
      reply = `Hello! I am **PRAGATHI AI Tutor**, your intelligent academic guide. 
I can help you with:
- **Curriculum Details**: Deep explanations of all 7 syllabus modules (AI Foundations, Problem Solving, Logic, Machine Learning, NLP & GenAI, Robotics, Ethics & Careers).
- **Assessments & Quizzes**: Taking multi-mode exams and reviewing instant scorecards.
- **Student Profile**: How to upload your photo, update credentials, and submit assignments.
- **PWA Mobile App**: Installing PRAGATHI AI on your phone or tablet.

What topic would you like to explore today?`;
    }

    return NextResponse.json({ reply });
  } catch (err) {
    console.error('AI chat error:', err);
    return NextResponse.json({ error: 'Failed to process AI chat query' }, { status: 500 });
  }
}
