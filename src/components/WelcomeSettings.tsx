import React, { useState } from 'react';
import { FreddySettings } from '../utils/freddyBot';
import { DiscordEmbedPreview } from './DiscordEmbedPreview';
import { Save, Eye, Upload, CheckCircle2, AlertCircle, Sparkles, Image as ImageIcon } from 'lucide-react';
import confetti from 'canvas-confetti';

interface WelcomeSettingsProps {
  settings: FreddySettings;
  onSave: (newSettings: FreddySettings) => Promise<boolean>;
}

export const WelcomeSettings: React.FC<WelcomeSettingsProps> = ({
  settings: initialSettings,
  onSave
}) => {
  const [formData, setFormData] = useState<FreddySettings>(initialSettings);
  const [previewMode, setPreviewMode] = useState<'welcome' | 'goodbye'>('welcome');
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'success' | 'error' | null>(null);
  const [isUploading, setIsUploading] = useState<string | null>(null);

  const presetImages = [
    { label: 'Freddy Stage', url: '/src/assets/images/glamrock_freddy_hero_1793907789001.jpg' },
    { label: 'Pizzaplex Neon', url: '/src/assets/images/pizzaplex_stage_neon_1793907790277.jpg' },
    { label: 'Solver Glitch', url: '/src/assets/images/absolute_solver_glitch_1793907789794.jpg' }
  ];

  const handleFieldChange = (field: keyof FreddySettings, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (field: 'welcomeImage' | 'goodbyeImage', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setStatusType('error');
      setStatusMessage('File size exceeds 5 MB limit.');
      return;
    }

    setIsUploading(field);
    setStatusMessage('Encoding image for Pizzaplex embed...');

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      try {
        const res = await fetch('/api/upload-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64, filename: file.name })
        });
        const data = await res.json();
        if (res.ok && data.url) {
          handleFieldChange(field, data.url);
          setStatusType('success');
          setStatusMessage(`Uploaded ${file.name}. Click 'Save Settings' to apply.`);
        } else {
          // In local browser without server storage, use the data URL directly so preview works immediately!
          handleFieldChange(field, base64);
          setStatusType('success');
          setStatusMessage(`Local image loaded into preview. Click 'Save Settings' to apply.`);
        }
      } catch {
        handleFieldChange(field, base64);
        setStatusType('success');
        setStatusMessage(`Local image loaded into preview.`);
      } finally {
        setIsUploading(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMessage('Saving settings to Freddy bot bridge...');

    try {
      const success = await onSave(formData);
      if (success) {
        setStatusType('success');
        setStatusMessage('Settings saved successfully! Freddy will use these for member join and leave events.');
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#53e7ff', '#ff9b45', '#9d4edd', '#ffffff']
        });
      } else {
        setStatusType('error');
        setStatusMessage('Failed to save settings. Please verify bridge connection.');
      }
    } catch (err: any) {
      setStatusType('error');
      setStatusMessage(err.message || 'An error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <span>👋 Welcome & Goodbye Settings</span>
          </h2>
          <p className="text-xs text-[#aab6c9] mt-1">
            Configure automated arrival greetings and departure messages posted by Glamrock Freddy in your Discord server.
          </p>
        </div>

        {/* Live Preview Mode Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-[#121c2c] border border-white/10 rounded-xl">
          <button
            type="button"
            onClick={() => setPreviewMode('welcome')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              previewMode === 'welcome'
                ? 'bg-[#53e7ff] text-black shadow-sm'
                : 'text-[#aab6c9] hover:text-white'
            }`}
          >
            Welcome Embed
          </button>
          <button
            type="button"
            onClick={() => setPreviewMode('goodbye')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              previewMode === 'goodbye'
                ? 'bg-[#ff9b45] text-black shadow-sm'
                : 'text-[#aab6c9] hover:text-white'
            }`}
          >
            Goodbye Embed
          </button>
        </div>
      </div>

      {/* Grid: Form on Left, Discord Embed Live Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Settings Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-6">
          {/* Section 1: Welcome Settings */}
          <div className="bg-[#121c2c] border border-white/10 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#53e7ff] flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>Arrival (Member Join)</span>
              </h3>
              <span className="text-[11px] text-[#7d8b9f]">Use {`{user}`} and {`{server}`}</span>
            </div>

            <div>
              <label htmlFor="welcomeMessage" className="block text-xs font-semibold text-[#f5f7fb] mb-1.5">
                Welcome Message
              </label>
              <textarea
                id="welcomeMessage"
                value={formData.welcomeMessage}
                onChange={(e) => handleFieldChange('welcomeMessage', e.target.value)}
                maxLength={1800}
                rows={3}
                className="w-full bg-[#0a1220] border border-white/15 focus:border-[#53e7ff] focus:ring-1 focus:ring-[#53e7ff] rounded-xl p-3 text-xs text-white placeholder-slate-500 outline-none transition-all leading-relaxed"
                placeholder="🐻🎸 Welcome to the Pizzaplex, {user}! I’m Glamrock Freddy. Stay safe, Superstar!"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="welcomeChannel" className="block text-xs font-semibold text-[#f5f7fb] mb-1.5">
                  Welcome Channel ID (Optional)
                </label>
                <input
                  id="welcomeChannel"
                  type="text"
                  value={formData.welcomeChannel}
                  onChange={(e) => handleFieldChange('welcomeChannel', e.target.value)}
                  placeholder="e.g. 948123456789012345"
                  className="w-full bg-[#0a1220] border border-white/15 focus:border-[#53e7ff] focus:ring-1 focus:ring-[#53e7ff] rounded-xl px-3 py-2.5 text-xs text-white font-mono placeholder-slate-600 outline-none"
                />
              </div>

              <div>
                <label htmlFor="welcomeImage" className="block text-xs font-semibold text-[#f5f7fb] mb-1.5">
                  Welcome Image URL
                </label>
                <input
                  id="welcomeImage"
                  type="text"
                  value={formData.welcomeImage}
                  onChange={(e) => handleFieldChange('welcomeImage', e.target.value)}
                  placeholder="https://... or select below"
                  className="w-full bg-[#0a1220] border border-white/15 focus:border-[#53e7ff] focus:ring-1 focus:ring-[#53e7ff] rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 outline-none"
                />
              </div>
            </div>

            {/* Presets and Upload */}
            <div className="pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs text-[#aab6c9]">
                <span className="text-[11px] text-[#7d8b9f]">Presets:</span>
                {presetImages.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handleFieldChange('welcomeImage', preset.url)}
                    className="px-2 py-0.5 text-[11px] rounded bg-white/5 hover:bg-white/15 text-white transition-colors cursor-pointer"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#53e7ff] hover:text-white bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>{isUploading === 'welcomeImage' ? 'Uploading...' : 'Upload Picture'}</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/gif,image/webp"
                  className="hidden"
                  onChange={(e) => handleFileUpload('welcomeImage', e)}
                />
              </label>
            </div>
          </div>

          {/* Section 2: Goodbye Settings */}
          <div className="bg-[#121c2c] border border-white/10 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#ff9b45] flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>Departure (Member Leave)</span>
              </h3>
              <span className="text-[11px] text-[#7d8b9f]">Use {`{user}`} and {`{server}`}</span>
            </div>

            <div>
              <label htmlFor="goodbyeMessage" className="block text-xs font-semibold text-[#f5f7fb] mb-1.5">
                Goodbye Message
              </label>
              <textarea
                id="goodbyeMessage"
                value={formData.goodbyeMessage}
                onChange={(e) => handleFieldChange('goodbyeMessage', e.target.value)}
                maxLength={1800}
                rows={3}
                className="w-full bg-[#0a1220] border border-white/15 focus:border-[#ff9b45] focus:ring-1 focus:ring-[#ff9b45] rounded-xl p-3 text-xs text-white placeholder-slate-500 outline-none transition-all leading-relaxed"
                placeholder="Goodbye, {user}! We hope to see you again at the Pizzaplex."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="goodbyeChannel" className="block text-xs font-semibold text-[#f5f7fb] mb-1.5">
                  Goodbye Channel ID (Optional)
                </label>
                <input
                  id="goodbyeChannel"
                  type="text"
                  value={formData.goodbyeChannel}
                  onChange={(e) => handleFieldChange('goodbyeChannel', e.target.value)}
                  placeholder="Defaults to welcome channel"
                  className="w-full bg-[#0a1220] border border-white/15 focus:border-[#ff9b45] focus:ring-1 focus:ring-[#ff9b45] rounded-xl px-3 py-2.5 text-xs text-white font-mono placeholder-slate-600 outline-none"
                />
              </div>

              <div>
                <label htmlFor="goodbyeImage" className="block text-xs font-semibold text-[#f5f7fb] mb-1.5">
                  Goodbye Image URL
                </label>
                <input
                  id="goodbyeImage"
                  type="text"
                  value={formData.goodbyeImage}
                  onChange={(e) => handleFieldChange('goodbyeImage', e.target.value)}
                  placeholder="https://... or select below"
                  className="w-full bg-[#0a1220] border border-white/15 focus:border-[#ff9b45] focus:ring-1 focus:ring-[#ff9b45] rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 outline-none"
                />
              </div>
            </div>

            {/* Presets and Upload */}
            <div className="pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs text-[#aab6c9]">
                <span className="text-[11px] text-[#7d8b9f]">Presets:</span>
                {presetImages.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handleFieldChange('goodbyeImage', preset.url)}
                    className="px-2 py-0.5 text-[11px] rounded bg-white/5 hover:bg-white/15 text-white transition-colors cursor-pointer"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#ff9b45] hover:text-white bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>{isUploading === 'goodbyeImage' ? 'Uploading...' : 'Upload Picture'}</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/gif,image/webp"
                  className="hidden"
                  onChange={(e) => handleFileUpload('goodbyeImage', e)}
                />
              </label>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-[#ff9b45] to-[#ff8020] text-black hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all shadow-lg shadow-[#ff9b45]/20 flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
              </button>

              <button
                type="button"
                onClick={() => setPreviewMode(previewMode === 'welcome' ? 'goodbye' : 'welcome')}
                className="px-4 py-2.5 rounded-xl font-bold text-xs text-white border border-white/20 hover:border-white/40 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Toggle Preview</span>
              </button>
            </div>

            {statusMessage && (
              <div className={`text-xs flex items-center gap-1.5 ${
                statusType === 'success' ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {statusType === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{statusMessage}</span>
              </div>
            )}
          </div>
        </form>

        {/* Live Discord Embed Preview on Right Column */}
        <div className="lg:col-span-5 space-y-3 sticky top-24">
          <div className="flex items-center justify-between text-xs text-[#aab6c9] px-1">
            <span className="font-semibold text-white">Live Discord Preview</span>
            <span className="text-[11px] text-[#53e7ff] font-mono">
              Mode: {previewMode === 'welcome' ? 'Arrival' : 'Departure'}
            </span>
          </div>

          <DiscordEmbedPreview
            type={previewMode}
            message={previewMode === 'welcome' ? formData.welcomeMessage : formData.goodbyeMessage}
            channelId={previewMode === 'welcome' ? formData.welcomeChannel : formData.goodbyeChannel}
            imageUrl={previewMode === 'welcome' ? formData.welcomeImage : formData.goodbyeImage}
          />

          <div className="p-3 bg-[#121c2c]/60 rounded-xl border border-white/5 text-[11px] text-[#7d8b9f] leading-relaxed">
            💡 <strong>Discord Tip:</strong> Glamrock Freddy listens to member join and leave events via Discord Gateway intents. Uploaded images are stored locally and embedded into the rich embed card automatically.
          </div>
        </div>
      </div>
    </div>
  );
};
