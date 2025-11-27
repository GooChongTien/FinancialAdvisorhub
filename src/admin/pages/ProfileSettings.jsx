import { adviseUAdminApi } from "@/admin/api/adviseUAdminApi";
import { Alert, AlertDescription } from "@/admin/components/ui/alert";
import { Button } from "@/admin/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/admin/components/ui/card";
import { CurrencySelector } from "@/admin/components/ui/CurrencySelector.jsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/admin/components/ui/dialog";
import { Input } from "@/admin/components/ui/input";
import { Label } from "@/admin/components/ui/label";
import { LanguageSwitcher } from "@/admin/components/ui/LanguageSwitcher.jsx";
import PageHeader from "@/admin/components/ui/page-header.jsx";
import { Separator } from "@/admin/components/ui/separator";
import { Switch } from "@/admin/components/ui/switch";
import { useToast } from "@/admin/components/ui/toast";
import { usePreferences } from "@/admin/state/PreferencesContext.jsx";
import { createPageUrl } from "@/admin/utils";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Check, Settings as SettingsIcon, Shield, User } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

export default function ProfileSettings() {
  const navigate = useNavigate();
  const { t } = useTranslation();
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
    showToast({
      type: "success",
      title: t("profile.toast.twoFAEnabledTitle"),
      description: t("profile.toast.twoFAEnabledDesc"),
    });
  };

  const confirmDisable2FA = async () => {
    setPreferences({ ...preferences, two_fa_enabled: false });
    updatePrefs({ two_fa_enabled: false });
    setShow2FADisableConfirm(false);
    showToast({
      type: "success",
      title: t("profile.toast.twoFADisabledTitle"),
      description: t("profile.toast.twoFADisabledDesc"),
    });
  };

  const validatePassword = () => {
    setPwdError("");
    const { current, next, confirm } = pwdForm;
    if (!current) return setPwdError(t("profile.validation.currentRequired"));
    if (!next || next.length < 8) return setPwdError(t("profile.validation.minLength"));
    if (!/[A-Z]/.test(next)) return setPwdError(t("profile.validation.uppercase"));
    if (!/[a-z]/.test(next)) return setPwdError(t("profile.validation.lowercase"));
    if (!/\d/.test(next)) return setPwdError(t("profile.validation.number"));
    if (!/[\W_]/.test(next)) return setPwdError(t("profile.validation.special"));
    if (next !== confirm) return setPwdError(t("profile.validation.mismatch"));
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
          showToast({
            type: "info",
            title: t("profile.toast.emailNoticeTitle"),
            description: t("profile.toast.emailNoticeDesc", { email: me.email }),
          });
        }
      } catch { }
      showToast({
        type: "success",
        title: t("profile.toast.passwordUpdatedTitle"),
        description: t("profile.toast.passwordUpdatedDesc"),
      });
      setShowPwdDialog(false);
      await adviseUAdminApi.auth.logout();
      window.location.href = "/";
    } catch (e) {
      setPwdError(e?.message ?? t("profile.toast.passwordChangeError"));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">{t("common.loading")}</div>
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
            title={t("profile.title")}
            subtitle={t("profile.subtitle")}
            icon={SettingsIcon}
            className="mb-0"
          />
        </div>

        {showSuccess && (
          <Alert className="bg-green-50 border-green-200">
            <Check className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {t("profile.saveSuccess")}
            </AlertDescription>
          </Alert>
        )}

        <Card className="shadow-lg border-slate-200">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary-600" />
              {t("profile.personal.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("profile.personal.fullName")}</Label>
                <Input
                  value={user?.full_name || ""}
                  disabled
                  className="bg-slate-50"
                />
                <p className="text-xs text-slate-500">
                  {t("profile.personal.managedByAdmin")}
                </p>
              </div>
              <div className="space-y-2">
                <Label>{t("profile.personal.email")}</Label>
                <Input
                  value={user?.email || ""}
                  disabled
                  className="bg-slate-50"
                />
                <p className="text-xs text-slate-500">
                  {t("profile.personal.managedByAdmin")}
                </p>
              </div>
              <div className="space-y-2">
                <Label>{t("profile.personal.mobile")}</Label>
                <Input
                  value={user?.mobile_number || t("profile.personal.notSet")}
                  disabled
                  className="bg-slate-50"
                />
                <p className="text-xs text-slate-500">
                  {t("profile.personal.managedByAdmin")}
                </p>
              </div>
              <div className="space-y-2">
                <Label>{t("profile.personal.advisorId")}</Label>
                <Input
                  value={user?.advisor_id || t("profile.personal.notAssigned")}
                  disabled
                  className="bg-slate-50"
                />
                <p className="text-xs text-slate-500">
                  {t("profile.personal.managedByAdmin")}
                </p>
              </div>
              <div className="space-y-2">
                <Label>{t("profile.personal.advisorIdExpiry")}</Label>
                <Input
                  value={user?.advisor_id_expiry || t("profile.personal.na")}
                  disabled
                  className="bg-slate-50"
                />
                <p className="text-xs text-slate-500">
                  {t("profile.personal.managedByAdmin")}
                </p>
              </div>
              <div className="space-y-2">
                <Label>{t("profile.personal.accountStatus")}</Label>
                <Input
                  value={user?.account_status || t("profile.personal.active")}
                  disabled
                  className="bg-slate-50"
                />
                <p className="text-xs text-slate-500">
                  {t("profile.personal.managedByAdmin")}
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
                {t("profile.restoreDefaults")}
              </Button>
              <div />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-slate-200">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary-600" />
              {t("profile.security.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label>{t("profile.security.twoFA")}</Label>
                <p className="text-sm text-slate-500 mt-1">
                  {t("profile.security.twoFADesc")}
                </p>
              </div>
              <Switch
                checked={preferences.two_fa_enabled}
                onCheckedChange={handleToggle2FA}
              />
            </div>
            <Separator />
            <div>
              <Label>{t("profile.security.changePassword")}</Label>
              <p className="text-sm text-slate-500 mt-1 mb-4">
                {t("profile.security.changePasswordDesc")}
              </p>
              <Button variant="outline" onClick={() => setShowPwdDialog(true)}>
                {t("profile.security.changePasswordCta")}
              </Button>
              <p className="text-xs text-slate-400 mt-2">
                {t("profile.security.requiresCurrent")}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-slate-200">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="w-5 h-5 text-primary-600" />
              {t("profile.preferences.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("profile.preferences.language")}</Label>
                <LanguageSwitcher
                  className="w-full"
                  onLanguageChange={(value) => {
                    const next = { ...preferences, language: value };
                    setPreferences(next);
                    updatePrefs({ language: value });
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("profile.preferences.currency")}</Label>
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
            {t("profile.preferences.saveChanges")}
          </Button>
        </div>
      </div>

      {/* Change Password Dialog */}
      <Dialog open={showPwdDialog} onOpenChange={setShowPwdDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("profile.dialog.changePasswordTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {pwdError && (
              <Alert className="bg-red-50 border-red-200">
                <AlertDescription className="text-red-800">{pwdError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label>{t("profile.dialog.currentPassword")}</Label>
              <Input type="password" value={pwdForm.current} onChange={(e) => setPwdForm({ ...pwdForm, current: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{t("profile.dialog.newPassword")}</Label>
              <Input type="password" value={pwdForm.next} onChange={(e) => setPwdForm({ ...pwdForm, next: e.target.value })} />
              <p className="text-xs text-slate-500">{t("profile.security.passwordHint")}</p>
            </div>
            <div className="space-y-2">
              <Label>{t("profile.dialog.confirmNewPassword")}</Label>
              <Input type="password" value={pwdForm.confirm} onChange={(e) => setPwdForm({ ...pwdForm, confirm: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowPwdDialog(false)}>{t("profile.dialog.cancel")}</Button>
              <Button className="bg-primary-600 hover:bg-primary-700" onClick={submitPasswordChange}>{t("profile.dialog.updatePassword")}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 2FA Setup Dialog */}
      <Dialog open={show2FASetup} onOpenChange={setShow2FASetup}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("profile.twofaSetup.title")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              {t("profile.twofaSetup.instructions")}
            </p>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <p className="text-xs text-slate-500 mb-1">{t("profile.twofaSetup.secretLabel")}</p>
              <p className="font-mono text-sm">{twoFASecret}</p>
            </div>
            {otpUri && (
              <div className="flex flex-col items-center gap-2">
                <p className="text-xs text-slate-500">
                  {t("profile.twofaSetup.qrInstruction")}
                </p>
                <img
                  alt={t("profile.twofaSetup.qrInstruction")}
                  className="border border-slate-200 rounded bg-white"
                  width={180}
                  height={180}
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(otpUri)}`}
                />
              </div>
            )}
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <p className="text-xs text-slate-500 mb-1">{t("profile.twofaSetup.uriLabel")}</p>
              <p className="font-mono text-xs break-all">{otpUri}</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium mb-2">
                {t("profile.twofaSetup.backupCodes")}
              </p>
              <ul className="grid grid-cols-2 gap-2 text-sm font-mono">
                {backupCodes.map((c) => (
                  <li key={c} className="px-2 py-1 rounded border border-slate-200 bg-white">{c}</li>
                ))}
              </ul>
              <div className="flex gap-2 mt-3">
                <Button variant="outline" onClick={genBackupCodes}>{t("profile.twofaSetup.regenerate")}</Button>
                <Button variant="outline" onClick={downloadCodes}>{t("profile.twofaSetup.download")}</Button>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShow2FASetup(false)}>{t("profile.dialog.cancel")}</Button>
              <Button className="bg-primary-600 hover:bg-primary-700" onClick={finalizeEnable2FA}>{t("profile.twofaSetup.finish")}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 2FA Disable Confirm */}
      <Dialog open={show2FADisableConfirm} onOpenChange={setShow2FADisableConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("profile.twofaDisable.title")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            {t("profile.twofaDisable.body")}
          </p>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShow2FADisableConfirm(false)}>{t("profile.twofaDisable.cancel")}</Button>
            <Button className="bg-red-600 hover:bg-red-700" onClick={confirmDisable2FA}>{t("profile.twofaDisable.confirm")}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
