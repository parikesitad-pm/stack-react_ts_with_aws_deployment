import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  X,
  User,
  Sliders,
  Palette,
  Edit3,
  HardDrive,
  Shield,
  Info,
  Check,
  Download,
  Upload,
  RefreshCw,
  LogOut,
  ExternalLink,
} from 'lucide-react';
import { useAuthSession } from '~/features/auth/hooks/useAuthSession';
import { AvatarEditor } from './AvatarEditor';
import { Button } from '~/components/atoms/Button';
import { Badge } from '~/components/atoms/Badge';
import {
  SUPPORTED_LANGUAGES,
  changeAppLanguage,
  type SupportedLocale,
} from '~/lib/i18n';

export type ProfileTab =
  | 'profile'
  | 'preferences'
  | 'appearance'
  | 'editor'
  | 'storage'
  | 'security'
  | 'about';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: ProfileTab;
}

export function ProfileModal({
  isOpen,
  onClose,
  initialTab = 'profile',
}: ProfileModalProps) {
  const navigate = useNavigate();
  const { user, updateProfile, signOut } = useAuthSession();
  const [activeTab, setActiveTab] = useState<ProfileTab>(initialTab);

  // Form states for profile & preferences
  const [preferredName, setPreferredName] = useState(
    user?.preferredName || user?.name || 'Operator'
  );
  const [dateOfBirth, setDateOfBirth] = useState(user?.dateOfBirth || '');
  const [avatar, setAvatar] = useState(user?.picture || '');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Settings mock states
  const [language, setLanguage] = useState('en-US');
  const [timeFormat, setTimeFormat] = useState('24h');
  const [dateFormat, setDateFormat] = useState('YYYY-MM-DD');
  const [confirmDelete, setConfirmDelete] = useState(true);
  const [openLastNote, setOpenLastNote] = useState(true);

  // Appearance
  const [theme, setTheme] = useState<'system' | 'dark' | 'light'>('dark');
  const [density, setDensity] = useState<'compact' | 'comfortable'>(
    'comfortable'
  );
  const [fontSize, setFontSize] = useState(14);
  const [lineHeight, setLineHeight] = useState('1.6');
  const [reducedMotion, setReducedMotion] = useState(false);

  // Editor
  const [defaultEditorMode, setDefaultEditorMode] = useState<
    'write' | 'split' | 'read'
  >('split');
  const [wordWrap, setWordWrap] = useState(true);
  const [lineNumbers, setLineNumbers] = useState(true);
  const [autosave, setAutosave] = useState(true);
  const [previewDelay, setPreviewDelay] = useState(150);

  // Keyboard dismissal (Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      preferredName: preferredName.trim(),
      dateOfBirth,
      picture: avatar,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const navItems: { id: ProfileTab; label: string; icon: typeof User }[] = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'preferences', label: 'Preferences', icon: Sliders },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'editor', label: 'Editor', icon: Edit3 },
    { id: 'storage', label: 'Storage & Sync', icon: HardDrive },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'about', label: 'About', icon: Info },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stack-bg/80 backdrop-blur-sm font-mono text-stack-bone animate-fade-in"
    >
      <div className="flex flex-col w-full max-w-4xl h-[90vh] sm:h-[80vh] border border-stack-metal bg-stack-surface rounded-lg shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stack-metal bg-stack-surface-raised">
          <div className="flex items-center gap-2">
            <span className="font-bold text-stack-bone text-sm">
              WORKSPACE CONFIGURATION
            </span>
            <span className="text-stack-steel text-xs">/</span>
            <span className="text-stack-steel text-xs uppercase">
              {activeTab}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded text-stack-steel hover:text-stack-bone hover:bg-stack-metal/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Layout: Sidebar navigation + Tab panel */}
        <div className="flex flex-1 overflow-hidden">
          {/* Tabs navigation */}
          <nav className="w-48 sm:w-56 border-r border-stack-metal/70 bg-stack-surface/60 p-3 space-y-1 overflow-y-auto shrink-0">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2.5 w-full px-3 py-2 text-xs rounded font-medium transition-colors text-left ${
                    isActive
                      ? 'bg-stack-metal text-stack-bone font-bold'
                      : 'text-stack-steel hover:text-stack-silver hover:bg-stack-metal/30'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}

            <div className="pt-4 mt-4 border-t border-stack-metal/40">
              <button
                onClick={() => {
                  onClose();
                  navigate('/auth/logout');
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs rounded text-stack-red-hover hover:bg-stack-red-muted/20 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </nav>

          {/* Tab Content Panel */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6 text-xs">
            {/* TAB 1: Profile */}
            {activeTab === 'profile' && (
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-stack-bone">
                    Operator Identity
                  </h3>
                  <p className="text-stack-steel text-xs">
                    Your personal profile metadata and Auth0 verified provider.
                  </p>
                </div>

                <AvatarEditor
                  currentAvatar={avatar}
                  userName={preferredName}
                  onSave={(webp) => setAvatar(webp)}
                  onRemove={() => setAvatar('')}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-stack-silver">
                      Preferred Name (Callsign)
                    </label>
                    <input
                      type="text"
                      value={preferredName}
                      onChange={(e) => setPreferredName(e.target.value)}
                      className="w-full px-3 py-2 bg-stack-surface-raised border border-stack-metal rounded text-stack-bone focus:outline-none focus:border-stack-steel"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-stack-silver">
                      Date of Birth (Private)
                    </label>
                    <input
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="w-full px-3 py-2 bg-stack-surface-raised border border-stack-metal rounded text-stack-bone focus:outline-none focus:border-stack-steel"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-stack-silver">
                      Primary Email
                    </label>
                    <input
                      type="text"
                      disabled
                      value={user?.email || 'operator@modula.dev'}
                      className="w-full px-3 py-2 bg-stack-bg border border-stack-metal/60 rounded text-stack-steel cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-stack-silver">
                      Auth0 Provider
                    </label>
                    <div className="flex items-center gap-2 px-3 py-2 bg-stack-bg border border-stack-metal/60 rounded text-stack-steel">
                      <span className="uppercase font-bold text-stack-silver">
                        {user?.provider || 'github'}
                      </span>
                      <span className="text-[10px] text-stack-red-hover font-bold">
                        (VERIFIED)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-stack-metal/60">
                  {saveSuccess && (
                    <span className="flex items-center gap-1.5 text-stack-silver text-xs">
                      <Check className="w-4 h-4 text-green-500" />
                      Changes saved to local profile.
                    </span>
                  )}
                  <div className="ml-auto">
                    <Button type="submit" variant="primary" size="md">
                      <span>Save Profile Changes</span>
                    </Button>
                  </div>
                </div>
              </form>
            )}

            {/* TAB 2: Preferences */}
            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-stack-bone">
                    System Preferences
                  </h3>
                  <p className="text-stack-steel text-xs">
                    Regional localization, deletion confirmations, and startup
                    behavior.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded border border-stack-metal bg-stack-surface-raised">
                    <div>
                      <h4 className="font-bold text-stack-bone">Language</h4>
                      <p className="text-stack-steel text-[11px]">
                        User interface language
                      </p>
                    </div>
                    <select
                      value={language}
                      onChange={(e) => {
                        const newLang = e.target.value as SupportedLocale;
                        setLanguage(newLang);
                        changeAppLanguage(newLang);
                      }}
                      className="px-3 py-1.5 bg-stack-surface border border-stack-metal rounded text-stack-bone text-xs"
                    >
                      {SUPPORTED_LANGUAGES.map((l) => (
                        <option key={l.code} value={l.code}>
                          {l.nativeName} ({l.name})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded border border-stack-metal bg-stack-surface-raised">
                    <div>
                      <h4 className="font-bold text-stack-bone">
                        Time & Date Format
                      </h4>
                      <p className="text-stack-steel text-[11px]">
                        Timestamps on note revisions
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={timeFormat}
                        onChange={(e) => setTimeFormat(e.target.value)}
                        className="px-2 py-1.5 bg-stack-surface border border-stack-metal rounded text-stack-bone"
                      >
                        <option value="24h">24 Hours</option>
                        <option value="12h">12 Hours (AM/PM)</option>
                      </select>
                      <select
                        value={dateFormat}
                        onChange={(e) => setDateFormat(e.target.value)}
                        className="px-2 py-1.5 bg-stack-surface border border-stack-metal rounded text-stack-bone"
                      >
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded border border-stack-metal bg-stack-surface-raised">
                    <div>
                      <h4 className="font-bold text-stack-bone">
                        Confirm Note Deletion
                      </h4>
                      <p className="text-stack-steel text-[11px]">
                        Prompt confirmation modal before removing documents
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={confirmDelete}
                      onChange={(e) => setConfirmDelete(e.target.checked)}
                      className="w-4 h-4 accent-stack-red-slate"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded border border-stack-metal bg-stack-surface-raised">
                    <div>
                      <h4 className="font-bold text-stack-bone">
                        Open Last Note on Launch
                      </h4>
                      <p className="text-stack-steel text-[11px]">
                        Restore previous workspace state upon cold start
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={openLastNote}
                      onChange={(e) => setOpenLastNote(e.target.checked)}
                      className="w-4 h-4 accent-stack-red-slate"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Appearance */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-stack-bone">
                    Appearance & Ergonomics
                  </h3>
                  <p className="text-stack-steel text-xs">
                    Industrial theme tokens, typography sizing, and density.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded border border-stack-metal bg-stack-surface-raised">
                    <div>
                      <h4 className="font-bold text-stack-bone">Color Theme</h4>
                      <p className="text-stack-steel text-[11px]">
                        Post-war avionics high-contrast palette
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {(['dark', 'system', 'light'] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => setTheme(t)}
                          className={`px-3 py-1 rounded capitalize border ${
                            theme === t
                              ? 'bg-stack-metal text-stack-bone border-stack-steel font-bold'
                              : 'bg-stack-surface text-stack-steel border-stack-metal'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded border border-stack-metal bg-stack-surface-raised">
                    <div>
                      <h4 className="font-bold text-stack-bone">
                        Editor Font Size
                      </h4>
                      <p className="text-stack-steel text-[11px]">
                        JetBrains Mono base size: {fontSize}px
                      </p>
                    </div>
                    <input
                      type="range"
                      min={12}
                      max={20}
                      value={fontSize}
                      onChange={(e) => setFontSize(Number(e.target.value))}
                      className="accent-stack-red-slate"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded border border-stack-metal bg-stack-surface-raised">
                    <div>
                      <h4 className="font-bold text-stack-bone">
                        Reduced Motion
                      </h4>
                      <p className="text-stack-steel text-[11px]">
                        Disable CSS keyframes and transitions
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={reducedMotion}
                      onChange={(e) => setReducedMotion(e.target.checked)}
                      className="w-4 h-4 accent-stack-red-slate"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: Editor */}
            {activeTab === 'editor' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-stack-bone">
                    CodeMirror 6 Engine
                  </h3>
                  <p className="text-stack-steel text-xs">
                    Editor parameters, line numbering, and autosave intervals.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded border border-stack-metal bg-stack-surface-raised">
                    <div>
                      <h4 className="font-bold text-stack-bone">
                        Default Editor View
                      </h4>
                      <p className="text-stack-steel text-[11px]">
                        Initial workspace layout
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {(['write', 'split', 'read'] as const).map((m) => (
                        <button
                          key={m}
                          onClick={() => setDefaultEditorMode(m)}
                          className={`px-3 py-1 rounded capitalize border ${
                            defaultEditorMode === m
                              ? 'bg-stack-metal text-stack-bone border-stack-steel font-bold'
                              : 'bg-stack-surface text-stack-steel border-stack-metal'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded border border-stack-metal bg-stack-surface-raised">
                    <div>
                      <h4 className="font-bold text-stack-bone">Word Wrap</h4>
                      <p className="text-stack-steel text-[11px]">
                        Soft-wrap long Markdown paragraphs
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={wordWrap}
                      onChange={(e) => setWordWrap(e.target.checked)}
                      className="w-4 h-4 accent-stack-red-slate"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded border border-stack-metal bg-stack-surface-raised">
                    <div>
                      <h4 className="font-bold text-stack-bone">
                        Line Numbers
                      </h4>
                      <p className="text-stack-steel text-[11px]">
                        Display gutter line counts
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={lineNumbers}
                      onChange={(e) => setLineNumbers(e.target.checked)}
                      className="w-4 h-4 accent-stack-red-slate"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded border border-stack-metal bg-stack-surface-raised">
                    <div>
                      <h4 className="font-bold text-stack-bone">
                        Autosave to IndexedDB
                      </h4>
                      <p className="text-stack-steel text-[11px]">
                        Commit every stroke to local memory immediately
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={autosave}
                      onChange={(e) => setAutosave(e.target.checked)}
                      className="w-4 h-4 accent-stack-red-slate"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: Storage & Sync */}
            {activeTab === 'storage' && (
              <div className="space-y-6">
                <div>
                  <Badge variant="accent">MOCKUP DEMO (PHASE 2)</Badge>
                  <h3 className="mt-1 text-base font-bold text-stack-bone">
                    Storage & Synchronization Telemetry
                  </h3>
                  <p className="text-stack-steel text-xs">
                    Local IndexedDB statistics and cloud synchronization status.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded border border-stack-metal bg-stack-surface-raised">
                    <span className="text-[10px] text-stack-steel uppercase">
                      Local Notes
                    </span>
                    <p className="text-lg font-bold text-stack-bone">
                      3 Documents
                    </p>
                  </div>
                  <div className="p-3 rounded border border-stack-metal bg-stack-surface-raised">
                    <span className="text-[10px] text-stack-steel uppercase">
                      Attachments
                    </span>
                    <p className="text-lg font-bold text-stack-bone">1.2 MB</p>
                  </div>
                  <div className="p-3 rounded border border-stack-metal bg-stack-surface-raised">
                    <span className="text-[10px] text-stack-steel uppercase">
                      Sync Status
                    </span>
                    <p className="text-lg font-bold text-stack-silver">
                      Synced
                    </p>
                  </div>
                  <div className="p-3 rounded border border-stack-metal bg-stack-surface-raised">
                    <span className="text-[10px] text-stack-steel uppercase">
                      Queue
                    </span>
                    <p className="text-lg font-bold text-stack-bone">
                      0 Pending
                    </p>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <h4 className="font-bold text-stack-bone">
                    Portability Actions
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" size="sm">
                      <Download className="w-3.5 h-3.5" />
                      <span>Export All Markdown (.md)</span>
                    </Button>
                    <Button variant="secondary" size="sm">
                      <Download className="w-3.5 h-3.5" />
                      <span>Export Workspace ZIP</span>
                    </Button>
                    <Button variant="outline" size="sm">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Import Markdown</span>
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: Security */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-stack-bone">
                    Security & Token Claims
                  </h3>
                  <p className="text-stack-steel text-xs">
                    Auth0 JWT token claims and identity isolation parameters.
                  </p>
                </div>

                <div className="p-4 rounded border border-stack-metal bg-stack-bg space-y-3 font-mono text-[11px]">
                  <div className="flex justify-between border-b border-stack-metal/40 pb-2">
                    <span className="text-stack-steel">
                      Canonical Identity (sub):
                    </span>
                    <span className="font-bold text-stack-bone">
                      {user?.sub || 'github|84912034'}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-stack-metal/40 pb-2">
                    <span className="text-stack-steel">Issuer (iss):</span>
                    <span className="text-stack-bone">
                      https://dev-q17s3o8mib1dgwhd.us.auth0.com/
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-stack-metal/40 pb-2">
                    <span className="text-stack-steel">Audience (aud):</span>
                    <span className="text-stack-bone">
                      https://api.stack.modula
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stack-steel">Storage Namespace:</span>
                    <span className="text-stack-red-hover font-bold">
                      stack:user:{user?.sub || 'isolated'}
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-stack-red-hover hover:border-stack-red-hover"
                    onClick={() => {
                      onClose();
                      navigate('/auth/logout');
                    }}
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Revoke Local Session & Tokens</span>
                  </Button>
                </div>
              </div>
            )}

            {/* TAB 7: About */}
            {activeTab === 'about' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-stack-bone">
                    STACK — A Modula Project
                  </h3>
                  <p className="text-stack-steel text-xs">
                    Industrial Markdown-first note engine for desktop & web.
                  </p>
                </div>

                <div className="p-4 rounded border border-stack-metal bg-stack-surface-raised space-y-3 text-xs leading-relaxed text-stack-silver">
                  <p>
                    <strong className="text-stack-bone">Core Principle:</strong>{' '}
                    Markdown notes without the noise. Write plainly. Keep
                    everything.
                  </p>
                  <p>
                    <strong className="text-stack-bone">Version:</strong> 0.1.0
                  </p>
                  <p>
                    <strong className="text-stack-bone">License:</strong> MIT
                    License 2026 under{' '}
                    <a
                      href="https://github.com/parikesitad-pm"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline text-stack-bone"
                    >
                      parikesitad-pm
                    </a>
                  </p>
                  <div className="pt-2 flex flex-wrap gap-3">
                    <a
                      href="https://github.com/parikesitad-pm/stack-react_ts_with_aws_deployment"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-stack-bone hover:underline"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>GitHub Repository</span>
                    </a>
                    <a
                      href="https://stack-md.online"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-stack-bone hover:underline"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Live Preview</span>
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
