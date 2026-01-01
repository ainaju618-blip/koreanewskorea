'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// Settings types
interface DivinationSettings {
  videoUrl: string;
  showTodayFortune: boolean;
  animationSpeed: 'slow' | 'normal' | 'fast';
  theme: 'dark' | 'cosmic' | 'traditional';
}

const DEFAULT_SETTINGS: DivinationSettings = {
  videoUrl: '/videos/Ancient_Chinese_Coins_Cosmic_Animation.mp4',
  showTodayFortune: true,
  animationSpeed: 'normal',
  theme: 'cosmic',
};

const VIDEO_OPTIONS = [
  { value: '/videos/Ancient_Chinese_Coins_Cosmic_Animation.mp4', label: 'Cosmic Coins Animation' },
  { value: '/videos/divination-bg.mp4', label: 'Divination Background' },
  { value: 'none', label: 'No Video' },
];

export default function AdminPage() {
  const [settings, setSettings] = useState<DivinationSettings>(DEFAULT_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'video' | 'layout' | 'method'>('video');

  // Load settings on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('divination-settings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch {
        // Use default settings
      }
    }
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');

    try {
      // Save to localStorage (can be upgraded to Supabase later)
      localStorage.setItem('divination-settings', JSON.stringify(settings));
      setSaveMessage('Settings saved successfully!');
    } catch {
      setSaveMessage('Failed to save settings');
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem('divination-settings');
    setSaveMessage('Settings reset to default');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-black/50 border-b border-gray-800 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/divination"
              className="text-gray-400 hover:text-white transition-colors"
            >
              ← Back to Divination
            </Link>
            <h1 className="text-xl font-bold text-amber-400">Divination Admin</h1>
          </div>
          <Link
            href="/"
            className="text-gray-400 hover:text-white transition-colors text-sm"
          >
            Home
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          {[
            { id: 'video', label: 'Video Settings', icon: '🎬' },
            { id: 'layout', label: 'Layout', icon: '📐' },
            { id: 'method', label: 'Divination Method', icon: '🔮' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'video' | 'layout' | 'method')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Video Settings Tab */}
        {activeTab === 'video' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="text-2xl">🎬</span>
                Background Video
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Select Video</label>
                  <select
                    value={settings.videoUrl}
                    onChange={(e) => setSettings({ ...settings, videoUrl: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    {VIDEO_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Animation Speed</label>
                  <div className="flex gap-3">
                    {['slow', 'normal', 'fast'].map((speed) => (
                      <button
                        key={speed}
                        onClick={() => setSettings({ ...settings, animationSpeed: speed as 'slow' | 'normal' | 'fast' })}
                        className={`px-4 py-2 rounded-lg capitalize transition-all ${
                          settings.animationSpeed === speed
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-gray-700 text-gray-400 border border-gray-600'
                        }`}
                      >
                        {speed}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Preview */}
            {settings.videoUrl !== 'none' && (
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 className="text-sm text-gray-400 mb-3">Preview</h3>
                <div className="aspect-video rounded-xl overflow-hidden bg-black">
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                    src={settings.videoUrl}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Layout Tab */}
        {activeTab === 'layout' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="text-2xl">📐</span>
                Layout Settings
              </h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-white font-medium">Show Today&apos;s Fortune</label>
                    <p className="text-sm text-gray-400">Display daily fortune card on home screen</p>
                  </div>
                  <button
                    onClick={() => setSettings({ ...settings, showTodayFortune: !settings.showTodayFortune })}
                    className={`w-14 h-8 rounded-full transition-all ${
                      settings.showTodayFortune ? 'bg-amber-500' : 'bg-gray-600'
                    }`}
                  >
                    <div className={`w-6 h-6 bg-white rounded-full transition-transform ${
                      settings.showTodayFortune ? 'translate-x-7' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Theme</label>
                  <div className="flex gap-3">
                    {[
                      { id: 'dark', label: 'Dark', icon: '🌙' },
                      { id: 'cosmic', label: 'Cosmic', icon: '✨' },
                      { id: 'traditional', label: 'Traditional', icon: '📜' },
                    ].map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() => setSettings({ ...settings, theme: theme.id as 'dark' | 'cosmic' | 'traditional' })}
                        className={`px-4 py-2 rounded-lg transition-all ${
                          settings.theme === theme.id
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-gray-700 text-gray-400 border border-gray-600'
                        }`}
                      >
                        {theme.icon} {theme.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Divination Method Tab */}
        {activeTab === 'method' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="text-2xl">🔮</span>
                Divination Method
              </h2>

              <div className="space-y-4">
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                  <p className="text-amber-300 text-sm">
                    Currently using: <strong>Random Yao Method</strong>
                  </p>
                  <p className="text-gray-400 text-xs mt-1">
                    Generates random hexagram and yao position for each divination.
                  </p>
                </div>

                <div className="text-gray-400 text-sm">
                  <p className="mb-2">Available methods (coming soon):</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-500">
                    <li>Yarrow Stalk Method (Traditional)</li>
                    <li>Three Coins Method</li>
                    <li>Date-based Fortune</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Reset to Default
          </button>

          <div className="flex items-center gap-4">
            {saveMessage && (
              <span className={`text-sm ${saveMessage.includes('success') ? 'text-green-400' : 'text-red-400'}`}>
                {saveMessage}
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2 bg-amber-500 text-black font-bold rounded-lg hover:bg-amber-400 transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
