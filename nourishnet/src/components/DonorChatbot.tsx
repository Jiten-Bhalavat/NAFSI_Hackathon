import { useState, useRef, useEffect, useCallback } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const API_URL = import.meta.env.VITE_CHATBOT_API ?? "/api/chat";

export default function DonorChatbot() {
  const [open, setOpen] = useState(false);
  const [zipCode, setZipCode] = useState("");
  const [zipConfirmed, setZipConfirmed] = useState(false);
  const [zipInput, setZipInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (open && zipConfirmed) inputRef.current?.focus();
    if (open && !zipConfirmed) zipInputRef.current?.focus();
  }, [open, zipConfirmed]);

  const confirmZip = () => {
    const z = zipInput.trim();
    if (/^\d{5}$/.test(z)) {
      setZipCode(z);
      setZipConfirmed(true);
    }
  };

  const resetChat = () => {
    setZipConfirmed(false);
    setZipCode("");
    setZipInput("");
    setMessages([]);
  };

  const suggestions = [
    `Food pantries near ${zipCode || "me"}`,
    `Where is the highest hunger area near ${zipCode || "me"}?`,
    "Which locations accept donations on weekends?",
  ];

  const send = useCallback(async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput("");

    const userMsg: Message = { role: "user", content: msg };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const history = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, history, zip_code: zipCode }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.answer },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, zipCode]);

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close chat assistant" : "Open chat assistant"}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-amber-600
          text-white shadow-lg hover:bg-amber-700 hover:shadow-xl
          flex items-center justify-center text-2xl"
        style={{ zIndex: 10000 }}
      >
        {open ? "✕" : "💬"}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          role="dialog"
          aria-label="Donor chat assistant"
          className="fixed bottom-24 right-6 w-[380px] max-w-[calc(100vw-2rem)]
            h-[520px] max-h-[calc(100vh-8rem)] bg-white rounded-2xl shadow-2xl
            border border-gray-200 flex flex-col overflow-hidden"
          style={{ zIndex: 9999 }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-600 to-amber-500 text-white
            px-4 py-3 flex items-center gap-3 shrink-0">
            <span className="text-xl">🤲</span>
            <div className="flex-1">
              <div className="font-semibold text-sm">Donor Assistant</div>
              <div className="text-xs text-amber-100">
                {zipConfirmed ? `ZIP: ${zipCode}` : "Ask about donation locations"}
              </div>
            </div>
            {zipConfirmed && (
              <button
                onClick={resetChat}
                className="text-xs text-amber-200 hover:text-white px-2 py-1 rounded-lg
                  hover:bg-white/15"
                aria-label="Change ZIP code"
              >
                Change ZIP
              </button>
            )}
          </div>

          {/* ZIP code entry screen */}
          {!zipConfirmed && (
            <div className="flex-1 flex flex-col items-center justify-center p-6">
              <div className="text-4xl mb-3">📍</div>
              <h3 className="text-sm font-semibold text-gray-800 mb-1">Enter your ZIP code</h3>
              <p className="text-xs text-gray-500 text-center mb-4">
                This helps me find food resources and hunger data near you.
              </p>
              <div className="flex gap-2 w-full max-w-[220px]">
                <input
                  ref={zipInputRef}
                  value={zipInput}
                  onChange={(e) => setZipInput(e.target.value.replace(/\D/g, "").slice(0, 5))}
                  onKeyDown={(e) => e.key === "Enter" && confirmZip()}
                  placeholder="e.g. 20740"
                  className="flex-1 text-center text-sm px-3 py-2.5 border border-gray-200
                    rounded-xl outline-none focus:border-amber-400 focus:ring-1
                    focus:ring-amber-200 tracking-widest font-medium"
                  inputMode="numeric"
                  maxLength={5}
                  aria-label="ZIP code"
                />
                <button
                  onClick={confirmZip}
                  disabled={!/^\d{5}$/.test(zipInput)}
                  className="bg-amber-600 text-white text-sm font-medium px-4 py-2.5
                    rounded-xl hover:bg-amber-700 disabled:opacity-40
                    disabled:cursor-not-allowed"
                >
                  Go
                </button>
              </div>
            </div>
          )}

          {/* Chat area — only shown after ZIP confirmed */}
          {zipConfirmed && (
            <>
              {/* Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 styled-scrollbar">
                {messages.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500 mb-4">
                      Hi! I can help you find food pantries, food banks, and SNAP
                      retailers near <span className="font-medium text-amber-700">{zipCode}</span> where
                      you can donate.
                    </p>
                    <div className="space-y-2">
                      {suggestions.map((s) => (
                        <button
                          key={s}
                          onClick={() => send(s)}
                          className="block w-full text-left text-xs bg-amber-50 text-amber-700
                            border border-amber-200 rounded-xl px-3 py-2 hover:bg-amber-100"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                        m.role === "user"
                          ? "bg-amber-600 text-white rounded-br-sm"
                          : "bg-gray-100 text-gray-800 rounded-bl-sm"
                      }`}
                    >
                      <MessageContent text={m.content} />
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.15s]" />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.3s]" />
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="border-t border-gray-200 p-3 flex gap-2 shrink-0">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                  placeholder="Ask about donation locations..."
                  className="flex-1 text-sm px-3 py-2 border border-gray-200 rounded-xl
                    outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-200"
                  disabled={loading}
                  aria-label="Chat message input"
                />
                <button
                  onClick={() => send()}
                  disabled={loading || !input.trim()}
                  className="bg-amber-600 text-white text-sm font-medium px-4 py-2
                    rounded-xl hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Send message"
                >
                  Send
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

function MessageContent({ text }: { text: string }) {
  const html = text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    // Convert markdown links [text](url) to clickable <a> tags
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-amber-700 underline hover:text-amber-900">$1</a>')
    // Indent lines after a bullet (address, phone, hours) with left padding
    .replace(/\n {2,}(.+)/g, '<br/><span class="pl-4 text-gray-600">$1</span>')
    // Bullet points
    .replace(/\n- /g, '<br/><span class="mt-1 inline-block">• </span>')
    .replace(/\n\* /g, '<br/><span class="mt-1 inline-block">• </span>')
    .replace(/\n• /g, '<br/><span class="mt-1 inline-block">• </span>')
    // Regular line breaks
    .replace(/\n/g, "<br/>")
    // Convert bare URLs to clickable links
    .replace(/(^|[^"'>])(https?:\/\/[^\s<,)]+)/g,
      '$1<a href="$2" target="_blank" rel="noopener noreferrer" class="text-amber-700 underline hover:text-amber-900">$2</a>');
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}
