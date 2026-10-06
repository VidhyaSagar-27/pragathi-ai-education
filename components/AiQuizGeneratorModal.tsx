'use client';

import React, { useState } from 'react';
import { Sparkles, Brain, Check, X, RefreshCw, Layers, BookOpen } from 'lucide-react';
import { QuestionDraft } from '@/app/instructor/quizzes/page';

interface AiQuizGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyQuestions: (generatedQuestions: QuestionDraft[], suggestedTitle: string) => void;
}

const PRESET_TOPICS = [
  {
    moduleId: 1,
    title: 'Introduction to Artificial Intelligence',
    description: 'Foundations of AI, Intelligent Agents, and AI History',
    sampleQuestions: [
      {
        type: 'MCQ' as const,
        question: 'Which of the following best defines Artificial Intelligence?',
        options: [
          'Simulation of human intelligence in machines',
          'Only writing computer games',
          'A hardware chip for faster internet',
          'A robotic vacuum cleaner only',
        ],
        correctOptionIndex: 0,
        acceptableAnswers: '',
        theoryKeywords: 'simulation, human intelligence, algorithms',
        modelAnswer: 'AI is the study and design of intelligent agents that can perceive their environment and take actions that maximize chances of success.',
        marks: 2,
        explanation: 'AI refers to computer systems engineered to perform tasks that typically require human intelligence, such as reasoning and learning.',
      },
      {
        type: 'MCQ' as const,
        question: 'Who is widely recognized as the father of modern Artificial Intelligence and coined the term in 1956?',
        options: ['John McCarthy', 'Alan Turing', 'Steve Jobs', 'Charles Babbage'],
        correctOptionIndex: 0,
        acceptableAnswers: '',
        theoryKeywords: 'John McCarthy, Dartmouth Conference',
        modelAnswer: 'John McCarthy coined the term Artificial Intelligence at the Dartmouth Conference in 1956.',
        marks: 2,
        explanation: 'John McCarthy organized the Dartmouth conference in 1956 where the field of AI was officially born.',
      },
      {
        type: 'MCQ' as const,
        question: 'What is a Rational Agent in AI?',
        options: [
          'An agent that acts to achieve the best expected outcome',
          'A robot made of metal only',
          'A computer that never turns off',
          'A program that only calculates numbers',
        ],
        correctOptionIndex: 0,
        acceptableAnswers: '',
        theoryKeywords: 'rational agent, best outcome, environment perception',
        modelAnswer: 'A rational agent perceives its environment through sensors and takes actions through actuators to achieve the best expected outcome.',
        marks: 2,
        explanation: 'Rationality in AI means making decisions that maximize performance measures given current knowledge.',
      },
    ],
  },
  {
    moduleId: 2,
    title: 'How AI Thinks & Problem Solving',
    description: 'Search algorithms, decision trees, heuristics, and state space',
    sampleQuestions: [
      {
        type: 'MCQ' as const,
        question: 'What is a Heuristic in AI problem solving?',
        options: [
          'A rule of thumb or informed guess that guides the search',
          'A type of computer screen',
          'An error message that crashes programs',
          'A physical wire in a robotic arm',
        ],
        correctOptionIndex: 0,
        acceptableAnswers: '',
        theoryKeywords: 'heuristic, rule of thumb, search optimization',
        modelAnswer: 'A heuristic is an informed estimate that helps search algorithms choose the most promising path.',
        marks: 2,
        explanation: 'Heuristics guide state-space search to find solutions faster without checking every single possibility.',
      },
      {
        type: 'MCQ' as const,
        question: 'In a Decision Tree, what do the leaf nodes represent?',
        options: [
          'The final decision or predicted class',
          'The root starting question',
          'The internet connection speed',
          'The number of CPU cores',
        ],
        correctOptionIndex: 0,
        acceptableAnswers: '',
        theoryKeywords: 'leaf nodes, final classification, outcome',
        modelAnswer: 'Leaf nodes represent the final outcome or classification of the decision path.',
        marks: 2,
        explanation: 'Internal nodes test attributes, branches represent outcomes, and leaf nodes hold the final classification.',
      },
    ],
  },
  {
    moduleId: 4,
    title: 'Machine Learning & Neural Networks',
    description: 'Supervised vs Unsupervised learning, weights, and layers',
    sampleQuestions: [
      {
        type: 'MCQ' as const,
        question: 'Which machine learning paradigm uses labeled training data with known correct outputs?',
        options: [
          'Supervised Learning',
          'Unsupervised Learning',
          'Random Trial',
          'Binary Logic Only',
        ],
        correctOptionIndex: 0,
        acceptableAnswers: '',
        theoryKeywords: 'supervised learning, labeled data, ground truth',
        modelAnswer: 'Supervised learning trains models on labeled inputs paired with verified outputs.',
        marks: 2,
        explanation: 'Supervised learning maps input features to target labels using historical labeled examples.',
      },
      {
        type: 'MCQ' as const,
        question: 'In an Artificial Neural Network, what connects neurons across layers?',
        options: [
          'Weights and Biases',
          'Fiber optic cables',
          'USB cables',
          'Webcam pixels',
        ],
        correctOptionIndex: 0,
        acceptableAnswers: '',
        theoryKeywords: 'weights, biases, activation function',
        modelAnswer: 'Synaptic weights determine the strength of connections between artificial neurons.',
        marks: 2,
        explanation: 'Weights scale the signal between interconnected neurons and get optimized during training through backpropagation.',
      },
      {
        type: 'MCQ' as const,
        question: 'What is Overfitting in machine learning?',
        options: [
          'Model memorizes training data but fails on new unseen data',
          'Computer runs out of battery',
          'The camera resolution is too high',
          'The program prints text too fast',
        ],
        correctOptionIndex: 0,
        acceptableAnswers: '',
        theoryKeywords: 'overfitting, generalization error, memorization',
        modelAnswer: 'Overfitting occurs when a model learns noise in training data and fails to generalize to novel inputs.',
        marks: 2,
        explanation: 'Good AI models strike a balance by generalizing patterns rather than blindly memorizing training examples.',
      },
    ],
  },
  {
    moduleId: 5,
    title: 'Generative AI & Prompt Engineering',
    description: 'Large Language Models, tokens, context windows, and ethical AI',
    sampleQuestions: [
      {
        type: 'MCQ' as const,
        question: 'What is a "Token" in Large Language Models (LLMs)?',
        options: [
          'A chunk of characters or word sub-units processed by the model',
          'A physical metal coin used to start a computer',
          'The login password of a student',
          'A brand of robotic sensor',
        ],
        correctOptionIndex: 0,
        acceptableAnswers: '',
        theoryKeywords: 'token, tokenizer, sub-words, LLM input',
        modelAnswer: 'Tokens are the fundamental semantic text fragments processed and generated by LLMs.',
        marks: 2,
        explanation: 'LLMs break text down into tokens (roughly 4 characters or 0.75 words in English) to calculate probability distributions.',
      },
      {
        type: 'MCQ' as const,
        question: 'In Prompt Engineering, what does "Few-Shot Prompting" mean?',
        options: [
          'Providing a few sample input-output examples before the target question',
          'Taking photos with a fast camera',
          'Restarting the computer three times',
          'Limiting the response to three sentences',
        ],
        correctOptionIndex: 0,
        acceptableAnswers: '',
        theoryKeywords: 'few-shot prompting, in-context learning, demonstrations',
        modelAnswer: 'Few-shot prompting provides demonstrations of desired input-output mappings within the prompt context.',
        marks: 2,
        explanation: 'Few-shot prompting conditions the model on the expected format and reasoning style by showing 1–5 concrete examples.',
      },
      {
        type: 'MCQ' as const,
        question: 'What is AI "Hallucination"?',
        options: [
          'When an LLM produces plausible-sounding but factually incorrect information',
          'When a robot gets dizzy from spinning',
          'When the screen brightness is too low',
          'When code compiles with zero warnings',
        ],
        correctOptionIndex: 0,
        acceptableAnswers: '',
        theoryKeywords: 'hallucination, factual inconsistency, generation error',
        modelAnswer: 'Hallucination is when an AI model outputs inaccurate or fabricated statements with high confidence.',
        marks: 2,
        explanation: 'Because LLMs predict probable next tokens, they can generate fluent statements that do not correspond to verified reality.',
      },
    ],
  },
];

