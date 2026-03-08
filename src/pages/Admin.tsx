import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import ParticleBackground from "@/components/ParticleBackground";
import ThemeToggle from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Lock, BarChart3, HardDrive, Download, FileUp, Clock,
  Trash2, ExternalLink, Search, RefreshCw, AlertTriangle,
  Home, Shield, TrendingUp, PieChart, Activity
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface AdminData {
  totalUploads: number;
  totalSize: number;
  totalDownloads: number;
  activeFiles: number;
  expiredFiles: number;
  dailyUploads: Record<string, number>;
  topDownloads: any[];
  typeDistribution: Record<string, number>;
  expiringSoon: any[];
  uploads: any[];
}

const Admin = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AdminData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [storedPassword, setStoredPassword] = useState("");

  const fetchData = useCallback(async (pwd: string) => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("admin", {
        headers: { "x-admin-password": pwd },
        body: {},
      });
      if (error) throw error;
      if (result?.error) throw new Error(result.error);
      setData(result);
    } catch (err: any) {
      if (err.message?.includes("Unauthorized")) {
        setAuthenticated(false);
        toast.error("Session expired");
      } else {
        toast.error(err.message || "Failed to load data");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("admin", {
        headers: { "x-admin-password": password },
        body: {},
      });
      if (error) throw error;
      if (result?.error) throw new Error(result.error);
      setAuthenticated(true);
      setStoredPassword(password);
      setData(result);
      toast.success("Authenticated");
    } catch {
      toast.error("Wrong password");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (upload: any) => {
    if (!confirm(`Delete "${upload.file_name}"?`)) return;
    try {
      const { error } = await supabase.functions.invoke("admin", {
        headers: { "x-admin-password": storedPassword },
        body: { id: upload.id, storagePath: upload.storage_path },
      });
      if (error) throw error;
      toast.success("Deleted");
      fetchData(storedPassword);
    } catch (err: any) {
      toast.error(err.message || "Delete failed");
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
  };

  const getExpiryStatus = (expireAt: string | null) => {
    if (!expireAt) return { text: "Never", color: "text-success" };
    const exp = new Date(expireAt);
    if (exp < new Date()) return { text: "Expired", color: "text-destructive" };
    return { text: formatDistanceToNow(exp, { addSuffix: true }), color: "text-muted-foreground" };
  };

  // Password gate
  if (!authenticated) {
    return (
      <div className="min-h-screen relative flex items-center justify-center">
        <ParticleBackground />
        <div className="fixed top-4 right-4 z-[100]"><ThemeToggle /></div>
        <div className="relative z-10 w-full max-w-sm px-4">
          <div className="rounded-2xl bg-card/80 backdrop-blur-sm border border-border/60 p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-xl font-bold text-foreground">Admin Access</h1>
              <p className="text-sm text-muted-foreground">Enter password to continue</p>
            </div>
            <div className="space-y-3">
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                className="bg-muted/20 border-border/40 h-11 rounded-xl"
              />
              <Button onClick={handleLogin} disabled={loading || !password} className="w-full h-11 rounded-xl bg-primary text-primary-foreground">
                {loading ? "Verifying..." : "Unlock"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filteredUploads = data?.uploads?.filter(u =>
    u.file_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.custom_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.short_id?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Chart: simple bar visualization from dailyUploads
  const dailyEntries = data ? Object.entries(data.dailyUploads).slice(-14) : [];
  const maxDaily = Math.max(...dailyEntries.map(([, v]) => v), 1);

  return (
    <div className="min-h-screen relative">
      <ParticleBackground />
      <div className="fixed top-4 right-4 z-[100] flex gap-2">
        <Button variant="outline" size="icon" onClick={() => navigate("/")} className="rounded-2xl bg-card/70 backdrop-blur-md border-border/60">
          <Home className="h-4 w-4" />
        </Button>
        <ThemeToggle />
      </div>

      <div className="container mx-auto px-4 py-20 relative z-10 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Admin analytics & file management</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => fetchData(storedPassword)} disabled={loading} className="rounded-xl">
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Total Uploads", value: data?.totalUploads || 0, icon: FileUp, color: "text-primary" },
            { label: "Total Storage", value: formatSize(data?.totalSize || 0), icon: HardDrive, color: "text-secondary" },
            { label: "Total Downloads", value: data?.totalDownloads || 0, icon: Download, color: "text-accent" },
            { label: "Active Files", value: data?.activeFiles || 0, icon: Activity, sub: `${data?.expiredFiles || 0} expired`, color: "text-success" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl bg-card/80 backdrop-blur-sm border border-border/60 p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-2">
                <s.icon className={`w-4 h-4 ${s.color}`} />
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{s.label}</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              {s.sub && <p className="text-[10px] text-muted-foreground mt-0.5">{s.sub}</p>}
            </div>
          ))}
        </div>

        {/* Upload activity chart */}
        <div className="rounded-2xl bg-card/80 backdrop-blur-sm border border-border/60 p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Upload Activity (14 days)</h2>
          </div>
          <div className="flex items-end gap-1 h-32">
            {dailyEntries.map(([date, count]) => (
              <div key={date} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[9px] text-muted-foreground font-mono">{count || ""}</span>
                <div
                  className="w-full bg-primary/70 rounded-t-md transition-all min-h-[2px]"
                  style={{ height: `${(count / maxDaily) * 100}%` }}
                />
                <span className="text-[8px] text-muted-foreground font-mono">{date.slice(5)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* File type distribution */}
          <div className="rounded-2xl bg-card/80 backdrop-blur-sm border border-border/60 p-5">
            <div className="flex items-center gap-2 mb-4">
              <PieChart className="w-4 h-4 text-secondary" />
              <h2 className="text-sm font-semibold text-foreground">File Types</h2>
            </div>
            <div className="space-y-2">
              {data && Object.entries(data.typeDistribution)
                .sort(([, a], [, b]) => b - a)
                .map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground capitalize">{type}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1.5 rounded-full bg-muted/40 overflow-hidden">
                        <div className="h-full bg-primary/60 rounded-full" style={{ width: `${(count / (data.totalUploads || 1)) * 100}%` }} />
                      </div>
                      <span className="text-xs font-medium text-foreground w-6 text-right">{count}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Top downloads */}
          <div className="rounded-2xl bg-card/80 backdrop-blur-sm border border-border/60 p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-accent" />
              <h2 className="text-sm font-semibold text-foreground">Top Downloads</h2>
            </div>
            <div className="space-y-2">
              {data?.topDownloads?.length === 0 && (
                <p className="text-xs text-muted-foreground">No downloads yet</p>
              )}
              {data?.topDownloads?.map((u) => (
                <div key={u.id} className="flex items-center justify-between">
                  <span className="text-xs text-foreground truncate max-w-[60%]">{u.custom_name || u.file_name}</span>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Download className="w-3 h-3" />
                    {u.download_count}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Expiring soon */}
        {data?.expiringSoon && data.expiringSoon.length > 0 && (
          <div className="rounded-2xl bg-accent/5 border border-accent/20 p-5 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-accent" />
              <h2 className="text-sm font-semibold text-foreground">Expiring Soon (24h)</h2>
              <span className="text-[10px] bg-accent/10 text-accent px-2 py-0.5 rounded-full font-medium">{data.expiringSoon.length}</span>
            </div>
            <div className="space-y-1.5">
              {data.expiringSoon.map((u) => (
                <div key={u.id} className="flex items-center justify-between text-xs">
                  <span className="text-foreground truncate max-w-[50%]">{u.custom_name || u.file_name}</span>
                  <span className="text-accent">{formatDistanceToNow(new Date(u.expire_at), { addSuffix: true })}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* File management */}
        <div className="rounded-2xl bg-card/80 backdrop-blur-sm border border-border/60 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">All Files</h2>
            <div className="relative w-48">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
              <Input
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs bg-muted/20 border-border/40 rounded-lg"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/40">
                  <th className="text-left py-2 px-2 text-muted-foreground font-medium">Name</th>
                  <th className="text-left py-2 px-2 text-muted-foreground font-medium">Link</th>
                  <th className="text-left py-2 px-2 text-muted-foreground font-medium hidden sm:table-cell">Size</th>
                  <th className="text-left py-2 px-2 text-muted-foreground font-medium hidden md:table-cell">Type</th>
                  <th className="text-left py-2 px-2 text-muted-foreground font-medium">Downloads</th>
                  <th className="text-left py-2 px-2 text-muted-foreground font-medium">Expires</th>
                  <th className="text-right py-2 px-2 text-muted-foreground font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUploads.map((u) => {
                  const expiry = getExpiryStatus(u.expire_at);
                  const link = `${window.location.origin}/${u.custom_name || u.short_id}`;
                  return (
                    <tr key={u.id} className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                      <td className="py-2.5 px-2">
                        <p className="font-medium text-foreground truncate max-w-[180px]">{u.file_name}</p>
                        <p className="text-[10px] text-muted-foreground/60 font-mono">{u.short_id}</p>
                      </td>
                      <td className="py-2.5 px-2">
                        <a
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline truncate max-w-[200px] block font-mono text-[11px]"
                        >
                          /{u.custom_name || u.short_id}
                        </a>
                      </td>
                      <td className="py-2.5 px-2 text-muted-foreground hidden sm:table-cell">{formatSize(u.file_size)}</td>
                      <td className="py-2.5 px-2 text-muted-foreground hidden md:table-cell">{u.file_type}</td>
                      <td className="py-2.5 px-2 text-muted-foreground">{u.download_count || 0}</td>
                      <td className={`py-2.5 px-2 ${expiry.color}`}>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {expiry.text}
                        </div>
                      </td>
                      <td className="py-2.5 px-2">
                        <div className="flex gap-1 justify-end">
                          <Button
                            size="sm" variant="ghost"
                            onClick={() => window.open(link, "_blank")}
                            className="h-7 w-7 p-0"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm" variant="ghost"
                            onClick={() => handleDelete(u)}
                            className="h-7 w-7 p-0 hover:text-destructive"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredUploads.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground text-xs">
                      {searchQuery ? "No files match your search" : "No files uploaded yet"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
