'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Sliders,
  Cpu,
  Brain,
  Eye,
  Zap,
  Play,
  RotateCcw,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  Code,
  Layers,
  Terminal,
} from 'lucide-react';

export default function AiPlayground() {
  const [activeTab, setActiveTab] = useState<'neural' | 'prompt' | 'vision'>('neural');

  // Neural Network Simulator State
  const [x1, setX1] = useState(1.0);
  const [x2, setX2] = useState(0.5);
  const [w1, setW1] = useState(0.8);
  const [w2, setW2] = useState(-0.4);
  const [bias, setBias] = useState(0.1);
  const [activation, setActivation] = useState<'relu' | 'sigmoid' | 'step'>('relu');

  const z = Number((x1 * w1 + x2 * w2 + bias).toFixed(3));
  let output = 0;
  if (activation === 'relu') {
    output = Math.max(0, z);
  } else if (activation === 'sigmoid') {
    output = 1 / (1 + Math.exp(-z));
  } else if (activation === 'step') {
    output = z >= 0 ? 1 : 0;
  }
  const formattedOutput = Number(output.toFixed(3));

  // Prompt Lab State
  const [promptText, setPromptText] = useState('Explain how artificial neural networks learn from training data.');
  const [temperature, setTemperature] = useState(0.7);
  const [persona, setPersona] = useState('Academic Tutor');
  const [promptResult, setPromptResult] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  // Vision Kernel Lab State
  const [selectedKernel, setSelectedKernel] = useState<'edge' | 'sharpen' | 'blur'>('edge');

  const handleRunPrompt = () => {
    setGenerating(true);
    setTimeout(() => {
      let simulatedResponse = '';
      if (persona === 'Academic Tutor') {
        simulatedResponse = `[Mode: Academic Tutor | Temp: ${temperature}]\nNeural networks learn through an iterative cycle called backpropagation. First, input features propagate through weighted synapses to produce a prediction (forward pass). The error between prediction and ground truth is measured via a loss function. Gradients of this loss are then propagated backward using the calculus chain rule, systematically adjusting each weight via gradient descent.`;
      } else if (persona === 'Coding Assistant') {
        simulatedResponse = `[Mode: Python Coder | Temp: ${temperature}]\nimport torch\nimport torch.nn as nn\n\n# Standard feedforward neural network\nmodel = nn.Sequential(\n    nn.Linear(10, 64),\n    nn.ReLU(),\n    nn.Linear(64, 2)\n)\n\noptimizer = torch.optim.Adam(model.parameters(), lr=0.001)\ncriterion = nn.CrossEntropyLoss()\n# Loss calculation and backprop:\n# loss = criterion(outputs, labels); optimizer.step()`;
      } else {
        simulatedResponse = `[Mode: Creative Explainer | Temp: ${temperature}]\nImagine a team of detectives where each detective focuses on a single clue (weights). When they make an incorrect guess, the chief inspector recalculates whose clue misled them the most (backpropagation), adjusting each detective's confidence score until the entire team solves cases with near-perfect accuracy!`;
      }
      setPromptResult(simulatedResponse);
      setGenerating(false);
    }, 600);
  };

  return (
    <div className="space-y-8">
      {/* Navigation Tabs */}
      <div className="flex items-center space-x-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200 w-fit">
        <button
          onClick={() => setActiveTab('neural')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeTab === 'neural'
              ? 'bg-white text-teal-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Brain className="w-4 h-4 text-teal-600" />
          <span>Neural Network Simulator</span>
        </button>

        <button
          onClick={() => setActiveTab('prompt')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeTab === 'prompt'
              ? 'bg-white text-teal-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sliders className="w-4 h-4 text-teal-600" />
          <span>Prompt Engineering Lab</span>
        </button>

        <button
          onClick={() => setActiveTab('vision')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeTab === 'vision'
              ? 'bg-white text-teal-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Eye className="w-4 h-4 text-teal-600" />
          <span>Computer Vision Convolutions</span>
        </button>
      </div>

      {/* 1. Neural Network Interactive Simulator */}
      {activeTab === 'neural' && (
        <div className="grid lg:grid-cols-12 gap-8 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs">
          {/* Controls Column */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">
                Hands-On Lab • Module 4
              </span>
              <h2 className="text-xl font-black text-slate-900 mt-1">
                Artificial Neuron & Perceptron Lab
              </h2>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Adjust input stimuli, connection weights, and bias to witness how an artificial neuron computes mathematical activations.
              </p>
            </div>

            <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
              {/* Input 1 & Weight 1 */}
              <div>
                <div className="flex justify-between font-bold text-slate-700 mb-1">
                  <span>Input 1 (x₁): {x1}</span>
                  <span>Weight 1 (w₁): {w1}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="range"
                    min="-2"
                    max="2"
                    step="0.1"
                    value={x1}
                    onChange={(e) => setX1(parseFloat(e.target.value))}
                    className="accent-teal-600 cursor-pointer"
                  />
                  <input
                    type="range"
                    min="-2"
                    max="2"
                    step="0.1"
                    value={w1}
                    onChange={(e) => setW1(parseFloat(e.target.value))}
                    className="accent-teal-600 cursor-pointer"
                  />
                </div>
              </div>

              {/* Input 2 & Weight 2 */}
              <div>
                <div className="flex justify-between font-bold text-slate-700 mb-1">
                  <span>Input 2 (x₂): {x2}</span>
                  <span>Weight 2 (w₂): {w2}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="range"
                    min="-2"
                    max="2"
                    step="0.1"
                    value={x2}
                    onChange={(e) => setX2(parseFloat(e.target.value))}
                    className="accent-teal-600 cursor-pointer"
                  />
                  <input
                    type="range"
                    min="-2"
                    max="2"
                    step="0.1"
                    value={w2}
                    onChange={(e) => setW2(parseFloat(e.target.value))}
                    className="accent-teal-600 cursor-pointer"
                  />
                </div>
              </div>

              {/* Bias Slider */}
              <div>
                <div className="flex justify-between font-bold text-slate-700 mb-1">
                  <span>Neuron Threshold Bias (b):</span>
                  <span>{bias}</span>
                </div>
                <input
                  type="range"
                  min="-2"
                  max="2"
                  step="0.1"
                  value={bias}
                  onChange={(e) => setBias(parseFloat(e.target.value))}
                  className="w-full accent-teal-600 cursor-pointer"
                />
              </div>

              {/* Activation Function */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Activation Function</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['relu', 'sigmoid', 'step'] as const).map((fn) => (
                    <button
                      key={fn}
                      type="button"
                      onClick={() => setActivation(fn)}
                      className={`py-1.5 font-bold uppercase rounded-lg text-xs transition ${
                        activation === fn
                          ? 'bg-teal-600 text-white shadow-xs'
                          : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {fn}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Reset */}
            <button
              onClick={() => {
                setX1(1.0);
                setX2(0.5);
                setW1(0.8);
                setW2(-0.4);
                setBias(0.1);
                setActivation('relu');
              }}
              className="inline-flex items-center space-x-1 text-xs font-bold text-slate-500 hover:text-slate-800"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Parameters</span>
            </button>
          </div>

          {/* Interactive Visual Graph Column */}
          <div className="lg:col-span-7 bg-slate-900 text-white p-6 rounded-3xl flex flex-col justify-between relative overflow-hidden shadow-inner">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-bold text-teal-400 font-mono">NEURAL_CIRCUIT_SIMULATOR_V2</span>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                Live Signal Propagation
              </span>
            </div>

            {/* Visual SVG Circuit */}
            <div className="py-6 flex items-center justify-center">
              <svg viewBox="0 0 500 240" className="w-full max-w-md h-auto">
                {/* Synapse Lines */}
                <line x1="80" y1="60" x2="250" y2="120" stroke="#0d9488" strokeWidth="3" />
                <line x1="80" y1="180" x2="250" y2="120" stroke="#0d9488" strokeWidth="3" />
                <line x1="250" y1="120" x2="420" y2="120" stroke="#10b981" strokeWidth="4" />

                {/* Input Nodes */}
                <circle cx="80" cy="60" r="28" fill="#1e293b" stroke="#38bdf8" strokeWidth="3" />
                <text x="80" y="55" fill="#94a3b8" fontSize="10" textAnchor="middle" fontWeight="bold">INPUT 1</text>
                <text x="80" y="72" fill="#ffffff" fontSize="13" textAnchor="middle" fontWeight="900">{x1}</text>

                <circle cx="80" cy="180" r="28" fill="#1e293b" stroke="#38bdf8" strokeWidth="3" />
                <text x="80" y="175" fill="#94a3b8" fontSize="10" textAnchor="middle" fontWeight="bold">INPUT 2</text>
                <text x="80" y="192" fill="#ffffff" fontSize="13" textAnchor="middle" fontWeight="900">{x2}</text>

                {/* Synapse Weights Labels */}
                <rect x="135" y="65" width="55" height="18" rx="4" fill="#0f172a" />
                <text x="162" y="78" fill="#38bdf8" fontSize="10" textAnchor="middle" fontWeight="bold">w1={w1}</text>

                <rect x="135" y="155" width="55" height="18" rx="4" fill="#0f172a" />
                <text x="162" y="168" fill="#38bdf8" fontSize="10" textAnchor="middle" fontWeight="bold">w2={w2}</text>

                {/* Center Artificial Neuron */}
                <circle cx="250" cy="120" r="38" fill="#0f766e" stroke="#2dd4bf" strokeWidth="4" />
                <text x="250" y="112" fill="#ccfbf1" fontSize="10" textAnchor="middle" fontWeight="bold">SUM: {z}</text>
                <text x="250" y="132" fill="#ffffff" fontSize="13" textAnchor="middle" fontWeight="900">{activation.toUpperCase()}</text>

                {/* Output Node */}
                <circle cx="420" cy="120" r="32" fill={output > 0 ? '#059669' : '#475569'} stroke="#6ee7b7" strokeWidth="3" />
                <text x="420" y="112" fill="#d1fae5" fontSize="10" textAnchor="middle" fontWeight="bold">OUTPUT</text>
                <text x="420" y="132" fill="#ffffff" fontSize="15" textAnchor="middle" fontWeight="900">{formattedOutput}</text>
              </svg>
            </div>

            {/* Formula Explanation */}
            <div className="p-3.5 bg-slate-800/80 rounded-2xl border border-slate-700 font-mono text-xs space-y-1">
              <div className="text-teal-400">
                Linear Weighted Sum (z) = ({x1} × {w1}) + ({x2} × {w2}) + {bias} = <strong>{z}</strong>
              </div>
              <div className="text-emerald-300">
                Activation Output (y) = {activation}({z}) = <strong className="text-white text-sm">{formattedOutput}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Prompt Engineering Lab */}
      {activeTab === 'prompt' && (
        <div className="grid lg:grid-cols-12 gap-8 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs">
          <div className="lg:col-span-5 space-y-5">
            <div>
              <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">
                Hands-On Lab • Module 5
              </span>
              <h2 className="text-xl font-black text-slate-900 mt-1">
                Prompt Engineering & Temperature Lab
              </h2>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Observe how varying system personas and sampling temperatures fundamentally alter AI generation consistency, creativity, and structure.
              </p>
            </div>

            <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target System Persona</label>
                <select
                  value={persona}
                  onChange={(e) => setPersona(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-semibold"
                >
                  <option value="Academic Tutor">Academic AI Tutor (Structured & Educational)</option>
                  <option value="Coding Assistant">Python ML Engineer (Code-First)</option>
                  <option value="Creative Storyteller">Creative Storyteller (Metaphorical & Engaging)</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between font-bold text-slate-700 mb-1">
                  <span>Temperature: {temperature}</span>
                  <span className="text-teal-700">
                    {temperature <= 0.3 ? 'Deterministic & Precise' : temperature <= 0.7 ? 'Balanced' : 'High Creativity'}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full accent-teal-600 cursor-pointer"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Prompt Query</label>
                <textarea
                  rows={3}
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <button
                onClick={handleRunPrompt}
                disabled={generating}
                className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-xs transition flex items-center justify-center space-x-2"
              >
                <Zap className="w-4 h-4" />
                <span>{generating ? 'Simulating Inference...' : 'Execute Prompt Test'}</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-7 bg-slate-900 text-white p-6 rounded-3xl flex flex-col justify-between shadow-inner">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-bold text-teal-400 font-mono">LLM_INFERENCE_OUTPUT</span>
              <span className="text-[10px] text-slate-400">Tokens: ~{promptText.split(/\s+/).length * 2}</span>
            </div>

            <div className="my-6 p-4 bg-slate-800/80 rounded-2xl border border-slate-700 text-xs leading-relaxed whitespace-pre-wrap font-mono min-h-[160px]">
              {promptResult || (
                <span className="text-slate-500 italic">
                  Click "Execute Prompt Test" to simulate inference output with current temperature and persona settings...
                </span>
              )}
            </div>

            <div className="p-3 bg-slate-800 rounded-xl text-[11px] text-slate-300 flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
              <span>
                <strong>Prompt Tip:</strong> Lower temperature (0.1–0.3) is best for math, coding, and factual recall. Higher temperature (0.8–1.0) is ideal for creative brainstorming.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Computer Vision Convolutions Lab */}
      {activeTab === 'vision' && (
        <div className="grid lg:grid-cols-12 gap-8 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs">
          <div className="lg:col-span-5 space-y-5">
            <div>
              <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">
                Hands-On Lab • Module 6
              </span>
              <h2 className="text-xl font-black text-slate-900 mt-1">
                Computer Vision Matrix Convolutions
              </h2>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Computer vision processes images by sliding 2D mathematical matrix kernels across pixel arrays to detect horizontal and vertical edges.
              </p>
            </div>

            <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
              <label className="block font-bold text-slate-700">Select Convolution Kernel:</label>
              <div className="space-y-2">
                {[
                  { id: 'edge', title: 'Sobel Edge Detection', desc: 'Detects structural boundaries and object outlines' },
                  { id: 'sharpen', title: 'Image Sharpening', desc: 'Accentuates contrast and fine pixel details' },
                  { id: 'blur', title: 'Gaussian Smoothing', desc: 'Eliminates sensor noise and softens textures' },
                ].map((k) => (
                  <label
                    key={k.id}
                    onClick={() => setSelectedKernel(k.id as any)}
                    className={`block p-3 rounded-xl border cursor-pointer transition ${
                      selectedKernel === k.id
                        ? 'bg-teal-50 border-teal-500 ring-1 ring-teal-500'
                        : 'bg-white border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        checked={selectedKernel === k.id}
                        onChange={() => setSelectedKernel(k.id as any)}
                        className="text-teal-600"
                      />
                      <span className="font-bold text-slate-900">{k.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 ml-5 mt-0.5">{k.desc}</p>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 bg-slate-900 text-white p-6 rounded-3xl flex flex-col justify-between shadow-inner">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-bold text-teal-400 font-mono">CONVOLUTION_KERNEL_MATRIX (3×3)</span>
              <span className="text-[11px] text-emerald-400 font-bold">Pixel Transformation</span>
            </div>

            <div className="my-6 grid grid-cols-3 gap-3 max-w-xs mx-auto text-center font-mono font-black text-sm">
              {selectedKernel === 'edge' ? (
                <>
                  <div className="p-3 bg-slate-800 border border-slate-700 rounded-xl">-1</div>
                  <div className="p-3 bg-slate-800 border border-slate-700 rounded-xl">-1</div>
                  <div className="p-3 bg-slate-800 border border-slate-700 rounded-xl">-1</div>
                  <div className="p-3 bg-slate-800 border border-slate-700 rounded-xl">-1</div>
                  <div className="p-3 bg-teal-600 text-white border border-teal-400 rounded-xl">8</div>
                  <div className="p-3 bg-slate-800 border border-slate-700 rounded-xl">-1</div>
                  <div className="p-3 bg-slate-800 border border-slate-700 rounded-xl">-1</div>
                  <div className="p-3 bg-slate-800 border border-slate-700 rounded-xl">-1</div>
                  <div className="p-3 bg-slate-800 border border-slate-700 rounded-xl">-1</div>
                </>
              ) : selectedKernel === 'sharpen' ? (
                <>
                  <div className="p-3 bg-slate-800 border border-slate-700 rounded-xl">0</div>
                  <div className="p-3 bg-slate-800 border border-slate-700 rounded-xl">-1</div>
                  <div className="p-3 bg-slate-800 border border-slate-700 rounded-xl">0</div>
                  <div className="p-3 bg-slate-800 border border-slate-700 rounded-xl">-1</div>
                  <div className="p-3 bg-teal-600 text-white border border-teal-400 rounded-xl">5</div>
                  <div className="p-3 bg-slate-800 border border-slate-700 rounded-xl">-1</div>
                  <div className="p-3 bg-slate-800 border border-slate-700 rounded-xl">0</div>
                  <div className="p-3 bg-slate-800 border border-slate-700 rounded-xl">-1</div>
                  <div className="p-3 bg-slate-800 border border-slate-700 rounded-xl">0</div>
                </>
              ) : (
                <>
                  <div className="p-3 bg-slate-800 border border-slate-700 rounded-xl">1/9</div>
                  <div className="p-3 bg-slate-800 border border-slate-700 rounded-xl">1/9</div>
                  <div className="p-3 bg-slate-800 border border-slate-700 rounded-xl">1/9</div>
                  <div className="p-3 bg-slate-800 border border-slate-700 rounded-xl">1/9</div>
                  <div className="p-3 bg-teal-600 text-white border border-teal-400 rounded-xl">1/9</div>
                  <div className="p-3 bg-slate-800 border border-slate-700 rounded-xl">1/9</div>
                  <div className="p-3 bg-slate-800 border border-slate-700 rounded-xl">1/9</div>
                  <div className="p-3 bg-slate-800 border border-slate-700 rounded-xl">1/9</div>
                  <div className="p-3 bg-slate-800 border border-slate-700 rounded-xl">1/9</div>
                </>
              )}
            </div>

            <div className="p-3.5 bg-slate-800/80 rounded-2xl border border-slate-700 text-xs text-slate-300">
              <strong>How it works:</strong> Each output pixel is computed by multiplying neighboring input pixels by the 3×3 kernel weights and summing the result:
              <div className="mt-1 font-mono text-teal-400">P_out(x, y) = Σ [P_in(x+i, y+j) × K(i, j)]</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
