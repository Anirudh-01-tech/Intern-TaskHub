import { useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const sampleQuestions = [
  "How do I create a task as a manager?",
  "How do I add an intern?",
  "What can an intern do in this app?",
  "Explain the activity log.",
  "What is the tech stack of this project?",
  "How do I run this project?",
];

export default function AssistantPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! I am your Intern TaskHub AI Assistant. Ask me how to use the app, create tasks, add interns, understand roles, or explain the project architecture.",
    },
  ]);
  const [loading, setLoading] = useState(false);

  const askAssistant = async (question?: string) => {
    const message = question || input;
    if (!message.trim()) return;

    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/assistant/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Assistant request failed");
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I could not connect to the AI assistant. Please check that the backend is running and OPENAI_API_KEY is set.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6">

      <div className="mx-auto max-w-5xl">

        <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">

          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">

            AI Assistant
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">

            Intern TaskHub Assistant
          </h1>

          <p className="mt-2 text-slate-600">

            Ask about app navigation, manager tasks, intern workflows, activity
            logs, setup steps, or project architecture.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">

          <div className="rounded-2xl bg-white shadow-sm">

            <div className="border-b border-slate-200 p-4">

              <h2 className="text-lg font-semibold text-slate-900">
                Chat with assistant
              </h2>
              <p className="text-sm text-slate-500">
                
                This assistant uses project context to answer questions about
                Intern TaskHub.
              </p>
            </div>

            <div className="h-[460px] space-y-4 overflow-y-auto p-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      message.role === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-800"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-500">
                    Thinking...
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 p-4">
              <div className="flex gap-3">
                <input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") askAssistant();
                  }}
                  placeholder="Ask something like: Where do I create a manager task?"
                  className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                <button
                  onClick={() => askAssistant()}
                  disabled={loading}
                  className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                >
                  Ask
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Frequently asked Questions
            </h2>

            <div className="mt-4 space-y-3">
              {sampleQuestions.map((question) => (
                <button
                  key={question}
                  onClick={() => askAssistant(question)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm text-slate-700 hover:border-blue-300 hover:bg-blue-50"
                >
                  {question}
                </button>
              ))}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
