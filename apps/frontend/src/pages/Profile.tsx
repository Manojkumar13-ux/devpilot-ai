import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  RefreshCw, Save, AlertTriangle, CheckCircle, Edit2, X,
  MapPin, Building, Link2, Globe, Github, Linkedin, User, Mail,
  Code2, TrendingUp, Zap, Activity,
} from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../hooks/AuthProvider";

interface Skill {
  name: string;
  proficiency: "beginner" | "intermediate" | "advanced" | "expert";
}

interface Badge {
  id: string;
  label: string;
  icon: string;
  description: string;
}

interface ProfileData {
  user: { id: string; username: string; email: string; createdAt: string };
  bio: string;
  location: string;
  company: string;
  github: string;
  linkedin: string;
  website: string;
  country: string;
  skills: Skill[];
  xp: number;
  stats: { problemsSolved: number; acceptanceRate: number; streak: number; totalSubmissions: number };
  badges: Badge[];
}

const PROFICIENCY_COLORS: Record<string, string> = {
  beginner: "bg-[#6b6b85] text-white/60 border-white/10",
  intermediate: "bg-[#6c63ff]/20 text-[#6c63ff] border-[#6c63ff]/30",
  advanced: "bg-[#00d4ff]/20 text-[#00d4ff] border-[#00d4ff]/30",
  expert: "bg-[#00e676]/20 text-[#00e676] border-[#00e676]/30",
};

function LoadingSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <div className="skeleton h-40 rounded-xl" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-24 rounded-xl" />)}
      </div>
      <div className="skeleton h-48 rounded-xl" />
    </div>
  );
}

