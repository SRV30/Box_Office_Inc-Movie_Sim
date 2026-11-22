import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Building2, Save, AlertCircle, CheckCircle, Eye, Sparkles, Type, Focus, RotateCcw } from "lucide-react";

import api, { clearScheduledRefresh } from "../../api/axios";
import { logout } from "../../features/auth/authSlice";
import DashboardLayout from "../../layouts/DashboardLayout";
import { useAccessibility } from "../../context/AccessibilityContext";

const Settings = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    reducedMotion,
    setReducedMotion,
    highContrast,
    setHighContrast,
    textScale,
    setTextScale,
    largeFocusIndicator,
    setLargeFocusIndicator,
    resetAccessibility,
  } = useAccessibility();

  const [studioName, setStudioName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStudio = async () => {
      try {
        const res = await api.get("/studios/profile");
        setStudioName(res.data.studio.name);
      } catch (err) {
        setError("Failed to load studio details.");
      } finally {
        setLoading(false);
      }
    };
    fetchStudio();
  }, []);

  const handleUpdateStudio = async (e) => {
    e.preventDefault();
    if (!studioName || studioName.trim().length < 3) {
      setError("Studio name must be at least 3 characters.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");
      await api.put("/studios/profile", { name: studioName });
      setSuccess("Studio name updated successfully!");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update studio name.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error(error);
    } finally {
      clearScheduledRefresh();
      dispatch(logout());
      navigate("/login");
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-white">Settings</h1>
          <p className="text-slate-400 mt-2">Manage your account and studio settings.</p>
        </div>

        {/* Studio profile card */}
        <div className="bg-[#111827] border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <Building2 className="text-violet-500" size={24} />
            <h2 className="text-xl font-bold text-white">Studio Profile</h2>
          </div>

          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-4 w-24 bg-slate-800 rounded-lg" />
              <div className="h-12 w-full bg-slate-800 rounded-xl" />
              <div className="h-10 w-32 bg-slate-800 rounded-xl" />
            </div>
          ) : (
            <form onSubmit={handleUpdateStudio} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="flex items-center gap-2 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">
                  <CheckCircle size={16} />
                  <span>{success}</span>
                </div>
              )}

              <div>
                <label className="block text-slate-400 text-sm mb-2">Studio Name</label>
                <input
                  type="text"
                  value={studioName}
                  onChange={(e) => setStudioName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-violet-600"
                  placeholder="Enter studio name..."
                  disabled={saving}
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm transition disabled:opacity-50"
              >
                <Save size={16} />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </form>
          )}
        </div>

        {/* Accessibility Preferences Panel */}
        <div className="bg-[#111827] border border-slate-800 rounded-3xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <Eye className="text-violet-500" size={24} />
              <div>
                <h2 className="text-xl font-bold text-white">Accessibility Preferences</h2>
                <p className="text-slate-400 text-sm">Customize visual motion, contrast, typography scaling, and focus indicators.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={resetAccessibility}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Reset accessibility options to defaults"
            >
              <RotateCcw size={14} />
              Reset Defaults
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Reduced Motion */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-white font-semibold">
                <Sparkles size={18} className="text-amber-400" />
                <span>Motion & Animations</span>
              </div>
              <p className="text-slate-400 text-xs">
                Control transitions and animations across page navigations and simulation widgets.
              </p>
              <div className="grid grid-cols-3 gap-2 pt-1">
                {[
                  { value: "system", label: "System Default" },
                  { value: "on", label: "Reduced" },
                  { value: "off", label: "Standard" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setReducedMotion(option.value)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                      reducedMotion === option.value
                        ? "bg-violet-600 border-violet-500 text-white"
                        : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* High Contrast */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-white font-semibold">
                <Eye size={18} className="text-emerald-400" />
                <span>High Contrast Mode</span>
              </div>
              <p className="text-slate-400 text-xs">
                Enhance visual boundaries, text contrast, and border clarity for low-vision navigation.
              </p>
              <div className="flex items-center justify-between pt-2">
                <span className="text-sm text-slate-300">
                  {highContrast ? "High Contrast Enabled" : "High Contrast Disabled"}
                </span>
                <button
                  type="button"
                  onClick={() => setHighContrast(!highContrast)}
                  role="switch"
                  aria-checked={highContrast}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    highContrast ? "bg-violet-600" : "bg-slate-700"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      highContrast ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Text Scaling */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-white font-semibold">
                <Type size={18} className="text-sky-400" />
                <span>Text Scaling</span>
              </div>
              <p className="text-slate-400 text-xs">
                Increase typography size across interfaces while preserving responsive layout integrity.
              </p>
              <div className="grid grid-cols-3 gap-2 pt-1">
                {[
                  { value: "normal", label: "Default (100%)" },
                  { value: "large", label: "Large (112%)" },
                  { value: "x-large", label: "X-Large (125%)" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setTextScale(option.value)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                      textScale === option.value
                        ? "bg-violet-600 border-violet-500 text-white"
                        : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Large Focus Indicators */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-white font-semibold">
                <Focus size={18} className="text-amber-300" />
                <span>Prominent Focus Outlines</span>
              </div>
              <p className="text-slate-400 text-xs">
                Display clear, high-visibility 3px focus rings on interactive elements for keyboard navigation.
              </p>
              <div className="flex items-center justify-between pt-2">
                <span className="text-sm text-slate-300">
                  {largeFocusIndicator ? "Prominent Outlines Active" : "Standard Outlines"}
                </span>
                <button
                  type="button"
                  onClick={() => setLargeFocusIndicator(!largeFocusIndicator)}
                  role="switch"
                  aria-checked={largeFocusIndicator}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    largeFocusIndicator ? "bg-violet-600" : "bg-slate-700"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      largeFocusIndicator ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Account actions card */}
        <div className="bg-[#111827] border border-slate-800 rounded-3xl p-6">
          <h2 className="text-xl font-bold text-white mb-5">Account</h2>

          <button
            onClick={handleLogout}
            className="
              w-full
              bg-red-600
              hover:bg-red-700
              py-4
              rounded-2xl
              text-white
              font-semibold
              transition
            "
          >
            Logout
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
