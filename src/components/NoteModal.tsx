import React, { useEffect } from 'react';
import { LoreNote } from '../types';
import { X, FileText, CheckCircle2 } from 'lucide-react';

interface NoteModalProps {
  note: LoreNote | null;
  onClose: () => void;
}

export const NoteModal: React.FC<NoteModalProps> = ({ note, onClose }) => {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape' || e.code === 'KeyE' || e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey, { capture: true });
    return () => {
      window.removeEventListener('keydown', handleKey, { capture: true });
    };
  }, [onClose]);

  if (!note) return null;

  return (
    <div
      id="note-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in cursor-default"
      onClick={onClose}
    >
      <div
        id="note-modal-content"
        className="relative max-w-lg w-full bg-[#f4ebd0] text-[#1c1917] p-8 rounded-sm shadow-2xl border-4 border-[#854d0e]/40 font-mono select-text cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grungy accent */}
        <div className="absolute top-3 right-12 text-red-800/40 text-4xl select-none pointer-events-none font-bold">
          CONFIDENTIAL
        </div>

        <div className="flex items-center justify-between border-b-2 border-[#a8a29e] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-amber-900" />
            <h3 className="font-bold text-lg tracking-wide uppercase">{note.title}</h3>
          </div>
          <button
            id="close-note-btn"
            type="button"
            onClick={onClose}
            className="flex items-center gap-1 px-3 py-1.5 rounded bg-stone-800/10 hover:bg-stone-800/20 text-stone-900 font-bold text-xs transition-colors cursor-pointer border border-stone-400"
            aria-label="Close Note"
          >
            <X className="h-4 w-4" />
            <span>CLOSE [ESC / E]</span>
          </button>
        </div>

        <div className="text-xs text-stone-600 mb-4 space-y-0.5">
          <p><span className="font-bold">DATE:</span> {note.date}</p>
          <p><span className="font-bold">AUTHOR:</span> {note.author}</p>
        </div>

        <div className="text-sm leading-relaxed whitespace-pre-line text-stone-900 font-medium py-2">
          {note.body}
        </div>

        <div className="mt-6 pt-3 border-t border-[#d6d3d1] flex items-center justify-between text-xs text-stone-600">
          <span className="flex items-center gap-1 text-emerald-800 font-bold">
            <CheckCircle2 className="h-3.5 w-3.5" /> LOG RECORDED
          </span>
          <button type="button" onClick={onClose} className="px-5 py-2 bg-stone-900 text-stone-100 rounded text-xs font-bold hover:bg-stone-800 active:scale-95 transition-all cursor-pointer shadow-md">
            Put Down [E / ESC / CLICK]
          </button>
        </div>
      </div>
    </div>
  );
};
