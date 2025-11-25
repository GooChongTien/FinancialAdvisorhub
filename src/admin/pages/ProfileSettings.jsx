import { adviseUAdminApi } from "@/admin/api/adviseUAdminApi";
import { Alert, AlertDescription } from "@/admin/components/ui/alert";
import { Button } from "@/admin/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/admin/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/admin/components/ui/dialog";
import { Input } from "@/admin/components/ui/input";
import { Label } from "@/admin/components/ui/label";
import PageHeader from "@/admin/components/ui/page-header.jsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/admin/components/ui/select";
import { CurrencySelector } from "@/admin/components/ui/CurrencySelector.jsx";
import { Separator } from "@/admin/components/ui/separator";
import { Switch } from "@/admin/components/ui/switch";
import { useToast } from "@/admin/components/ui/toast";
import { usePreferences } from "@/admin/state/PreferencesContext.jsx";
import { createPageUrl } from "@/admin/utils";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Check, Settings as SettingsIcon, Shield, User } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ProfileSettings() {
  const navigate = useNavigate();
  const [showSuccess, setShowSuccess] = useState(false);
  const { showToast } = useToast();
  const [showPwdDialog, setShowPwdDialog] = useState(false);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [show2FADisableConfirm, setShow2FADisableConfirm] = useState(false);
  const [pwdForm, setPwdForm] = useState({ current: "", next: "", confirm: "" });
  const [pwdError, setPwdError] = useState("");
  const [backupCodes, setBackupCodes] = useState([]);
  const [twoFASecret, setTwoFASecret] = useState("");

  const { data: user, isLoading } = useQuery({
    queryKey: ["current-user"],
    queryFn: () => adviseUAdminApi.auth.me(),
  });
  const { prefs, updatePrefs } = usePreferences();

  const [preferences, setPreferences] = useState({
    language: prefs.language,
    currency: prefs.currency,
    two_fa_enabled: prefs.two_fa_enabled,
  });

  const languageOptions = useMemo(
    () => [
      { code: "en", label: "English" },
      { code: "zh", label: "Chinese (中文)" },
      { code: "ms", label: "Malay (Bahasa Melayu)" },
      { code: "ta", label: "Tamil" },
      { code: "hi", label: "Hindi" },
      { code: "es", label: "Spanish (Español)" },
    ],
    [],
  );

  useEffect(() => {
    setPreferences({
      language: prefs.language,
      currency: prefs.currency,
      two_fa_enabled: prefs.two_fa_enabled,
    });
  }, [prefs.language, prefs.currency, prefs.two_fa_enabled]);
  const otpLabel = useMemo(() => encodeURIComponent(`${user?.email ?? "advisor@example.com"}`), [user?.email]);
  const otpIssuer = useMemo(() => encodeURIComponent("AdvisorHub"), []);
  const otpUri = useMemo(() => (twoFASecret ? `otpauth://totp/${otpIssuer}:${otpLabel}?secret=${twoFASecret}&issuer=${otpIssuer}&digits=6&period=30` : ""), [twoFASecret, otpIssuer, otpLabel]);

  // Updates are driven via PreferencesContext.updatePrefs; no local mutation needed here.

  const handleSave = () => {
    updatePrefs(preferences);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const randomString = (len) => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let out = "";
    for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return out;
  };

  const genBackupCodes = () => {
    const codes = Array.from({ length: 10 }).map(() => `${randomString(4)}-${randomString(4)}`);
    setBackupCodes(codes);
  };

  const downloadCodes = () => {
    const blob = new Blob([backupCodes.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "advisorhub-2fa-backup-codes.txt";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleToggle2FA = (checked) => {
    if (checked) {
      // Enabling: open setup dialog, generate secret and backup codes
      const secret = randomString(16);
      setTwoFASecret(secret);
      genBackupCodes();
      setShow2FASetup(true);
    } else {
      // Disabling: confirm first
      setShow2FADisableConfirm(true);
    }
  };

  const finalizeEnable2FA = async () => {
    setPreferences({ ...preferences, two_fa_enabled: true });
    updatePrefs({ two_fa_enabled: true });
    setShow2FASetup(false);
    showToast({ type: "success", title: "Two-Factor Enabled", description: "2FA is now active. Store your backup codes safely." });
  };

  const confirmDisable2FA = async () => {
    setPreferences({ ...preferences, two_fa_enabled: false });
    updatePrefs({ two_fa_enabled: false });
    setShow2FADisableConfirm(false);
    showToast({ type: "success", title: "Two-Factor Disabled", description: "2FA has been disabled for your account." });
  };

  const validatePassword = () => {
    setPwdError("");
    const { current, next, confirm } = pwdForm;
    if (!current) return setPwdError("Current password is required");
    if (!next || next.length < 8) return setPwdError("New password must be at least 8 characters");
    if (!/[A-Z]/.test(next)) return setPwdError("Include at least one uppercase letter");
    if (!/[a-z]/.test(next)) return setPwdError("Include at least one lowercase letter");
    if (!/\d/.test(next)) return setPwdError("Include at least one number");
    if (!/[\W_]/.test(next)) return setPwdError("Include at least one special character");
    if (next !== confirm) return setPwdError("Password confirmation does not match");
    return "ok";
  };

  const submitPasswordChange = async () => {
    const ok = validatePassword();
    if (ok !== "ok") return;
    try {
      await adviseUAdminApi.auth.changePassword({ currentPassword: pwdForm.current, newPassword: pwdForm.next });
      try {
        const me = await adviseUAdminApi.auth.me();
        if (me?.email) {
          showToast({ type: "info", title: "Email Notice", description: `A confirmation email will be sent to ${me.email}.` });
        }
      } catch { }
      showToast({ type: "success", title: "Password Updated", description: "You will be signed out for security." });
      setShowPwdDialog(false);
      await adviseUAdminApi.auth.logout();
      window.location.href = "/";
    } catch (e) {
      setPwdError(e?.message ?? "Unable to change password");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-8">
      {/* Back Arrow - Top Left Edge */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigate(createPageUrl("Home"))}
        className="absolute left-8 top-8"
      >
        <ArrowLeft className="h-5 w-5" />
      </Button>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Sticky Header Section */}
        <div className="sticky top-0 z-20 -mx-8 -mt-8 px-8 pt-8 pb-4 bg-white/80 backdrop-blur-md border-b border-slate-200/50 transition-all duration-200">
          <PageHeader
            title="Profile Settings"
            subtitle="Manage your account information and preferences"
            icon={SettingsIcon}
            className="mb-0"
          />
        </div>

        {showSuccess && (
          <Alert className="bg-green-50 border-green-200">
            <Check className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Your preferences have been saved successfully.
            </AlertDescription>
          </Alert>
        )}

        <Card className="shadow-lg border-slate-200">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary-600" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  value={user?.full_name || ""}
                  disabled
                  className="bg-slate-50"
                />
                <p className="text-xs text-slate-500">
                  Managed by administrator
                </p>
              </div>
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input
                  value={user?.email || ""}
                  disabled
                  className="bg-slate-50"
                />
                <p className="text-xs text-slate-500">
                  Managed by administrator
                </p>
              </div>
              <div className="space-y-2">
                <Label>Mobile Number</Label>
                <Input
                  value={user?.mobile_number || "Not set"}
                  disabled
                  className="bg-slate-50"
                />
                <p className="text-xs text-slate-500">
                  Managed by administrator
                </p>
              </div>
              <div className="space-y-2">
                <Label>Advisor ID</Label>
                <Input
                  value={user?.advisor_id || "Not assigned"}
                  disabled
                  className="bg-slate-50"
                />
                <p className="text-xs text-slate-500">
                  Managed by administrator
                </p>
              </div>
              <div className="space-y-2">
                <Label>Advisor ID Expiry</Label>
                <Input
                  value={user?.advisor_id_expiry || "N/A"}
                  disabled
                  className="bg-slate-50"
                />
                <p className="text-xs text-slate-500">
                  Managed by administrator
                </p>
              </div>
              <div className="space-y-2">
                <Label>Account Status</Label>
                <Input
                  value={user?.account_status || "Active"}
                  disabled
                  className="bg-slate-50"
                />
                <p className="text-xs text-slate-500">
                  Managed by administrator
                </p>
              </div>
            </div>
            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  const defaults = { ...preferences, language: "en", currency: "SGD" };
                  setPreferences(defaults);
                  updatePrefs({ language: "en", currency: "SGD" });
                }}
              >
                Restore Defaults
              </Button>
              <div />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-slate-200">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary-600" />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label>Two-Factor Authentication</Label>
                <p className="text-sm text-slate-500 mt-1">
                  Add an extra layer of security to your account
                </p>
              </div>
              <Switch
                checked={preferences.two_fa_enabled}
                onCheckedChange={handleToggle2FA}
              />
            </div>
            <Separator />
            <div>
              <Label>Change Password</Label>
              <p className="text-sm text-slate-500 mt-1 mb-4">
                Update your password to keep your account secure
              </p>
              <Button variant="outline" onClick={() => setShowPwdDialog(true)}>
                Change Password
              </Button>
              <p className="text-xs text-slate-400 mt-2">Requires current password and strong new password</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-slate-200">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="w-5 h-5 text-primary-600" />
              User Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Language</Label>
                <Select
                  value={preferences.language}
                  onValueChange={(value) => {
                    const next = { ...preferences, language: value };
                    setPreferences(next);
                    updatePrefs({ language: value });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languageOptions.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <CurrencySelector
                  value={preferences.currency}
                  onChange={(value) => {
                    const next = { ...preferences, currency: value };
                    setPreferences(next);
                    updatePrefs({ currency: value });
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} className="bg-primary-600 hover:bg-primary-700 px-8">
            <Check className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Change Password Dialog */}
      <Dialog open={showPwdDialog} onOpenChange={setShowPwdDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {pwdError && (
              <Alert className="bg-red-50 border-red-200">
                <AlertDescription className="text-red-800">{pwdError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label>Current Password</Label>
              <Input type="password" value={pwdForm.current} onChange={(e) => setPwdForm({ ...pwdForm, current: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input type="password" value={pwdForm.next} onChange={(e) => setPwdForm({ ...pwdForm, next: e.target.value })} />
              <p className="text-xs text-slate-500">Min 8 chars, upper+lowercase, number, special</p>
            </div>
            <div className="space-y-2">
              <Label>Confirm New Password</Label>
              <Input type="password" value={pwdForm.confirm} onChange={(e) => setPwdForm({ ...pwdForm, confirm: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowPwdDialog(false)}>Cancel</Button>
              <Button className="bg-primary-600 hover:bg-primary-700" onClick={submitPasswordChange}>Update Password</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 2FA Setup Dialog */}
      <Dialog open={show2FASetup} onOpenChange={setShow2FASetup}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">Scan this key in Google Authenticator or Authy, or add the account manually.</p>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <p className="text-xs text-slate-500 mb-1">Secret</p>
              <p className="font-mono text-sm">{twoFASecret}</p>
            </div>
            {otpUri && (
              <div className="flex flex-col items-center gap-2">
                <p className="text-xs text-slate-500">Scan QR in your authenticator app</p>
                <img
                  alt="2FA QR Code"
                  className="border border-slate-200 rounded bg-white"
                  width={180}
                  height={180}
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(otpUri)}`}
                />
              </div>
            )}
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <p className="text-xs text-slate-500 mb-1">otpauth URI</p>
              <p className="font-mono text-xs break-all">{otpUri}</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium mb-2">Backup Codes</p>
              <ul className="grid grid-cols-2 gap-2 text-sm font-mono">
                {backupCodes.map((c) => (
                  <li key={c} className="px-2 py-1 rounded border border-slate-200 bg-white">{c}</li>
                ))}
              </ul>
              <div className="flex gap-2 mt-3">
                <Button variant="outline" onClick={genBackupCodes}>Regenerate Codes</Button>
                <Button variant="outline" onClick={downloadCodes}>Download Codes</Button>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShow2FASetup(false)}>Cancel</Button>
              <Button className="bg-primary-600 hover:bg-primary-700" onClick={finalizeEnable2FA}>Finish</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 2FA Disable Confirm */}
      <Dialog open={show2FADisableConfirm} onOpenChange={setShow2FADisableConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Disable Two-Factor?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">You will remove the extra layer of security. Continue?</p>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShow2FADisableConfirm(false)}>Cancel</Button>
            <Button className="bg-red-600 hover:bg-red-700" onClick={confirmDisable2FA}>Disable 2FA</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
