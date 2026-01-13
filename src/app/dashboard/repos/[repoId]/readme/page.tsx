"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
});

export default function ReadmePage() {
  const { repoId } = useParams<{ repoId: string }>();

  const [files, setFiles] = useState<any[]>([]);
  const [content, setContent] = useState<Record<string, string>>({});
  const [readme, setReadme] = useState("");
  const [loading, setLoading] = useState(false);
  const [committing, setCommitting] = useState(false);

  // ✅ Fetch repo structure + important files
  useEffect(() => {
    if (!repoId) return;

    const fetchAll = async () => {
      try {
        const [filesRes, contentRes] = await Promise.all([
          axios.get(`/api/github/repos/${repoId}/files`),
          axios.get(`/api/github/repos/${repoId}/content`),
        ]);

        setFiles(filesRes.data.files);
        setContent(contentRes.data.content);
      } catch (err) {
        console.error("Failed to fetch repo data", err);
      }
    };

    fetchAll();
  }, [repoId]);

  async function generateReadme() {
    if (!repoId) return;

    setLoading(true);
    try {
      const res = await axios.post(
        `/api/github/repos/${repoId}/generate-readme`,
        {
          file: files,
          extractedFile: content,
        }
      );

      setReadme(res.data.readme || "");
    } catch (err) {
      console.error(err);
      alert("Failed to generate README");
    } finally {
      setLoading(false);
    }
  }

  async function commitReadme() {
    if (!readme.trim()) return;

    setCommitting(true);
    try {
      await axios.post(
        `/api/github/repos/${repoId}/commit-readme`,
        {
          readmeContent: readme,
          commitMessage: "docs: auto-generate README",
        }
      );

      alert("README committed successfully 🎉");
    } finally {
      setCommitting(false);
    }
  }

  return (
    <div className="grid grid-cols-2 gap-6 p-6 min-h-screen">
      <div className="flex flex-col border rounded">
        <div className="p-3 border-b font-semibold">README Editor</div>

        <MonacoEditor
          height="100%"
          language="markdown"
          value={readme}
          onChange={(v) => setReadme(v || "")}
          options={{ minimap: { enabled: false } }}
        />

        <div className="flex gap-3 p-3 border-t">
          <button onClick={generateReadme}>
            Generate README
          </button>
          <button onClick={commitReadme}>
            Commit to GitHub
          </button>
        </div>
      </div>

      <div className="border rounded p-4 overflow-auto">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {readme}
        </ReactMarkdown>
      </div>
    </div>
  );
}