export default function AiQuizGeneratorModal({
  isOpen,
  onClose,
  onApplyQuestions,
}: AiQuizGeneratorModalProps) {
  const [selectedTopicIndex, setSelectedTopicIndex] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [generatedList, setGeneratedList] = useState<QuestionDraft[]>(PRESET_TOPICS[0].sampleQuestions);

  if (!isOpen) return null;

  const handleSelectTopic = (index: number) => {
    setSelectedTopicIndex(index);
    setGeneratedList(PRESET_TOPICS[index].sampleQuestions);
  };

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      setGeneratedList(PRESET_TOPICS[selectedTopicIndex].sampleQuestions);
      setGenerating(false);
    }, 400);
  };

  const handleApply = () => {
    const topic = PRESET_TOPICS[selectedTopicIndex];
    onApplyQuestions(generatedList, `Assessment: ${topic.title}`);
    onClose();
  };

  const currentTopic = PRESET_TOPICS[selectedTopicIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-700 to-indigo-900 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
              <Sparkles className="w-6 h-6 text-teal-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs uppercase tracking-wider font-extrabold text-teal-300">
                  Pragathi AI Assistant
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-teal-400 text-slate-950">
                  1-Click Generator
                </span>
              </div>
              <h2 className="text-lg font-black tracking-tight">AI Quiz & Assessment Generator</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Topic Select */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
              Select Curriculum Topic / Module
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {PRESET_TOPICS.map((topic, idx) => (
                <button
                  key={topic.title}
                  type="button"
                  onClick={() => handleSelectTopic(idx)}
                  className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
                    selectedTopicIndex === idx
                      ? 'border-teal-500 bg-teal-50/70 ring-2 ring-teal-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-teal-700 font-mono">
                      Module {topic.moduleId}
                    </span>
                    {selectedTopicIndex === idx && (
                      <Check className="w-4 h-4 text-teal-600" />
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 mt-1 line-clamp-1">{topic.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{topic.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Generated Preview Card */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                <Brain className="w-4 h-4 text-teal-600" />
                <span>Generated Questions Preview ({generatedList.length})</span>
              </h3>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={generating}
                className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center space-x-1 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
                <span>Regenerate Questions</span>
              </button>
            </div>

            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {generatedList.map((q, qIdx) => (
                <div
                  key={qIdx}
                  className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-2 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-slate-900">
                      Q{qIdx + 1}. {q.question}
                    </span>
                    <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-black bg-teal-100 text-teal-800">
                      {q.marks} Marks
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-2 text-[11px]">
                    {q.options.map((opt, oIdx) => (
                      <div
                        key={oIdx}
                        className={`p-1.5 rounded-lg border flex items-center space-x-1.5 ${
                          oIdx === q.correctOptionIndex
                            ? 'bg-emerald-50 border-emerald-300 font-bold text-emerald-900'
                            : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        <span className="font-mono text-[10px] opacity-60">
                          {String.fromCharCode(65 + oIdx)}.
                        </span>
                        <span>{opt}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-500 italic pt-1 border-t border-slate-200/60">
                    Explanation: {q.explanation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Apply Questions to Quiz</span>
          </button>
        </div>
      </div>
    </div>
  );
}
