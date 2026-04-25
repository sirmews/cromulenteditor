import '@fontsource-variable/geist';
import type { ProgressCallback } from '@huggingface/transformers';
import {
  FileText,
  Github,
  Moon,
  PenLine,
  Sparkles,
  Sun,
  Trash2
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger
} from '@/components/ui/sidebar';
import type { AiAction } from '@/lib/ai';
import { queryBonsai } from '@/lib/ai';
import type { ModelDtype, ModelStatus } from '@/lib/bonsai';
import {
  clearModels,
  DTYPE_INFO,
  isModelLoaded,
  loadModel,
  setModelDtype
} from '@/lib/bonsai';
import { DocumentEditor } from './components/editor/DocumentEditor';

function App() {
  const { theme, setTheme } = useTheme();
  const [documentTitle, setDocumentTitle] = useState('Untitled');
  const [modelStatus, setModelStatus] = useState<ModelStatus>(
    isModelLoaded() ? 'ready' : 'idle'
  );
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadFile, setDownloadFile] = useState('');
  const [selectedDtype, setSelectedDtype] = useState<ModelDtype>('q1');

  const initialContent = (() => {
    try {
      return localStorage.getItem('cromulent:content') ?? undefined;
    } catch {
      return undefined;
    }
  })();

  const handleContentChange = useCallback((html: string) => {
    try {
      localStorage.setItem('cromulent:content', html);
    } catch {
      // localStorage full or unavailable
    }
  }, []);

  const handleLoadModel = useCallback(async () => {
    if (modelStatus === 'downloading' || modelStatus === 'ready') return;

    setModelStatus('downloading');
    setDownloadProgress(0);
    setDownloadFile('');

    const onProgress: ProgressCallback = (progress) => {
      if (
        progress.status === 'progress_total' &&
        typeof progress.progress === 'number'
      ) {
        setDownloadProgress(Math.round(progress.progress));
      } else if (
        progress.status === 'progress' &&
        typeof progress.progress === 'number'
      ) {
        // Track which individual file is being downloaded
        setDownloadFile(progress.file);
      }
    };

    try {
      await loadModel(onProgress);
      setModelStatus('ready');
    } catch (error) {
      console.error('Failed to load model:', error);
      setModelStatus('error');
    }
  }, [modelStatus]);

  const handleAiAssist = useCallback(
    async (text: string, action: AiAction): Promise<string> => {
      if (modelStatus !== 'ready') {
        await handleLoadModel();
      }
      try {
        return await queryBonsai(text, action);
      } catch (error) {
        console.error('AI Assist error:', error);
        return '[Error: AI service unavailable. Please try again.]';
      }
    },
    [modelStatus, handleLoadModel]
  );

  const handleClearModels = useCallback(async () => {
    if (
      !confirm(
        'This will delete the downloaded AI model from your browser cache. It will be re-downloaded next time you use AI. Continue?'
      )
    ) {
      return;
    }
    try {
      await clearModels();
      setModelStatus('idle');
      setDownloadProgress(0);
    } catch (error) {
      console.error('Failed to clear models:', error);
    }
  }, []);

  const handleDtypeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const dtype = e.target.value as ModelDtype;
      setSelectedDtype(dtype);
      setModelDtype(dtype);
      // Reset status since the user switched to a different model variant.
      if (modelStatus === 'ready') {
        setModelStatus('idle');
      }
    },
    [modelStatus]
  );

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, [setTheme]);

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" variant="inset">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <PenLine className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Cromulent</span>
                  <span className="truncate text-xs text-muted-foreground">
                    Editor
                  </span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Pages</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton isActive tooltip={documentTitle}>
                  <FileText />
                  <span>{documentTitle}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="New page">
                  <Sparkles />
                  <span>New page</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>

          <SidebarGroup className="mt-auto">
            <SidebarGroupLabel>AI Model</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                {modelStatus === 'downloading' ? (
                  <SidebarMenuButton disabled>
                    <div className="size-4 rounded-full border-2 border-sidebar-foreground/30 border-t-sidebar-foreground animate-spin" />
                    <span>
                      {downloadFile
                        ? `Downloading ${downloadFile}...`
                        : `Downloading... ${downloadProgress}%`}
                    </span>
                  </SidebarMenuButton>
                ) : modelStatus === 'ready' ? (
                  <SidebarMenuButton tooltip="Clear AI cache">
                    <Sparkles className="text-green-500" />
                    <span>Bonsai 1.7B ready</span>
                    <SidebarMenuBadge>
                      <button
                        type="button"
                        onClick={handleClearModels}
                        className="flex items-center justify-center"
                        aria-label="Clear AI model cache"
                      >
                        <Trash2 className="size-3 hover:text-destructive transition-colors" />
                      </button>
                    </SidebarMenuBadge>
                  </SidebarMenuButton>
                ) : (
                  <SidebarMenuButton
                    onClick={handleLoadModel}
                    tooltip="Load AI model"
                  >
                    <Sparkles />
                    <span>Load AI model</span>
                  </SidebarMenuButton>
                )}
              </SidebarMenuItem>
              <SidebarMenuItem>
                <div className="flex items-center gap-2 px-2 py-1.5 w-full">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    Quality
                  </span>
                  <select
                    value={selectedDtype}
                    onChange={handleDtypeChange}
                    className="bg-sidebar-accent text-sidebar-accent-foreground text-xs rounded px-1.5 py-1 outline-none border border-sidebar-border flex-1 min-w-0 cursor-pointer"
                    aria-label="Select model quality"
                  >
                    {(
                      Object.entries(DTYPE_INFO) as [
                        ModelDtype,
                        typeof DTYPE_INFO.q1
                      ][]
                    ).map(([key, info]) => (
                      <option key={key} value={key}>
                        {info.label} — {info.size}
                      </option>
                    ))}
                  </select>
                </div>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={toggleTheme}
                tooltip={theme === 'dark' ? 'Light mode' : 'Dark mode'}
              >
                {theme === 'dark' ? (
                  <>
                    <Sun />
                    <span>Light mode</span>
                  </>
                ) : (
                  <>
                    <Moon />
                    <span>Dark mode</span>
                  </>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <a
                href="https://github.com/sirmews/cromulenteditor"
                target="_blank"
                rel="noopener noreferrer"
                className="contents"
              >
                <SidebarMenuButton tooltip="GitHub">
                  <Github />
                  <span>GitHub</span>
                </SidebarMenuButton>
              </a>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <div className="shrink-0 bg-amber-500 text-amber-950 text-xs font-semibold text-center py-1.5 px-4">
          This is purely an experiment. Do not use this for anything important.
        </div>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
          </div>
          <div className="flex flex-1 items-center gap-2">
            <input
              type="text"
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              className="bg-transparent border-none outline-none text-lg font-medium flex-1 max-w-md focus:ring-0"
              placeholder="Untitled"
            />
          </div>
          <div className="flex items-center gap-2">
            {modelStatus === 'downloading' && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${downloadProgress}%` }}
                  />
                </div>
                <span>{downloadFile || `${downloadProgress}%`}</span>
              </div>
            )}
            {modelStatus === 'idle' && (
              <Button variant="outline" size="sm" onClick={handleLoadModel}>
                Load AI
              </Button>
            )}
            <Button variant="default" size="sm">
              Share
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="max-w-3xl mx-auto py-8 px-4">
            <DocumentEditor
              initialContent={initialContent}
              onAiAssist={handleAiAssist}
              onContentChange={handleContentChange}
              modelStatus={modelStatus}
            />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default App;
