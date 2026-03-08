import { useState } from "react";
import ParticleBackground from "@/components/ParticleBackground";
import ThemeToggle from "@/components/ThemeToggle";
import HamburgerMenu from "@/components/HamburgerMenu";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code, Copy, Check, Home, Play, Loader2, Upload, Link, Download, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";

const ApiDocs = () => {
  const navigate = useNavigate();
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [testUrl, setTestUrl] = useState("");
  const [testCustomName, setTestCustomName] = useState("");
  const [testResult, setTestResult] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const CopyBtn = ({ section, text }: { section: string; text: string }) => (
    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(text, section)}>
      {copiedSection === section ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
    </Button>
  );

  const baseUrl = window.location.origin;
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  const handleTestUpload = async () => {
    if (!testUrl.trim()) {
      toast.error("Please enter a URL");
      return;
    }
    setIsTesting(true);
    setTestResult(null);
    try {
      // Step 1: Check file metadata
      const { data: metaData, error: metaError } = await supabase.functions.invoke("check-url-file", {
        body: { url: testUrl.trim() },
      });
      if (metaError) throw new Error(metaError.message || "Failed to check URL");
      if (metaData?.error) throw new Error(metaData.error);

      // Step 2: Generate short ID
      const { data: shortId, error: idError } = await supabase.rpc("generate_short_id");
      if (idError) throw idError;

      // Step 3: Upload from URL
      const expireAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1h for test
      const { data, error } = await supabase.functions.invoke("upload-from-url", {
        body: {
          url: testUrl.trim(),
          shortId,
          expireAt,
          customName: testCustomName.trim() || null,
        },
      });
      if (error) throw new Error(error.message || "Upload failed");
      if (data?.error) throw new Error(data.error);

      const identifier = data.custom_name || data.short_id;
      setTestResult({
        success: true,
        data: {
          ...data,
          url: `${baseUrl}/${identifier}`,
          metadata: metaData,
        },
      });
      toast.success("Test upload successful!");
    } catch (err: any) {
      setTestResult({ success: false, error: err.message });
      toast.error(err.message);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <ParticleBackground />

      <div className="fixed top-4 left-4 z-[100] pointer-events-auto">
        <HamburgerMenu />
      </div>
      <div className="fixed top-4 right-4 z-[100] pointer-events-auto flex gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate("/")}
          className="glass-strong border border-primary/20 pointer-events-auto"
        >
          <Home className="h-4 w-4" />
        </Button>
        <ThemeToggle />
      </div>

      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 glass-panel px-6 py-3 rounded-full mb-6">
              <Code className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">API Documentation</span>
            </div>
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              File Upload API
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Upload files directly or from any URL. Share with expiring links.
            </p>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 glass-panel">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="upload">File Upload</TabsTrigger>
              <TabsTrigger value="url-upload">URL Upload</TabsTrigger>
              <TabsTrigger value="download">Download</TabsTrigger>
              <TabsTrigger value="test">🧪 Test</TabsTrigger>
            </TabsList>

            {/* OVERVIEW */}
            <TabsContent value="overview" className="space-y-6">
              <Card className="glass-panel border-primary/20">
                <CardHeader>
                  <CardTitle>Getting Started</CardTitle>
                  <CardDescription>How the API works</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="flex flex-col items-center text-center p-4 rounded-lg bg-muted/50">
                      <Upload className="h-8 w-8 text-primary mb-2" />
                      <p className="font-medium text-sm">1. Upload</p>
                      <p className="text-xs text-muted-foreground mt-1">Send a file or paste a URL</p>
                    </div>
                    <div className="flex flex-col items-center text-center p-4 rounded-lg bg-muted/50">
                      <Link className="h-8 w-8 text-primary mb-2" />
                      <p className="font-medium text-sm">2. Get Link</p>
                      <p className="text-xs text-muted-foreground mt-1">Receive a short shareable URL</p>
                    </div>
                    <div className="flex flex-col items-center text-center p-4 rounded-lg bg-muted/50">
                      <Download className="h-8 w-8 text-primary mb-2" />
                      <p className="font-medium text-sm">3. Share</p>
                      <p className="text-xs text-muted-foreground mt-1">Anyone can download via the link</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">Base URL</p>
                    <code className="block p-3 bg-muted rounded-lg text-sm">{baseUrl}</code>
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      <strong>Size limits:</strong> Files up to 2GB are supported. Files over 50MB automatically expire after 1 hour.
                      No authentication required.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>

            {/* FILE UPLOAD */}
            <TabsContent value="upload" className="space-y-6">
              <Card className="glass-panel border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" /> Direct File Upload
                  </CardTitle>
                  <CardDescription>Upload a file from your device using multipart form data</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium">Endpoint</p>
                      <CopyBtn section="file-endpoint" text={`POST ${baseUrl}/api/upload`} />
                    </div>
                    <code className="block p-3 bg-muted rounded-lg text-sm">POST /api/upload</code>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">Request Body (multipart/form-data)</p>
                    <div className="bg-muted rounded-lg p-3 space-y-2 text-sm">
                      <div><span className="text-primary font-mono">file</span> <span className="text-muted-foreground">(required)</span> — The file to upload</div>
                      <div><span className="text-primary font-mono">customName</span> <span className="text-muted-foreground">(optional)</span> — Custom slug for the download URL</div>
                      <div><span className="text-primary font-mono">expiration</span> <span className="text-muted-foreground">(optional)</span> — <code className="text-xs">"1h"</code>, <code className="text-xs">"24h"</code>, <code className="text-xs">"7d"</code>, or <code className="text-xs">"never"</code></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium">cURL Example</p>
                      <CopyBtn section="file-curl" text={`curl -X POST ${baseUrl}/api/upload \\\n  -F "file=@/path/to/file.pdf" \\\n  -F "customName=my-doc" \\\n  -F "expiration=24h"`} />
                    </div>
                    <pre className="bg-muted rounded-lg p-3 text-xs overflow-x-auto">
{`curl -X POST ${baseUrl}/api/upload \\
  -F "file=@/path/to/file.pdf" \\
  -F "customName=my-doc" \\
  -F "expiration=24h"`}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* URL UPLOAD */}
            <TabsContent value="url-upload" className="space-y-6">
              <Card className="glass-panel border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Link className="h-5 w-5" /> Upload from URL
                  </CardTitle>
                  <CardDescription>
                    Provide a direct file URL and we'll download & host it for you. Two-step process.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Step 1 */}
                  <div className="border border-primary/20 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">Step 1</span>
                      <p className="text-sm font-medium">Check URL metadata (optional but recommended)</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Verify the file exists and check its size before uploading. This is optional — you can skip straight to Step 2.
                    </p>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium">Endpoint</p>
                        <CopyBtn section="check-endpoint" text={`POST ${supabaseUrl}/functions/v1/check-url-file`} />
                      </div>
                      <code className="block p-3 bg-muted rounded-lg text-xs break-all">
                        POST {supabaseUrl}/functions/v1/check-url-file
                      </code>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">JSON Body</p>
                      <pre className="bg-muted rounded-lg p-3 text-xs overflow-x-auto">{`{ "url": "https://example.com/video.mp4" }`}</pre>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">Response</p>
                      <pre className="bg-muted rounded-lg p-3 text-xs overflow-x-auto">{`{
  "fileSize": 479001600,
  "contentType": "video/mp4",
  "fileName": "video.mp4"
}`}</pre>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="border border-primary/20 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">Step 2</span>
                      <p className="text-sm font-medium">Upload the file from URL</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Provide the URL along with a unique short ID. The server fetches the file and stores it.
                    </p>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium">Endpoint</p>
                        <CopyBtn section="url-endpoint" text={`POST ${supabaseUrl}/functions/v1/upload-from-url`} />
                      </div>
                      <code className="block p-3 bg-muted rounded-lg text-xs break-all">
                        POST {supabaseUrl}/functions/v1/upload-from-url
                      </code>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">JSON Body</p>
                      <pre className="bg-muted rounded-lg p-3 text-xs overflow-x-auto">{`{
  "url": "https://example.com/video.mp4",
  "shortId": "AbC123",
  "expireAt": "2025-01-01T00:00:00Z",
  "customName": "my-video"
}`}</pre>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-2">Parameters</p>
                      <div className="bg-muted rounded-lg p-3 space-y-2 text-sm">
                        <div><span className="text-primary font-mono">url</span> <span className="text-muted-foreground">(required)</span> — Direct link to a downloadable file</div>
                        <div><span className="text-primary font-mono">shortId</span> <span className="text-muted-foreground">(required)</span> — A unique ID (use our generate_short_id or your own)</div>
                        <div><span className="text-primary font-mono">expireAt</span> <span className="text-muted-foreground">(optional)</span> — ISO 8601 expiry timestamp</div>
                        <div><span className="text-primary font-mono">customName</span> <span className="text-muted-foreground">(optional)</span> — Custom slug for the download URL</div>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">Response</p>
                      <pre className="bg-muted rounded-lg p-3 text-xs overflow-x-auto">{`{
  "id": "uuid",
  "short_id": "AbC123",
  "file_name": "video.mp4",
  "file_size": 479001600,
  "file_type": "video/mp4",
  "storage_path": "AbC123.mp4",
  "expire_at": "2025-01-01T00:00:00Z",
  "custom_name": "my-video",
  "created_at": "2025-03-08T12:00:00Z"
}`}</pre>
                    </div>
                  </div>

                  {/* Full cURL example */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium">Full cURL Example</p>
                      <CopyBtn section="url-curl" text={`# Step 1: Check metadata\ncurl -X POST ${supabaseUrl}/functions/v1/check-url-file \\\n  -H "Content-Type: application/json" \\\n  -d '{"url": "https://example.com/file.zip"}'\n\n# Step 2: Upload\ncurl -X POST ${supabaseUrl}/functions/v1/upload-from-url \\\n  -H "Content-Type: application/json" \\\n  -d '{"url": "https://example.com/file.zip", "shortId": "MyId123", "expireAt": "2025-01-01T00:00:00Z"}'`} />
                    </div>
                    <pre className="bg-muted rounded-lg p-3 text-xs overflow-x-auto">
{`# Step 1: Check metadata
curl -X POST ${supabaseUrl}/functions/v1/check-url-file \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://example.com/file.zip"}'

# Step 2: Upload from URL
curl -X POST ${supabaseUrl}/functions/v1/upload-from-url \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://example.com/file.zip", "shortId": "MyId123"}'`}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* DOWNLOAD */}
            <TabsContent value="download" className="space-y-6">
              <Card className="glass-panel border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5" /> Download / View File
                  </CardTitle>
                  <CardDescription>Access uploaded files via their short ID or custom name</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2">URL Format</p>
                    <div className="space-y-2">
                      <code className="block p-3 bg-muted rounded-lg text-sm">{baseUrl}/<span className="text-primary">{'<short_id>'}</span></code>
                      <code className="block p-3 bg-muted rounded-lg text-sm">{baseUrl}/<span className="text-primary">{'<custom_name>'}</span></code>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">Examples</p>
                    <div className="space-y-2">
                      <code className="block p-3 bg-muted rounded-lg text-sm">{baseUrl}/AbC123</code>
                      <code className="block p-3 bg-muted rounded-lg text-sm">{baseUrl}/my-video</code>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Opens a download page with file info and a download button. If the file has expired, an error is shown.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TEST ENDPOINT */}
            <TabsContent value="test" className="space-y-6">
              <Card className="glass-panel border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="h-5 w-5" /> Test URL Upload
                  </CardTitle>
                  <CardDescription>
                    Try the URL upload endpoint right here. Paste a direct file link and hit upload.
                    Test uploads expire after 1 hour.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">File URL</label>
                    <Input
                      placeholder="https://example.com/sample.pdf"
                      value={testUrl}
                      onChange={(e) => setTestUrl(e.target.value)}
                      className="bg-muted/50"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Custom Name <span className="text-muted-foreground">(optional)</span></label>
                    <Input
                      placeholder="my-test-file"
                      value={testCustomName}
                      onChange={(e) => setTestCustomName(e.target.value)}
                      className="bg-muted/50"
                    />
                  </div>
                  <Button onClick={handleTestUpload} disabled={isTesting} className="w-full">
                    {isTesting ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading...</>
                    ) : (
                      <><Play className="h-4 w-4 mr-2" /> Run Test Upload</>
                    )}
                  </Button>

                  {testResult && (
                    <div className={`rounded-lg p-4 text-sm ${testResult.success ? "bg-green-500/10 border border-green-500/30" : "bg-destructive/10 border border-destructive/30"}`}>
                      {testResult.success ? (
                        <div className="space-y-2">
                          <p className="font-medium text-green-600 dark:text-green-400">✅ Upload Successful</p>
                          <div className="space-y-1 text-xs">
                            <p><span className="text-muted-foreground">File:</span> {testResult.data.file_name}</p>
                            <p><span className="text-muted-foreground">Size:</span> {testResult.data.metadata?.fileSize ? `${(testResult.data.metadata.fileSize / 1024 / 1024).toFixed(2)} MB` : "Unknown"}</p>
                            <p><span className="text-muted-foreground">Type:</span> {testResult.data.file_type}</p>
                            <p><span className="text-muted-foreground">Expires:</span> {testResult.data.expire_at ? new Date(testResult.data.expire_at).toLocaleString() : "Never"}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-muted-foreground">Download URL:</span>
                              <a href={testResult.data.url} target="_blank" rel="noopener noreferrer" className="text-primary underline break-all">
                                {testResult.data.url}
                              </a>
                              <CopyBtn section="test-url" text={testResult.data.url} />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p className="font-medium text-destructive">❌ Upload Failed</p>
                          <p className="text-xs mt-1 text-muted-foreground">{testResult.error}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ApiDocs;
