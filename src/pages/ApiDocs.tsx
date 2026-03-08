import { useState } from "react";
import ParticleBackground from "@/components/ParticleBackground";
import ThemeToggle from "@/components/ThemeToggle";
import HamburgerMenu from "@/components/HamburgerMenu";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Code, Copy, Check, Home, Play, Loader2, ArrowRight, FileUp, Globe, Download, AlertTriangle, Braces, ExternalLink } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
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

  const CopyBtn = ({ id, text }: { id: string; text: string }) => (
    <button onClick={() => copy(text, id)} className="ml-2 text-muted-foreground hover:text-foreground transition-colors">
      {copiedSection === id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
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

  return (
    <div className="min-h-screen relative overflow-hidden">
      <ParticleBackground />
      <div className="fixed top-4 left-4 z-[100]"><HamburgerMenu /></div>
      <div className="fixed top-4 right-4 z-[100] flex gap-2">
        <Button variant="outline" size="icon" onClick={() => navigate("/")} className="glass-strong border border-primary/20">
          <Home className="h-4 w-4" />
        </Button>
        <ThemeToggle />
      </div>

      <div className="container mx-auto px-4 py-16 relative z-10 max-w-3xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 glass-panel px-5 py-2 rounded-full mb-4">
            <Code className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">API Docs</span>
          </div>
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Upload &amp; Share Files
          </h1>
          <p className="text-muted-foreground">
            Two ways to upload: send a file directly, or give us a URL and we'll grab it for you.
          </p>
        </div>

        {/* Quick Info */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="glass-panel rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-primary">2 GB</p>
            <p className="text-xs text-muted-foreground mt-1">Max file size</p>
          </div>
          <div className="glass-panel rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-primary">No</p>
            <p className="text-xs text-muted-foreground mt-1">Auth required</p>
          </div>
          <div className="glass-panel rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-primary">1 hr</p>
            <p className="text-xs text-muted-foreground mt-1">Expiry if &gt;50MB</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* ===== SECTION 1: Upload a file from your computer ===== */}
          <Card className="glass-panel border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileUp className="h-5 w-5 text-primary" />
                Option 1 — Upload a File
              </CardTitle>
              <p className="text-sm text-muted-foreground">Send a file from your computer. Use <code className="text-xs bg-muted px-1 rounded">multipart/form-data</code>.</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <CodeBlock id="opt1" label="cURL" onCopy={copy} copied={copiedSection} code={`curl -X POST ${baseUrl}/api/upload \\
  -F "file=@./photo.jpg" \\
  -F "expiration=24h" \\
  -F "customName=my-photo"`} />
              <ParamTable params={[
                { name: "file", required: true, desc: "The file to upload" },
                { name: "expiration", required: false, desc: '"1h", "24h", "7d", or "never"' },
                { name: "customName", required: false, desc: "Custom name for the download link" },
              ]} />
            </CardContent>
          </Card>

          {/* ===== SECTION 2: Upload from a URL ===== */}
          <Card className="glass-panel border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Globe className="h-5 w-5 text-primary" />
                Option 2 — Upload from a URL
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Give us a link to any file on the internet. We download it and host it for you.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Visual flow */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
                <span className="bg-primary/20 text-primary font-medium px-2 py-0.5 rounded">Your URL</span>
                <ArrowRight className="h-3 w-3" />
                <span>We download it</span>
                <ArrowRight className="h-3 w-3" />
                <span>We store it</span>
                <ArrowRight className="h-3 w-3" />
                <span className="bg-primary/20 text-primary font-medium px-2 py-0.5 rounded">You get a link</span>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Just one request needed:</p>
                <CodeBlock id="opt2" label="cURL" onCopy={copy} copied={copiedSection} code={`curl -X POST ${functionsUrl}/upload-from-url \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://example.com/video.mp4",
    "shortId": "MyFile123",
    "customName": "cool-video",
    "expireAt": "2026-04-01T00:00:00Z"
  }'`} />
                <ParamTable params={[
                  { name: "url", required: true, desc: "Direct link to a downloadable file" },
                  { name: "shortId", required: true, desc: "A unique ID for this upload (any alphanumeric string)" },
                  { name: "customName", required: false, desc: "Custom name for the download link" },
                  { name: "expireAt", required: false, desc: "When the file should be deleted (ISO date)" },
                ]} />
              </div>

              <details className="group">
                <summary className="text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                  ▸ Want to check file size before uploading? (Optional)
                </summary>
                <div className="mt-2 ml-2 border-l-2 border-primary/20 pl-3 space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Use the check endpoint first to see the file's size and type — useful if you want to avoid uploading huge files by mistake.
                  </p>
                  <CodeBlock id="check" label="cURL" onCopy={copy} copied={copiedSection} code={`curl -X POST ${functionsUrl}/check-url-file \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://example.com/video.mp4"}'`} />
                  <p className="text-xs text-muted-foreground">Returns:</p>
                  <pre className="bg-muted rounded-lg p-2 text-xs">{`{ "fileSize": 479001600, "contentType": "video/mp4", "fileName": "video.mp4" }`}</pre>
                </div>
              </details>
            </CardContent>
          </Card>

          {/* ===== SECTION 3: Download ===== */}
          <Card className="glass-panel border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Download className="h-5 w-5 text-primary" />
                Accessing Files
              </CardTitle>
              <p className="text-sm text-muted-foreground">Share the link — anyone can view and download.</p>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="bg-muted rounded-lg p-3 space-y-1 text-sm font-mono">
                <p>{baseUrl}/<span className="text-primary">MyFile123</span></p>
                <p>{baseUrl}/<span className="text-primary">cool-video</span></p>
              </div>
              <p className="text-xs text-muted-foreground">
                Use the <code className="bg-muted px-1 rounded">short_id</code> or the <code className="bg-muted px-1 rounded">customName</code> you set during upload.
              </p>
            </CardContent>
          </Card>

          {/* ===== SECTION 4: Code Examples ===== */}
          <Card className="glass-panel border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Braces className="h-5 w-5 text-primary" />
                Code Examples
              </CardTitle>
              <p className="text-sm text-muted-foreground">Copy-paste examples in your favorite language.</p>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="js" className="space-y-3">
                <TabsList className="bg-muted/70">
                  <TabsTrigger value="js" className="text-xs">JavaScript</TabsTrigger>
                  <TabsTrigger value="python" className="text-xs">Python</TabsTrigger>
                  <TabsTrigger value="node" className="text-xs">Node.js</TabsTrigger>
                  <TabsTrigger value="curl" className="text-xs">cURL</TabsTrigger>
                </TabsList>

                <TabsContent value="js" className="space-y-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Upload a file (browser)</p>
                  <CodeBlock id="js-file" label="" onCopy={copy} copied={copiedSection} code={`const formData = new FormData();
formData.append("file", fileInput.files[0]);
formData.append("expiration", "24h");
formData.append("customName", "my-photo");

const res = await fetch("${baseUrl}/api/upload", {
  method: "POST",
  body: formData,
});
const data = await res.json();
console.log("Download link:", data.url);`} />

                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Upload from URL</p>
                  <CodeBlock id="js-url" label="" onCopy={copy} copied={copiedSection} code={`const res = await fetch("${functionsUrl}/upload-from-url", {
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
console.log("Download link:", "${baseUrl}/" + (data.custom_name || data.short_id));`} />
                </TabsContent>

                <TabsContent value="python" className="space-y-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Upload a file</p>
                  <CodeBlock id="py-file" label="" onCopy={copy} copied={copiedSection} code={`import requests

files = {"file": open("photo.jpg", "rb")}
data = {"expiration": "24h", "customName": "my-photo"}

res = requests.post("${baseUrl}/api/upload", files=files, data=data)
print("Download link:", res.json()["url"])`} />

                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Upload from URL</p>
                  <CodeBlock id="py-url" label="" onCopy={copy} copied={copiedSection} code={`import requests

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
print("Download link:", "${baseUrl}/" + (data.get("custom_name") or data["short_id"]))`} />
                </TabsContent>

                <TabsContent value="node" className="space-y-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Upload a file (Node.js)</p>
                  <CodeBlock id="node-file" label="" onCopy={copy} copied={copiedSection} code={`import fs from "fs";

const formData = new FormData();
formData.append("file", new Blob([fs.readFileSync("./photo.jpg")]), "photo.jpg");
formData.append("expiration", "24h");
formData.append("customName", "my-photo");

const res = await fetch("${baseUrl}/api/upload", {
  method: "POST",
  body: formData,
});
const data = await res.json();
console.log("Download link:", data.url);`} />

                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Upload from URL</p>
                  <CodeBlock id="node-url" label="" onCopy={copy} copied={copiedSection} code={`const res = await fetch("${functionsUrl}/upload-from-url", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    url: "https://example.com/video.mp4",
    shortId: "MyVid123",
    customName: "cool-video",
  }),
});
const data = await res.json();
console.log("Download link:", "${baseUrl}/" + (data.custom_name || data.short_id));`} />
                </TabsContent>

                <TabsContent value="curl" className="space-y-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Upload a file</p>
                  <CodeBlock id="curl-file" label="" onCopy={copy} copied={copiedSection} code={`curl -X POST ${baseUrl}/api/upload \\
  -F "file=@./photo.jpg" \\
  -F "expiration=24h" \\
  -F "customName=my-photo"`} />

                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Upload from URL</p>
                  <CodeBlock id="curl-url" label="" onCopy={copy} copied={copiedSection} code={`curl -X POST ${functionsUrl}/upload-from-url \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://example.com/video.mp4",
    "shortId": "MyVid123",
    "customName": "cool-video"
  }'`} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* ===== SECTION 5: Try It ===== */}
          <Card className="glass-panel border-primary/20 border-2">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Play className="h-5 w-5 text-primary" />
                🧪 Try It Now
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Paste any direct file URL below and we'll upload it. Test uploads expire in 1 hour.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-xs font-medium mb-1 block">File URL <span className="text-destructive">*</span></label>
                <Input placeholder="https://example.com/sample.pdf" value={testUrl} onChange={(e) => setTestUrl(e.target.value)} className="bg-muted/50" />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Custom Name <span className="text-muted-foreground">(optional)</span></label>
                <Input placeholder="my-test-file" value={testCustomName} onChange={(e) => setTestCustomName(e.target.value)} className="bg-muted/50" />
              </div>
              <Button onClick={handleTestUpload} disabled={isTesting} className="w-full">
                {isTesting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading…</> : <><Play className="h-4 w-4 mr-2" /> Upload from URL</>}
              </Button>

              {testResult && (
                <div className={`rounded-lg p-4 text-sm space-y-1 ${testResult.success ? "bg-muted/80 border border-primary/30" : "bg-destructive/10 border border-destructive/30"}`}>
                  {testResult.success ? (
                    <>
                      <p className="font-semibold text-primary">✅ Done!</p>
                      <p className="text-xs"><span className="text-muted-foreground">File:</span> {testResult.fileName}</p>
                      {testResult.size && <p className="text-xs"><span className="text-muted-foreground">Size:</span> {(testResult.size / 1024 / 1024).toFixed(2)} MB</p>}
                      <p className="text-xs"><span className="text-muted-foreground">Type:</span> {testResult.type}</p>
                      <p className="text-xs"><span className="text-muted-foreground">Expires:</span> {new Date(testResult.expires).toLocaleString()}</p>
                      <div className="flex items-center gap-1 mt-2 bg-muted rounded-md p-2">
                        <a href={testResult.link} target="_blank" rel="noopener noreferrer" className="text-primary underline text-xs break-all flex-1">{testResult.link}</a>
                        <CopyBtn id="result-link" text={testResult.link} />
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold text-destructive flex items-center gap-1"><AlertTriangle className="h-4 w-4" /> Failed</p>
                      <p className="text-xs text-muted-foreground">{testResult.error}</p>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

/* ── Tiny helper components ── */

const CodeBlock = ({ id, label, code, onCopy, copied }: { id: string; label: string; code: string; onCopy: (t: string, id: string) => void; copied: string | null }) => (
  <div>
    <div className="flex items-center justify-between mb-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <button onClick={() => onCopy(code, id)} className="text-muted-foreground hover:text-foreground transition-colors">
        {copied === id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
    <pre className="bg-muted rounded-lg p-3 text-xs overflow-x-auto whitespace-pre-wrap">{code}</pre>
  </div>
);

const ParamTable = ({ params }: { params: { name: string; required: boolean; desc: string }[] }) => (
  <div className="rounded-lg border border-border overflow-hidden text-xs">
    <div className="grid grid-cols-[120px_60px_1fr] bg-muted/70 px-3 py-1.5 font-semibold text-muted-foreground">
      <span>Parameter</span><span>Required</span><span>Description</span>
    </div>
    {params.map((p) => (
      <div key={p.name} className="grid grid-cols-[120px_60px_1fr] px-3 py-1.5 border-t border-border">
        <span className="font-mono text-primary">{p.name}</span>
        <span>{p.required ? "✅" : "—"}</span>
        <span className="text-muted-foreground">{p.desc}</span>
      </div>
    ))}
  </div>
);

export default ApiDocs;
