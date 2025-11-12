import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/admin/components/ui/card";
import { Input } from "@/admin/components/ui/input";
import { Label } from "@/admin/components/ui/label";
import { Button } from "@/admin/components/ui/button";
import { useToast } from "@/admin/components/ui/toast";
import { supabase } from "@/admin/api/supabaseClient";

export default function Register() {
  const { showToast } = useToast();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!form.email || !form.password) {
      showToast({ type: "error", title: "Missing info", description: "Email and password are required." });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({ email: form.email, password: form.password });
      if (error) throw error;
      showToast({ type: "success", title: "Registered", description: "A confirmation email may be sent depending on project settings." });
    } catch (e) {
      showToast({ type: "error", title: "Registration failed", description: e?.message || "Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-8 bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <Card className="w-full max-w-md border-slate-200 shadow-lg">
        <CardHeader className="border-b border-slate-100">
          <CardTitle>Create Advisor Account</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label>Password</Label>
            <Input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="min 8 characters"
            />
          </div>
          <Button className="w-full" onClick={handleRegister} disabled={loading}>
            {loading ? "Creating..." : "Create Account"}
          </Button>
          <p className="text-xs text-slate-500">
            After account creation, we will stamp existing records with your user id.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

