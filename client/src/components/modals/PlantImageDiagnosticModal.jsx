'use client'

import React from 'react';
import PlantImageDiagnosticCard from '@/components/ai/PlantImageDiagnosticCard';

export default function PlantImageDiagnosticModal({ isOpen, onClose, plant = null }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-transparent w-full max-w-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Close Button top-right */}
        <div className="flex justify-end mb-2">
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-black/60 text-white hover:bg-black/90 transition shadow-lg backdrop-blur-sm"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Diagnostic Card */}
        <div className="overflow-y-auto max-h-[88vh] rounded-2xl shadow-2xl">
          <PlantImageDiagnosticCard plant={plant} onFinish={() => {}} />
        </div>
      </div>
    </div>
  );
}