export default function Profile() {
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Editable fields
  const [editField, setEditField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");

  // Skill input
  const [newSkill, setNewSkill] = useState("");
  const [newProficiency, setNewProficiency] = useState<Skill["proficiency"]>("intermediate");

  useEffect(() => {
    api.profile.get()
      .then((d) => setProfile(d as ProfileData))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load profile"))
      .finally(() => setLoading(false));
  }, []);

  const startEdit = (field: string, currentValue: string) => {
    setEditField(field);
    setEditValue(currentValue);
    setSaveError("");
    setSaveSuccess("");
  };

  const cancelEdit = () => {
    setEditField(null);
    setEditValue("");
  };

  const saveField = async () => {
    if (!editField || !profile) return;
    setSaving(true);
    setSaveError("");
    setSaveSuccess("");
    try {
      const updated = await api.profile.update({ [editField]: editValue }) as any;
      setProfile((prev) => prev ? { ...prev, ...updated } : prev);
      setSaveSuccess("Saved");
      setEditField(null);
      setTimeout(() => setSaveSuccess(""), 2000);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const addSkill = async () => {
    if (!newSkill.trim() || !profile) return;
    const updated = [...profile.skills, { name: newSkill.trim(), proficiency: newProficiency }];
    try {
      const resp = await api.profile.update({ skills: updated }) as any;
      setProfile((prev) => prev ? { ...prev, skills: resp.skills ?? updated } : prev);
      setNewSkill("");
      setNewProficiency("intermediate");
    } catch (e) {
      setSaveError("Failed to add skill");
    }
  };

  const removeSkill = async (index: number) => {
    if (!profile) return;
    const updated = profile.skills.filter((_, i) => i !== index);
    try {
      const resp = await api.profile.update({ skills: updated }) as any;
      setProfile((prev) => prev ? { ...prev, skills: resp.skills ?? updated } : prev);
    } catch (e) {
      setSaveError("Failed to remove skill");
    }
  };

  if (loading) return <LoadingSkeleton />;

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="glass-card p-8 text-center">
          <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
          <p className="text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  const p = profile;
  const s = p?.stats;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Profile header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8"
      >
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#6c63ff] to-[#00d4ff] flex items-center justify-center text-3xl font-bold text-white flex-shrink-0">
            {p?.user?.username?.charAt(0).toUpperCase() || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-white">{p?.user?.username || "User"}</h1>
            <p className="text-sm text-[#a0a0b8]">{p?.user?.email || ""}</p>
            <p className="text-xs text-[#6b6b85] mt-1">
              Member since {p?.user?.createdAt ? new Date(p.user.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long" }) : "—"}
            </p>
            {p?.bio && (
              <InlineEditField
                label=""
                value={p.bio}
                fieldKey="bio"
                editField={editField}
                editValue={editValue}
                onStart={startEdit}
                onCancel={cancelEdit}
                onSave={saveField}
                onChange={setEditValue}
                saving={saving}
                isTextarea
              />
            )}
            {!p?.bio && editField !== "bio" && (
              <button onClick={() => startEdit("bio", "")} className="text-xs text-[#6c63ff] hover:text-[#8b83ff] mt-2 transition-colors">
                + Add bio
              </button>
            )}
          </div>
        </div>

        {/* Save feedback */}
        {saveSuccess && (
          <div className="flex items-center gap-2 text-xs text-green-400 bg-green-500/10 rounded-lg p-3 mt-4">
            <CheckCircle className="w-3.5 h-3.5" /> {saveSuccess}
          </div>
        )}
        {saveError && (
          <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 rounded-lg p-3 mt-4">
            <AlertTriangle className="w-3.5 h-3.5" /> {saveError}
          </div>
        )}
      </motion.div>

      {/* Stats row */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <StatCard icon={Code2} label="Problems Solved" value={s?.problemsSolved ?? 0} color="from-[#6c63ff] to-[#8b83ff]" />
        <StatCard icon={TrendingUp} label="Success Rate" value={s ? `${s.acceptanceRate}%` : "—"} color="from-[#00e676] to-[#69f0ae]" />
        <StatCard icon={Zap} label="Current Streak" value={s ? `${s.streak} day${s.streak !== 1 ? "s" : ""}` : "—"} color="from-[#ffd740] to-[#ffe57f]" />
        <StatCard icon={Activity} label="Total Submissions" value={s?.totalSubmissions ?? 0} color="from-[#00d4ff] to-[#40e0ff]" />
      </motion.div>

      {/* Detail fields */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-6"
      >
        <h2 className="text-sm font-semibold text-white mb-4">Details</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <InlineEditField
            label="Location"
            value={p?.location || ""}
            fieldKey="location"
            icon={<MapPin className="w-3.5 h-3.5" />}
            editField={editField}
            editValue={editValue}
            onStart={startEdit}
            onCancel={cancelEdit}
            onSave={saveField}
            onChange={setEditValue}
            saving={saving}
          />
          <InlineEditField
            label="Company"
            value={p?.company || ""}
            fieldKey="company"
            icon={<Building className="w-3.5 h-3.5" />}
            editField={editField}
            editValue={editValue}
            onStart={startEdit}
            onCancel={cancelEdit}
            onSave={saveField}
            onChange={setEditValue}
            saving={saving}
          />
          <InlineEditField
            label="Country"
            value={p?.country || ""}
            fieldKey="country"
            icon={<Globe className="w-3.5 h-3.5" />}
            editField={editField}
            editValue={editValue}
            onStart={startEdit}
            onCancel={cancelEdit}
            onSave={saveField}
            onChange={setEditValue}
            saving={saving}
          />
          <InlineEditField
            label="Website"
            value={p?.website || ""}
            fieldKey="website"
            icon={<Link2 className="w-3.5 h-3.5" />}
            editField={editField}
            editValue={editValue}
            onStart={startEdit}
            onCancel={cancelEdit}
            onSave={saveField}
            onChange={setEditValue}
            saving={saving}
          />
          <InlineEditField
            label="GitHub"
            value={p?.github || ""}
            fieldKey="github"
            icon={<Github className="w-3.5 h-3.5" />}
            editField={editField}
            editValue={editValue}
            onStart={startEdit}
            onCancel={cancelEdit}
            onSave={saveField}
            onChange={setEditValue}
            saving={saving}
          />
          <InlineEditField
            label="LinkedIn"
            value={p?.linkedin || ""}
            fieldKey="linkedin"
            icon={<Linkedin className="w-3.5 h-3.5" />}
            editField={editField}
            editValue={editValue}
            onStart={startEdit}
            onCancel={cancelEdit}
            onSave={saveField}
            onChange={setEditValue}
            saving={saving}
          />
        </div>
      </motion.div>

      {/* Skills */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-6"
      >
        <h2 className="text-sm font-semibold text-white mb-4">Skills</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {(p?.skills?.length ?? 0) === 0 && (
            <span className="text-xs text-[#6b6b85]">No skills added yet</span>
          )}
          {p?.skills.map((skill, i) => (
            <span
              key={i}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${PROFICIENCY_COLORS[skill.proficiency] || PROFICIENCY_COLORS.beginner}`}
            >
              {skill.name}
              <button onClick={() => removeSkill(i)} className="hover:text-white transition-colors">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>

        {/* Add skill */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            placeholder="Add a skill..."
            className="input-field flex-1 text-sm"
            onKeyDown={(e) => e.key === "Enter" && addSkill()}
          />
          <select
            value={newProficiency}
            onChange={(e) => setNewProficiency(e.target.value as Skill["proficiency"])}
            className="input-field w-32 text-xs"
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
            <option value="expert">Expert</option>
          </select>
          <button onClick={addSkill} disabled={!newSkill.trim()} className="btn-primary text-xs">
            Add
          </button>
        </div>
      </motion.div>

      {/* Badges */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card p-6"
      >
        <h2 className="text-sm font-semibold text-white mb-4">Achievements</h2>
        {(p?.badges?.length ?? 0) === 0 ? (
          <div className="text-center py-8">
            <p className="text-xs text-[#6b6b85]">Solve problems and maintain streaks to earn badges.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {p?.badges.map((badge) => (
              <div
                key={badge.id}
                className="glass-card p-4 text-center hover:border-[#6c63ff]/30 transition-colors"
              >
                <div className="text-2xl mb-2">{badge.icon}</div>
                <div className="text-xs font-medium text-white">{badge.label}</div>
                <div className="text-[10px] text-[#6b6b85] mt-1">{badge.description}</div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function InlineEditField({
  label, value, fieldKey, icon, editField, editValue,
  onStart, onCancel, onSave, onChange, saving, isTextarea,
}: {
  label: string; value: string; fieldKey: string; icon?: React.ReactNode;
  editField: string | null; editValue: string;
  onStart: (field: string, value: string) => void;
  onCancel: () => void; onSave: () => void;
  onChange: (v: string) => void; saving: boolean; isTextarea?: boolean;
}) {
  const isEditing = editField === fieldKey;
  return (
    <div className="group">
      {label && <label className="text-xs text-[#a0a0b8] mb-1 block">{label}</label>}
      <div className="flex items-center gap-2">
        {icon && <span className="text-[#6b6b85] flex-shrink-0">{icon}</span>}
        {isEditing ? (
          <div className="flex-1 flex items-center gap-2">
            {isTextarea ? (
              <textarea
                value={editValue}
                onChange={(e) => onChange(e.target.value)}
                className="input-field flex-1 text-sm resize-none"
                rows={3}
                autoFocus
              />
            ) : (
              <input
                type="text"
                value={editValue}
                onChange={(e) => onChange(e.target.value)}
                className="input-field flex-1 text-sm"
                autoFocus
              />
            )}
            <button onClick={onSave} disabled={saving} className="btn-icon text-green-400 hover:text-green-300">
              <Save className="w-3.5 h-3.5" />
            </button>
            <button onClick={onCancel} className="btn-icon text-red-400 hover:text-red-300">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <>
            <span className={`text-sm flex-1 ${value ? "text-white/80" : "text-[#6b6b85] italic"}`}>
              {value || `No ${label.toLowerCase() || "bio"} set`}
            </span>
            <button
              onClick={() => onStart(fieldKey, value)}
              className="btn-icon opacity-0 group-hover:opacity-100 transition-opacity text-[#6b6b85] hover:text-white"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  return (
    <div className="glass-card p-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-gradient-to-br ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-[#a0a0b8] mt-1">{label}</div>
    </div>
  );
}
