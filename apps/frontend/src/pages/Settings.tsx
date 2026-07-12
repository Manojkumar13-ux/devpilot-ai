import { useState, useEffect, useRef } from "react";
import { useAuth } from "../hooks/AuthProvider";
import { api } from "../lib/api";
import { LogOut, Eye, EyeOff, Loader2, Check, X, Trash2, Save, Palette, Monitor, Sun, Moon, Type, Hash, FileText, Minimize2, Bell, Mail, CheckCircle, Sparkles, BarChart3, Key, AlertTriangle } from "lucide-react";

interface GeneralSettings {
  displayName: string;
  email: string;
  timezone: string;
  language: string;
}

interface AppearanceSettings {
  theme: string;
  primaryColor: string;
  fontSize: number;
  compactMode: boolean;
}

interface EditorSettings {
  theme: string;
  fontFamily: string;
  fontSize: number;
  tabSize: number;
  autoSave: boolean;
  lineNumbers: boolean;
  minimap: boolean;
}

interface NotificationSettings {
  emailNotifications: boolean;
  submissionResults: boolean;
  aiReviewReady: boolean;
  weeklyReport: boolean;
}

interface Settings {
  general: GeneralSettings;
  appearance: AppearanceSettings;
  editor: EditorSettings;
  notifications: NotificationSettings;
}

const TABS = ["General", "Appearance", "Code Editor", "Notifications", "Privacy"] as const;
type Tab = (typeof TABS)[number];

const TIMEZONES = [
  "UTC", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "Europe/London", "Europe/Paris", "Europe/Berlin", "Europe/Moscow",
  "Asia/Tokyo", "Asia/Shanghai", "Asia/Kolkata", "Asia/Dubai",
  "Australia/Sydney", "Pacific/Auckland",
];

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "ja", label: "Japanese" },
  { value: "zh", label: "Chinese" },
  { value: "ko", label: "Korean" },
  { value: "pt", label: "Portuguese" },
];

