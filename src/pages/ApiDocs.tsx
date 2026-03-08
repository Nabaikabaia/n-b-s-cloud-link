import { useState, useRef } from "react";
import ParticleBackground from "@/components/ParticleBackground";
import ThemeToggle from "@/components/ThemeToggle";
import HamburgerMenu from "@/components/HamburgerMenu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Code, Copy, Check, Home, Play, Loader2, ArrowRight,
  FileUp, Globe, Download, AlertTriangle, ExternalLink,
  Terminal, Zap, ChevronRight, Send, CornerDownLeft
} from "lucide-react";
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
  const [terminalHistory, setTerminalHistory] = useState<Array<{ type: 'input' | 'output' | 'error' | 'info'; text: string }>>([]);
  const terminalRef = useRef<HTMLDivElement>(null);

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    toast.success("Copied!");
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const CopyBtn = ({ id, text, label }: { id: string; text: string; label?: string }) => (
    <button
      onClick={() => copy(text, id)}
      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-200"
    >
      {copiedSection === id ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
      {label || "Copy"}
    </button>
  );

  const baseUrl = window.location.origin;
  const apiUrl = `${baseUrl}/api`;

  const addTerminalLine = (type: 'input' | 'output' | 'error' | 'info', text: string) => {
    setTerminalHistory(prev => [...prev, { type, text }]);
    setTimeout(() => terminalRef.current?.scrollTo({ top: terminalRef.current.scrollHeight, behavior: 'smooth' }), 50);
  };

  const handleTestUpload = async () => {
    if (!testUrl.trim()) { toast.error("Enter a URL first"); return; }
    setIsTesting(true);
    setTestResult(null);
    setTerminalHistory([]);

    const url = testUrl.trim();
    const name = testCustomName.trim() || null;

    addTerminalLine('info', `$ Sending request to upload-from-url...`);
    addTerminalLine('input', `POST ${apiUrl}/upload-from-url`);
    addTerminalLine('input', `Body: { url: "${url}"${name ? `, customName: "${name}"` : ''} }`);

    try {
      // Check file first
      addTerminalLine('info', '→ Checking file metadata...');
      const { data: metaData, error: metaError } = await supabase.functions.invoke("check-url-file", {
        body: { url },
      });
      if (metaError) throw new Error(metaError.message);
      if (metaData?.error) throw new Error(metaData.error);

      addTerminalLine('output', `✓ File: ${metaData?.fileName || 'unknown'} (${metaData?.contentType || 'unknown'}, ${metaData?.fileSize ? (metaData.fileSize / 1024 / 1024).toFixed(2) + ' MB' : 'unknown size'})`);

      // Generate short ID
      const { data: shortId, error: idError } = await supabase.rpc("generate_short_id");
      if (idError) throw idError;
      addTerminalLine('info', `→ Generated short ID: ${shortId}`);

      // Upload
      addTerminalLine('info', '→ Uploading file...');
      const expireAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase.functions.invoke("upload-from-url", {
        body: { url, shortId, expireAt, customName: name },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      const link = `${baseUrl}/${data.custom_name || data.short_id}`;
      const fullJson = { upload: data, metadata: metaData, download_url: link };

      addTerminalLine('output', `✓ Upload complete!`);
      addTerminalLine('output', `→ Download: ${link}`);
      addTerminalLine('output', `→ Expires: ${new Date(data.expire_at).toLocaleString()}`);

      setTestResult({ success: true, link, fileName: data.file_name, size: metaData?.fileSize, type: data.file_type, expires: data.expire_at, json: fullJson });
      toast.success("Upload successful!");
    } catch (err: any) {
      addTerminalLine('error', `✗ Error: ${err.message}`);
      setTestResult({ success: false, error: err.message });
    } finally {
      setIsTesting(false);
    }
  };

  const buildBrowserUrl = (url: string, shortId?: string, customName?: string) => {
    const params = new URLSearchParams();
    params.set("url", url);
    if (shortId) params.set("shortId", shortId);
    if (customName) params.set("customName", customName);
    return `${apiUrl}/upload-from-url?${params.toString()}`;
  };

  return (
    <div className="min-h-screen relative">
      <ParticleBackground />
      <div className="fixed top-4 left-4 z-[100]"><HamburgerMenu /></div>
      <div className="fixed top-4 right-4 z-[100] flex gap-2">
        <Button variant="outline" size="icon" onClick={() => navigate("/")} className="rounded-2xl bg-card/70 backdrop-blur-md border-border/60 hover:border-primary/40">
          <Home className="h-4 w-4" />
        </Button>
        <ThemeToggle />
      </div>

      <div className="container mx-auto px-4 py-20 sm:py-28 relative z-10 max-w-3xl">
        {/* Hero */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/8 border border-primary/15 text-xs font-medium text-primary mb-5">
            <Terminal className="w-3.5 h-3.5" />
            Developer API
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4 tracking-tight">
            Upload & Share<br />
            <span className="gradient-text">via API</span>
          </h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
            Two endpoints. No auth required. Upload files or pass URLs — we handle the rest.
          </p>
        </div>

        {/* Stats bar */}
        <div className="flex items-center justify-center gap-6 sm:gap-10 mb-14">
          {[
            { label: "Max size", value: "2 GB", icon: Zap },
            { label: "Auth", value: "None", icon: Globe },
            { label: ">50MB TTL", value: "1 hour", icon: Terminal },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary/8 border border-primary/15 flex items-center justify-center">
                <s.icon className="h-3.5 w-3.5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground leading-none">{s.value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Base URL */}
        <div className="rounded-2xl bg-card/80 backdrop-blur-sm border border-border/60 p-5 mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Base URL</span>
            </div>
            <CopyBtn id="base-url" text={apiUrl} label="Copy" />
          </div>
          <div className="font-mono text-sm text-primary bg-muted/30 rounded-xl px-4 py-3 border border-border/40 break-all">
            {apiUrl}
          </div>
        </div>

        <div className="space-y-6">

          {/* ─── REQUEST TERMINAL ─── */}
          <div className="rounded-2xl overflow-hidden border border-primary/20 shadow-[0_0_40px_-12px_hsl(var(--primary)/0.15)]">
            {/* Terminal header */}
            <div className="bg-card/90 backdrop-blur-sm border-b border-border/60 px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-destructive/60" />
                  <span className="w-3 h-3 rounded-full bg-accent/60" />
                  <span className="w-3 h-3 rounded-full bg-success/60" />
                </div>
                <span className="text-xs font-medium text-muted-foreground font-mono">api-terminal</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">Live</span>
                <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              </div>
            </div>

            {/* Terminal body */}
            <div className="bg-[hsl(var(--background))] p-5 space-y-4">
              {/* Input fields */}
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                    File URL <span className="text-destructive">*</span>
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 text-xs font-mono">$</span>
                      <Input
                        placeholder="https://example.com/sample.pdf"
                        value={testUrl}
                        onChange={(e) => setTestUrl(e.target.value)}
                        className="pl-7 bg-muted/20 border-border/40 font-mono text-xs h-10 rounded-xl"
                        onKeyDown={(e) => e.key === 'Enter' && handleTestUpload()}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                    Custom Name <span className="text-muted-foreground/50">(optional)</span>
                  </label>
                  <Input
                    placeholder="my-file"
                    value={testCustomName}
                    onChange={(e) => setTestCustomName(e.target.value)}
                    className="bg-muted/20 border-border/40 font-mono text-xs h-10 rounded-xl"
                  />
                </div>

                {/* Live request URL */}
                {testUrl.trim() && (
                  <div className="rounded-xl bg-muted/20 border border-border/40 p-3 space-y-2 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Request URL</span>
                      <div className="flex gap-1.5">
                        <CopyBtn id="live-req-url" text={buildBrowserUrl(testUrl.trim(), testCustomName.trim() || `test-${Date.now()}`, testCustomName.trim() || undefined)} label="Copy" />
                        <button
                          onClick={() => window.open(buildBrowserUrl(testUrl.trim(), testCustomName.trim() || `test-${Date.now()}`, testCustomName.trim() || undefined), '_blank')}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium bg-primary/10 text-primary hover:bg-primary/15 transition-colors"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Open
                        </button>
                      </div>
                    </div>
                    <code className="text-[10px] font-mono text-foreground/60 break-all block leading-relaxed">
                      {buildBrowserUrl(testUrl.trim(), testCustomName.trim() || "<auto>", testCustomName.trim() || undefined)}
                    </code>
                  </div>
                )}

                <Button
                  onClick={handleTestUpload}
                  disabled={isTesting || !testUrl.trim()}
                  className="w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 h-11 font-medium"
                >
                  {isTesting ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Executing...</>
                  ) : (
                    <><Send className="h-4 w-4 mr-2" /> Send Request <CornerDownLeft className="h-3 w-3 ml-2 opacity-40" /></>
                  )}
                </Button>
              </div>

              {/* Terminal output */}
              {terminalHistory.length > 0 && (
                <div ref={terminalRef} className="rounded-xl bg-muted/15 border border-border/30 p-4 max-h-52 overflow-y-auto font-mono text-xs space-y-1">
                  {terminalHistory.map((line, i) => (
                    <div key={i} className={`leading-relaxed ${
                      line.type === 'input' ? 'text-primary/80' :
                      line.type === 'output' ? 'text-success/80' :
                      line.type === 'error' ? 'text-destructive/80' :
                      'text-muted-foreground/70'
                    }`}>
                      {line.type === 'input' && <span className="text-primary/40 mr-1">›</span>}
                      {line.type === 'output' && <span className="text-success/40 mr-1">›</span>}
                      {line.type === 'error' && <span className="text-destructive/40 mr-1">!</span>}
                      {line.type === 'info' && <span className="text-muted-foreground/30 mr-1">#</span>}
                      {line.text}
                    </div>
                  ))}
                  {isTesting && (
                    <div className="text-muted-foreground/50 flex items-center gap-1.5">
                      <Loader2 className="h-3 w-3 animate-spin" /> Processing...
                    </div>
                  )}
                </div>
              )}

              {/* Result card */}
              {testResult && testResult.success && (
                <div className="rounded-xl bg-card/60 border border-success/20 p-4 space-y-3 animate-fade-in">
                  <div className="flex items-center gap-2 text-success text-xs font-semibold">
                    <Check className="h-3.5 w-3.5" /> Upload Complete
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    <span className="text-muted-foreground">File</span>
                    <span className="text-foreground font-medium truncate">{testResult.fileName}</span>
                    {testResult.size && <>
                      <span className="text-muted-foreground">Size</span>
                      <span className="text-foreground font-medium">{(testResult.size / 1024 / 1024).toFixed(2)} MB</span>
                    </>}
                    <span className="text-muted-foreground">Type</span>
                    <span className="text-foreground font-medium">{testResult.type}</span>
                    <span className="text-muted-foreground">Expires</span>
                    <span className="text-foreground font-medium">{new Date(testResult.expires).toLocaleString()}</span>
                  </div>

                  {/* Download link */}
                  <div className="flex items-center gap-2 bg-muted/20 rounded-lg p-2.5 border border-border/30">
                    <a href={testResult.link} target="_blank" rel="noopener noreferrer" className="text-primary text-[11px] font-mono break-all flex-1 hover:underline">
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
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium bg-primary/8 text-primary hover:bg-primary/15 transition-colors border border-primary/10"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View JSON in Browser
                    </button>
                    <CopyBtn id="json-full" text={JSON.stringify(testResult.json, null, 2)} label="Copy JSON" />
                  </div>

                  {/* Raw JSON */}
                  <details className="group">
                    <summary className="text-[10px] font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors flex items-center gap-1">
                      <ChevronRight className="h-3 w-3 transition-transform group-open:rotate-90" />
                      Raw JSON Response
                    </summary>
                    <div className="relative mt-2">
                      <div className="absolute top-2 right-2">
                        <CopyBtn id="raw-json-copy" text={JSON.stringify(testResult.json, null, 2)} label="Copy" />
                      </div>
                      <pre className="bg-muted/20 rounded-xl p-4 pr-20 text-[10px] font-mono overflow-x-auto whitespace-pre-wrap max-h-60 overflow-y-auto text-foreground/70 border border-border/30 leading-relaxed">
                        {JSON.stringify(testResult.json, null, 2)}
                      </pre>
                    </div>
                  </details>
                </div>
              )}

              {testResult && !testResult.success && (
                <div className="rounded-xl bg-destructive/5 border border-destructive/20 p-4 space-y-2 animate-fade-in">
                  <p className="font-semibold text-destructive text-xs flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" /> Request Failed
                  </p>
                  <p className="text-[11px] text-muted-foreground font-mono">{testResult.error}</p>
                  <button
                    onClick={() => {
                      const blob = new Blob([JSON.stringify({ success: false, error: testResult.error }, null, 2)], { type: "application/json" });
                      window.open(URL.createObjectURL(blob), "_blank");
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium bg-destructive/10 text-destructive hover:bg-destructive/15 transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                    View Error JSON
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ─── ENDPOINTS ─── */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 px-1">
              <Code className="h-4 w-4 text-primary" /> Endpoints
            </h2>

            {/* File Upload */}
            <Endpoint
              method="POST"
              path="/api/upload"
              title="Upload a File"
              desc="Send a file from your device using multipart/form-data."
            >
              <CodeBlock id="opt1" code={`curl -X POST ${baseUrl}/api/upload \\
  -F "file=@./photo.jpg" \\
  -F "expiration=24h" \\
  -F "customName=my-photo"`} onCopy={copy} copied={copiedSection} />
              <ParamTable params={[
                { name: "file", required: true, desc: "The file to upload" },
                { name: "expiration", required: false, desc: '"1h", "24h", "7d", or "never"' },
                { name: "customName", required: false, desc: "Custom name for the download link" },
              ]} />
            </Endpoint>

            {/* Upload from URL */}
            <Endpoint
              method="POST"
              path="/upload-from-url"
              title="Upload from URL"
              desc="Give us a link — we download and host it for you."
            >
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground bg-muted/20 rounded-lg p-2.5 border border-border/30 font-mono">
                <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold">URL</span>
                <ArrowRight className="h-2.5 w-2.5" />
                <span>Download</span>
                <ArrowRight className="h-2.5 w-2.5" />
                <span>Store</span>
                <ArrowRight className="h-2.5 w-2.5" />
                <span className="px-1.5 py-0.5 rounded bg-success/10 text-success font-semibold">Link</span>
              </div>

              <CodeBlock id="opt2" code={`curl -X POST ${apiUrl}/upload-from-url \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://example.com/video.mp4",
    "shortId": "MyFile123",
    "customName": "cool-video",
    "expireAt": "2026-04-01T00:00:00Z"
  }'`} onCopy={copy} copied={copiedSection} />

              {/* Browser URL */}
              <div className="rounded-lg bg-muted/20 border border-border/30 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Browser Test URL</span>
                  <CopyBtn id="browser-url" text={buildBrowserUrl("https://example.com/video.mp4", "MyFile123", "cool-video")} label="Copy" />
                </div>
                <code className="text-[10px] font-mono text-foreground/50 break-all block leading-relaxed">
                  {buildBrowserUrl("https://example.com/video.mp4", "MyFile123", "cool-video")}
                </code>
              </div>

              <ParamTable params={[
                { name: "url", required: true, desc: "Direct link to a downloadable file" },
                { name: "shortId", required: true, desc: "Unique ID for this upload" },
                { name: "customName", required: false, desc: "Custom name for download link" },
                { name: "expireAt", required: false, desc: "Expiry date (ISO format)" },
              ]} />
            </Endpoint>

            {/* Check File */}
            <Endpoint
              method="POST"
              path="/check-url-file"
              title="Check File Info"
              desc="Get file metadata before uploading."
            >
              <CodeBlock id="check" code={`curl -X POST ${apiUrl}/check-url-file \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://example.com/video.mp4"}'`} onCopy={copy} copied={copiedSection} />
              <pre className="bg-muted/20 rounded-xl p-3 text-[10px] font-mono text-foreground/60 border border-border/30">{`{
  "fileSize": 479001600,
  "contentType": "video/mp4",
  "fileName": "video.mp4"
}`}</pre>
            </Endpoint>

            {/* Accessing Files */}
            <Endpoint
              method="GET"
              path="/:id"
              title="Access Files"
              desc="Share the link — anyone can view or download."
            >
              <div className="rounded-lg bg-muted/20 border border-border/30 p-3 space-y-1 font-mono text-xs">
                <p>{baseUrl}/<span className="text-primary font-semibold">MyFile123</span></p>
                <p>{baseUrl}/<span className="text-primary font-semibold">cool-video</span></p>
              </div>
            </Endpoint>
          </div>

          {/* ─── CODE EXAMPLES ─── */}
          <div className="rounded-2xl bg-card/80 backdrop-blur-sm border border-border/60 p-5 sm:p-6 space-y-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Code className="h-4 w-4 text-primary" /> Code Examples
            </h2>

            <Tabs defaultValue="js" className="space-y-3">
              <TabsList className="bg-muted/30 border border-border/40 p-1 rounded-xl">
                <TabsTrigger value="js" className="text-[10px] rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">JavaScript</TabsTrigger>
                <TabsTrigger value="python" className="text-[10px] rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">Python</TabsTrigger>
                <TabsTrigger value="node" className="text-[10px] rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">Node.js</TabsTrigger>
                <TabsTrigger value="curl" className="text-[10px] rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">cURL</TabsTrigger>
              </TabsList>

              <TabsContent value="js" className="space-y-3">
                <ExampleLabel>Upload from URL</ExampleLabel>
                <CodeBlock id="js-url" code={`const res = await fetch("${functionsUrl}/upload-from-url", {
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

              <TabsContent value="python" className="space-y-3">
                <ExampleLabel>Upload from URL</ExampleLabel>
                <CodeBlock id="py-url" code={`import requests

res = requests.post(
    "${functionsUrl}/upload-from-url",
    json={
        "url": "https://example.com/video.mp4",
        "shortId": "MyVid123",
        "customName": "cool-video",
    },
)
data = res.json()
print("Download:", "${baseUrl}/" + (data.get("custom_name") or data["short_id"]))`} onCopy={copy} copied={copiedSection} />
              </TabsContent>

              <TabsContent value="node" className="space-y-3">
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

              <TabsContent value="curl" className="space-y-3">
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
          </div>
        </div>

        <footer className="mt-20 text-center">
          <p className="text-[10px] text-muted-foreground/50 font-mono">Nãbēēs Uploader API • v2.0</p>
        </footer>
      </div>
    </div>
  );
};

/* ── Helper Components ── */

const Endpoint = ({ method, path, title, desc, children }: { method: string; path: string; title: string; desc: string; children: React.ReactNode }) => (
  <div className="rounded-2xl bg-card/80 backdrop-blur-sm border border-border/60 overflow-hidden">
    <div className="px-5 py-4 border-b border-border/40 flex items-center gap-3">
      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold font-mono ${
        method === 'GET' ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'
      }`}>{method}</span>
      <code className="text-xs font-mono text-foreground/70">{path}</code>
      <span className="text-xs text-muted-foreground ml-auto hidden sm:block">{title}</span>
    </div>
    <div className="p-5 space-y-3">
      <p className="text-xs text-muted-foreground">{desc}</p>
      {children}
    </div>
  </div>
);

const CodeBlock = ({ id, code, onCopy, copied }: { id: string; code: string; onCopy: (t: string, id: string) => void; copied: string | null }) => (
  <div className="relative group">
    <div className="absolute top-2.5 right-2.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
      <button
        onClick={() => onCopy(code, id)}
        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium bg-card/90 backdrop-blur-sm border border-border/40 text-muted-foreground hover:text-foreground transition-colors"
      >
        {copied === id ? <Check className="h-2.5 w-2.5 text-success" /> : <Copy className="h-2.5 w-2.5" />}
        {copied === id ? "Copied" : "Copy"}
      </button>
    </div>
    <pre className="bg-muted/20 border border-border/30 rounded-xl p-4 pr-20 text-[11px] font-mono overflow-x-auto whitespace-pre-wrap text-foreground/65 leading-relaxed">{code}</pre>
  </div>
);

const ExampleLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">{children}</p>
);

const ParamTable = ({ params }: { params: { name: string; required: boolean; desc: string }[] }) => (
  <div className="rounded-xl border border-border/30 overflow-hidden text-[11px]">
    <div className="grid grid-cols-[90px_40px_1fr] bg-muted/20 px-3 py-2 font-semibold text-muted-foreground/70 text-[10px] uppercase tracking-wider">
      <span>Param</span><span>Req</span><span>Description</span>
    </div>
    {params.map((p) => (
      <div key={p.name} className="grid grid-cols-[90px_40px_1fr] px-3 py-2 border-t border-border/20">
        <span className="font-mono text-primary/80 font-medium">{p.name}</span>
        <span className="text-muted-foreground">{p.required ? "✓" : "—"}</span>
        <span className="text-muted-foreground/80">{p.desc}</span>
      </div>
    ))}
  </div>
);

export default ApiDocs;
