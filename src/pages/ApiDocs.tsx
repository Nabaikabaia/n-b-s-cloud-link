import { useState } from "react";
import ParticleBackground from "@/components/ParticleBackground";
import ThemeToggle from "@/components/ThemeToggle";
import HamburgerMenu from "@/components/HamburgerMenu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code, Copy, Check, Home, Play, Loader2, ArrowRight, FileUp, Globe, Download, AlertTriangle, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const ApiDocs = () => {
  const navigate = useNavigate();
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [testUrl, setTestUrl] = useState("");
  const [testCustomName, setTestCustomName] = useState("");
  const [testResult, setTestResult] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    toast.success("Copied!");
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const CopyBtn = ({ id, text, label }: { id: string; text: string; label?: string }) => (
    <button
      onClick={() => copy(text, id)}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
    >
      {copiedSection === id ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
      {label || "Copy"}
    </button>
  );

  const baseUrl = window.location.origin;
  const functionsUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

  const handleTestUpload = async () => {
    if (!testUrl.trim()) { toast.error("Enter a URL first"); return; }
    setIsTesting(true);
    setTestResult(null);
    try {
      const { data: metaData, error: metaError } = await supabase.functions.invoke("check-url-file", {
        body: { url: testUrl.trim() },
      });
      if (metaError) throw new Error(metaError.message);
      if (metaData?.error) throw new Error(metaData.error);

      const { data: shortId, error: idError } = await supabase.rpc("generate_short_id");
      if (idError) throw idError;

      const expireAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase.functions.invoke("upload-from-url", {
        body: { url: testUrl.trim(), shortId, expireAt, customName: testCustomName.trim() || null },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      const link = `${baseUrl}/${data.custom_name || data.short_id}`;
      const fullJson = { upload: data, metadata: metaData, download_url: link };
      setTestResult({ success: true, link, fileName: data.file_name, size: metaData?.fileSize, type: data.file_type, expires: data.expire_at, json: fullJson });
      toast.success("Upload successful!");
    } catch (err: any) {
      setTestResult({ success: false, error: err.message });
    } finally {
      setIsTesting(false);
    }
  };

  // Build the browser-openable URL for upload-from-url
  const buildBrowserUrl = (url: string, shortId?: string, customName?: string) => {
    const params = new URLSearchParams();
    params.set("url", url);
    if (shortId) params.set("shortId", shortId);
    if (customName) params.set("customName", customName);
    return `${functionsUrl}/upload-from-url?${params.toString()}`;
  };

  return (
    <div className="min-h-screen relative">
      <ParticleBackground />
      <div className="fixed top-4 left-4 z-[100]"><HamburgerMenu /></div>
      <div className="fixed top-4 right-4 z-[100] flex gap-2">
        <Button variant="outline" size="icon" onClick={() => navigate("/")} className="rounded-full bg-card/80 backdrop-blur-sm border-border hover:border-primary/50">
          <Home className="h-4 w-4" />
        </Button>
        <ThemeToggle />
      </div>

      <div className="container mx-auto px-4 py-16 sm:py-24 relative z-10 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary mb-4">
            <Code className="w-3 h-3" />
            API Documentation
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
            Upload & Share <span className="gradient-text">via API</span>
          </h1>
          <p className="text-muted-foreground text-sm max-w-lg mx-auto">
            Two endpoints: upload a file directly, or pass a URL and we fetch it for you.
          </p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3 mb-10">
          {[
            { label: "Max size", value: "2 GB" },
            { label: "Auth", value: "None" },
            { label: ">50MB expiry", value: "1 hour" },
          ].map(s => (
            <div key={s.label} className="rounded-xl bg-card border border-border p-3.5 text-center">
              <p className="text-lg font-bold text-primary">{s.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Base URL — prominent & copyable */}
        <div className="rounded-xl bg-card border border-border p-4 mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Base URL</span>
            <CopyBtn id="base-url" text={functionsUrl} label="Copy" />
          </div>
          <code className="text-sm font-mono text-primary break-all">{functionsUrl}</code>
          <p className="text-xs text-muted-foreground mt-2">Use this as the base for all API requests. You can also open URLs in your browser for GET-style testing.</p>
        </div>

        <div className="space-y-6">
          {/* SECTION 1: File Upload */}
          <Section icon={<FileUp className="h-4 w-4 text-primary" />} title="Upload a File" desc="Send a file from your device using multipart/form-data.">
            <CodeBlock id="opt1" code={`curl -X POST ${baseUrl}/api/upload \\
  -F "file=@./photo.jpg" \\
  -F "expiration=24h" \\
  -F "customName=my-photo"`} onCopy={copy} copied={copiedSection} />
            <ParamTable params={[
              { name: "file", required: true, desc: "The file to upload" },
              { name: "expiration", required: false, desc: '"1h", "24h", "7d", or "never"' },
              { name: "customName", required: false, desc: "Custom name for the download link" },
            ]} />
          </Section>

          {/* SECTION 2: Upload from URL */}
          <Section icon={<Globe className="h-4 w-4 text-primary" />} title="Upload from URL" desc="Give us a link, we download and host it for you.">
            {/* Flow diagram */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg p-3 border border-border">
              <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">URL</span>
              <ArrowRight className="h-3 w-3" />
              <span>Download</span>
              <ArrowRight className="h-3 w-3" />
              <span>Store</span>
              <ArrowRight className="h-3 w-3" />
              <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">Link</span>
            </div>

            <CodeBlock id="opt2" code={`curl -X POST ${functionsUrl}/upload-from-url \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://example.com/video.mp4",
    "shortId": "MyFile123",
    "customName": "cool-video",
    "expireAt": "2026-04-01T00:00:00Z"
  }'`} onCopy={copy} copied={copiedSection} />

            {/* Browser URL */}
            <div className="rounded-lg bg-muted/30 border border-border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">🌐 Open in Browser (for testing)</span>
                <CopyBtn id="browser-url" text={buildBrowserUrl("https://example.com/video.mp4", "MyFile123", "cool-video")} label="Copy URL" />
              </div>
              <code className="text-[11px] font-mono text-foreground/70 break-all block leading-relaxed">
                {buildBrowserUrl("https://example.com/video.mp4", "MyFile123", "cool-video")}
              </code>
              <p className="text-[10px] text-muted-foreground">Paste this URL in your browser to trigger the upload and get a JSON response.</p>
            </div>

            <ParamTable params={[
              { name: "url", required: true, desc: "Direct link to a downloadable file" },
              { name: "shortId", required: true, desc: "Unique ID for this upload" },
              { name: "customName", required: false, desc: "Custom name for download link" },
              { name: "expireAt", required: false, desc: "Expiry date (ISO format)" },
            ]} />

            <details className="group">
              <summary className="text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                ▸ Check file size before uploading
              </summary>
              <div className="mt-2 ml-2 border-l-2 border-border pl-3 space-y-2">
                <CodeBlock id="check" code={`curl -X POST ${functionsUrl}/check-url-file \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://example.com/video.mp4"}'`} onCopy={copy} copied={copiedSection} />
                <p className="text-xs text-muted-foreground">Returns:</p>
                <pre className="bg-muted/50 rounded-lg p-2.5 text-xs font-mono text-foreground/80">{`{ "fileSize": 479001600, "contentType": "video/mp4", "fileName": "video.mp4" }`}</pre>
              </div>
            </details>
          </Section>

          {/* SECTION 3: Accessing Files */}
          <Section icon={<Download className="h-4 w-4 text-primary" />} title="Accessing Files" desc="Share the link — anyone can view and download.">
            <div className="rounded-lg bg-muted/30 border border-border p-3 space-y-1.5 font-mono text-sm">
              <p>{baseUrl}/<span className="text-primary font-medium">MyFile123</span></p>
              <p>{baseUrl}/<span className="text-primary font-medium">cool-video</span></p>
            </div>
            <p className="text-xs text-muted-foreground">
              Use <code className="bg-muted px-1 rounded text-foreground/70">short_id</code> or <code className="bg-muted px-1 rounded text-foreground/70">customName</code> from the upload response.
            </p>
          </Section>

          {/* SECTION 4: Code Examples */}
          <Section icon={<Code className="h-4 w-4 text-primary" />} title="Code Examples" desc="Copy-paste ready snippets.">
            <Tabs defaultValue="js" className="space-y-3">
              <TabsList className="bg-muted/50 border border-border">
                <TabsTrigger value="js" className="text-xs data-[state=active]:bg-card">JavaScript</TabsTrigger>
                <TabsTrigger value="python" className="text-xs data-[state=active]:bg-card">Python</TabsTrigger>
                <TabsTrigger value="node" className="text-xs data-[state=active]:bg-card">Node.js</TabsTrigger>
                <TabsTrigger value="curl" className="text-xs data-[state=active]:bg-card">cURL</TabsTrigger>
              </TabsList>

              <TabsContent value="js" className="space-y-4">
                <ExampleLabel>Upload a file (browser)</ExampleLabel>
                <CodeBlock id="js-file" code={`const formData = new FormData();
formData.append("file", fileInput.files[0]);
formData.append("expiration", "24h");
formData.append("customName", "my-photo");

const res = await fetch("${baseUrl}/api/upload", {
  method: "POST",
  body: formData,
});
const data = await res.json();
console.log("Download:", data.url);`} onCopy={copy} copied={copiedSection} />

                <ExampleLabel>Upload from URL</ExampleLabel>
                <CodeBlock id="js-url" code={`const res = await fetch("${functionsUrl}/upload-from-url", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    url: "https://example.com/video.mp4",
    shortId: "MyVid123",
    customName: "cool-video",
    expireAt: "2026-04-01T00:00:00Z",
  }),
});
const data = await res.json();
console.log("Download:", "${baseUrl}/" + (data.custom_name || data.short_id));`} onCopy={copy} copied={copiedSection} />
              </TabsContent>

              <TabsContent value="python" className="space-y-4">
                <ExampleLabel>Upload a file</ExampleLabel>
                <CodeBlock id="py-file" code={`import requests

files = {"file": open("photo.jpg", "rb")}
data = {"expiration": "24h", "customName": "my-photo"}

res = requests.post("${baseUrl}/api/upload", files=files, data=data)
print("Download:", res.json()["url"])`} onCopy={copy} copied={copiedSection} />

                <ExampleLabel>Upload from URL</ExampleLabel>
                <CodeBlock id="py-url" code={`import requests

res = requests.post(
    "${functionsUrl}/upload-from-url",
    json={
        "url": "https://example.com/video.mp4",
        "shortId": "MyVid123",
        "customName": "cool-video",
        "expireAt": "2026-04-01T00:00:00Z",
    },
)
data = res.json()
print("Download:", "${baseUrl}/" + (data.get("custom_name") or data["short_id"]))`} onCopy={copy} copied={copiedSection} />
              </TabsContent>

              <TabsContent value="node" className="space-y-4">
                <ExampleLabel>Upload a file</ExampleLabel>
                <CodeBlock id="node-file" code={`import fs from "fs";

const formData = new FormData();
formData.append("file", new Blob([fs.readFileSync("./photo.jpg")]), "photo.jpg");
formData.append("expiration", "24h");

const res = await fetch("${baseUrl}/api/upload", {
  method: "POST",
  body: formData,
});
const data = await res.json();
console.log("Download:", data.url);`} onCopy={copy} copied={copiedSection} />

                <ExampleLabel>Upload from URL</ExampleLabel>
                <CodeBlock id="node-url" code={`const res = await fetch("${functionsUrl}/upload-from-url", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    url: "https://example.com/video.mp4",
    shortId: "MyVid123",
    customName: "cool-video",
  }),
});
const data = await res.json();
console.log("Download:", "${baseUrl}/" + (data.custom_name || data.short_id));`} onCopy={copy} copied={copiedSection} />
              </TabsContent>

              <TabsContent value="curl" className="space-y-4">
                <ExampleLabel>Upload a file</ExampleLabel>
                <CodeBlock id="curl-file" code={`curl -X POST ${baseUrl}/api/upload \\
  -F "file=@./photo.jpg" \\
  -F "expiration=24h" \\
  -F "customName=my-photo"`} onCopy={copy} copied={copiedSection} />

                <ExampleLabel>Upload from URL</ExampleLabel>
                <CodeBlock id="curl-url" code={`curl -X POST ${functionsUrl}/upload-from-url \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://example.com/video.mp4",
    "shortId": "MyVid123",
    "customName": "cool-video"
  }'`} onCopy={copy} copied={copiedSection} />
              </TabsContent>
            </Tabs>
          </Section>

          {/* SECTION 5: Try It */}
          <div className="rounded-2xl bg-card border-2 border-primary/30 p-6 sm:p-8 space-y-5">
            <div className="flex items-center gap-2">
              <Play className="h-4 w-4 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Try It Now</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Paste a direct file URL and test the upload. Results expire in 1 hour.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-foreground mb-1 block">File URL <span className="text-destructive">*</span></label>
                <Input placeholder="https://example.com/sample.pdf" value={testUrl} onChange={(e) => setTestUrl(e.target.value)} className="bg-muted/30 border-border" />
              </div>

              {/* Live base URL with file URL attached */}
              {testUrl.trim() && (
                <div className="rounded-lg bg-muted/30 border border-border p-3 space-y-2 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">🔗 Request URL</span>
                    <CopyBtn id="test-browser-url" text={buildBrowserUrl(testUrl.trim(), testCustomName.trim() || undefined, testCustomName.trim() || undefined)} label="Copy" />
                  </div>
                  <code className="text-[11px] font-mono text-foreground/70 break-all block leading-relaxed">
                    {buildBrowserUrl(testUrl.trim(), testCustomName.trim() || "auto-generated", testCustomName.trim() || undefined)}
                  </code>
                  <button
                    onClick={() => window.open(buildBrowserUrl(testUrl.trim(), testCustomName.trim() || `test-${Date.now()}`, testCustomName.trim() || undefined), '_blank')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Open in browser for JSON response
                  </button>
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-foreground mb-1 block">Custom Name <span className="text-muted-foreground font-normal">(optional)</span></label>
                <Input placeholder="my-test-file" value={testCustomName} onChange={(e) => setTestCustomName(e.target.value)} className="bg-muted/30 border-border" />
              </div>

              <Button onClick={handleTestUpload} disabled={isTesting} className="w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">
                {isTesting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading…</> : <><Play className="h-4 w-4 mr-2" /> Upload from URL</>}
              </Button>

              {/* Results */}
              {testResult && (
                <div className={`rounded-xl p-5 text-sm space-y-3 border ${testResult.success ? "bg-card border-primary/20" : "bg-destructive/5 border-destructive/20"}`}>
                  {testResult.success ? (
                    <>
                      <p className="font-semibold text-success flex items-center gap-1.5">
                        <Check className="h-4 w-4" /> Upload Complete
                      </p>

                      <div className="grid grid-cols-2 gap-1.5 text-xs">
                        <span className="text-muted-foreground">File</span>
                        <span className="text-foreground font-medium truncate">{testResult.fileName}</span>
                        {testResult.size && <><span className="text-muted-foreground">Size</span><span className="text-foreground font-medium">{(testResult.size / 1024 / 1024).toFixed(2)} MB</span></>}
                        <span className="text-muted-foreground">Type</span>
                        <span className="text-foreground font-medium">{testResult.type}</span>
                        <span className="text-muted-foreground">Expires</span>
                        <span className="text-foreground font-medium">{new Date(testResult.expires).toLocaleString()}</span>
                      </div>

                      {/* Link */}
                      <div className="flex items-center gap-2 bg-muted/30 rounded-lg p-2.5 border border-border">
                        <a href={testResult.link} target="_blank" rel="noopener noreferrer" className="text-primary text-xs font-mono break-all flex-1 hover:underline">
                          {testResult.link}
                        </a>
                        <CopyBtn id="result-link" text={testResult.link} />
                      </div>

                      {/* JSON actions */}
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => {
                            const blob = new Blob([JSON.stringify(testResult.json, null, 2)], { type: "application/json" });
                            window.open(URL.createObjectURL(blob), "_blank");
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                        >
                          <ExternalLink className="h-3 w-3" />
                          View JSON
                        </button>
                        <CopyBtn id="json-raw" text={JSON.stringify(testResult.json, null, 2)} label="Copy JSON" />
                      </div>

                      {/* Raw JSON preview */}
                      <details>
                        <summary className="text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                          ▸ Raw JSON Response
                        </summary>
                        <pre className="mt-2 bg-muted/30 rounded-lg p-3 text-[11px] font-mono overflow-x-auto whitespace-pre-wrap max-h-60 overflow-y-auto text-foreground/80 border border-border">
                          {JSON.stringify(testResult.json, null, 2)}
                        </pre>
                      </details>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold text-destructive flex items-center gap-1.5">
                        <AlertTriangle className="h-4 w-4" /> Failed
                      </p>
                      <p className="text-xs text-muted-foreground">{testResult.error}</p>
                      <button
                        onClick={() => {
                          const blob = new Blob([JSON.stringify({ success: false, error: testResult.error }, null, 2)], { type: "application/json" });
                          window.open(URL.createObjectURL(blob), "_blank");
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                      >
                        <ExternalLink className="h-3 w-3" />
                        View Error JSON
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <footer className="mt-20 text-center">
          <p className="text-xs text-muted-foreground">Nãbēēs Uploader API • v2.0</p>
        </footer>
      </div>
    </div>
  );
};

/* ── Helper Components ── */

const Section = ({ icon, title, desc, children }: { icon: React.ReactNode; title: string; desc: string; children: React.ReactNode }) => (
  <div className="rounded-2xl bg-card border border-border p-5 sm:p-6 space-y-4">
    <div>
      <h2 className="flex items-center gap-2 text-base font-semibold text-foreground mb-1">{icon}{title}</h2>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </div>
    {children}
  </div>
);

const CodeBlock = ({ id, code, onCopy, copied }: { id: string; code: string; onCopy: (t: string, id: string) => void; copied: string | null }) => (
  <div className="relative">
    <div className="absolute top-2 right-2 z-10">
      <button
        onClick={() => onCopy(code, id)}
        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium bg-background/80 backdrop-blur-sm border border-border text-muted-foreground hover:text-foreground transition-colors"
      >
        {copied === id ? <Check className="h-2.5 w-2.5 text-success" /> : <Copy className="h-2.5 w-2.5" />}
        {copied === id ? "Copied" : "Copy"}
      </button>
    </div>
    <pre className="bg-muted/40 border border-border rounded-xl p-4 pr-20 text-xs font-mono overflow-x-auto whitespace-pre-wrap text-foreground/80 leading-relaxed">{code}</pre>
  </div>
);

const ExampleLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{children}</p>
);

const ParamTable = ({ params }: { params: { name: string; required: boolean; desc: string }[] }) => (
  <div className="rounded-xl border border-border overflow-hidden text-xs">
    <div className="grid grid-cols-[100px_50px_1fr] bg-muted/40 px-3 py-2 font-medium text-muted-foreground border-b border-border">
      <span>Param</span><span>Req</span><span>Description</span>
    </div>
    {params.map((p) => (
      <div key={p.name} className="grid grid-cols-[100px_50px_1fr] px-3 py-2 border-t border-border/50">
        <span className="font-mono text-primary font-medium">{p.name}</span>
        <span>{p.required ? "✓" : "—"}</span>
        <span className="text-muted-foreground">{p.desc}</span>
      </div>
    ))}
  </div>
);

export default ApiDocs;
