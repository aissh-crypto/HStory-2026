import React, { useState } from 'react';
import { FolderCheck, ArrowRight, ShieldCheck, Search, Clock, Activity, FileText, CheckCircle2, Sparkles, Trash2, X, ArrowLeft } from 'lucide-react';
import { CaseFile, Property } from '../types';
import { computeCaseFileProgress } from '../utils/caseStatus';

interface CaseFilesListViewProps {
  caseFiles: CaseFile[];
  properties: Property[];
  onOpenCaseFile: (caseFile: CaseFile) => void;
  onNavigateToSearch: () => void;
  onDismissCase?: (caseId: string) => void;
}

export const CaseFilesListView: React.FC<CaseFilesListViewProps> = ({
  caseFiles = [],
  properties = [],
  onOpenCaseFile,
  onNavigateToSearch,
  onDismissCase,
}) => {
  const [confirmingCaseId, setConfirmingCaseId] = useState<string | null>(null);

  // Ensure we have a valid list to render
  const defaultProp = properties[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 space-y-8 pb-20">
      {/* Top Back Navigation Strip */}
      <div className="flex items-center">
        <button
          type="button"
          onClick={onNavigateToSearch}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#E8E2D6] bg-white hover:border-[#C98A3E] hover:bg-[#FAF7F0] text-xs font-semibold text-[#1E2A44] transition-all shadow-xs cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#C98A3E]" />
          <span>Back to Explore</span>
        </button>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E8E2D6] pb-6">
        <div className="space-y-1">
          <span className="font-label text-[10px] text-[#C98A3E] font-bold tracking-widest uppercase flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-[#C98A3E]" />
            UNDERWRITING DOSSIERS & AUDITS
          </span>
          <h1 className="font-serif font-bold text-3xl sm:text-4xl text-[#1E2A44]">
            Due Diligence Case Files
          </h1>
          <p className="text-sm text-[#5B6478]">
            {caseFiles.length} active investigation dossiers, mortgage stress tests, and statutory land registry audits.
          </p>
        </div>

        <button
          onClick={onNavigateToSearch}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#E8E2D6] bg-white hover:border-[#C98A3E] text-xs font-semibold text-[#1E2A44] transition-all self-start sm:self-auto shadow-xs cursor-pointer"
        >
          <Search className="w-3.5 h-3.5 text-[#C98A3E]" />
          <span>New Property Audit</span>
        </button>
      </div>

      {caseFiles.length === 0 ? (
        <div className="bg-white rounded-[24px] p-12 text-center border border-[#E8E2D6] shadow-[0_20px_60px_rgba(30,42,68,0.06)] space-y-4 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-full bg-[#FAF7F0] border border-[#E8E2D6] flex items-center justify-center text-[#C98A3E] mx-auto">
            <FolderCheck className="w-7 h-7" />
          </div>
          <h3 className="font-serif font-bold text-xl text-[#1E2A44]">
            No Case Files Started Yet
          </h3>
          <p className="text-xs sm:text-sm text-[#5B6478] leading-relaxed">
            Find any property you are considering on the Search page and click "Start Due Diligence" to initiate your 5-module audit dossier.
          </p>
          <button
            onClick={onNavigateToSearch}
            className="px-6 py-3 rounded-xl bg-[#1E2A44] hover:bg-[#2A3B5E] text-white text-xs font-semibold inline-flex items-center gap-2 transition-all shadow-sm cursor-pointer"
          >
            <Search className="w-4 h-4 text-[#C98A3E]" />
            <span>Search Properties</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {caseFiles.map((c, index) => {
            const prop = properties.find((p) => p.id === c.propertyId) || defaultProp;
            if (!prop) return null;

            const marketPosition = c.decisionProfile?.marketPosition || prop.valuation?.marketPosition || 'Fairly Valued';
            const stressedDsr = c.modules?.stressTest?.stressedDsrPercent || 38.5;
            const price = prop.price || 1850000;
            const currency = prop.currency || 'MYR';
            const psqft = prop.valuation?.pricePerSqFt || Math.round(price / (prop.builtUpArea || 1000));
            const image = prop.images?.[0] || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80';

            const calculated = computeCaseFileProgress(c);
            const effectiveProgress = c.progressPercent && c.progressPercent >= calculated.progressPercent ? c.progressPercent : calculated.progressPercent;
            const effectiveStatus = c.status || calculated.status;
            const completedModules = calculated.completedCount;

            return (
              <div
                key={c.caseId || `case-${index}`}
                onClick={() => onOpenCaseFile(c)}
                className="bg-white rounded-[24px] overflow-hidden border border-[#E8E2D6] shadow-[0_10px_30px_rgba(30,42,68,0.04)] hover:shadow-[0_20px_50px_rgba(30,42,68,0.1)] transition-all cursor-pointer group flex flex-col justify-between apple-reveal"
              >
                <div>
                  {/* Photo & Status Banner */}
                  <div className="relative aspect-[16/9] overflow-hidden bg-[#FAF7F0]">
                    <img
                      src={image}
                      alt={prop.title || 'Property'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                    <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between">
                      <span className="font-label text-[9px] px-2.5 py-1 rounded-full bg-[#1E2A44]/90 backdrop-blur-sm text-white font-medium">
                        {prop.country || 'Malaysia'} • Dossier #{c.caseId ? c.caseId.slice(-6) : `00${index + 1}`}
                      </span>

                      <span
                        className={`font-label text-[9px] px-2.5 py-1 rounded-full font-bold shadow-xs ${
                          effectiveStatus === 'Decision Ready'
                            ? 'bg-emerald-600 text-white'
                            : effectiveStatus === 'In Progress'
                            ? 'bg-[#C98A3E] text-white'
                            : 'bg-slate-700/90 text-slate-100 border border-white/20'
                        }`}
                      >
                        {effectiveStatus}
                      </span>
                    </div>

                    <div className="absolute bottom-3 left-3.5 right-3.5 text-white">
                      <div className="font-sans font-bold text-xl drop-shadow-xs">
                        {currency} {price.toLocaleString()}
                      </div>
                      <div className="font-mono text-[10px] text-white/90">
                        {currency} {psqft.toLocaleString()} / sqft
                      </div>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-5 space-y-3">
                    <div className="space-y-1">
                      <h3 className="font-serif font-bold text-base text-[#1E2A44] group-hover:text-[#C98A3E] transition-colors line-clamp-1">
                        {prop.title}
                      </h3>
                      <p className="text-xs text-[#5B6478] line-clamp-1">
                        {prop.address}, {prop.city}
                      </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="p-3 rounded-xl bg-[#FAF7F0] border border-[#E8E2D6] space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-label text-[9px] text-[#5B6478] font-bold">
                          DILIGENCE PROGRESS
                        </span>
                        <span className="font-mono font-bold text-[#1E2A44]">
                          {effectiveProgress}% {effectiveProgress === 0 ? '(Not Started)' : effectiveProgress === 100 ? '(100% Complete)' : ''}
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-emerald-600 rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(effectiveProgress, 3)}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-[#5B6478] flex items-center justify-between">
                        <span>Modules Status:</span>
                        <span className="font-semibold text-slate-700">
                          {completedModules === 5 ? '5 of 5 Done (Ready)' : `${completedModules} of 5 Completed`}
                        </span>
                      </div>
                    </div>

                    {/* Decision Profile Snippet */}
                    <div className="p-3 rounded-xl bg-white border border-[#E8E2D6] space-y-2 text-xs">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-label text-[9px] text-[#5B6478] font-bold">VALUATION</span>
                        <span className="font-medium text-[#1E2A44]">{marketPosition}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-label text-[9px] text-[#5B6478] font-bold">STRESSED DSR</span>
                        <span className="font-mono font-bold text-[#C98A3E]">
                          {stressedDsr}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Progress Strip with Open & Dismiss */}
                <div className="p-4 bg-[#FAF7F0] border-t border-[#E8E2D6] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-[#5B6478] font-mono text-[11px]">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#C98A3E]" />
                    <span>5 Modules Active</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {onDismissCase && (
                      confirmingCaseId === c.caseId ? (
                        <div
                          className="flex items-center gap-1.5 bg-rose-50 p-1 px-2 rounded-xl border border-rose-300 animate-fadeIn"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="text-[10px] font-bold text-rose-800">
                            Dismiss?
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              onDismissCase(c.caseId);
                              setConfirmingCaseId(null);
                            }}
                            className="px-2 py-0.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold cursor-pointer transition-all shadow-2xs"
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setConfirmingCaseId(null);
                            }}
                            className="p-1 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-200 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setConfirmingCaseId(c.caseId);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Dismiss Case File"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )
                    )}
                    <span className="font-label text-xs font-semibold text-[#1E2A44] group-hover:text-[#C98A3E] flex items-center gap-1 transition-colors">
                      <span>Open Dossier</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#C98A3E] group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