const PRIMARY_COLORS = [
  { value: "#6c63ff", label: "Purple" },
  { value: "#00d4ff", label: "Cyan" },
  { value: "#ff6b6b", label: "Red" },
  { value: "#51cf66", label: "Green" },
  { value: "#ffd43b", label: "Yellow" },
  { value: "#cc5de8", label: "Magenta" },
  { value: "#20c997", label: "Teal" },
  { value: "#ff922b", label: "Orange" },
];

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ${
        checked ? "bg-[#6c63ff]" : "bg-[rgba(255,255,255,0.12)]"
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-200 ${
          checked ? "translate-x-[18px]" : "translate-x-[3px]"
        }`}
      />
    </button>
  );
}

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("General");
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [general, setGeneral] = useState<GeneralSettings>({ displayName: "", email: "", timezone: "UTC", language: "en" });
  const [appearance, setAppearance] = useState<AppearanceSettings>({ theme: "dark", primaryColor: "#6c63ff", fontSize: 14, compactMode: false });
  const [editor, setEditor] = useState<EditorSettings>({ theme: "vs-dark", fontFamily: "'JetBrains Mono', monospace", fontSize: 14, tabSize: 2, autoSave: true, lineNumbers: true, minimap: true });
  const [notifications, setNotifications] = useState<NotificationSettings>({ emailNotifications: true, submissionResults: true, aiReviewReady: true, weeklyReport: false });
  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const debounceTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    try {
      const data = await api.settings.get();
      setSettings(data);
      setGeneral({ displayName: data.general?.displayName || "", email: data.general?.email || user?.email || "", timezone: data.general?.timezone || "UTC", language: data.general?.language || "en" });
      setAppearance(data.appearance || { theme: "dark", primaryColor: "#6c63ff", fontSize: 14, compactMode: false });
      setEditor(data.editor || { theme: "vs-dark", fontFamily: "'JetBrains Mono', monospace", fontSize: 14, tabSize: 2, autoSave: true, lineNumbers: true, minimap: true });
      setNotifications(data.notifications || { emailNotifications: true, submissionResults: true, aiReviewReady: true, weeklyReport: false });
    } catch {
      setError("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (section: string, data: unknown) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(async () => {
      try {
        setSaving(true);
        await api.settings.update({ [section]: data });
        setSuccess("Settings saved");
        setTimeout(() => setSuccess(""), 2000);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setSaving(false);
      }
    }, 300);
  };

  const handleSaveGeneral = async () => {
    try {
      setSaving(true);
      await api.settings.update({ general });
      setSuccess("Settings saved");
      setTimeout(() => setSuccess(""), 2000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setError("Passwords do not match"); return; }
    if (newPassword.length < 6) { setError("Password must be at least 6 characters"); return; }
    try {
      setChangingPassword(true);
      await api.settings.changePassword({ currentPassword, newPassword });
      setSuccess("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setSuccess(""), 3000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    try {
      setDeleting(true);
      await api.settings.deleteAccount({ password: deletePassword });
      logout();
    } catch (e: any) {
      setError(e.message);
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-[#6c63ff]" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-[#6b6b85] mt-1">Manage your preferences</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-[rgba(255,82,82,0.1)] border border-[rgba(255,82,82,0.2)] text-sm text-[#ff5252]">
          <X className="w-4 h-4 cursor-pointer" onClick={() => setError("")} />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-[rgba(81,207,102,0.1)] border border-[rgba(81,207,102,0.2)] text-sm text-[#51cf66]">
          <Check className="w-4 h-4" />
          {success}
        </div>
      )}

      {/* Horizontal Tab Bar */}
      <div className="flex border-b border-[rgba(255,255,255,0.06)]">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setError(""); setSuccess(""); }}
            className={`px-5 py-3 text-sm font-medium transition-all duration-200 relative ${
              activeTab === tab ? "text-white" : "text-[#6b6b85] hover:text-[#a0a0b8]"
            }`}
          >
            {tab}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#6c63ff] to-[#00d4ff]" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* General */}
        {activeTab === "General" && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#a0a0b8] mb-1.5">Display Name</label>
              <input
                type="text"
                value={general.displayName}
                onChange={(e) => setGeneral({ ...general, displayName: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-white text-sm focus:outline-none focus:border-[#6c63ff] transition-colors"
                placeholder="Your display name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#a0a0b8] mb-1.5">Email</label>
              <input
                type="email"
                value={general.email}
                onChange={(e) => setGeneral({ ...general, email: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-white text-sm focus:outline-none focus:border-[#6c63ff] transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#a0a0b8] mb-1.5">Timezone</label>
              <select
                value={general.timezone}
                onChange={(e) => setGeneral({ ...general, timezone: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-white text-sm focus:outline-none focus:border-[#6c63ff] transition-colors"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz} className="bg-[#1a1a2e]">{tz}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#a0a0b8] mb-1.5">Language</label>
              <select
                value={general.language}
                onChange={(e) => setGeneral({ ...general, language: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-white text-sm focus:outline-none focus:border-[#6c63ff] transition-colors"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.value} value={lang.value} className="bg-[#1a1a2e]">{lang.label}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleSaveGeneral}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-[#6c63ff] to-[#00d4ff] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          </div>
        )}

        {/* Appearance */}
        {activeTab === "Appearance" && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[#a0a0b8] mb-2">Theme</label>
              <div className="flex gap-2">
                {[
                  { value: "dark", icon: Moon, label: "Dark" },
                  { value: "light", icon: Sun, label: "Light" },
                  { value: "system", icon: Monitor, label: "System" },
                ].map(({ value, icon: Icon, label }) => (
                  <button
                    key={value}
                    onClick={() => { setAppearance({ ...appearance, theme: value }); saveSettings("appearance", { ...appearance, theme: value }); }}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all duration-200 ${
                      appearance.theme === value
                        ? "border-[#6c63ff] bg-[rgba(108,99,255,0.1)] text-white"
                        : "border-[rgba(255,255,255,0.08)] text-[#a0a0b8] hover:text-white hover:border-[rgba(255,255,255,0.15)]"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#a0a0b8] mb-2">Primary Color</label>
              <div className="flex gap-2 flex-wrap">
                {PRIMARY_COLORS.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => { setAppearance({ ...appearance, primaryColor: value }); saveSettings("appearance", { ...appearance, primaryColor: value }); }}
                    className={`w-8 h-8 rounded-full transition-all duration-200 ${
                      appearance.primaryColor === value ? "ring-2 ring-white ring-offset-2 ring-offset-[#0a0a0f] scale-110" : ""
                    }`}
                    style={{ backgroundColor: value }}
                    title={label}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#a0a0b8] mb-1.5">Font Size: {appearance.fontSize}px</label>
              <input
                type="range"
                min={12}
                max={24}
                value={appearance.fontSize}
                onChange={(e) => { const v = Number(e.target.value); setAppearance({ ...appearance, fontSize: v }); saveSettings("appearance", { ...appearance, fontSize: v }); }}
                className="w-full max-w-xs accent-[#6c63ff]"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-white">Compact Mode</div>
                <div className="text-xs text-[#6b6b85]">Reduce spacing for a tighter layout</div>
              </div>
              <Toggle checked={appearance.compactMode} onChange={(v) => { setAppearance({ ...appearance, compactMode: v }); saveSettings("appearance", { ...appearance, compactMode: v }); }} />
            </div>
          </div>
        )}

        {/* Code Editor */}
        {activeTab === "Code Editor" && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#a0a0b8] mb-1.5">Editor Theme</label>
              <select
                value={editor.theme}
                onChange={(e) => { setEditor({ ...editor, theme: e.target.value }); saveSettings("editor", { ...editor, theme: e.target.value }); }}
                className="w-full max-w-xs px-3 py-2 rounded-lg bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-white text-sm focus:outline-none focus:border-[#6c63ff] transition-colors"
              >
                {["vs-dark", "vs-light", "hc-black", "hc-light"].map((t) => (
                  <option key={t} value={t} className="bg-[#1a1a2e]">{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#a0a0b8] mb-1.5">Font Family</label>
              <input
                type="text"
                value={editor.fontFamily}
                onChange={(e) => { setEditor({ ...editor, fontFamily: e.target.value }); saveSettings("editor", { ...editor, fontFamily: e.target.value }); }}
                className="w-full max-w-xs px-3 py-2 rounded-lg bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-white text-sm focus:outline-none focus:border-[#6c63ff] transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#a0a0b8] mb-1.5">Font Size: {editor.fontSize}px</label>
              <input
                type="range"
                min={10}
                max={28}
                value={editor.fontSize}
                onChange={(e) => { const v = Number(e.target.value); setEditor({ ...editor, fontSize: v }); saveSettings("editor", { ...editor, fontSize: v }); }}
                className="w-full max-w-xs accent-[#6c63ff]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#a0a0b8] mb-1.5">Tab Size</label>
              <select
                value={editor.tabSize}
                onChange={(e) => { const v = Number(e.target.value); setEditor({ ...editor, tabSize: v }); saveSettings("editor", { ...editor, tabSize: v }); }}
                className="w-full max-w-xs px-3 py-2 rounded-lg bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-white text-sm focus:outline-none focus:border-[#6c63ff] transition-colors"
              >
                {[2, 4, 8].map((n) => (
                  <option key={n} value={n} className="bg-[#1a1a2e]">{n} spaces</option>
                ))}
              </select>
            </div>
            {[
              { key: "autoSave", label: "Auto Save", desc: "Automatically save code changes" },
              { key: "lineNumbers", label: "Line Numbers", desc: "Show line numbers in the editor" },
              { key: "minimap", label: "Minimap", desc: "Show code minimap sidebar" },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-white">{label}</div>
                  <div className="text-xs text-[#6b6b85]">{desc}</div>
                </div>
                <Toggle
                  checked={editor[key as keyof Pick<EditorSettings, "autoSave" | "lineNumbers" | "minimap">]}
                  onChange={(v) => { const upd = { ...editor, [key]: v }; setEditor(upd); saveSettings("editor", upd); }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Notifications */}
        {activeTab === "Notifications" && (
          <div className="space-y-4">
            {[
              { key: "emailNotifications", icon: Mail, label: "Email Notifications", desc: "Receive email updates about your account" },
              { key: "submissionResults", icon: CheckCircle, label: "Submission Results", desc: "Get notified when your code is evaluated" },
              { key: "aiReviewReady", icon: Sparkles, label: "AI Review Ready", desc: "Alert when AI code review completes" },
              { key: "weeklyReport", icon: BarChart3, label: "Weekly Report", desc: "Receive weekly performance summary" },
            ].map(({ key, icon: Icon, label, desc }) => (
              <div key={key} className="flex items-center justify-between p-4 rounded-lg bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[rgba(108,99,255,0.1)] flex items-center justify-center">
                    <Icon className="w-4 h-4 text-[#6c63ff]" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{label}</div>
                    <div className="text-xs text-[#6b6b85]">{desc}</div>
                  </div>
                </div>
                <Toggle
                  checked={notifications[key as keyof NotificationSettings]}
                  onChange={(v) => { const upd = { ...notifications, [key]: v }; setNotifications(upd); saveSettings("notifications", upd); }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Privacy */}
        {activeTab === "Privacy" && (
          <div className="space-y-8">
            {/* Change Password */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Key className="w-5 h-5 text-[#6c63ff]" />
                Change Password
              </h3>
              <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-[#a0a0b8] mb-1.5">Current Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-white text-sm focus:outline-none focus:border-[#6c63ff] transition-colors pr-10"
                      required
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b6b85] hover:text-white">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#a0a0b8] mb-1.5">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-white text-sm focus:outline-none focus:border-[#6c63ff] transition-colors"
                    required
                    minLength={6}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#a0a0b8] mb-1.5">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-white text-sm focus:outline-none focus:border-[#6c63ff] transition-colors"
                    required
                    minLength={6}
                  />
                </div>
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-[#6c63ff] to-[#00d4ff] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {changingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                  Change Password
                </button>
              </form>
            </div>

            <div className="border-t border-[rgba(255,255,255,0.06)]" />

            {/* Delete Account */}
            <div>
              <h3 className="text-lg font-semibold text-[#ff5252] mb-4 flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                Delete Account
              </h3>
              <div className="p-4 rounded-lg border border-[rgba(255,82,82,0.2)] bg-[rgba(255,82,82,0.05)] max-w-md space-y-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-[#ff5252] mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-[#a0a0b8]">
                    This action is <strong className="text-[#ff5252]">irreversible</strong>. All your data, including submissions, reviews, and profile information will be permanently deleted.
                  </div>
                </div>
                {confirmDelete && (
                  <div>
                    <label className="block text-sm font-medium text-[#a0a0b8] mb-1.5">Enter your password to confirm</label>
                    <input
                      type="password"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-white text-sm focus:outline-none focus:border-[#ff5252] transition-colors mb-3"
                      placeholder="Your password"
                    />
                  </div>
                )}
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting || (confirmDelete && !deletePassword)}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#ff5252] text-white text-sm font-medium hover:bg-[#e04848] transition-colors disabled:opacity-50"
                >
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  {confirmDelete ? "Permanently Delete My Account" : "Delete My Account"}
                </button>
                {confirmDelete && (
                  <button
                    onClick={() => { setConfirmDelete(false); setDeletePassword(""); }}
                    className="ml-2 text-sm text-[#6b6b85] hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
