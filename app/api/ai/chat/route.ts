import { NextRequest, NextResponse } from 'next/server';
import { getDb, noCacheHeaders } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Master system prompt for live LLMs (Gemini / OpenAI) if keys are provided
const MASTER_SYSTEM_PROMPT = `
You are "PRAGATHI AI Tutor", the official super-intelligent AI academic guide and omniscient assistant for PRAGATHI AI Education (https://pragathi-ai-education.vercel.app/).
You possess two vast realms of mastery:
1. COMPLETE WEBSITE & PLATFORM EXPERTISE:
- Admissions: Anyone can enroll at /register (New Student Enrollment form).
- Password & Credentials Retrieval: Students can look up their assigned login email and password using their 10-digit mobile number at /register?tab=status.
- Login: Student, Instructor, and Admin login at /login. Students can sign in using their email or 10-digit mobile number.
- Curriculum: Comprehensive 7-module handwritten syllabus at /curriculum (Module 1: Intro to AI, Module 2: How AI Thinks, Module 3: Logic & Reasoning, Module 4: Machine Learning, Module 5: NLP & GenAI, Module 6: Computer Vision & Robotics, Module 7: AI Ethics, Careers & Future).
- AI Playground: Interactive browser labs at /playground (Neuron/Perceptron Simulator, Prompt Engineering Lab, Computer Vision Convolutions Lab).
- Digital Certificates: Verifiable credentials with public registry at /verify-certificate.
- School Partnerships: Institutional collaboration form at /partnerships ("Bring PRAGATHI AI to Your School").
- Student Activities & Workshops: /activities.
- Student Achievements & Honors: /achievements.
- Media Gallery: /gallery.
- About Us: /about (Mission, Vision, 5 Core Educational Pillars).
- Contact Coordinates: /contact (Phone +91 9618611522, Email support@pragathiai.com).
- Mobile App: Installable Progressive Web App (PWA) on Android & iOS.
- Student Portal: /student (learning modules, study materials, quizzes with instant automatic evaluation and scorecards, assignments, certificates, profile photo upload).
- Instructor Portal: /instructor (materials upload, quiz creator, student progress, log reports).
- Admin Portal: /admin (student moderation, 1-click WhatsApp credentials dispatch, automated notifications, curriculum CMS).

2. VAST COMPUTER SCIENCE, ARTIFICIAL INTELLIGENCE, ROBOTICS & MATHEMATICS KNOWLEDGE:
- You have expert-level understanding of all AI/ML/DL/CS concepts from high school to graduate level:
  Perceptrons, Neural Networks, Weights, Biases, Activation Functions (ReLU, Sigmoid, Tanh, Softmax), Backpropagation, Gradient Descent, Loss Functions (MSE, Cross-Entropy), Supervised/Unsupervised/Reinforcement Learning, Decision Trees, Random Forests, SVM, K-Means, PCA, CNNs, Kernels, Convolutions, Pooling, YOLO, Transformers, Self-Attention (Q, K, V), LLMs, Diffusion Models, GANs, Prompt Engineering (CoT, few-shot), Tokenization, Robotics Kinematics, LiDAR, SLAM, Embodied AI, AI Ethics, Bias, Deepfakes, Python programming, and Math equations.

Always provide structured, clear, friendly, and authoritative responses with markdown formatting, code snippets, and mathematical formulas where helpful.
`;

