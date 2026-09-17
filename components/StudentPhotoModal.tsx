'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Camera, Image as ImageIcon, X, Check, RefreshCw, Trash2, Upload, AlertCircle } from 'lucide-react';

interface StudentPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: {
    id: string;
    name: string;
    email?: string;
    photoUrl?: string;
  } | null;
  onPhotoSaved: (newPhotoUrl: string | null) => void;
}

export default function StudentPhotoModal({
  isOpen,
  onClose,
  student,
  onPhotoSaved,
}: StudentPhotoModalProps) {
  const [activeTab, setActiveTab] = useState<'LIBRARY' | 'CAMERA'>('LIBRARY');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const deviceCameraInputRef = useRef<HTMLInputElement | null>(null);

  // Reset when modal opens or student changes
  useEffect(() => {
    if (isOpen) {
      setPreviewUrl(null);
      setCameraError(null);
      setStatusMessage(null);
      setActiveTab('LIBRARY');
    } else {
      stopCamera();
    }
  }, [isOpen, student]);

  // Clean up stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const startCamera = async () => {
    stopCamera();
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera streaming is not supported on this browser. Use the device camera button below.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 640 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setIsCameraActive(false);
      setCameraError(
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? 'Camera permission was denied. Please allow camera permissions in your browser or choose a photo from your library.'
          : err.message || 'Unable to access camera.'
      );
    }
  };

  const handleTabChange = (tab: 'LIBRARY' | 'CAMERA') => {
    setActiveTab(tab);
    setPreviewUrl(null);
    setCameraError(null);
    if (tab === 'CAMERA') {
      startCamera();
    } else {
      stopCamera();
    }
  };

  // Convert and compress an image file to a 400x400 JPEG data URL
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (JPEG, PNG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current || document.createElement('canvas');
        const size = 400;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Crop center square
        const minDim = Math.min(img.width, img.height);
        const startX = (img.width - minDim) / 2;
        const startY = (img.height - minDim) / 2;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, size, size);
        ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, size, size);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setPreviewUrl(compressedDataUrl);
        stopCamera();
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Capture frame from live video feed
  const captureFromVideo = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    const canvas = canvasRef.current || document.createElement('canvas');
    const size = 400;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const minDim = Math.min(video.videoWidth, video.videoHeight);
    const startX = (video.videoWidth - minDim) / 2;
    const startY = (video.videoHeight - minDim) / 2;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    ctx.drawImage(video, startX, startY, minDim, minDim, 0, 0, size, size);

    const capturedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setPreviewUrl(capturedDataUrl);
    stopCamera();
  };

  const handleSavePhoto = async () => {
    if (!student || !previewUrl) return;

    setIsSaving(true);
    setStatusMessage('Uploading and updating photo...');
    try {
      const res = await fetch('/api/students/photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: student.id,
          photoUrl: previewUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save photo');

      onPhotoSaved(previewUrl);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Error saving photo.');
      setIsSaving(false);
      setStatusMessage(null);
    }
  };

  const handleRemovePhoto = async () => {
    if (!student) return;
    if (!confirm(`Are you sure you want to remove ${student.name}'s photo?`)) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/students/photo?studentId=${encodeURIComponent(student.id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to remove photo');

      onPhotoSaved(null);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Error removing photo.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !student) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-teal-50/40">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Student Profile Photo</h2>
            <p className="text-xs text-slate-500 font-medium">
              Update photo for <span className="text-teal-700 font-semibold">{student.name}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition border border-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Hidden Canvas for Processing */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Current / Selected Photo Preview */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-32 h-32 rounded-2xl overflow-hidden border-2 border-teal-500 shadow-md bg-slate-100 flex items-center justify-center">
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : student.photoUrl ? (
                <img src={student.photoUrl} alt={student.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-teal-800 bg-teal-50/70 font-black text-4xl">
                  {student.name.charAt(0).toUpperCase()}
                </div>
              )}

              {previewUrl && (
                <span className="absolute bottom-1 right-1 bg-emerald-600 text-white p-1 rounded-md text-[10px] font-bold shadow-xs">
                  New
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 mt-2 font-medium">
              {previewUrl ? 'Preview of new photo' : student.photoUrl ? 'Current student photo' : 'No photo uploaded yet'}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          {!previewUrl && (
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => handleTabChange('LIBRARY')}
                className={`flex items-center justify-center space-x-2 py-2.5 rounded-lg text-xs font-bold transition ${
                  activeTab === 'LIBRARY'
                    ? 'bg-white text-teal-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ImageIcon className="w-4 h-4 text-teal-600" />
                <span>Choose from Library</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange('CAMERA')}
                className={`flex items-center justify-center space-x-2 py-2.5 rounded-lg text-xs font-bold transition ${
                  activeTab === 'CAMERA'
                    ? 'bg-white text-teal-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Camera className="w-4 h-4 text-teal-600" />
                <span>Capture from Camera</span>
              </button>
            </div>
          )}

          {/* Tab 1: Library Upload */}
          {!previewUrl && activeTab === 'LIBRARY' && (
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) processImageFile(file);
                }}
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-teal-500 bg-slate-50/60 hover:bg-teal-50/20 rounded-2xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2"
              >
                <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    Click to select from Library / Device
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Supports JPG, PNG, WebP (auto-centered and cropped)
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Live Camera Viewfinder */}
          {!previewUrl && activeTab === 'CAMERA' && (
            <div className="space-y-3">
              <div className="relative bg-black rounded-2xl overflow-hidden aspect-square max-w-[320px] mx-auto border-2 border-slate-800 shadow-inner flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${!isCameraActive ? 'hidden' : ''}`}
                />

                {/* Portrait Oval Overlay Guide */}
                {isCameraActive && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-48 h-60 rounded-full border-2 border-dashed border-white/70 shadow-sm" />
                    <span className="absolute bottom-2 text-[10px] text-white/90 bg-black/50 px-2.5 py-0.5 rounded-full backdrop-blur-xs font-semibold">
                      Align student face within oval
                    </span>
                  </div>
                )}

                {/* Loading or Permission Required state */}
                {!isCameraActive && !cameraError && (
                  <div className="text-center p-6 text-slate-400 space-y-2">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-teal-400" />
                    <p className="text-xs">Connecting to camera...</p>
                  </div>
                )}

                {/* Camera Error / Fallback message */}
                {cameraError && (
                  <div className="p-5 text-center text-slate-200 space-y-3">
                    <AlertCircle className="w-8 h-8 mx-auto text-amber-400" />
                    <p className="text-xs text-slate-300 leading-relaxed">{cameraError}</p>
                    <button
                      type="button"
                      onClick={startCamera}
                      className="inline-flex items-center space-x-1 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-bold transition"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Retry Webcam</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Direct Native Camera Fallback input (for mobile browsers) */}
              <input
                ref={deviceCameraInputRef}
                type="file"
                accept="image/*"
                capture="user"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) processImageFile(file);
                }}
              />

              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-1">
                {isCameraActive && (
                  <button
                    type="button"
                    onClick={captureFromVideo}
                    className="w-full sm:w-auto px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition flex items-center justify-center space-x-2"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Snap / Capture Photo</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => deviceCameraInputRef.current?.click()}
                  className="w-full sm:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition flex items-center justify-center space-x-1.5"
                  title="Use default device camera application"
                >
                  <Camera className="w-3.5 h-3.5 text-teal-700" />
                  <span>Native Mobile Camera</span>
                </button>
              </div>
            </div>
          )}

          {/* Preview Review Actions (when an image is captured or selected) */}
          {previewUrl && (
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3">
              <div className="flex items-center space-x-2 text-emerald-900 text-xs font-bold">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Photo ready to save! Review the preview above.</span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setPreviewUrl(null);
                    if (activeTab === 'CAMERA') startCamera();
                  }}
                  className="flex-1 py-2 px-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retake / Choose Another</span>
                </button>

                <button
                  type="button"
                  onClick={handleSavePhoto}
                  disabled={isSaving}
                  className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center space-x-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Saving...' : 'Save & Upload Photo'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div>
            {student.photoUrl && !previewUrl && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                disabled={isSaving}
                className="inline-flex items-center space-x-1 text-xs font-semibold text-rose-600 hover:text-rose-800 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Current Photo</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 transition rounded-xl"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
