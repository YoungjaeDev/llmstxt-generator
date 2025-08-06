"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { CN_SMOOTH_SHADOW } from "./constants";
import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Credenza,
  CredenzaContent,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaDescription,
  CredenzaBody,
  CredenzaFooter,
  CredenzaClose,
} from "@/components/ui/credenza";
import { CircleHelp, ExternalLinkIcon, Loader2 } from "lucide-react";
import { dataMock } from "./data-mock";
import { toast } from "@/hooks/use-toast";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@radix-ui/react-popover";

export default function Page() {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const prevIsModalOpen = usePrevious(isModalOpen);
  const [firecrawlKey, setFirecrawlKey] = React.useState("");
  const [openaiKey, setOpenaiKey] = React.useState("");
  
  // Check if environment variables are available (for display purposes)
  const [hasEnvKeys, setHasEnvKeys] = React.useState({ 
    firecrawl: false, 
    firecrawl_base_url: "https://api.firecrawl.dev/v1",
    openai: false 
  });
  const [envLoaded, setEnvLoaded] = React.useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = React.useState(false);

  // Configuration state
  const [config, setConfig] = React.useState({
    firecrawl_base_url: "",
    map_limit: 500,
    process_limit: -1,
    include_subdomains: false,
    use_sitemap: true,
    exclude_patterns: [] as string[],
    batch_size: 10,
    max_workers: 5,
    batch_delay: 1.0,
    content_limit: 4000,
    openai_model: "gpt-4.1-mini",
    openai_temperature: 0.3,
    openai_max_tokens: 100
  });

  const [url, setUrl] = React.useState("");

  const hasKey = firecrawlKey.length > 0;
  
  // Check environment variables on component mount
  React.useEffect(() => {
    const checkEnvKeys = async () => {
      try {
        const response = await fetch('/api/check-env');
        if (response.ok) {
          const data = await response.json();
          setHasEnvKeys(data);
          setEnvLoaded(true);
          // Set config base URL from environment if available
          if (data.firecrawl_base_url) {
            setConfig(prev => ({
              ...prev,
              firecrawl_base_url: data.firecrawl_base_url
            }));
          }
        }
              } catch (error) {
          console.log('Could not check environment variables');
          // Set default values if check fails
          setHasEnvKeys({ 
            firecrawl: false, 
            firecrawl_base_url: "https://api.firecrawl.dev/v1",
            openai: false 
          });
          setEnvLoaded(true);
        }
    };
    checkEnvKeys();
  }, []);

  const [loading, setLoading] = useState<boolean>(false);
  const [mapUrls, setMapUrls] = useState<string[]>([]);
  const [scrapingStatus, setScrapingStatus] = useState<string>("");
  const [apiCallStatus, setApiCallStatus] = useState<string>("");

  const [finalMessage, setFinalMessage] = useState<{
    fullMessage: string;
    message: string;
    isFull: boolean;
  } | null>(
    // Mocked data
    // {
    //   fullMessage: dataMock.fullApiMessage,
    //   message: dataMock.apiMessage,
    //   isFull: false,
    // }
    null
  );

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading && mapUrls.length > 0) {
      let index = 0;
      const messages = [
        (url: string) => `Scraping URL: ${url}`,
        (url: string) => `Extracting Title for URL: ${url}`,
        (url: string) => `Extracting Description for URL: ${url}`,
        (url: string) => `Adding URL to llms.txt: ${url}`,
      ];
      interval = setInterval(() => {
        const currentUrl = mapUrls[index];
        setScrapingStatus(messages[index % messages.length](currentUrl));
        index = (index + 1) % mapUrls.length;
      }, 750);
    } else {
      setScrapingStatus("");
    }
    return () => clearInterval(interval);
  }, [loading, mapUrls]);

  const callApi = React.useCallback(async () => {
    const formattedUrl = url.toLowerCase();

    setLoading(true);
    try {
      // Python 백엔드만 사용
      const response = await fetch("/api/service", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: formattedUrl,
          firecrawlApiKey: firecrawlKey,
          openaiApiKey: openaiKey,
          config: config
        }),
      });
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setFinalMessage({
        fullMessage: data.llmstxt,
        message: data.llmstxt,
        isFull: false,
      });
    } catch (error) {
      setFinalMessage(null);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong, please try again later",
      });
    } finally {
      setLoading(false);
    }
  }, [url, hasKey, firecrawlKey, openaiKey, config]);

  const handleSubmit = React.useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      let inferredUrl = url;
      if (!inferredUrl.startsWith("http") && !inferredUrl.startsWith("https")) {
        inferredUrl = `https://${inferredUrl}`;
      }

      if (!inferredUrl) {
        toast({
          title: "Error",
          description: "Please enter a URL",
        });
        return;
      }

      try {
        new URL(inferredUrl);
      } catch {
        toast({
          title: "Error", 
          description: "Please enter a valid URL",
        });
        return;
      }

      callApi();
    },
    [url,callApi]
  );

  const [
    retryWhenModalClosesWithFilledKey,
    setRetryWhenModalClosesWithFilledKey,
  ] = useState(false);
  React.useEffect(() => {
    if (
      prevIsModalOpen &&
      !isModalOpen &&
      hasKey &&
      retryWhenModalClosesWithFilledKey
    ) {
      setRetryWhenModalClosesWithFilledKey(false);
      callApi();
    }
  }, [prevIsModalOpen, isModalOpen, hasKey, retryWhenModalClosesWithFilledKey]);
  const retryWithApiKey = React.useCallback(() => {
    setIsModalOpen(true);
    setRetryWhenModalClosesWithFilledKey(true);
  }, []);

  const canSubmit = (!loading && !url) || loading;

  return (
    <PageContainer className="min-h-screen h-full flex items-center justify-center">
      <div className="w-full py-12 flex flex-col h-full justify-center items-center relative">
        <h1 className="text-center text-pretty text-3xl lg:text-5xl font-semibold font-mono tracking-tight relative">
          LLMs.txt generator<span className="absolute -top-3 -right-7 text-lg lg:text-2xl text-orange-500 animate-pulse">v2</span>
        </h1>
        <h2 className="text-center text-balance lg:text-lg mt-2">
          Generate consolidated text files from websites for LLM training and
          inference – Powered by{" "}
          <a href="https://firecrawl.dev" target="_blank" className={CN_LINK}>
            Firecrawl 🔥
          </a>
        </h2>

        <form
          onSubmit={handleSubmit}
          className={cn(
            CN_SMOOTH_SHADOW,
            "mt-6 w-full",
            "flex flex-col p-4 border-2 rounded-2xl focus-within:border-primary bg-card"
          )}
        >
          <Input
            placeholder="Enter a URL"
            className="!border-none focus-within:!ring-0 focus-within:!outline-none bg-transparent !shadow-none"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />

          {/* Action Bar */}
          <div className="w-full flex justify-between items-center space-y-6">
            {/* Left */}
            <div></div>

            {/* Right */}
            <div className="flex space-x-4">
              <Button className="w-24" disabled={canSubmit}>
                {!loading && <span>Generate</span>}
                {loading && <Loader2 className="size-4 animate-spin" />}
              </Button>
            </div>
          </div>
        </form>

                <div className="flex flex-col space-y-2 mt-2">
          <div className="flex space-x-4">
            <button
              onClick={() => {
                setIsModalOpen(true);
              }}
              className="text-sm text-primary hover:text-primary/80 transition-colors"
            >
              {hasEnvKeys.firecrawl ? 'Override Firecrawl API key' : 'Enter Firecrawl API key'}
            </button>
            <button
              onClick={() => {
                setIsConfigModalOpen(true);
              }}
              className="text-sm text-blue-600 hover:text-blue-500 transition-colors"
            >
              Configure Python Settings
            </button>
          </div>
          
          {/* Environment Variables Status */}
          {envLoaded && (
            <div className="text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded border">
              <div className="font-medium mb-1">Environment Status:</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-1">
                <span className={hasEnvKeys.firecrawl ? "text-green-600" : "text-red-500"}>
                  Firecrawl: {hasEnvKeys.firecrawl ? "✅" : "❌"}
                </span>
                <span className={hasEnvKeys.openai ? "text-green-600" : "text-red-500"}>
                  OpenAI: {hasEnvKeys.openai ? "✅" : "❌"}
                </span>
                <span className={hasEnvKeys.firecrawl_base_url !== "https://api.firecrawl.dev/v1" ? "text-blue-600" : "text-gray-500"}>
                  Custom URL: {hasEnvKeys.firecrawl_base_url !== "https://api.firecrawl.dev/v1" ? "✅" : "Default"}
                </span>
              </div>
              {(!hasEnvKeys.firecrawl || !hasEnvKeys.openai) && (
                <div className="mt-1 text-orange-600 font-medium">
                  ⚠️ Missing API keys - please configure them in settings or .env file
                </div>
              )}
            </div>
          )}
        </div>

        <div className="w-full overflow-hidden flex flex-col gap-2 mt-4">
          <div className="relative w-full">
            <div className="w-full h-80 border rounded-2xl p-4 text-sm font-mono">
              {(!finalMessage || loading) && <div className="flex flex-col w-full h-full items-center justify-center text-balance text-center">
                <div className="max-w-72">
                  {!loading && (
                    <>
                      <p>Please provide a URL to generate a llms.txt file.</p>
                      <br />
                      <p>
                        For a better experience, use an API key from{" "}
                        <a
                          href="https://firecrawl.dev"
                          className={CN_LINK}
                          target="_blank"
                        >
                          Firecrawl 🔥
                        </a>
                        .
                      </p>
                      <br />
                      <p>
                        You can also call llms.txt it via{" "}
                        <Popover>
                          <PopoverTrigger asChild>
                            <span className="inline-flex items-center gap-1.5 cursor-help">
                              API <CircleHelp className="size-3.5" />
                            </span>
                          </PopoverTrigger>
                          <PopoverContent className="w-96 p-4 bg-background">
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <p className="text-sm font-medium">
                                  Access llms.txt via API by going to:
                                </p>
                                <code className="text-xs block bg-muted/60 p-3 rounded-md">
                                  http://llmstxt.firecrawl.dev/{"{YOUR_URL}"}
                                </code>
                              </div>
                              <div className="space-y-2">
                                <p className="text-sm font-medium">
                                  For full results, add your Firecrawl API key:
                                </p>
                                <code className="text-xs block bg-muted/60 p-3 rounded-md">
                                  ?FIRECRAWL_API_KEY=YOUR_API_KEY
                                </code>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </p>
                    </>
                  )}
                  {loading && (
                    <>
                      <p>
                        {loading && !scrapingStatus && !apiCallStatus && <Loader2 className="size-4 animate-spin" />}
                        {loading && scrapingStatus && <>{scrapingStatus}</>}
                        {apiCallStatus && <>{apiCallStatus}</>}
                      </p>
                    </>
                  )}
                </div>
              </div>}

              {!loading && finalMessage && (
                <div className="whitespace-pre-wrap h-full w-full overflow-scroll custom-scrollbar">
                  {finalMessage.message}
                  {!hasKey && (
                    <div className="flex justify-center">
                      <div className="px-4 mt-8 mb-4">
                        For full results get a
                        <a
                          href="https://firecrawl.dev"
                          className={CN_LINK}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {" "}
                          free Firecrawl key 🔥
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {finalMessage && !loading && (
              <div className="flex flex-col gap-2 mt-2">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(finalMessage.message);
                      toast({
                        title: "Copied to clipboard",
                        description:
                          "The result has been copied to your clipboard",
                      });
                    }}
                  >
                    Copy
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => {
                      const content = finalMessage.message;
                      const blob = new Blob([content], { type: 'text/plain' });
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      
                      // Extract domain from URL for filename
                      let filename = 'llms.txt';
                      try {
                        const inputUrl = url.startsWith('http') ? url : `https://${url}`;
                        const urlObj = new URL(inputUrl);
                        const domain = urlObj.hostname.replace('www.', '');
                        filename = `${domain}-llms.txt`;
                      } catch (e) {
                        // Keep default filename if URL parsing fails
                      }
                      
                      a.download = filename;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      window.URL.revokeObjectURL(url);
                      
                      toast({
                        title: "File downloaded",
                        description: `${filename} has been saved to your downloads folder`,
                      });
                    }}
                                     >
                     Download
                   </Button>
                </div>

                {!hasKey && (
                  <Button className="w-full" onClick={retryWithApiKey}>
                    Re-try with API key
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Credenza
        open={isModalOpen}
        onOpenChange={(val) => {
          setIsModalOpen(val);
          if (!val) {
            if (firecrawlKey.length === 0) {
              toast({
                title: "No API key provided",
                description: "API key can improve generation quality.",
              });
            }
          }
        }}
      >
        <CredenzaContent>
          <form onSubmit={(e) => {
            e.preventDefault();
            setIsModalOpen(false);
          }} className="flex flex-col sm:gap-4">
            <CredenzaHeader>
              <CredenzaTitle>Enable full generation</CredenzaTitle>
              <CredenzaDescription>
                {hasEnvKeys.firecrawl 
                  ? 'API key found in environment. You can override it here if needed.' 
                  : 'Please enter your Firecrawl API key to enable the full generation feature.'
                }
              </CredenzaDescription>
            </CredenzaHeader>
            <CredenzaBody>
              <div className="flex flex-col">
                <Input
                  disabled={loading}
                  autoFocus
                  placeholder={hasEnvKeys.firecrawl ? "Override environment API key (optional)" : "Paste your Firecrawl API key"}
                  value={firecrawlKey}
                  onChange={(e) => setFirecrawlKey(e.target.value)}
                />
                {hasEnvKeys.firecrawl && (
                  <p className="text-xs text-green-600 mt-1">
                    ✅ Firecrawl API key found in environment
                  </p>
                )}
                <a
                  href="https://firecrawl.dev"
                  target="_blank"
                  className="mt-2 text-sm hover:text-primary transition-colors inline-flex items-center gap-1"
                >
                  Don't have a key? Create Firecrawl account{" "}
                  <ExternalLinkIcon className="size-4 mb-0.5" />
                </a>
              </div>
            </CredenzaBody>
            <CredenzaFooter>
              <CredenzaClose asChild>
                <Button type="submit">Save and return</Button>
              </CredenzaClose>
            </CredenzaFooter>
          </form>
        </CredenzaContent>
      </Credenza>

      {/* Python Configuration Modal */}
      <Credenza
        open={isConfigModalOpen}
        onOpenChange={setIsConfigModalOpen}
      >
        <CredenzaContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <CredenzaHeader>
            <CredenzaTitle>Python Backend Configuration</CredenzaTitle>
            <CredenzaDescription>
              Configure advanced settings for the Python backend
            </CredenzaDescription>
          </CredenzaHeader>
          <CredenzaBody className="space-y-6">
            {/* API Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">API Settings</h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="firecrawl-base-url">Firecrawl Base URL</Label>
                  <Input
                    id="firecrawl-base-url"
                    placeholder={hasEnvKeys.firecrawl_base_url || "https://api.firecrawl.dev/v1"}
                    value={config.firecrawl_base_url}
                    onChange={(e) => setConfig({...config, firecrawl_base_url: e.target.value})}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {hasEnvKeys.firecrawl_base_url !== "https://api.firecrawl.dev/v1" 
                      ? `Environment: ${hasEnvKeys.firecrawl_base_url}` 
                      : "Use self-hosted Firecrawl URL if needed"
                    }
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="openai-key">OpenAI API Key</Label>
                  <Input
                    id="openai-key"
                    type="password"
                    placeholder={hasEnvKeys.openai ? "Override environment API key (optional)" : "sk-..."}
                    value={openaiKey}
                    onChange={(e) => setOpenaiKey(e.target.value)}
                  />
                  {hasEnvKeys.openai && (
                    <p className="text-xs text-green-600 mt-1">
                      ✅ OpenAI API key found in environment
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="openai-model">OpenAI Model</Label>
                  <Input
                    id="openai-model"
                    value={config.openai_model}
                    onChange={(e) => setConfig({...config, openai_model: e.target.value})}
                  />
                </div>
              </div>
            </div>

            {/* URL Processing */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">URL Processing</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="map-limit">Map Limit</Label>
                  <Input
                    id="map-limit"
                    type="number"
                    value={config.map_limit}
                    onChange={(e) => setConfig({...config, map_limit: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <Label htmlFor="process-limit">Process Limit</Label>
                  <Input
                    id="process-limit"
                    type="number"
                    value={config.process_limit}
                    onChange={(e) => setConfig({...config, process_limit: parseInt(e.target.value)})}
                  />
                  <p className="text-xs text-gray-500 mt-1">Set to -1 for unlimited processing</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="include-subdomains"
                    checked={config.include_subdomains}
                    onCheckedChange={(checked) => setConfig({...config, include_subdomains: checked})}
                  />
                  <Label htmlFor="include-subdomains">Include Subdomains</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="use-sitemap"
                    checked={config.use_sitemap}
                    onCheckedChange={(checked) => setConfig({...config, use_sitemap: checked})}
                  />
                  <Label htmlFor="use-sitemap">Use Sitemap</Label>
                </div>
              </div>
            </div>

            {/* Processing Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Processing Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="batch-size">Batch Size</Label>
                  <Input
                    id="batch-size"
                    type="number"
                    value={config.batch_size}
                    onChange={(e) => setConfig({...config, batch_size: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <Label htmlFor="max-workers">Max Workers</Label>
                  <Input
                    id="max-workers"
                    type="number"
                    value={config.max_workers}
                    onChange={(e) => setConfig({...config, max_workers: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <Label htmlFor="batch-delay">Batch Delay (seconds)</Label>
                  <Input
                    id="batch-delay"
                    type="number"
                    step="0.1"
                    value={config.batch_delay}
                    onChange={(e) => setConfig({...config, batch_delay: parseFloat(e.target.value)})}
                  />
                </div>
              </div>
            </div>


            {/* Note about manual execution */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800">Manual Execution Required</h4>
                                <p className="text-blue-700 text-sm mt-1">
                    Currently, you need to run the Python script manually. Copy the command below:
                  </p>
                  <code className="block mt-2 p-2 bg-gray-100 rounded text-xs whitespace-pre-wrap">
cd fc-py
.venv\Scripts\activate
python generate-llmstxt.py {url || 'YOUR_URL'}{firecrawlKey ? ` --firecrawl-api-key ${firecrawlKey}` : ''}{openaiKey ? ` --openai-api-key ${openaiKey}` : ''} --config config.yaml
                  </code>
                  {(!firecrawlKey && !openaiKey) && envLoaded && (hasEnvKeys.firecrawl || hasEnvKeys.openai) && (
                    <p className="text-xs text-green-600 mt-2">
                      💡 API keys detected in environment - command above should work without additional keys
                    </p>
                  )}
                  {(!hasEnvKeys.firecrawl || !hasEnvKeys.openai) && envLoaded && (
                    <p className="text-xs text-orange-600 mt-2">
                      ⚠️ Some API keys missing in environment - please add them above or to .env file
                    </p>
                  )}
            </div>
          </CredenzaBody>
          <CredenzaFooter>
            <CredenzaClose asChild>
              <Button>Save Configuration</Button>
            </CredenzaClose>
          </CredenzaFooter>
        </CredenzaContent>
      </Credenza>
    </PageContainer >
  );
}

const PageContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div">
>(function PageContainer({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-col mx-auto max-w-96 lg:max-w-xl px-8",
        className
      )}
      {...props}
    />
  );
});

const Results = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div">
>(function Results({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-col p-4 border-2 rounded-2xl focus-within:border-primary bg-background",
        className
      )}
      {...props}
    />
  );
});

const CN_LINK = `text-primary hover:text-primary/80 transition-colors`;

function usePrevious<T>(value: T) {
  const ref = React.useRef<T>(value);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
}

const API_INFO = `You can access llms.txt via API by simply going to 'http://llmstxt.firecrawl.dev/{YOUR_URL}' or llms-full.txt via API with 'http://llmstxt.firecrawl.dev/{YOUR_URL}/full'. If you have a Firecrawl API key, you can use it by adding '?FIRECRAWL_API_KEY=YOUR_API_KEY' to the end of the URL for full results.`;
