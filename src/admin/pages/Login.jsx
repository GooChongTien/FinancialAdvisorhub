import { supabase } from "@/admin/api/supabaseClient";
import { useToast } from "@/admin/components/ui/toast";
import { createPageUrl } from "@/admin/utils";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [newPwd, setNewPwd] = useState("");
  const [newPwd2, setNewPwd2] = useState("");

  useEffect(() => {
    try {
      const hash = typeof window !== 'undefined' ? window.location.hash : '';
      const search = typeof window !== 'undefined' ? window.location.search : '';
      const hasRecovery = (hash && hash.includes('type=recovery')) || (search && search.includes('type=recovery'));
      if (hasRecovery) setRecoveryMode(true);
    } catch (_) { }
  }, []);

  const handleLogin = async () => {
    if (!form.email || !form.password) {
      showToast({ type: "error", title: "Missing info", description: "Email and password are required." });
      return;
    }
    setLoading(true);
    try {
      const { data: { user }, error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
      if (error) throw error;

      // Fetch user role
      const { data: advisorData, error: roleError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (roleError) {
        console.error("Error fetching role:", roleError);
        // Fallback to advisor if role fetch fails (safe default)
        navigate("/advisor/home", { replace: true });
      } else {
        const role = advisorData?.role || 'advisor';
        showToast({ type: "success", title: `Welcome back (${role})` });

        if (role === 'admin') {
          navigate("/admin/workflows", { replace: true });
        } else {
          navigate("/advisor/home", { replace: true });
        }
      }

      // Hard refresh to reload any user-dependent state
      setTimeout(() => { if (typeof window !== 'undefined') window.location.reload(); }, 50);
    } catch (e) {
      showToast({ type: "error", title: "Login failed", description: e?.message || "Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async () => {
    if (!form.email) {
      showToast({ type: 'error', title: 'Enter your email', description: 'Please enter your email to reset your password.' });
      return;
    }
    try {
      const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/login` : undefined;
      const { error } = await supabase.auth.resetPasswordForEmail(form.email, { redirectTo });
      if (error) throw error;
      showToast({ type: 'success', title: 'Reset email sent', description: 'Check your inbox for the reset link.' });
    } catch (e) {
      showToast({ type: 'error', title: 'Unable to send reset', description: e?.message || 'Please try again.' });
    }
  };

  const handleSetNewPassword = async () => {
    if (!newPwd || newPwd.length < 8) {
      showToast({ type: 'error', title: 'Weak password', description: 'Password must be at least 8 characters.' });
      return;
    }
    if (newPwd !== newPwd2) {
      showToast({ type: 'error', title: 'Mismatch', description: 'Passwords do not match.' });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPwd });
      if (error) throw error;
      showToast({ type: 'success', title: 'Password updated' });
      setRecoveryMode(false);
      navigate(createPageUrl('Home'), { replace: true });
      setTimeout(() => { if (typeof window !== 'undefined') window.location.reload(); }, 50);
    } catch (e) {
      showToast({ type: 'error', title: 'Update failed', description: e?.message || 'Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center"
      style={{
        backgroundColor: '#F4F5F5',
        backgroundImage: 'url(/login-background.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div
        className="bg-white flex flex-col items-end gap-6 p-6 w-full max-w-[418px]"
        style={{ borderRadius: '16px' }}
      >
        {/* Title */}
        <h1
          className="w-full text-left"
          style={{
            fontFamily: 'Open Sans, sans-serif',
            fontWeight: 700,
            fontSize: '20px',
            lineHeight: '1.4em',
            color: '#020303'
          }}
        >
          {recoveryMode ? 'Set New Password' : 'Login'}
        </h1>

        {!recoveryMode && (
          <>
            {/* Email Input */}
            <div className="w-full flex flex-col gap-1">
              <label className="flex items-center gap-1">
                <span
                  style={{
                    fontFamily: 'Open Sans, sans-serif',
                    fontWeight: 400,
                    fontSize: '14px',
                    lineHeight: '1.7142857142857142em',
                    textTransform: 'uppercase',
                    color: '#020303'
                  }}
                >
                  Email Address
                </span>
                <span style={{ color: '#F8333C' }}>*</span>
              </label>
              <div
                className="flex items-center w-full bg-white border border-gray-200 px-3 py-2"
                style={{
                  borderRadius: '4px',
                  boxShadow: '0px 0px 0px 1px rgba(104, 113, 130, 0.12), 0px 1px 2px 0px rgba(0, 0, 0, 0.06)'
                }}
              >
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="Email Address"
                  className="w-full outline-none border-none bg-transparent"
                  style={{
                    fontFamily: 'Open Sans, sans-serif',
                    fontWeight: 400,
                    fontSize: '16px',
                    lineHeight: '1.5em',
                    color: '#020303'
                  }}
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="w-full flex flex-col gap-1">
              <label className="flex items-center gap-1">
                <span
                  style={{
                    fontFamily: 'Open Sans, sans-serif',
                    fontWeight: 400,
                    fontSize: '14px',
                    lineHeight: '1.7142857142857142em',
                    textTransform: 'uppercase',
                    color: '#020303'
                  }}
                >
                  Password
                </span>
                <span style={{ color: '#F8333C' }}>*</span>
              </label>
              <div
                className="flex items-center w-full bg-white border border-gray-200 px-3 py-2"
                style={{
                  borderRadius: '4px',
                  boxShadow: '0px 0px 0px 1px rgba(104, 113, 130, 0.12), 0px 1px 2px 0px rgba(0, 0, 0, 0.06)'
                }}
              >
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Password"
                  className="w-full outline-none border-none bg-transparent"
                  style={{
                    fontFamily: 'Open Sans, sans-serif',
                    fontWeight: 400,
                    fontSize: '16px',
                    lineHeight: '1.5em',
                    color: '#020303'
                  }}
                />
              </div>
            </div>

            {/* Forget Password Button */}
            <button
              onClick={handleForgot}
              className="px-4 py-1 hover:bg-gray-50 transition-colors"
              style={{
                fontFamily: 'Open Sans, sans-serif',
                fontWeight: 600,
                fontSize: '14px',
                lineHeight: '1.7142857142857142em',
                textTransform: 'uppercase',
                color: '#1B365D',
                borderRadius: '8px'
              }}
            >
              Forget Password?
            </button>

            {/* CTA Section */}
            <div className="w-full flex flex-col items-center gap-2.5">
              {/* Login Button */}
              <button
                onClick={handleLogin}
                disabled={loading || !form.email || !form.password}
                className="w-full flex items-center justify-center px-4 py-1 transition-colors"
                style={{
                  backgroundColor: loading || !form.email || !form.password ? '#E8EAEC' : '#1B365D',
                  color: loading || !form.email || !form.password ? '#BBC1C5' : '#FFFFFF',
                  fontFamily: 'Open Sans, sans-serif',
                  fontWeight: 600,
                  fontSize: '14px',
                  lineHeight: '1.7142857142857142em',
                  textTransform: 'uppercase',
                  borderRadius: '8px',
                  cursor: loading || !form.email || !form.password ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Signing in...' : 'Login'}
              </button>

              {/* Register Link */}
              <div className="text-sm text-slate-600">
                Don't have an account?{' '}
                <button
                  onClick={() => navigate(createPageUrl("Register"))}
                  className="font-semibold hover:underline"
                  style={{ color: '#1B365D' }}
                >
                  Register
                </button>
              </div>
            </div>
          </>
        )}

        {recoveryMode && (
          <>
            <div className="w-full flex flex-col gap-1">
              <label className="flex items-center gap-1">
                <span
                  style={{
                    fontFamily: 'Open Sans, sans-serif',
                    fontWeight: 400,
                    fontSize: '14px',
                    lineHeight: '1.7142857142857142em',
                    textTransform: 'uppercase',
                    color: '#020303'
                  }}
                >
                  New Password
                </span>
                <span style={{ color: '#F8333C' }}>*</span>
              </label>
              <div
                className="flex items-center w-full bg-white border border-gray-200 px-3 py-2"
                style={{
                  borderRadius: '4px',
                  boxShadow: '0px 0px 0px 1px rgba(104, 113, 130, 0.12), 0px 1px 2px 0px rgba(0, 0, 0, 0.06)'
                }}
              >
                <input
                  type="password"
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full outline-none border-none bg-transparent"
                  style={{
                    fontFamily: 'Open Sans, sans-serif',
                    fontWeight: 400,
                    fontSize: '16px',
                    lineHeight: '1.5em',
                    color: '#020303'
                  }}
                />
              </div>
            </div>

            <div className="w-full flex flex-col gap-1">
              <label className="flex items-center gap-1">
                <span
                  style={{
                    fontFamily: 'Open Sans, sans-serif',
                    fontWeight: 400,
                    fontSize: '14px',
                    lineHeight: '1.7142857142857142em',
                    textTransform: 'uppercase',
                    color: '#020303'
                  }}
                >
                  Confirm New Password
                </span>
                <span style={{ color: '#F8333C' }}>*</span>
              </label>
              <div
                className="flex items-center w-full bg-white border border-gray-200 px-3 py-2"
                style={{
                  borderRadius: '4px',
                  boxShadow: '0px 0px 0px 1px rgba(104, 113, 130, 0.12), 0px 1px 2px 0px rgba(0, 0, 0, 0.06)'
                }}
              >
                <input
                  type="password"
                  value={newPwd2}
                  onChange={(e) => setNewPwd2(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full outline-none border-none bg-transparent"
                  style={{
                    fontFamily: 'Open Sans, sans-serif',
                    fontWeight: 400,
                    fontSize: '16px',
                    lineHeight: '1.5em',
                    color: '#020303'
                  }}
                />
              </div>
            </div>

            <button
              onClick={handleSetNewPassword}
              disabled={loading}
              className="w-full flex items-center justify-center px-4 py-1 transition-colors"
              style={{
                backgroundColor: loading ? '#E8EAEC' : '#1B365D',
                color: loading ? '#BBC1C5' : '#FFFFFF',
                fontFamily: 'Open Sans, sans-serif',
                fontWeight: 600,
                fontSize: '14px',
                lineHeight: '1.7142857142857142em',
                textTransform: 'uppercase',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Updating...' : 'Set New Password'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
