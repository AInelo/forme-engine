import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { FormEngine } from 'forme-engine';
import JsonModal from './components/JsonModal';
import { allForms, type FormEntry } from './forms';

export default function App() {
  const [active, setActive] = useState<FormEntry>(allForms[0]);
  const [result, setResult] = useState<{ name: string; data: Record<string, unknown> } | null>(null);

  const handleSubmit = (data: Record<string, unknown>) => {
    setResult({ name: active.form.name, data });
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 bg-teal-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">FE</span>
            </div>
            <div>
              <span className="font-semibold text-gray-800 text-sm">forme-engine</span>
              <span className="ml-1.5 text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">v0.1.0</span>
            </div>
          </div>

          {/* Form selector */}
          <nav className="flex gap-1 overflow-x-auto">
            {allForms.map((f) => (
              <button
                key={f.id}
                onClick={() => setActive(f)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  active.id === f.id
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {f.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-4 py-8">

        {/* Form meta */}
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-800">{active.form.name}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{active.description}</p>
          </div>
          <span className="shrink-0 text-xs bg-white border border-gray-200 text-gray-500 px-2 py-1 rounded-lg">
            {active.form.layoutOptions?.paginationMode === 'bySection' ? 'Par section' : 'Par champs'}
          </span>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-2 laptop:p-6 min-h-[500px] flex items-center justify-center">
          <FormEngine
            key={active.id}
            form={active.form}
            formId={active.id}
            onSubmit={handleSubmit}
            currentLang="fr"
            submitButtonText="Soumettre"
          />
        </div>

        {/* Hints */}
        <p className="text-center text-xs text-gray-400 mt-4">
          Soumettez le formulaire pour voir le JSON généré
        </p>
      </main>

      {/* Result modal */}
      {result && (
        <JsonModal
          formName={result.name}
          data={result.data}
          onClose={() => setResult(null)}
        />
      )}
    </div>
  );
}
