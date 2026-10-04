import React, { useState } from 'react';
import { Newspaper, Customer } from '../../types';
import {
  Plus,
  Edit2,
  Check,
  X,
  Newspaper as PaperIcon,
  Tag,
  IndianRupee,
  Layers,
  Sparkles
} from 'lucide-react';

interface NewspaperManagementProps {
  newspapers: Newspaper[];
  customers: Customer[];
  onSaveNewspaper: (newspaper: Newspaper) => void;
  lang: 'en' | 'ta';
}

export const NewspaperManagement: React.FC<NewspaperManagementProps> = ({
  newspapers,
  customers,
  onSaveNewspaper,
  lang
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPaper, setEditingPaper] = useState<Newspaper | null>(null);

  const [name, setName] = useState('');
  const [nameTamil, setNameTamil] = useState('');
  const [language, setLanguage] = useState<'English' | 'Tamil' | 'Bilingual' | 'Other'>('Tamil');
  const [publisher, setPublisher] = useState('');
  const [edition, setEdition] = useState('Chidambaram & Cuddalore');
  const [pricePerCopy, setPricePerCopy] = useState(6.0);
  const [subscriptionMonthly, setSubscriptionMonthly] = useState(180);
  const [isActive, setIsActive] = useState(true);
  const [color, setColor] = useState('#0284c7');

  const openNewModal = () => {
    setEditingPaper(null);
    setName('');
    setNameTamil('');
    setLanguage('Tamil');
    setPublisher('');
    setEdition('Chidambaram & Cuddalore');
    setPricePerCopy(6.0);
    setSubscriptionMonthly(180);
    setIsActive(true);
    setColor('#0284c7');
    setIsModalOpen(true);
  };

  const openEditModal = (p: Newspaper) => {
    setEditingPaper(p);
    setName(p.name);
    setNameTamil(p.nameTamil || '');
    setLanguage(p.language);
    setPublisher(p.publisher);
    setEdition(p.edition);
    setPricePerCopy(p.pricePerCopy);
    setSubscriptionMonthly(p.subscriptionMonthly);
    setIsActive(p.isActive);
    setColor(p.color || '#0284c7');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !publisher) return;

    const paperObj: Newspaper = {
      id: editingPaper ? editingPaper.id : `paper-${Date.now()}`,
      name,
      nameTamil: nameTamil || undefined,
      language,
      publisher,
      edition,
      pricePerCopy: Number(pricePerCopy),
      subscriptionMonthly: Number(subscriptionMonthly),
      isActive,
      color,
    };

    onSaveNewspaper(paperObj);
    setIsModalOpen(false);
  };

  const getSubscriberCount = (paperId: string) => {
    return customers.filter((c) =>
      c.subscriptions.some((s) => s.newspaperId === paperId && s.isActive)
    ).length;
  };

  const getTotalCopies = (paperId: string) => {
    let count = 0;
    customers.forEach((c) => {
      c.subscriptions.forEach((s) => {
        if (s.newspaperId === paperId && s.isActive) {
          count += s.quantity;
        }
      });
    });
    return count;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            {lang === 'ta' ? 'நாளிதழ் விபரப்பட்டியல்' : 'Newspaper Master Catalog'}
          </h2>
          <p className="text-xs text-slate-500">
            {lang === 'ta'
              ? 'தமிழ்நாடு பதிப்புகள், விலைகள், மொழி மற்றும் தனிப்பயன் நாளிதழ்களை நிர்வகிக்கவும்.'
              : 'Configure Tamil Nadu daily newspapers, price per copy, monthly rates, and custom additions.'}
          </p>
        </div>

        <button
          onClick={openNewModal}
          className="flex items-center space-x-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-xl shadow-sm transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{lang === 'ta' ? 'புதிய நாளிதழ் சேர்க்க' : 'Add Custom Newspaper'}</span>
        </button>
      </div>

      {/* Grid of Newspapers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {newspapers.map((paper) => {
          const subscribers = getSubscriberCount(paper.id);
          const copies = getTotalCopies(paper.id);

          return (
            <div
              key={paper.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm"
                      style={{ backgroundColor: paper.color }}
                    >
                      <PaperIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{paper.name}</h3>
                      {paper.nameTamil && (
                        <p className="text-xs text-slate-500 font-medium">{paper.nameTamil}</p>
                      )}
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      paper.isActive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {paper.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Language & Edition:</span>
                    <span className="font-semibold text-slate-800">
                      {paper.language} • {paper.edition}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Publisher:</span>
                    <span className="font-semibold text-slate-800">{paper.publisher}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Daily Cover Price:</span>
                    <span className="font-bold text-slate-900">₹{paper.pricePerCopy.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Monthly Subscription:</span>
                    <span className="font-bold text-sky-600">₹{paper.subscriptionMonthly}/mo</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="text-[11px] text-slate-500">
                  <span className="font-bold text-slate-800">{copies} copies</span> daily (
                  {subscribers} subscribers)
                </div>
                <button
                  onClick={() => openEditModal(paper)}
                  className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition cursor-pointer"
                  title="Edit Newspaper"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal for Add / Edit Newspaper */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingPaper ? 'Edit Newspaper' : 'Add Custom Newspaper'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Newspaper Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dina Thanthi"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tamil Name (optional)
                </label>
                <input
                  type="text"
                  value={nameTamil}
                  onChange={(e) => setNameTamil(e.target.value)}
                  placeholder="e.g. தினத்தந்தி"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Language</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    <option value="Tamil">Tamil</option>
                    <option value="English">English</option>
                    <option value="Bilingual">Bilingual</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Edition</label>
                  <input
                    type="text"
                    value={edition}
                    onChange={(e) => setEdition(e.target.value)}
                    placeholder="Chidambaram Edition"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Publisher *
                </label>
                <input
                  type="text"
                  required
                  value={publisher}
                  onChange={(e) => setPublisher(e.target.value)}
                  placeholder="e.g. Kasturi & Sons Ltd"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Price Per Copy (₹)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={pricePerCopy}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setPricePerCopy(val);
                      setSubscriptionMonthly(Math.round(val * 30));
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Monthly Subscription (₹)
                  </label>
                  <input
                    type="number"
                    value={subscriptionMonthly}
                    onChange={(e) => setSubscriptionMonthly(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-7 h-7 rounded-lg border-0 cursor-pointer"
                  />
                  <span className="text-slate-600">Color Tag</span>
                </div>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded text-sky-600 focus:ring-sky-500"
                  />
                  <span className="font-semibold text-slate-700">Active Distribution</span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow cursor-pointer"
                >
                  {editingPaper ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
