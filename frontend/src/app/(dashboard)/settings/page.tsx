'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Settings, Upload, Trash2, Save, AlertTriangle, Building2, ImageIcon, ShieldAlert, X } from 'lucide-react';

const BRANDING_STORAGE_KEY = 'app-branding';

interface BrandingData {
  companyName: string;
  logoBase64: string | null;
}

function getBranding(): BrandingData {
  if (typeof window === 'undefined') return { companyName: 'PropManage', logoBase64: null };
  try {
    const stored = localStorage.getItem(BRANDING_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return { companyName: 'PropManage', logoBase64: null };
}

function saveBranding(data: BrandingData) {
  localStorage.setItem(BRANDING_STORAGE_KEY, JSON.stringify(data));
  // Dispatch a custom event so Navbar/Sidebar re-render
  window.dispatchEvent(new Event('branding-updated'));
}

export default function SettingsPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  // ─── Branding State ─────────────────────────────────
  const [companyName, setCompanyName] = useState('PropManage');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Reset State ────────────────────────────────────
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [masterKey, setMasterKey] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');

  // ─── Access Guard ───────────────────────────────────
  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [user, router]);

  // ─── Load Branding from localStorage ────────────────
  useEffect(() => {
    const branding = getBranding();
    setCompanyName(branding.companyName);
    setLogoBase64(branding.logoBase64);
    setLogoPreview(branding.logoBase64);
  }, []);

  // ─── Logo Upload Handler ────────────────────────────
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (PNG, JPG, SVG)');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo file must be under 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setLogoBase64(base64);
      setLogoPreview(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoBase64(null);
    setLogoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ─── Save Branding ─────────────────────────────────
  const handleSaveBranding = () => {
    if (!companyName.trim()) {
      toast.error('Company name cannot be empty');
      return;
    }
    saveBranding({ companyName: companyName.trim(), logoBase64 });
    toast.success('Branding updated successfully! Changes are now live.');
  };

  // ─── Database Reset ─────────────────────────────────
  const handleDatabaseReset = async () => {
    if (resetConfirmText !== 'RESET') {
      toast.error('Please type RESET to confirm');
      return;
    }

    if (!masterKey) {
      toast.error('Master key is required');
      return;
    }

    setIsResetting(true);
    try {
      const res = await api.post('/system/reset', { masterKey });
      toast.success(res.data.message || 'Database reset successfully');
      setIsResetDialogOpen(false);
      setMasterKey('');
      setResetConfirmText('');
      // Clear session cache and reload
      sessionStorage.clear();
      window.dispatchEvent(new Event('dashboard-reload'));
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Database reset failed');
    } finally {
      setIsResetting(false);
    }
  };

  if (!user || user.role !== 'ADMIN') return null;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 dark:from-slate-500 dark:to-slate-700 flex items-center justify-center shadow-lg">
          <Settings className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">System Settings</h2>
          <p className="text-base text-slate-500 dark:text-slate-400">Manage branding, configuration, and system maintenance.</p>
        </div>
      </div>

      {/* ─── Branding Section ──────────────────────────── */}
      <Card className="border-2 border-slate-200 dark:border-slate-800">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <div>
              <CardTitle className="text-xl">Company Branding</CardTitle>
              <CardDescription className="text-base mt-1">
                Customize the company name and logo displayed throughout the application.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-8 pb-6 px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Company Name */}
            <div className="space-y-4">
              <Label htmlFor="companyName" className="text-base font-semibold text-slate-700 dark:text-slate-300">
                Company Name
              </Label>
              <Input
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Enter company name"
                className="text-base h-12 px-4"
              />
              <p className="text-sm text-slate-400">This name appears in the sidebar and navbar.</p>
            </div>

            {/* Logo Upload */}
            <div className="space-y-4">
              <Label className="text-base font-semibold text-slate-700 dark:text-slate-300">
                Company Logo
              </Label>
              <div className="flex items-center gap-6">
                {/* Preview */}
                <div className="h-24 w-24 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center bg-slate-50 dark:bg-slate-900 overflow-hidden shrink-0">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo Preview" className="h-full w-full object-contain p-2" />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                  )}
                </div>

                {/* Upload Controls */}
                <div className="space-y-3 flex-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id="logo-upload"
                  />
                  <Button
                    variant="outline"
                    className="w-full gap-2 h-10"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4" /> Upload Logo
                  </Button>
                  {logoPreview && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full gap-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/10"
                      onClick={handleRemoveLogo}
                    >
                      <X className="h-3 w-3" /> Remove Logo
                    </Button>
                  )}
                  <p className="text-xs text-slate-400">PNG, JPG, or SVG. Max 2MB.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
            <Button onClick={handleSaveBranding} className="gap-2 h-11 px-8 text-base">
              <Save className="h-4 w-4" /> Save Branding
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ─── Danger Zone ───────────────────────────────── */}
      <Card className="border-2 border-red-200 dark:border-red-900/50">
        <CardHeader className="border-b border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-950/20">
          <div className="flex items-center gap-3">
            <ShieldAlert className="h-5 w-5 text-red-600 dark:text-red-400" />
            <div>
              <CardTitle className="text-xl text-red-700 dark:text-red-400">Danger Zone</CardTitle>
              <CardDescription className="text-base mt-1 text-red-600/70 dark:text-red-400/70">
                Irreversible operations. Proceed with extreme caution.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-8 pb-6 px-8">
          <div className="flex items-center justify-between p-6 rounded-xl border-2 border-red-200 dark:border-red-900/40 bg-red-50/30 dark:bg-red-950/10">
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-red-700 dark:text-red-400 flex items-center gap-2">
                <Trash2 className="h-5 w-5" /> Reset System Database
              </h3>
              <p className="text-sm text-red-600/80 dark:text-red-400/60 max-w-xl">
                This will permanently delete all Properties, Tenants, Rent records, and Payment history.
                User accounts will be preserved. A master key is required to proceed.
              </p>
            </div>
            <Button
              variant="outline"
              className="shrink-0 border-red-300 text-red-700 hover:bg-red-100 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950 h-12 px-6 text-base font-bold"
              onClick={() => setIsResetDialogOpen(true)}
            >
              <AlertTriangle className="h-4 w-4 mr-2" /> Reset Database
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ─── Reset Confirmation Dialog ─────────────────── */}
      <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader className="border-b pb-4 mb-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <DialogTitle className="text-xl text-red-700 dark:text-red-400">Confirm System Reset</DialogTitle>
                <DialogDescription className="text-base mt-1">
                  This action is permanent and cannot be undone.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6 mt-2">
            {/* Warning Box */}
            <div className="rounded-xl bg-red-50 dark:bg-red-950/30 p-5 border border-red-200 dark:border-red-900">
              <p className="text-sm font-semibold text-red-800 dark:text-red-300 mb-3">
                The following data will be permanently deleted:
              </p>
              <ul className="text-sm text-red-700 dark:text-red-400/80 space-y-1.5 ml-4 list-disc">
                <li>All property records</li>
                <li>All tenant records</li>
                <li>All rent generation history</li>
                <li>All payment records and receipts</li>
              </ul>
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400 mt-4 flex items-center gap-2">
                ✓ User accounts (Admin, Manager, Collector) will be preserved.
              </p>
            </div>

            {/* Confirmation Text */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Type <span className="text-red-600 font-mono font-black">RESET</span> to confirm
              </Label>
              <Input
                value={resetConfirmText}
                onChange={(e) => setResetConfirmText(e.target.value)}
                placeholder="Type RESET"
                className="text-base h-11 font-mono tracking-wider"
              />
            </div>

            {/* Master Key */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Master Key Password
              </Label>
              <Input
                type="password"
                value={masterKey}
                onChange={(e) => setMasterKey(e.target.value)}
                placeholder="Enter the master key"
                className="text-base h-11"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button
              variant="outline"
              onClick={() => {
                setIsResetDialogOpen(false);
                setMasterKey('');
                setResetConfirmText('');
              }}
              className="h-11 px-6"
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              disabled={resetConfirmText !== 'RESET' || !masterKey || isResetting}
              onClick={handleDatabaseReset}
              className="h-11 px-6 bg-red-600 text-white border-red-600 hover:bg-red-700 hover:border-red-700 disabled:opacity-50 font-bold"
            >
              {isResetting ? 'Resetting...' : 'Reset Database'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
