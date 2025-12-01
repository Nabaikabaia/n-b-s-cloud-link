import { useState } from "react";
import ParticleBackground from "@/components/ParticleBackground";
import ThemeToggle from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code, Copy, Check, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const ApiDocs = () => {
  const navigate = useNavigate();
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const baseUrl = window.location.origin;

  return (
    <div className="min-h-screen relative overflow-hidden">
      <ParticleBackground />
      
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate("/")}
          className="glass-panel"
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
              Simple REST API for uploading and sharing files with expiration support
            </p>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 glass-panel">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="upload">Upload</TabsTrigger>
              <TabsTrigger value="download">Download</TabsTrigger>
              <TabsTrigger value="examples">Examples</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <Card className="glass-panel border-primary/20">
                <CardHeader>
                  <CardTitle>Getting Started</CardTitle>
                  <CardDescription>Base URL and Authentication</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Base URL</p>
                    <code className="block p-3 bg-muted rounded-lg text-sm">
                      {baseUrl}
                    </code>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">Authentication</p>
                    <p className="text-sm text-muted-foreground">
                      Currently, no authentication is required for public uploads.
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">Rate Limits</p>
                    <p className="text-sm text-muted-foreground">
                      Standard rate limits apply. Please be respectful with API usage.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="upload" className="space-y-6">
              <Card className="glass-panel border-primary/20">
                <CardHeader>
                  <CardTitle>Upload File</CardTitle>
                  <CardDescription>POST request to upload a file</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium">Endpoint</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(`${baseUrl}/api/upload`, "endpoint")}
                      >
                        {copiedSection === "endpoint" ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <code className="block p-3 bg-muted rounded-lg text-sm">
                      POST /api/upload
                    </code>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">Request Body (multipart/form-data)</p>
                    <div className="bg-muted rounded-lg p-3 space-y-2 text-sm">
                      <div><span className="text-primary">file</span>: File (required) - The file to upload</div>
                      <div><span className="text-primary">customName</span>: string (optional) - Custom name for the file</div>
                      <div><span className="text-primary">expiration</span>: string (optional) - Expiration time: "1h", "24h", "7d", or "never"</div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium">Example Response</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(`{
  "success": true,
  "upload": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "short_id": "ABC123",
    "file_name": "document.pdf",
    "custom_name": "My Document",
    "file_type": "application/pdf",
    "file_size": 1024000,
    "storage_path": "uploads/abc123.pdf",
    "download_count": 0,
    "expire_at": "2024-12-31T23:59:59Z",
    "created_at": "2024-12-01T12:00:00Z"
  },
  "url": "${baseUrl}/ABC123"
}`, "upload-response")}
                      >
                        {copiedSection === "upload-response" ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <pre className="bg-muted rounded-lg p-3 text-xs overflow-x-auto">
{`{
  "success": true,
  "upload": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "short_id": "ABC123",
    "file_name": "document.pdf",
    "custom_name": "My Document",
    "file_type": "application/pdf",
    "file_size": 1024000,
    "storage_path": "uploads/abc123.pdf",
    "download_count": 0,
    "expire_at": "2024-12-31T23:59:59Z",
    "created_at": "2024-12-01T12:00:00Z"
  },
  "url": "${baseUrl}/ABC123"
}`}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="download" className="space-y-6">
              <Card className="glass-panel border-primary/20">
                <CardHeader>
                  <CardTitle>Download File</CardTitle>
                  <CardDescription>GET request to download a file</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium">Endpoint</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(`${baseUrl}/:identifier`, "download-endpoint")}
                      >
                        {copiedSection === "download-endpoint" ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <code className="block p-3 bg-muted rounded-lg text-sm">
                      GET /:identifier
                    </code>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">URL Parameters</p>
                    <div className="bg-muted rounded-lg p-3 space-y-2 text-sm">
                      <div><span className="text-primary">identifier</span>: string - The short_id or custom_name of the file</div>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">Example URLs</p>
                    <div className="space-y-2">
                      <code className="block p-3 bg-muted rounded-lg text-sm">
                        {baseUrl}/ABC123
                      </code>
                      <code className="block p-3 bg-muted rounded-lg text-sm">
                        {baseUrl}/my-custom-name
                      </code>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">Response</p>
                    <p className="text-sm text-muted-foreground">
                      Returns a web page with file information and a download button. The download will start automatically when the button is clicked.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="examples" className="space-y-6">
              <Card className="glass-panel border-primary/20">
                <CardHeader>
                  <CardTitle>Code Examples</CardTitle>
                  <CardDescription>Integration examples in different languages</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium">JavaScript (Fetch API)</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(`const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('customName', 'My Document');
formData.append('expiration', '24h');

const response = await fetch('${baseUrl}/api/upload', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log('File URL:', result.url);`, "js-example")}
                      >
                        {copiedSection === "js-example" ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <pre className="bg-muted rounded-lg p-3 text-xs overflow-x-auto">
{`const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('customName', 'My Document');
formData.append('expiration', '24h');

const response = await fetch('${baseUrl}/api/upload', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log('File URL:', result.url);`}
                    </pre>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium">cURL</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(`curl -X POST ${baseUrl}/api/upload \\
  -F "file=@/path/to/file.pdf" \\
  -F "customName=My Document" \\
  -F "expiration=24h"`, "curl-example")}
                      >
                        {copiedSection === "curl-example" ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <pre className="bg-muted rounded-lg p-3 text-xs overflow-x-auto">
{`curl -X POST ${baseUrl}/api/upload \\
  -F "file=@/path/to/file.pdf" \\
  -F "customName=My Document" \\
  -F "expiration=24h"`}
                    </pre>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium">Python (requests)</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(`import requests

files = {'file': open('document.pdf', 'rb')}
data = {
    'customName': 'My Document',
    'expiration': '24h'
}

response = requests.post('${baseUrl}/api/upload', 
                        files=files, 
                        data=data)

result = response.json()
print('File URL:', result['url'])`, "python-example")}
                      >
                        {copiedSection === "python-example" ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <pre className="bg-muted rounded-lg p-3 text-xs overflow-x-auto">
{`import requests

files = {'file': open('document.pdf', 'rb')}
data = {
    'customName': 'My Document',
    'expiration': '24h'
}

response = requests.post('${baseUrl}/api/upload', 
                        files=files, 
                        data=data)

result = response.json()
print('File URL:', result['url'])`}
                    </pre>
                  </div>
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
