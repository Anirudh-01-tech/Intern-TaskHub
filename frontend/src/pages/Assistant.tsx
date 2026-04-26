import { useEffect, useState } from "react";
import api from "../lib/api";
import { Card, CardBody, CardHeader } from "../components/Card";
import { Button } from "../components/Button";
import { Input } from "../components/Input";

type Match = { path: string; excerpt: string };

export function Assistant() {
  const [message, setMessage] = useState("");
  const [answer, setAnswer] = useState<string>("Ask about navigation, features, routes, pages, or search the codebase.");
  const [matches, setMatches] = useState<Match[]>([]);
  const [files, setFiles] = useState<string[]>([]);
  const [selectedPath, setSelectedPath] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  async function searchFiles(term = "") {
    const res = await api.get("/assistant/files", { params: { q: term || undefined } });
    setFiles(res.data.files || []);
  }

  async function ask() {
    setStatus(null);
    const res = await api.post("/assistant/chat", { message });
    setAnswer(res.data.answer);
    setMatches(res.data.matches || []);
  }

  async function openFile(path: string) {
    const res = await api.get("/assistant/file", { params: { path } });
    setSelectedPath(res.data.path);
    setContent(res.data.content);
    setStatus(null);
  }

  async function saveFile() {
    setStatus(null);
    try {
      await api.put("/assistant/file", { path: selectedPath, content });
      setStatus("File saved successfully.");
    } catch (e: any) {
      setStatus(e?.response?.data?.error || "Unable to save file.");
    }
  }

  useEffect(() => { searchFiles(); }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="TaskHub Assistant" subtitle="Local guide for app navigation, codebase search, and optional source editing." />
        <CardBody>
          <div className="grid gap-4 lg:grid-cols-[1.1fr,0.9fr]">
            <div className="space-y-3">
              <Input label="Ask something" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Where do I add manager task creation?" />
              <div className="flex gap-3">
                <Button onClick={ask}>Ask assistant</Button>
                <Button variant="ghost" onClick={() => setMessage("Find task routes")}>Try sample</Button>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/30 p-4 text-sm text-slate-300">{answer}</div>
              <div className="space-y-3">
                {matches.map((match) => (
                  <button key={match.path} className="w-full rounded-2xl border border-slate-800 bg-slate-950/30 p-4 text-left hover:bg-slate-900/40" onClick={() => openFile(match.path)}>
                    <div className="text-sm font-semibold text-slate-100">{match.path}</div>
                    <div className="mt-2 text-xs text-slate-400">{match.excerpt}</div>
                  </button>
                ))}
                {matches.length === 0 ? <div className="text-sm text-slate-500">No file matches yet.</div> : null}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/20 p-4">
                <div className="mb-3 text-sm font-semibold text-slate-100">Browse source files</div>
                <Input value={query} onChange={(e) => { const value = e.target.value; setQuery(value); searchFiles(value); }} placeholder="Filter files..." />
                <div className="mt-3 max-h-64 space-y-2 overflow-auto pr-1">
                  {files.map((file) => (
                    <button key={file} className="block w-full rounded-xl border border-slate-800 bg-slate-950/30 px-3 py-2 text-left text-xs text-slate-300 hover:bg-slate-900/40" onClick={() => openFile(file)}>{file}</button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-100">File editor</div>
                    <div className="text-xs text-slate-500">{selectedPath || "Open a file to inspect it"}</div>
                  </div>
                  <Button onClick={saveFile} disabled={!selectedPath}>Save file</Button>
                </div>
                <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={18} className="mt-3 w-full rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 font-mono text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400/50" placeholder="File contents will appear here..." />
                <div className="mt-2 text-xs text-slate-500">Saving works only when the backend runs with ENABLE_FILE_EDITING=true.</div>
                {status ? <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-xs text-slate-300">{status}</div> : null}
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
