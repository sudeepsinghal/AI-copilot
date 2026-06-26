import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, File, FileText, CheckCircle2, AlertCircle, Loader2, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { api } from '../../lib/api';

const DocumentUploader = ({ onUploadComplete }) => {
  const [uploadState, setUploadState] = useState('idle'); // 'idle', 'uploading', 'success', 'error'
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [pdfMode, setPdfMode] = useState('parse'); // parse | ocr | auto
  const [ocrProvider, setOcrProvider] = useState('tesseract'); // tesseract | paddleocr | doctr | trocr

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      setUploadState('error');
      setErrorMessage(rejectedFiles[0].errors[0]?.message || 'Invalid file type or size.');
      return;
    }

    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setSelectedFile(file);
      uploadFile(file);
    }
  }, [onUploadComplete, pdfMode, ocrProvider]);

  const uploadFile = async (file) => {
    setUploadState('uploading');
    setProgress(0);
    setErrorMessage('');

    // fetch() has no upload-progress event, so animate an indeterminate bar
    // that creeps to ~90% while the real request (extract + embed) runs.
    const ticker = setInterval(() => {
      setProgress((prev) => (prev >= 90 ? 90 : prev + Math.max(1, Math.floor((90 - prev) / 8))));
    }, 250);

    try {
      const isPdf = (file.name || '').toLowerCase().endsWith('.pdf');
      const res = await api.uploadDocument(file, {
        pdfMode: isPdf ? pdfMode : undefined,
        ocrProvider: isPdf && pdfMode !== 'parse' ? ocrProvider : undefined,
      });
      clearInterval(ticker);
      setProgress(100);
      setUploadState('success');
      setTimeout(() => {
        // Pass the REAL backend document up to the parent.
        onUploadComplete({
          id: res.document_id,
          name: res.filename || file.name,
          type: file.type || res.file_type,
          file_type: res.file_type,
          size: file.size,
          chunks: res.chunks_added,
        });
      }, 700);
    } catch (err) {
      clearInterval(ticker);
      setUploadState('error');
      setErrorMessage(err.message || 'Upload failed. Please try again.');
    }
  };

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'text/plain': ['.txt'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: false
  });

  return (
    <div className="w-full max-w-2xl mx-auto h-full flex flex-col items-center justify-center p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold tracking-tight mb-2">Upload Document</h2>
        <p className="text-text-muted">Drop a PDF or image to extract structured data instantly.</p>
      </div>

      <motion.div
        {...getRootProps()}
        whileHover={uploadState === 'idle' ? { scale: 1.02 } : {}}
        whileTap={uploadState === 'idle' ? { scale: 0.98 } : {}}
        className={`w-full relative rounded-2xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center p-12 min-h-[400px] cursor-pointer overflow-hidden
          ${isDragActive && !isDragReject ? 'border-primary bg-primary/5' : ''}
          ${isDragReject || uploadState === 'error' ? 'border-danger bg-danger/5' : ''}
          ${uploadState === 'idle' && !isDragActive ? 'border-border/60 hover:border-border glass-panel hover:shadow-[0_0_30px_rgba(255,229,0,0.05)]' : ''}
          ${uploadState === 'uploading' ? 'border-primary/50 bg-surface/50 cursor-default' : ''}
          ${uploadState === 'success' ? 'border-success bg-success/5 cursor-default' : ''}
        `}
      >
        <input {...getInputProps()} disabled={uploadState !== 'idle'} />

        <AnimatePresence mode="wait">
          {/* ══ IDLE STATE ══ */}
          {uploadState === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center pointer-events-none"
            >
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-colors duration-300
                ${isDragActive ? 'bg-primary/20 text-primary glow' : 'bg-surface border border-border text-text-muted'}
              `}>
                <UploadCloud size={40} className={isDragActive ? 'animate-bounce' : ''} />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {isDragActive ? 'Drop file to upload' : 'Click or drag file to upload'}
              </h3>
              <p className="text-text-muted text-sm text-center max-w-xs">
                Supports PDF, DOCX, TXT, PNG, JPEG up to 50MB. Secure, encrypted processing.
              </p>
            </motion.div>
          )}

          {/* ══ UPLOADING STATE ══ */}
          {uploadState === 'uploading' && (
            <motion.div
              key="uploading"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="flex flex-col items-center w-full max-w-md"
            >
              <div className="relative w-24 h-32 bg-surface border border-border rounded-lg mb-8 shadow-xl overflow-hidden flex items-center justify-center">
                <FileText size={40} className="text-primary/50" />
                {/* Laser scan effect */}
                <motion.div 
                  className="absolute left-0 w-full h-[2px] bg-primary glow"
                  animate={{ top: ['0%', '100%', '0%'] }}
                  transition={{ duration: 2, ease: "linear", repeat: Infinity }}
                />
              </div>

              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <Loader2 size={18} className="animate-spin text-primary" />
                Processing Document...
              </h3>
              <p className="text-text-muted text-sm mb-6 truncate max-w-[250px]">
                {selectedFile?.name}
              </p>

              {/* Progress Bar */}
              <div className="w-full h-2 bg-surface border border-border rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: "easeOut" }}
                />
              </div>
              <div className="w-full flex justify-between mt-2 text-xs text-text-muted font-medium">
                <span>{progress}%</span>
                <span>Extracting entities</span>
              </div>
            </motion.div>
          )}

          {/* ══ SUCCESS STATE ══ */}
          {uploadState === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center"
            >
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", bounce: 0.5 }}
                className="w-20 h-20 rounded-full bg-success/20 text-success flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(0,255,128,0.3)]"
              >
                <CheckCircle2 size={40} />
              </motion.div>
              <h3 className="text-xl font-bold text-success mb-2">Upload Complete!</h3>
              <p className="text-text-muted text-sm">Preparing workspace...</p>
            </motion.div>
          )}

          {/* ══ ERROR STATE ══ */}
          {uploadState === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center"
            >
              <div className="w-20 h-20 rounded-full bg-danger/10 border border-danger/30 text-danger flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(255,0,128,0.2)]">
                <AlertCircle size={40} />
              </div>
              <h3 className="text-xl font-bold text-danger mb-2">Upload Failed</h3>
              <p className="text-text-muted text-sm text-center max-w-xs mb-6">
                {errorMessage}
              </p>
              <button 
                onClick={(e) => {
                  e.stopPropagation(); // prevent triggering dropzone again
                  setUploadState('idle');
                  setErrorMessage('');
                }}
                className="px-6 py-2 rounded-lg border border-border hover:bg-surface-hover transition-colors text-sm font-medium"
              >
                Try Again
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ══ ADVANCED OPTIONS (OCR / parser) ══ */}
      {uploadState === 'idle' && (
        <div className="w-full mt-4">
          <button
            onClick={() => setShowAdvanced((v) => !v)}
            className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text transition-colors"
          >
            <SlidersHorizontal size={13} />
            Advanced (PDF parsing & OCR)
            <ChevronDown size={13} className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          </button>

          {showAdvanced && (
            <div className="mt-3 grid grid-cols-2 gap-3 p-4 rounded-xl glass-card">
              <label className="flex flex-col gap-1.5 text-xs text-text-muted">
                PDF mode
                <select
                  value={pdfMode}
                  onChange={(e) => setPdfMode(e.target.value)}
                  className="bg-surface border border-border rounded-lg px-2.5 py-2 text-sm text-text focus:outline-none focus:border-primary/50"
                >
                  <option value="parse">parse — extract embedded text (fast)</option>
                  <option value="auto">auto — parse, fall back to OCR</option>
                  <option value="ocr">ocr — force OCR (scanned PDFs)</option>
                </select>
              </label>
              <label className="flex flex-col gap-1.5 text-xs text-text-muted">
                OCR engine
                <select
                  value={ocrProvider}
                  onChange={(e) => setOcrProvider(e.target.value)}
                  disabled={pdfMode === 'parse'}
                  className="bg-surface border border-border rounded-lg px-2.5 py-2 text-sm text-text focus:outline-none focus:border-primary/50 disabled:opacity-40"
                >
                  <option value="tesseract">Tesseract (default)</option>
                  <option value="paddleocr">PaddleOCR</option>
                  <option value="doctr">docTR</option>
                  <option value="trocr">TrOCR</option>
                </select>
              </label>
              <p className="col-span-2 text-[11px] text-text-muted/70">
                Applies to PDFs only. OCR engine is used when mode is “auto” or “ocr”.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DocumentUploader;