export async function POST(req: NextRequest) {
  try {
    const { message, conversationHistory } = await req.json();
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400, headers: noCacheHeaders });
    }

    const cleanMsg = message.trim();
    const query = cleanMsg.toLowerCase();

    // 1. Check if external Gemini API key is configured
    if (process.env.GEMINI_API_KEY) {
      try {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [
                    { text: `${MASTER_SYSTEM_PROMPT}\n\nUser Question: ${cleanMsg}` },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1000,
              },
            }),
          }
        );

        if (geminiRes.ok) {
          const gData = await geminiRes.json();
          const text = gData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            return NextResponse.json({ reply: text, provider: 'GEMINI_AI' }, { headers: noCacheHeaders });
          }
        }
      } catch (err) {
        console.warn('Gemini API call error, falling back to comprehensive knowledge engine:', err);
      }
    }

    // 2. Comprehensive Multi-Domain Semantic Knowledge Engine
    let reply = '';

    // ==========================================
    // A. WEBSITE NAVIGATION & PLATFORM SERVICES
    // ==========================================
    if (
      query.includes('how to register') ||
      query.includes('how to enroll') ||
      query.includes('registration form') ||
      query.includes('admission') ||
      (query.includes('register') && (query.includes('student') || query.includes('new') || query.includes('where')))
    ) {
      reply = `### How to Register for PRAGATHI AI Education

Enrolling in PRAGATHI AI is quick and open to school students across Grades 6 to 12:

1. **Open the Registration Page**: Navigate to [/register](/register) on any mobile or desktop browser.
2. **Fill in the Student Application**:
   - **Student Full Name** & **Class / Grade** (Grades 6–12)
   - **School Name** (e.g. Narayana, DPS, KV, State Board, CBSE)
   - **Parent / Guardian Full Name** & **Mobile Number (10 Digits)**
   - **City / Town / Location** & Optional Email Address
3. **Submit the Application**: Click **"Submit Student Application"**.
4. **Administrative Review**: Our admissions team reviews your application.
5. **Receive Login Credentials**: Upon approval, your official Login Email and Password are automatically dispatched to your mobile number via **WhatsApp and SMS**, and can also be viewed immediately on [/register?tab=status](/register?tab=status).

👉 **[Click here to open the Registration Form](/register)**`;
    } else if (
      query.includes('password') ||
      query.includes('forgot password') ||
      query.includes('get password') ||
      query.includes('application status') ||
      query.includes('check status') ||
      query.includes('my credentials') ||
      query.includes('login email') ||
      query.includes('retrieve')
    ) {
      reply = `### How to Retrieve Your Login Email & Password

If you have registered or your application was approved, you can retrieve your credentials in seconds using our self-service lookup:

1. **Go to Status & Password Lookup**: Visit [/register?tab=status](/register?tab=status).
2. **Enter Your Registered Mobile Number**: Type the 10-digit mobile number you submitted during registration (or your email).
3. **Click "Check Status"**:
   - If **Approved**: Your official **Student Name**, **Login Email / ID**, and **Password** are displayed on a verified green card with 1-click **Copy** buttons and a direct **"Sign In to Student Portal"** button.
   - If **Pending**: The card confirms your application is under administrative review and will be activated shortly.
4. **WhatsApp & SMS Dispatch**: Credentials are also sent automatically to your mobile number via WhatsApp and SMS upon approval.

👉 **[Click here to Check Your Status & Get Credentials](/register?tab=status)**`;
    } else if (
      query.includes('how to login') ||
      query.includes('sign in') ||
      query.includes('student portal') ||
      query.includes('login page')
    ) {
      reply = `### PRAGATHI AI Portal Sign-In Guide

You can access the learning platform at [/login](/login):

- **For Students**:
  - Switch to the **Student** tab.
  - Enter either your **Assigned Email** (e.g. \`studentname@pragathiai.student\`) or your **10-digit Registered Mobile Number**.
  - Enter your **Password** (default initial password: \`Pragathi2026!\`).
  - Access all 7 learning modules, interactive quizzes, capstone assignments, and digital certificates!
- **For Instructors**: Switch to the **Instructor** tab to manage course materials, create evaluations, and track student log reports.
- **For Administrators**: Switch to the **Admin** tab to review pending applications, dispatch credentials via WhatsApp, and manage the curriculum CMS.

👉 **[Go to Sign In Portal](/login)**`;
    } else if (
      query.includes('playground') ||
      query.includes('simulator') ||
      query.includes('lab') ||
      query.includes('hands-on') ||
      query.includes('hands on')
    ) {
      reply = `### PRAGATHI AI Interactive Hands-on Labs & Playground

Experience artificial intelligence in real-time through our visual simulator at [/playground](/playground):

1. **Artificial Neuron & Perceptron Simulator (Module 4)**:
   - Adjust input sliders ($x_1, x_2$), synaptic weights ($w_1, w_2$), and bias ($b$).
   - Switch between **ReLU**, **Sigmoid**, and **Binary Step** activation functions.
   - Watch the animated neural circuit compute the linear sum $z = (x_1 w_1 + x_2 w_2) + b$ and generate activation output $\hat{y}$ live!
2. **Prompt Engineering & Inference Lab (Module 5)**:
   - Experiment with system personas (*AI Academic Tutor*, *Python ML Engineer*, *Storyteller*).
   - Adjust the **Temperature** slider (0.1 deterministic to 1.0 creative) and analyze token generation.
3. **Computer Vision Convolutions Lab (Module 6)**:
   - Apply 3×3 convolution kernel matrices live: **Sobel Edge Detection**, **Sharpening**, and **Gaussian Blur**.
   - See how pixel arrays transform through mathematical convolutions.

👉 **[Launch the AI Playground](/playground)**`;
    } else if (
      query.includes('certificate') ||
      query.includes('verify') ||
      query.includes('certification') ||
      query.includes('credential')
    ) {
      reply = `### Verifiable Digital Certificates & Public Registry

PRAGATHI AI issues cryptographically verifiable digital certificates upon curriculum completion and passing module exams:

- **Public Verification Registry**: Anyone (schools, parents, universities) can verify certificate authenticity at [/verify-certificate](/verify-certificate) by entering the Certificate ID (e.g. \`CERT-PRAGATHI-A8B9C1\`).
- **Student Certificate Locker**: View, download, and print high-resolution certificates from your Student Portal under [/student/certificates](/student/certificates).
- **Printable PDF View**: Full-color formal verification record suitable for academic portfolios.

👉 **[Verify a Certificate Now](/verify-certificate)**`;
    } else if (
      query.includes('school') ||
      query.includes('partnership') ||
      query.includes('bring pragathi') ||
      query.includes('partner') ||
      query.includes('institution')
    ) {
      reply = `### Bring PRAGATHI AI to Your School (Institutional Partnerships)

We partner with high schools, colleges, and educational trusts across India to deliver world-class AI labs and curriculum:

- **Complete Turnkey Solution**:
  - Full 7-Module AI & Robotics curriculum aligned with national educational standards.
  - Teacher training, instructor dashboards, and student analytics.
  - Cloud-based practice labs, evaluations, and verifiable student certification.
- **Submit a Partnership Inquiry**:
  - School principals and coordinators can apply directly at [/partnerships](/partnerships).
  - Our institutional partnership team responds within 24 hours to schedule a campus demo.

👉 **[Visit School Partnerships Portal](/partnerships)**`;
    } else if (
      query.includes('contact') ||
      query.includes('phone') ||
      query.includes('email') ||
      query.includes('support') ||
      query.includes('address') ||
      query.includes('helpdesk') ||
      query.includes('location')
    ) {
      reply = `### PRAGATHI AI Official Contact & Support Coordinates

We are here to assist students, parents, and educators:

- **Primary Phone Support**: [+91 9618611522](tel:+919618611522)
- **Secondary Phone Support**: [+91 9346056745](tel:+919346056745)
- **Official Support Email**: [support@pragathiai.com](mailto:support@pragathiai.com)
- **Admissions Email**: [admissions@pragathiai.com](mailto:admissions@pragathiai.com)
- **Online Inquiry Form**: Visit our dedicated contact page at [/contact](/contact).
- **Instagram**: [@pragathiai_official](https://instagram.com/pragathiai_official)

👉 **[Open Contact & Campus Page](/contact)**`;
    } else if (
      query.includes('whatsapp') ||
      query.includes('sms') ||
      query.includes('notification')
    ) {
      reply = `### WhatsApp & SMS Automated Communication System

PRAGATHI AI features an automated multi-channel messaging system:

1. **Admission Approval & Credentials**: The moment an administrator approves your enrollment, an automated WhatsApp and SMS notification is dispatched containing your Student Name, Login Email, Temporary Password, and Portal URL.
2. **Security OTPs**: Dispatched instantly for password resets and verification.
3. **Exam Scorecard Alerts**: Sent upon submitting evaluations with your score, percentage, and scorecard link.
4. **Admin Direct Action**: Administrators have a 1-click **"Send via WhatsApp"** button on the admin dashboard to open a pre-filled message directly to any student or parent.`;
    } else if (
      query.includes('activities') ||
      query.includes('hackathon') ||
      query.includes('workshop')
    ) {
      reply = `### Student Activities, AI Hackathons & Workshops

PRAGATHI AI engages students beyond textbooks with experiential learning:

- **Hands-on AI & Robotics Hackathons**: Collaborative team coding and autonomous navigation challenges.
- **Neural Circuit Experiments**: Building interactive models using visual simulators and micro-controllers.
- **Guest Masterclasses**: Live sessions with senior machine learning engineers and data scientists.
- **Capstone Project Showcases**: Students build working AI prototypes (plant disease detectors, smart chatbots, obstacle-avoiding rovers).

Explore all upcoming and past activities at [/activities](/activities)!`;
    } else if (
      query.includes('achievement') ||
      query.includes('honor') ||
      query.includes('award')
    ) {
      reply = `### Student Achievements & Recognition

Our students routinely excel in state, national, and international AI competitions:

- **National AI Olympiad Laureates**: Top percentile scores in algorithmic reasoning.
- **Innovative Capstone Prototypes**: Real-world computer vision solutions developed by high schoolers.
- **Institutional Honors**: Best School AI Innovation Awards.

Discover all featured student milestones at [/achievements](/achievements)!`;
    } else if (query.includes('gallery') || query.includes('photos') || query.includes('video')) {
      reply = `### PRAGATHI AI Media Gallery

Take a visual tour of our campus workshops, student lab sessions, certificate convocation ceremonies, and robotics demonstrations at [/gallery](/gallery)!`;
    } else if (query.includes('about') || query.includes('mission') || query.includes('vision') || query.includes('pillars')) {
      reply = `### About PRAGATHI AI Education

PRAGATHI AI is India's pioneer foundation dedicated to democratizing artificial intelligence, machine learning, and robotics education for school students:

- **Our Mission**: To empower every student with practical, ethical, and rigorous AI literacy, preparing them to be creators—not just consumers—of tomorrow's technology.
- **Our Vision**: An India where every young mind has access to advanced computational education, hands-on neural labs, and verifiable career pathways.
- **5 Core Pillars**:
  1. **Hands-on First**: Building neural circuits, prompts, and computer vision models.
  2. **Rigorous Curriculum**: 7 comprehensive modules from search algorithms to LLMs and robotics.
  3. **Ethical Foundations**: Responsible AI, bias mitigation, and cyber safety.
  4. **Career Readiness**: Bridging school studies to modern tech careers.
  5. **Universal Reach**: Accessible to students from all economic and regional backgrounds.

Read the complete story and educational philosophy at [/about](/about)!`;
    }

    // ==========================================
    // B. COMPREHENSIVE 7-MODULE CURRICULUM
    // ==========================================
    else if (query.includes('module 1') || (query.includes('intro') && query.includes('ai'))) {
      reply = `### Module 1: Introduction to Artificial Intelligence
**Full Curriculum Scope:**
- **What is AI?**: Computational systems capable of performing cognitive tasks typically requiring human intelligence—including reasoning, pattern recognition, learning, and decision-making.
- **History of AI**:
  - 1950: Alan Turing introduces the *Imitation Game* (Turing Test).
  - 1956: John McCarthy, Marvin Minsky, and Claude Shannon coin "Artificial Intelligence" at the Dartmouth Conference.
  - 1960s–1980s: First AI Winters due to hardware limits and rule explosion.
  - 1997: Deep Blue defeats Garry Kasparov in Chess.
  - 2012–Present: Deep learning revolution (AlexNet, AlphaGo, Transformers, Foundation Models).
- **Types of AI**:
  - **Narrow AI (ANI)**: Task-specific systems (Siri, self-driving vision, spam filters).
  - **General AI (AGI)**: Hypothetical human-level multi-domain cognitive intelligence.
  - **Super AI (ASI)**: Systems surpassing all human collective intelligence.
- **Intelligent Agents**: Autonomous agents perceiving environments via **Sensors** and influencing environments via **Actuators** through the *Perception-Action Cycle*.

👉 **[Explore Module 1 on the Curriculum Page](/curriculum#module-1)**`;
    } else if (query.includes('module 2') || query.includes('how ai thinks') || query.includes('search algorithm') || query.includes('heuristic')) {
      reply = `### Module 2: How AI Thinks — Search & Heuristics
**Full Curriculum Scope:**
- **Problem Solving in AI**: Modeling challenges as state spaces consisting of an Initial State, Action Operators, Transition Models, and Goal State Tests.
- **Search Strategies**:
  - **Uninformed (Blind) Search**:
    - **Breadth-First Search (BFS)**: Explores level by level using a FIFO queue; guaranteed shortest path on unweighted graphs ($O(b^d)$ time & memory).
    - **Depth-First Search (DFS)**: Explores deep branches using a LIFO stack; memory efficient ($O(bm)$), but not optimal.
  - **Informed (Heuristic) Search**:
    - **Greedy Best-First Search**: Selects nodes minimizing heuristic distance $h(n)$ to the goal.
    - **A\\* Search Algorithm**: Uses the evaluation function $f(n) = g(n) + h(n)$, where $g(n)$ is actual cost and $h(n)$ is an admissible heuristic estimate. Guaranteed optimal and complete!
- **Decision Trees**:
  - Classifying data by recursively splitting on feature attributes that maximize **Information Gain**:
    $$\\text{Entropy}(S) = -\\sum_{i=1}^{c} p_i \\log_2(p_i)$$
    $$\\text{Information Gain}(S, A) = \\text{Entropy}(S) - \\sum_{v \\in \\text{Values}(A)} \\frac{|S_v|}{|S|} \\text{Entropy}(S_v)$$

👉 **[Explore Module 2 on the Curriculum Page](/curriculum#module-2)**`;
    } else if (query.includes('module 3') || query.includes('logic') || query.includes('expert system') || query.includes('reasoning')) {
      reply = `### Module 3: Logic & Reasoning
**Full Curriculum Scope:**
- **Knowledge Representation**: Formal structures to encode human knowledge (Propositional Logic, First-Order Predicate Logic, Semantic Networks, Frames).
- **If-Then Rules**: Condition-action pairs forming production rule systems:
  $$\\text{IF } (\\text{temperature} > 38^\\circ\\text{C}) \\text{ AND } (\\text{cough} = \\text{TRUE}) \\text{ THEN } \\text{Diagnosis: FeverAlert}$$
- **Forms of Logical Reasoning**:
  - **Deductive Reasoning**: From general premises to logically certain specific conclusions ($A \\implies B$, $A$ is true $\\therefore B$ is true).
  - **Inductive Reasoning**: Deriving generalized rules from specific observed empirical patterns.
  - **Abductive Reasoning**: Finding the simplest and most likely explanation for observations.
- **Inference Engines**:
  - **Forward Chaining**: Data-driven reasoning starting with known facts and deriving new conclusions.
  - **Backward Chaining**: Goal-driven reasoning starting with a hypothesis and working backwards to find supporting facts.
- **Expert Systems**: Historic systems like **MYCIN** (medical bacterial diagnosis) and **DENDRAL** (chemical molecular analysis).

👉 **[Explore Module 3 on the Curriculum Page](/curriculum#module-3)**`;
    } else if (query.includes('module 4') || (query.includes('machine learning') && !query.includes('module 5')) || query.includes('supervised')) {
      reply = `### Module 4: Machine Learning & Neural Networks
**Full Curriculum Scope:**
- **The Three Machine Learning Paradigms**:
  1. **Supervised Learning**: Models learn a mapping $y = f(x)$ from labeled input-output pairs. Examples: Linear Regression, Logistic Regression, Support Vector Machines (SVM), Random Forests.
  2. **Unsupervised Learning**: Models discover underlying patterns and clustering from unlabeled data $x$. Examples: K-Means Clustering, Principal Component Analysis (PCA), Anomaly Detection.
  3. **Reinforcement Learning (RL)**: An autonomous agent learns optimal policies $\\pi(a|s)$ via trial-and-error using reward signals $R_t$. Governed by the **Bellman Equation**:
     $$Q(s, a) = R(s, a) + \\gamma \\max_{a'} Q(s', a')$$
- **Artificial Neural Networks (ANN)**:
  - Modeled after biological neurons.
  - A single **Perceptron** computes a weighted sum plus bias and passes it through a non-linear activation function:
    $$z = \\sum_{i=1}^{n} w_i x_i + b, \\quad \\hat{y} = f(z)$$
- **Activation Functions**: **ReLU** (Rectified Linear Unit: $\\max(0, z)$), **Sigmoid** ($\\frac{1}{1 + e^{-z}}$), **Tanh**, and **Softmax**.
- **Deep Learning**: Training deep multi-layer neural networks via **Backpropagation** using the multivariable chain rule to compute gradients $\\frac{\\partial \\text{Loss}}{\\partial w}$ and minimize error through **Gradient Descent**.

👉 **[Try the Interactive Neuron Lab in the AI Playground](/playground)**`;
    } else if (query.includes('module 5') || query.includes('nlp') || query.includes('generative ai') || query.includes('transformer') || query.includes('prompt')) {
      reply = `### Module 5: Natural Language Processing & Generative AI
**Full Curriculum Scope:**
- **What is NLP?**: Enabling computers to process, understand, and generate human language through tokenization, syntax parsing, semantic analysis, and embeddings.
- **Word Embeddings**: Representing words as high-dimensional vectors (Word2Vec, GloVe) where semantically similar concepts are located close together in vector space:
  $$\\vec{v}_{\\text{King}} - \\vec{v}_{\\text{Man}} + \\vec{v}_{\\text{Woman}} \\approx \\vec{v}_{\\text{Queen}}$$
- **The Transformer Revolution (Vaswani et al. 2017)**:
  - Replaced recurrent neural networks with **Scaled Dot-Product Self-Attention**:
    $$\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right)V$$
  - Enabled parallel processing of full sentences and powers all modern LLMs (GPT-4, Claude, Gemini).
- **Prompt Engineering**:
  - **Zero-Shot & Few-Shot Prompting**: Providing task instructions with zero or multiple exemplar pairs.
  - **Chain-of-Thought (CoT)**: Guiding the model to "think step-by-step" before delivering final answers.
  - **Temperature Control**: Scaling output randomness ($T=0.1$ for deterministic factual answers; $T=0.9$ for creative storytelling).
- **Generative Media**: **Diffusion Models** (Stable Diffusion, Midjourney) reversing Gaussian noise steps to synthesize photorealistic artwork and music.

👉 **[Try the Interactive Prompt Lab in the AI Playground](/playground)**`;
    } else if (query.includes('module 6') || query.includes('computer vision') || query.includes('robotics') || query.includes('yolo')) {
      reply = `### Module 6: Computer Vision & Robotics
**Full Curriculum Scope:**
- **Digital Image Representation**: Images as 2D/3D numerical arrays (RGB matrices where each pixel takes values from 0 to 255).
- **Convolutional Neural Networks (CNNs)**:
  - **Convolutions**: Sliding a small weight matrix (Kernel) across pixel grids to compute feature maps:
    $$P_{\\text{out}}(x, y) = \\sum_{i} \\sum_{j} P_{\\text{in}}(x-i, y-j) \\cdot K(i, j)$$
  - **Kernels**: Sobel filter (vertical/horizontal edges), Gaussian filter (blurring), Sharpening kernel.
  - **Pooling**: Downsampling feature maps (Max Pooling) to achieve spatial translation invariance.
- **Object Detection**: Bounding boxes, Intersection-over-Union (IoU), and real-time detectors like **YOLO** (You Only Look Once) and **ResNet**.
- **Robotics Foundations**:
  - **Actuators & Sensors**: DC motors, servos, ultrasonic rangefinders, LiDAR, and IMUs.
  - **Kinematics**: Calculating end-effector position from joint angles (Forward Kinematics) and joint angles from desired coordinates (Inverse Kinematics).
  - **Embodied AI**: Combining real-time computer vision with autonomous pathfinding (SLAM) for drones, delivery rovers, and robotic arms.

👉 **[Try the Interactive Convolutions Lab in the AI Playground](/playground)**`;
    } else if (query.includes('module 7') || query.includes('ethics') || query.includes('deepfake') || query.includes('career') || query.includes('future of ai')) {
      reply = `### Module 7: AI Ethics, Cyber Safety, Careers & the Future
**Full Curriculum Scope:**
- **Algorithmic Bias & Fairness**:
  - How historical training data can amplify social prejudices.
  - Mitigating bias through diverse dataset curation, demographic parity audits, and adversarial debiasing.
- **Deepfakes & Synthetic Media**:
  - Generative deepfakes, voice cloning, and identity impersonation risks.
  - Detection mechanisms: Cryptographic provenance, digital watermarking (C2PA standard), and biometric anomaly detection.
- **Cyber Safety & Responsible AI**:
  - Data privacy rights, GDPR/DPDP principles, and defenses against prompt injection and data poisoning.
- **AI Career Pathways**:
  - **Machine Learning Engineer**: Building and deploying predictive pipelines ($120k–$200k+).
  - **AI Research Scientist**: Developing next-generation foundation models.
  - **Computer Vision Specialist**: Autonomous navigation, medical radiology AI.
  - **Prompt Engineer & AI Product Manager**: Bridging enterprise workflows with LLMs.
  - **AI Ethics & Safety Officer**: Auditing compliance and algorithmic fairness.
- **The Horizon of AI**: Artificial General Intelligence (AGI), Quantum Machine Learning, and symbiotic Human-AI collaboration.

👉 **[Explore Full Curriculum Overview](/curriculum)**`;
    }

    // ==========================================
    // C. VAST TECHNICAL & PROGRAMMING KNOWLEDGE
    // ==========================================
    else if (
      query.includes('python') ||
      query.includes('code') ||
      query.includes('perceptron code') ||
      query.includes('programming')
    ) {
      reply = `### Python AI Implementation: Simple Perceptron from Scratch

Here is a complete, executable Python example demonstrating how an artificial neuron learns the **AND logic gate**:

\`\`\`python
import numpy as np

class Perceptron:
    def __init__(self, input_size, lr=0.1, epochs=20):
        self.weights = np.zeros(input_size)
        self.bias = 0.0
        self.lr = lr
        self.epochs = epochs

    def activate(self, z):
        return 1 if z >= 0 else 0

    def predict(self, x):
        z = np.dot(x, self.weights) + self.bias
        return self.activate(z)

    def train(self, X, y):
        for epoch in range(self.epochs):
            for xi, target in zip(X, y):
                prediction = self.predict(xi)
                error = target - prediction
                # Update weights and bias based on error
                self.weights += self.lr * error * xi
                self.bias += self.lr * error

# Training Data for logical AND gate
X = np.array([[0, 0], [0, 1], [1, 0], [1, 1]])
y = np.array([0, 0, 0, 1])

# Initialize and train the neuron
neuron = Perceptron(input_size=2)
neuron.train(X, y)

print("Trained Weights:", neuron.weights)
print("Trained Bias:", neuron.bias)
print("Testing (1, 1) ->", neuron.predict([1, 1]))  # Outputs: 1
print("Testing (1, 0) ->", neuron.predict([1, 0]))  # Outputs: 0
\`\`\`

Want to explore more code examples? Ask me about **Gradient Descent in Python**, **Decision Tree Classifiers**, or **PyTorch Neural Networks**!`;
    } else if (
      query.includes('activation function') ||
      query.includes('relu') ||
      query.includes('sigmoid') ||
      query.includes('softmax') ||
      query.includes('tanh')
    ) {
      reply = `### Deep Dive: Neural Activation Functions

Activation functions introduce non-linearity into neural networks. Without them, a multi-layer network collapses into a single linear transformation $y = Wx + b$.

1. **ReLU (Rectified Linear Unit)**:
   - **Formula**: $f(z) = \\max(0, z)$
   - **Derivative**: $f'(z) = 1$ if $z > 0$, else $0$.
   - **Advantages**: Computationally efficient; eliminates vanishing gradients for positive inputs.
   - **Disadvantages**: "Dying ReLU" problem if neurons remain inactive below 0.
2. **Sigmoid**:
   - **Formula**: $\\sigma(z) = \\frac{1}{1 + e^{-z}}$
   - **Output Range**: $(0, 1)$—ideal for probabilities in binary classification.
   - **Limitation**: Causes vanishing gradients for very large or small $z$.
3. **Tanh (Hyperbolic Tangent)**:
   - **Formula**: $\\tanh(z) = \\frac{e^z - e^{-z}}{e^z + e^{-z}}$
   - **Output Range**: $(-1, 1)$—zero-centered, which aids faster convergence than Sigmoid.
4. **Softmax (Multi-Class Classification)**:
   - **Formula**: $\\text{Softmax}(z_i) = \\frac{e^{z_i}}{\\sum_{j=1}^{C} e^{z_j}}$
   - Normalizes an arbitrary vector of raw logits into a valid probability distribution summing to 1.0.

👉 **[Experiment with ReLU and Sigmoid live in the AI Playground](/playground)**`;
    } else if (
      query.includes('gradient descent') ||
      query.includes('backpropagation') ||
      query.includes('loss function') ||
      query.includes('optimizer')
    ) {
      reply = `### How Neural Networks Learn: Loss Functions & Gradient Descent

Training an AI model is an optimization problem: minimizing the difference between predicted outputs $\\hat{y}$ and true labels $y$.

1. **Loss Functions**:
   - **Mean Squared Error (MSE)** (Regression):
     $$\\text{MSE} = \\frac{1}{n} \\sum_{i=1}^{n} (y_i - \\hat{y}_i)^2$$
   - **Binary Cross-Entropy** (Classification):
     $$\\mathcal{L} = -\\frac{1}{n} \\sum [y \\log(\\hat{y}) + (1-y) \\log(1-\\hat{y})]$$
2. **Gradient Descent**:
   - Updates weights in the opposite direction of the loss gradient:
     $$w \\leftarrow w - \\eta \\cdot \\frac{\\partial \\mathcal{L}}{\\partial w}$$
   - Where $\\eta$ (eta) is the **Learning Rate**.
3. **Backpropagation**:
   - Uses the calculus **Chain Rule** to propagate gradients backwards from the output layer to early hidden layers:
     $$\\frac{\\partial \\mathcal{L}}{\\partial w_{ij}} = \\frac{\\partial \\mathcal{L}}{\\partial a_j} \\cdot \\frac{\\partial a_j}{\\partial z_j} \\cdot \\frac{\\partial z_j}{\\partial w_{ij}}$$
4. **Modern Optimizers**:
   - **SGD with Momentum**: Accelerates along relevant directions and dampens oscillations.
   - **Adam (Adaptive Moment Estimation)**: Computes adaptive learning rates for each parameter by storing exponentially decaying averages of past gradients and squared gradients.`;
    }

    // ==========================================
    // D. GENERAL AI & FALLBACK WITH FULL SITEMAP
    // ==========================================
    else {
      reply = `Hello! I am **PRAGATHI AI Tutor**, your omniscient academic guide across the entire PRAGATHI AI platform and artificial intelligence curriculum.

Here is how I can assist you:

### 🌐 Whole-Website Direct Navigation:
- **Enroll & Register**: Learn how to apply at [/register](/register).
- **Check Status & Get Password**: Retrieve your assigned login email and password using your 10-digit mobile number at [/register?tab=status](/register?tab=status).
- **Student & Faculty Login**: Sign in to authorized portals at [/login](/login).
- **Interactive AI Playground**: Experiment with live neural circuits, prompt engineering, and convolutions at [/playground](/playground).
- **Verify Certificates**: Check digital credentials on our public verification registry at [/verify-certificate](/verify-certificate).
- **School Partnerships**: Request an AI lab or curriculum partnership at [/partnerships](/partnerships).
- **Campus & Support Coordinates**: Contact us by phone (+91 9618611522) or online at [/contact](/contact).

### 🧠 In-Depth AI & Computer Science Topics:
- **7-Module Syllabus**: Explanations of AI Foundations, Search & Heuristics, Logic, Machine Learning, NLP/LLMs, Computer Vision, Robotics, and Ethics.
- **Math & Algorithms**: Ask about Backpropagation, Gradient Descent, Attention ($Q, K, V$), Convolutions, Decision Trees, or Loss Functions.
- **Python Code**: Request code examples for Perceptrons, Neural Networks, or Prompt Engineering.

What topic would you like to explore?`;
    }

    return NextResponse.json({ reply, provider: 'KNOWLEDGE_ENGINE' }, { headers: noCacheHeaders });
  } catch (error: any) {
    console.error('AI Chatbot processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process AI chat request.' },
      { status: 500, headers: noCacheHeaders }
    );
  }
}
