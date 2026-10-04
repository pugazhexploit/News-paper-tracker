import React, { useState } from 'react';
import {
  askDispatchAssistant,
  GroundingPlaceLink
} from '../../services/geminiService';
import {
  Sparkles,
  MapPin,
  ExternalLink,
  Send,
  Loader2,
  Compass,
  Layers,
  HelpCircle,
  X
} from 'lucide-react';

interface AIDispatchAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'en' | 'ta';
}

const PRESET_QUERIES = [
  'Where are the primary newspaper depots and distribution points in Chidambaram (608001)?',
  'Optimal early morning 4:30 AM delivery sequencing for East, West, South, North Car Streets.',
  'Landmark verification and gate access tips for Kanagasabai Nagar and Hospital Road.',
  'Check early morning road access around Annamalai University campus and Car Streets.'
];

export const AIDispatchAssistant: React.FC<AIDispatchAssistantProps> = ({
  isOpen,
  onClose,
  lang
}) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [responseAnswer, setResponseAnswer] = useState<string | null>(null);
  const [groundingPlaces, setGroundingPlaces] = useState<GroundingPlaceLink[]>([]);

  if (!isOpen) return null;

  const handleAsk = async (textToSend: string) => {
    if (!textToSend.trim()) return;
    setLoading(true);
    setResponseAnswer(null);
    setGroundingPlaces([]);

    try {
      const result = await askDispatchAssistant(textToSend, 11.3992, 79.6936);
      setResponseAnswer(result.answer);
      setGroundingPlaces(result.places || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error consulting AI';
      setResponseAnswer(`Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {lang === 'ta' ? 'செயற்கை நுண்ணறிவு விநியோக உதவியாளர்' : 'AI Route Intelligence & Dispatch Copilot'}
              </h3>
              <p className="text-xs text-slate-500">
                Powered by Gemini with real-time Google Maps Grounding
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs">
          {/* Preset queries */}
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
              Recommended Logistics Queries:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESET_QUERIES.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuery(preset);
                    handleAsk(preset);
                  }}
                  className="text-left p-2.5 rounded-xl bg-slate-50 hover:bg-sky-50 hover:border-sky-200 border border-slate-200 text-slate-700 transition font-medium cursor-pointer"
                >
                  "{preset}"
                </button>
              ))}
            </div>
          </div>

          {/* AI Response Display */}
          {loading && (
            <div className="p-8 text-center flex flex-col items-center justify-center space-y-2 text-sky-600">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="font-semibold text-xs text-slate-600">
                Grounding with Google Maps Platform & analyzing distribution routes...
              </span>
            </div>
          )}

          {responseAnswer && !loading && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center space-x-2 text-sky-700 font-bold text-xs">
                <Compass className="w-4 h-4" />
                <span>Dispatch Assistant Advice:</span>
              </div>
              <div className="text-slate-800 leading-relaxed whitespace-pre-line text-xs font-sans">
                {responseAnswer}
              </div>

              {/* Grounding Places Citations */}
              {groundingPlaces.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-200">
                  <span className="text-[11px] font-bold text-slate-600 block mb-1.5 flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-sky-600" />
                    <span>Google Maps Grounded Locations & Citations:</span>
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {groundingPlaces.map((place, idx) => (
                      <a
                        key={idx}
                        href={place.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white border border-sky-200 text-sky-700 hover:bg-sky-50 font-semibold text-[11px] transition shadow-xs"
                      >
                        <span>{place.title}</span>
                        <ExternalLink className="w-3 h-3 text-sky-500" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input box */}
        <div className="pt-3 border-t border-slate-100">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAsk(query);
            }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask about newspaper depot points, road shortcuts, or landmark directions..."
              className="flex-1 text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow transition flex items-center space-x-1 cursor-pointer"
            >
              <span>Ask</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
