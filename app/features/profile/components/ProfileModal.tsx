import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router';
import {
  X,
  User,
  Shield,
  Key,
  HardDrive,
  AlertTriangle,
  Lock,
  Check,
  ExternalLink,
  Loader2,
  Trash2,
  RefreshCw,
  LogOut,
  Fingerprint,
  Mail,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { useAuthSession } from '~/features/auth/hooks/useAuthSession';
import { useCurrentUserProfile } from '../hooks/useCurrentUserProfile';
import { IdentityService } from '../services/identity.service';
import { AvatarService } from '../services/avatar.service';
import { DeviceLockService } from '../services/deviceLock.service';
import { SecurityChallengeModal } from './SecurityChallengeModal';
import { Button } from '~/components/atoms/Button';
import { Badge } from '~/components/atoms/Badge';
import { normalizeUsername, usernameSchema, fullNameSchema } from '../schemas/username.schema';
import { getWorkspaceDbName, hashSub, userWorkspaceStorage } from '~/features/workspace/services/userWorkspaceStorage';

export type ProfileTab = 'profile' | 'security' | 'account' | 'danger';

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
  const { auth0User, user, token, isSocial, emailVerified, signOut } = useAuthSession();
  const provider = user?.provider || 'auth0';
  const {
    profile,
    sub,
    username,
    fullName: currentFullName,
    email,
    displayName,
    initials,
    avatarUrl,
    hasCustomAvatar,
    updateFullName,
    updateUsername,
    updateEmail,
    deleteAvatar,
    refetch: refetchProfile,
  } = useCurrentUserProfile();

  const [activeTab, setActiveTab] = useState<ProfileTab>(initialTab);
  const modalRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states: Full Name
  const [fullNameInput, setFullNameInput] = useState(currentFullName);
  const [fullNameError, setFullNameError] = useState<string | null>(null);
  const [fullNameSaved, setFullNameSaved] = useState(false);
  const [isSavingFullName, setIsSavingFullName] = useState(false);

  // Avatar upload state
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  // Challenge modal state
  const [challengePurpose, setChallengePurpose] = useState<
    'change-username' | 'change-email' | 'delete-account' | null
  >(null);
  const [pendingNewUsername, setPendingNewUsername] = useState('');
  const [pendingNewEmail, setPendingNewEmail] = useState('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);

  // Username change inline form
  const [isChangingUsername, setIsChangingUsername] = useState(false);
  const [newUsernameInput, setNewUsernameInput] = useState('');
  const [usernameCheckStatus, setUsernameCheckStatus] = useState<
    'idle' | 'checking' | 'available' | 'taken' | 'invalid'
  >('idle');
  const [usernameCheckError, setUsernameCheckError] = useState<string | null>(null);

  // Email change inline form
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [newEmailInput, setNewEmailInput] = useState('');
  const [newEmailError, setNewEmailError] = useState<string | null>(null);

  // Device PIN state
  const [deviceLockConfig, setDeviceLockConfig] = useState(() =>
    sub ? DeviceLockService.getConfig(sub) : { enabled: false, autoLockMinutes: 5, failedAttempts: 0 }
  );
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [currentPinToDisable, setCurrentPinToDisable] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinSuccess, setPinSuccess] = useState<string | null>(null);
  const [autoLockMins, setAutoLockMins] = useState(deviceLockConfig.autoLockMinutes || 5);

  // Danger Zone deletion form
  const [deleteConfirmationUsername, setDeleteConfirmationUsername] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState<string | null>(null);

  // Sync fullName state when profile loads
  useEffect(() => {
    setFullNameInput(currentFullName || '');
  }, [currentFullName]);

  // Sync DeviceLockConfig when sub changes or modal opens
  useEffect(() => {
    if (sub && isOpen) {
      const cfg = DeviceLockService.getConfig(sub);
      setDeviceLockConfig(cfg);
      setAutoLockMins(cfg.autoLockMinutes || 5);
    }
  }, [sub, isOpen]);

  // Keyboard accessibility: Escape key closes modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !challengePurpose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, challengePurpose]);

  // Focus trap inside dialog
  useEffect(() => {
    if (!isOpen) return;
    const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable && focusable.length > 0) {
      focusable[0]?.focus();
    }
  }, [isOpen, activeTab]);

  // Full Name Save
  const handleSaveFullName = async (e: React.FormEvent) => {
    e.preventDefault();
    setFullNameError(null);
    setFullNameSaved(false);

    const trimmed = fullNameInput.trim();
    if (trimmed.length > 100) {
      setFullNameError('Full name cannot exceed 100 characters.');
      return;
    }

    setIsSavingFullName(true);
    try {
      await updateFullName(trimmed);
      setFullNameSaved(true);
      setTimeout(() => setFullNameSaved(false), 3000);
    } catch (err: unknown) {
      setFullNameError(err instanceof Error ? err.message : 'Failed to update full name.');
    } finally {
      setIsSavingFullName(false);
    }
  };

  // Avatar Upload via native Canvas WebP pipeline
  const handleAvatarFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !sub) return;

    setIsUploadingAvatar(true);
    setAvatarError(null);
    try {
      const effectiveToken = token || sub;
      await AvatarService.uploadAvatar(file, sub, effectiveToken);
      await refetchProfile();
      setActionSuccessMsg('Avatar updated successfully.');
      setTimeout(() => setActionSuccessMsg(null), 3000);
    } catch (err: unknown) {
      setAvatarError(err instanceof Error ? err.message : 'Failed to process avatar.');
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    if (!confirm('Remove your custom avatar?')) return;
    try {
      await deleteAvatar();
      await refetchProfile();
      setActionSuccessMsg('Avatar removed.');
      setTimeout(() => setActionSuccessMsg(null), 3000);
    } catch (err: unknown) {
      setAvatarError(err instanceof Error ? err.message : 'Failed to delete avatar.');
    }
  };

  // Username validation & check
  const handleCheckNewUsername = async (candidate: string) => {
    setNewUsernameInput(candidate);
    setUsernameCheckError(null);
    const clean = normalizeUsername(candidate);
    if (!clean) {
      setUsernameCheckStatus('idle');
      return;
    }
    const val = usernameSchema.safeParse(clean);
    if (!val.success) {
      setUsernameCheckStatus('invalid');
      setUsernameCheckError(val.error.issues[0]?.message || 'Invalid username format.');
      return;
    }
    setUsernameCheckStatus('checking');
    try {
      const res = await IdentityService.checkAvailability(clean, token || undefined);
      if (res.available) {
        setUsernameCheckStatus('available');
      } else {
        setUsernameCheckStatus('taken');
        setUsernameCheckError(`@${clean} is already claimed.`);
      }
    } catch {
      setUsernameCheckStatus('idle');
    }
  };

  // Start username change challenge
  const handleInitiateUsernameChange = () => {
    const clean = normalizeUsername(newUsernameInput);
    if (usernameCheckStatus !== 'available' || !clean) {
      setUsernameCheckError('Please choose an available username first.');
      return;
    }
    setPendingNewUsername(clean);
    setChallengePurpose('change-username');
  };

  // Start email change challenge
  const handleInitiateEmailChange = () => {
    const clean = newEmailInput.trim().toLowerCase();
    if (!clean || !clean.includes('@')) {
      setNewEmailError('Please enter a valid email address.');
      return;
    }
    setPendingNewEmail(clean);
    setChallengePurpose('change-email');
  };

  // Challenge verified handler
  const handleChallengeVerified = async (challengeId: string, code: string) => {
    if (challengePurpose === 'change-username') {
      await updateUsername({
        newUsername: pendingNewUsername,
        challengeId,
        challengeCode: code,
      });
      setIsChangingUsername(false);
      setNewUsernameInput('');
      setUsernameCheckStatus('idle');
      setActionSuccessMsg(`Username successfully changed to @${pendingNewUsername}`);
    } else if (challengePurpose === 'change-email') {
      await updateEmail({
        newEmail: pendingNewEmail,
        challengeId,
        challengeCode: code,
      });
      setIsChangingEmail(false);
      setNewEmailInput('');
      setActionSuccessMsg(`Email successfully updated to ${pendingNewEmail}`);
    } else if (challengePurpose === 'delete-account') {
      setIsDeletingAccount(true);
      await IdentityService.deleteAccount(
        {
          confirmedUsername: deleteConfirmationUsername,
          challengeId,
          challengeCode: code,
        },
        token || sub || ''
      );

      // Clean local partition & lock
      if (sub) {
        await userWorkspaceStorage.clearUserData(sub);
        DeviceLockService.resetAfterReauthentication(sub);
      }

      onClose();
      await signOut(window.location.origin);
    }
    setChallengePurpose(null);
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  // Password reset/add handlers
  const handlePasswordAction = async () => {
    setActionErrorMsg(null);
    setActionSuccessMsg(null);
    const effectiveToken = token || sub || '';
    try {
      if (isSocial) {
        // Request add password / social account linking
        const res = await IdentityService.requestPasswordAdd(effectiveToken);
        if (res.ticketUrl) {
          window.location.href = res.ticketUrl;
        } else {
          setActionSuccessMsg(res.message);
        }
      } else {
        // Request password change ticket
        const res = await IdentityService.requestPasswordChange(effectiveToken);
        if (res.ticketUrl) {
          window.location.href = res.ticketUrl;
        } else {
          setActionSuccessMsg(res.message);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Operation failed.';
      if (msg === 'PASSWORD_SETUP_UNAVAILABLE') {
        setActionErrorMsg(
          'Password setup unavailable: Account linking is not enabled for this Auth0 tenant.'
        );
      } else {
        setActionErrorMsg(msg);
      }
    }
  };

  // Device Lock Handlers
  const handleSetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);
    setPinSuccess(null);

    if (!sub) return;
    if (newPin.length !== 6 || !/^\d{6}$/.test(newPin)) {
      setPinError('PIN must be exactly 6 digits.');
      return;
    }
    if (newPin !== confirmPin) {
      setPinError('PIN confirmation does not match.');
      return;
    }

    try {
      await DeviceLockService.setPin(sub, newPin, autoLockMins);
      const cfg = DeviceLockService.getConfig(sub);
      setDeviceLockConfig(cfg);
      setNewPin('');
      setConfirmPin('');
      setPinSuccess('Device PIN successfully activated on this browser.');
      setTimeout(() => setPinSuccess(null), 4000);
    } catch (err: unknown) {
      setPinError(err instanceof Error ? err.message : 'Failed to set PIN.');
    }
  };

  const handleDisablePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);
    setPinSuccess(null);

    if (!sub) return;
    try {
      await DeviceLockService.disablePin(sub, currentPinToDisable);
      const cfg = DeviceLockService.getConfig(sub);
      setDeviceLockConfig(cfg);
      setCurrentPinToDisable('');
      setPinSuccess('Device PIN disabled.');
      setTimeout(() => setPinSuccess(null), 4000);
    } catch (err: unknown) {
      setPinError(err instanceof Error ? err.message : 'Failed to disable PIN.');
    }
  };

  const handleUpdateAutoLock = (mins: number) => {
    if (!sub) return;
    setAutoLockMins(mins);
    if (deviceLockConfig.enabled) {
      const updated = { ...deviceLockConfig, autoLockMinutes: mins };
      DeviceLockService.saveConfig(sub, updated);
      setDeviceLockConfig(updated);
    }
  };

  if (!isOpen) return null;

  const workspaceDbName = sub ? getWorkspaceDbName(sub) : 'unknown';

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-modal-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stack-bg/80 backdrop-blur-sm"
      >
        <div
          ref={modalRef}
          className="w-full max-w-3xl border border-stack-metal bg-stack-surface shadow-2xl font-mono text-stack-bone flex flex-col max-h-[92vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-stack-metal bg-stack-surface-raised shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full border border-stack-metal overflow-hidden bg-stack-bg flex items-center justify-center shrink-0">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-bold text-stack-bone">{initials}</span>
                )}
              </div>
              <div>
                <h2 id="profile-modal-title" className="text-sm font-bold tracking-tight text-stack-bone">
                  {displayName}
                </h2>
                <span className="text-xs text-stack-steel">@{username}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close settings"
              className="text-stack-steel hover:text-stack-bone p-1 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-stack-steel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-stack-metal bg-stack-bg px-5 gap-1 shrink-0 overflow-x-auto">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'profile'}
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                activeTab === 'profile'
                  ? 'border-stack-red-slate text-stack-bone'
                  : 'border-transparent text-stack-steel hover:text-stack-silver'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Profile</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'security'}
              onClick={() => setActiveTab('security')}
              className={`flex items-center gap-2 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                activeTab === 'security'
                  ? 'border-stack-red-slate text-stack-bone'
                  : 'border-transparent text-stack-steel hover:text-stack-silver'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Security</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'account'}
              onClick={() => setActiveTab('account')}
              className={`flex items-center gap-2 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                activeTab === 'account'
                  ? 'border-stack-red-slate text-stack-bone'
                  : 'border-transparent text-stack-steel hover:text-stack-silver'
              }`}
            >
              <HardDrive className="w-3.5 h-3.5" />
              <span>Account</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'danger'}
              onClick={() => setActiveTab('danger')}
              className={`flex items-center gap-2 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                activeTab === 'danger'
                  ? 'border-red-600 text-red-400'
                  : 'border-transparent text-stack-steel hover:text-red-400/80'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Danger Zone</span>
            </button>
          </div>

          {/* Notifications Banner */}
          {actionSuccessMsg && (
            <div className="bg-emerald-950/40 border-b border-emerald-800 px-5 py-2 text-xs text-emerald-300 flex items-center gap-2">
              <Check className="w-3.5 h-3.5 shrink-0" />
              <span>{actionSuccessMsg}</span>
            </div>
          )}
          {actionErrorMsg && (
            <div className="bg-red-950/40 border-b border-red-800 px-5 py-2 text-xs text-red-300 flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>{actionErrorMsg}</span>
            </div>
          )}

          {/* Modal Content Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            {/* TAB 1: PROFILE */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                {/* Avatar Section */}
                <div className="border border-stack-metal bg-stack-surface-raised p-4 rounded-sm space-y-3">
                  <span className="text-[11px] font-bold text-stack-bone uppercase tracking-wider block">
                    Avatar
                  </span>
                  <div className="flex flex-col sm:flex-row items-center gap-5">
                    <div className="w-20 h-20 rounded-full border-2 border-stack-metal overflow-hidden bg-stack-bg flex items-center justify-center shrink-0">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl font-bold text-stack-bone">{initials}</span>
                      )}
                    </div>

                    <div className="flex-1 space-y-2 text-center sm:text-left">
                      <p className="text-xs text-stack-steel leading-relaxed">
                        Client-side canvas center-cropped and encoded as 512×512 WebP. Expiring S3 URLs are never persisted.
                      </p>
                      {avatarError && <p className="text-xs text-red-400">{avatarError}</p>}
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarFileSelected}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          disabled={isUploadingAvatar}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          {isUploadingAvatar ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                              Processing…
                            </>
                          ) : (
                            'Upload Photo'
                          )}
                        </Button>
                        {hasCustomAvatar && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleRemoveAvatar}
                            className="text-stack-red-hover hover:border-stack-red-hover"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1" />
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Handle (@username) Section */}
                <div className="border border-stack-metal bg-stack-surface-raised p-4 rounded-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-stack-bone uppercase tracking-wider block">
                        STACK Username
                      </span>
                      <span className="text-xs text-stack-steel">Your public handle on STACK.</span>
                    </div>
                    {!isChangingUsername && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsChangingUsername(true);
                          setNewUsernameInput('');
                          setUsernameCheckStatus('idle');
                        }}
                      >
                        Change Username
                      </Button>
                    )}
                  </div>

                  {!isChangingUsername ? (
                    <div className="text-sm font-semibold text-stack-bone bg-stack-bg px-3 py-2 border border-stack-metal inline-block">
                      @{username}
                    </div>
                  ) : (
                    <div className="space-y-3 pt-2 border-t border-stack-metal/60">
                      <div className="text-xs text-stack-silver">
                        Requires email security verification. Changing your username will release <code className="text-stack-bone">@{username}</code> and will NOT alter your notes storage partition.
                      </div>

                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-2 text-stack-steel text-sm">@</span>
                          <input
                            type="text"
                            value={newUsernameInput}
                            onChange={(e) => handleCheckNewUsername(e.target.value)}
                            placeholder="new_handle"
                            className="w-full pl-7 pr-3 py-1.5 text-xs bg-stack-bg border border-stack-metal text-stack-bone focus:outline-none focus:border-stack-steel"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          disabled={usernameCheckStatus !== 'available'}
                          onClick={handleInitiateUsernameChange}
                          className="bg-stack-red-slate hover:bg-stack-red-hover text-white shrink-0"
                        >
                          Request Code
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setIsChangingUsername(false)}
                          className="shrink-0"
                        >
                          Cancel
                        </Button>
                      </div>

                      {usernameCheckStatus === 'checking' && (
                        <p className="text-[11px] text-stack-steel">Checking availability…</p>
                      )}
                      {usernameCheckStatus === 'available' && (
                        <p className="text-[11px] text-emerald-400">@{normalizeUsername(newUsernameInput)} is available.</p>
                      )}
                      {usernameCheckError && (
                        <p className="text-[11px] text-red-400">{usernameCheckError}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Full Name Section */}
                <form onSubmit={handleSaveFullName} className="border border-stack-metal bg-stack-surface-raised p-4 rounded-sm space-y-3">
                  <span className="text-[11px] font-bold text-stack-bone uppercase tracking-wider block">
                    Full Name (Optional)
                  </span>
                  <p className="text-xs text-stack-steel">
                    Display name shown across the UI. Up to 100 characters. Does not require email challenge.
                  </p>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={100}
                      value={fullNameInput}
                      onChange={(e) => setFullNameInput(e.target.value)}
                      placeholder="e.g. Parikesit Ananta"
                      className="flex-1 px-3 py-1.5 text-xs bg-stack-bg border border-stack-metal text-stack-bone focus:outline-none focus:border-stack-steel"
                    />
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      disabled={isSavingFullName || fullNameInput === currentFullName}
                      className="bg-stack-red-slate hover:bg-stack-red-hover text-white shrink-0"
                    >
                      {isSavingFullName ? 'Saving…' : fullNameSaved ? 'Saved!' : 'Save'}
                    </Button>
                  </div>
                  {fullNameError && <p className="text-[11px] text-red-400">{fullNameError}</p>}
                </form>

                {/* Email Section */}
                <div className="border border-stack-metal bg-stack-surface-raised p-4 rounded-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-stack-bone uppercase tracking-wider block">
                        Email Address
                      </span>
                      <span className="text-xs text-stack-steel">Primary identity email for alerts and challenges.</span>
                    </div>
                    {!isChangingEmail && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsChangingEmail(true);
                          setNewEmailInput('');
                        }}
                      >
                        Change Email
                      </Button>
                    )}
                  </div>

                  {!isChangingEmail ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-stack-bone font-mono bg-stack-bg px-3 py-1.5 border border-stack-metal">
                        {email || auth0User?.email || 'No email attached'}
                      </span>
                      {emailVerified ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/40 border border-emerald-800 px-2 py-0.5">
                          <ShieldCheck className="w-3 h-3" />
                          VERIFIED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 bg-amber-950/40 border border-amber-800 px-2 py-0.5">
                          <ShieldAlert className="w-3 h-3" />
                          UNVERIFIED
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3 pt-2 border-t border-stack-metal/60">
                      <div className="text-xs text-stack-silver">
                        Requires email challenge code sent to your currently verified email address.
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="email"
                          value={newEmailInput}
                          onChange={(e) => {
                            setNewEmailInput(e.target.value);
                            setNewEmailError(null);
                          }}
                          placeholder="new.email@example.com"
                          className="flex-1 px-3 py-1.5 text-xs bg-stack-bg border border-stack-metal text-stack-bone focus:outline-none focus:border-stack-steel"
                        />
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={handleInitiateEmailChange}
                          className="bg-stack-red-slate hover:bg-stack-red-hover text-white shrink-0"
                        >
                          Request Code
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setIsChangingEmail(false)}
                          className="shrink-0"
                        >
                          Cancel
                        </Button>
                      </div>
                      {newEmailError && <p className="text-[11px] text-red-400">{newEmailError}</p>}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: SECURITY */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                {/* Password Management */}
                <div className="border border-stack-metal bg-stack-surface-raised p-4 rounded-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-stack-bone uppercase tracking-wider block">
                        Password Authentication
                      </span>
                      <span className="text-xs text-stack-steel">
                        {isSocial
                          ? 'Signed in with social provider. STACK does not hold your password.'
                          : 'Standard email and password authentication.'}
                      </span>
                    </div>

                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handlePasswordAction}
                    >
                      <Key className="w-3.5 h-3.5 mr-1" />
                      {isSocial ? 'Add Password' : 'Change Password'}
                    </Button>
                  </div>
                  <p className="text-[11px] text-stack-steel leading-relaxed">
                    STACK never touches, hashes, or stores raw passwords. Passwords are fully managed via Auth0-hosted secure tickets.
                  </p>
                </div>

                {/* Connected Accounts Roster */}
                <div className="border border-stack-metal bg-stack-surface-raised p-4 rounded-sm space-y-3">
                  <span className="text-[11px] font-bold text-stack-bone uppercase tracking-wider block">
                    Connected Accounts
                  </span>
                  <div className="space-y-2">
                    {/* Google */}
                    <div className="flex items-center justify-between p-2.5 bg-stack-bg border border-stack-metal text-xs">
                      <div className="flex items-center gap-2.5">
                        <span className="font-semibold text-stack-bone">Google</span>
                        <span className="text-stack-steel text-[11px]">OAuth 2.0</span>
                      </div>
                      {provider === 'google-oauth2' ? (
                        <span className="text-[10px] text-emerald-400 border border-emerald-800 bg-emerald-950/40 px-2 py-0.5">
                          ACTIVE IDENTITY
                        </span>
                      ) : (
                        <span className="text-[10px] text-stack-steel">Not connected</span>
                      )}
                    </div>

                    {/* GitHub */}
                    <div className="flex items-center justify-between p-2.5 bg-stack-bg border border-stack-metal text-xs">
                      <div className="flex items-center gap-2.5">
                        <span className="font-semibold text-stack-bone">GitHub</span>
                        <span className="text-stack-steel text-[11px]">OAuth 2.0</span>
                      </div>
                      {provider === 'github' ? (
                        <span className="text-[10px] text-emerald-400 border border-emerald-800 bg-emerald-950/40 px-2 py-0.5">
                          ACTIVE IDENTITY
                        </span>
                      ) : (
                        <span className="text-[10px] text-stack-steel">Not connected</span>
                      )}
                    </div>

                    {/* Email/Password */}
                    <div className="flex items-center justify-between p-2.5 bg-stack-bg border border-stack-metal text-xs">
                      <div className="flex items-center gap-2.5">
                        <span className="font-semibold text-stack-bone">Email & Password</span>
                        <span className="text-stack-steel text-[11px]">Auth0 Database</span>
                      </div>
                      {provider === 'auth0' ? (
                        <span className="text-[10px] text-emerald-400 border border-emerald-800 bg-emerald-950/40 px-2 py-0.5">
                          ACTIVE IDENTITY
                        </span>
                      ) : (
                        <span className="text-[10px] text-stack-steel">Not configured</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Device PIN Lock */}
                <div className="border border-stack-metal bg-stack-surface-raised p-4 rounded-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-stack-bone uppercase tracking-wider block">
                        Local Device Lock (6-Digit PIN)
                      </span>
                      <span className="text-xs text-stack-steel">
                        Web Crypto PBKDF2/SHA-256 local convenience lock.
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 border ${
                        deviceLockConfig.enabled
                          ? 'border-emerald-800 bg-emerald-950/40 text-emerald-400'
                          : 'border-stack-metal bg-stack-bg text-stack-steel'
                      }`}
                    >
                      {deviceLockConfig.enabled ? 'PIN ACTIVE' : 'DISABLED'}
                    </span>
                  </div>

                  {/* Explicit honest copy invariant */}
                  <div className="p-3 bg-stack-bg border border-stack-metal/80 text-xs text-stack-silver leading-relaxed">
                    <span className="font-semibold text-stack-bone">Notice:</span> Device PIN locks STACK on this browser. It does not encrypt your notes or replace account authentication.
                  </div>

                  {pinError && <p className="text-xs text-red-400">{pinError}</p>}
                  {pinSuccess && <p className="text-xs text-emerald-400">{pinSuccess}</p>}

                  {/* Enable or Change PIN */}
                  <form onSubmit={handleSetPin} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-stack-steel uppercase block mb-1">
                          {deviceLockConfig.enabled ? 'Set New 6-Digit PIN' : 'Enter 6-Digit PIN'}
                        </label>
                        <input
                          type="password"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={6}
                          value={newPin}
                          onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="••••••"
                          className="w-full tracking-widest text-center px-3 py-1.5 text-xs bg-stack-bg border border-stack-metal text-stack-bone focus:outline-none focus:border-stack-steel"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] text-stack-steel uppercase block mb-1">
                          Confirm 6-Digit PIN
                        </label>
                        <input
                          type="password"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={6}
                          value={confirmPin}
                          onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="••••••"
                          className="w-full tracking-widest text-center px-3 py-1.5 text-xs bg-stack-bg border border-stack-metal text-stack-bone focus:outline-none focus:border-stack-steel"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
                      <div className="flex items-center gap-2 text-xs">
                        <label className="text-stack-steel">Auto-lock timeout:</label>
                        <select
                          value={autoLockMins}
                          onChange={(e) => handleUpdateAutoLock(Number(e.target.value))}
                          className="bg-stack-bg border border-stack-metal text-stack-bone text-xs px-2 py-1 focus:outline-none"
                        >
                          <option value={1}>1 minute</option>
                          <option value={5}>5 minutes</option>
                          <option value={15}>15 minutes</option>
                          <option value={30}>30 minutes</option>
                        </select>
                      </div>

                      <Button
                        type="submit"
                        variant="secondary"
                        size="sm"
                        disabled={newPin.length !== 6 || confirmPin.length !== 6}
                      >
                        {deviceLockConfig.enabled ? 'Update PIN' : 'Enable Device PIN'}
                      </Button>
                    </div>
                  </form>

                  {/* Disable PIN section if active */}
                  {deviceLockConfig.enabled && (
                    <form onSubmit={handleDisablePin} className="pt-3 border-t border-stack-metal/60 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="password"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={6}
                          value={currentPinToDisable}
                          onChange={(e) => setCurrentPinToDisable(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="Enter current PIN"
                          className="w-40 tracking-widest text-center px-3 py-1 text-xs bg-stack-bg border border-stack-metal text-stack-bone focus:outline-none focus:border-stack-steel"
                        />
                        <Button
                          type="submit"
                          variant="outline"
                          size="sm"
                          disabled={currentPinToDisable.length !== 6}
                          className="text-stack-red-hover hover:border-stack-red-hover"
                        >
                          Disable PIN
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: ACCOUNT */}
            {activeTab === 'account' && (
              <div className="space-y-6">
                {/* Account details section (strictly labeled Account details, NOT telemetry) */}
                <div className="border border-stack-metal bg-stack-surface-raised p-4 rounded-sm space-y-4">
                  <span className="text-[11px] font-bold text-stack-bone uppercase tracking-wider block">
                    Account details
                  </span>
                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-stack-steel text-[11px] uppercase block mb-1">
                        Workspace Authority Key (sub)
                      </span>
                      <code className="text-stack-bone bg-stack-bg px-2.5 py-1 border border-stack-metal block break-all">
                        {sub}
                      </code>
                    </div>

                    <div>
                      <span className="text-stack-steel text-[11px] uppercase block mb-1">
                        Isolated Storage Partition (IndexedDB)
                      </span>
                      <code className="text-stack-bone bg-stack-bg px-2.5 py-1 border border-stack-metal block break-all">
                        {workspaceDbName}
                      </code>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <span className="text-stack-steel text-[11px] uppercase block mb-0.5">
                          Profile Created
                        </span>
                        <span className="text-stack-bone">
                          {profile?.createdAt ? new Date(profile.createdAt).toLocaleString() : 'Recent'}
                        </span>
                      </div>
                      <div>
                        <span className="text-stack-steel text-[11px] uppercase block mb-0.5">
                          Last Updated
                        </span>
                        <span className="text-stack-bone">
                          {profile?.updatedAt ? new Date(profile.updatedAt).toLocaleString() : 'Recent'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Workspace Data Export */}
                <div className="border border-stack-metal bg-stack-surface-raised p-4 rounded-sm space-y-3">
                  <span className="text-[11px] font-bold text-stack-bone uppercase tracking-wider block">
                    Export Notes Archive
                  </span>
                  <p className="text-xs text-stack-steel leading-relaxed">
                    Download a raw Markdown export of your local workspace notes and attachments.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      alert('Exporting local markdown archive from partition: ' + workspaceDbName);
                    }}
                  >
                    Export Workspace (.zip)
                  </Button>
                </div>
              </div>
            )}

            {/* TAB 4: DANGER ZONE */}
            {activeTab === 'danger' && (
              <div className="space-y-6">
                <div className="border-2 border-red-900/60 bg-red-950/20 p-5 rounded-sm space-y-4">
                  <div className="flex items-center gap-2.5 text-red-400">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <h3 className="font-bold text-sm tracking-tight">Permanent Account Deletion</h3>
                  </div>

                  <p className="text-xs text-red-200/80 leading-relaxed">
                    Deleting your account is irreversible. It will release your claimed handle{' '}
                    <strong className="text-red-100">@{username}</strong>, delete your cloud profile, and permanently destroy the local browser storage partition{' '}
                    <code className="text-red-100 bg-red-950/80 px-1 py-0.5">{workspaceDbName}</code> on this device.
                  </p>

                  <div className="space-y-3 pt-2 border-t border-red-900/40">
                    <div>
                      <label className="text-[11px] text-red-300 uppercase block mb-1">
                        Type @{username} to confirm:
                      </label>
                      <input
                        type="text"
                        value={deleteConfirmationUsername}
                        onChange={(e) => setDeleteConfirmationUsername(e.target.value)}
                        placeholder={`@${username}`}
                        className="w-full px-3 py-1.5 text-xs bg-stack-bg border border-red-900 text-red-200 focus:outline-none focus:border-red-500"
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        disabled={
                          normalizeUsername(deleteConfirmationUsername) !== username ||
                          isDeletingAccount
                        }
                        onClick={() => setChallengePurpose('delete-account')}
                        className="bg-red-700 hover:bg-red-600 text-white"
                      >
                        {isDeletingAccount ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                            Deleting…
                          </>
                        ) : (
                          'Request Security Code & Delete'
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-stack-metal bg-stack-surface-raised flex items-center justify-between shrink-0">
            <span className="text-[11px] text-stack-steel">
              STACK • Modula Architecture
            </span>

            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      </div>

      {/* Security Challenge Modal for Sensitive Operations */}
      {challengePurpose && (
        <SecurityChallengeModal
          isOpen={Boolean(challengePurpose)}
          onClose={() => setChallengePurpose(null)}
          purpose={challengePurpose}
          token={token || sub || ''}
          title={
            challengePurpose === 'change-username'
              ? `Confirm Username Change to @${pendingNewUsername}`
              : challengePurpose === 'change-email'
              ? `Confirm Email Change to ${pendingNewEmail}`
              : `Authorize Account Deletion for @${username}`
          }
          description={
            challengePurpose === 'change-username'
              ? `Enter the 6-digit security code sent to ${email} to release @${username} and claim @${pendingNewUsername}.`
              : challengePurpose === 'change-email'
              ? `Enter the 6-digit security code sent to ${email} to authorize switching your email to ${pendingNewEmail}.`
              : `Enter the 6-digit security code sent to ${email} to authorize permanent account destruction.`
          }
          onVerified={handleChallengeVerified}
        />
      )}
    </>
  );
}
