import { FormEvent, useEffect, useRef, useState } from "react";
import "./App.css";

type Role = "user" | "agent";

interface Message {
  id: string;
  role: Role;
  text: string;
}

const WELCOME: Message = {
  id: "welcome",
  role: "agent",
  text: "Hola, soy Agente Total. ¿En qué te ayudo hoy?",
};

export default function App() {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || pending) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", text };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setPending(true);

    // Placeholder echo — wire to the real agent backend here.
    setTimeout(() => {
      const reply: Message = {
        id: crypto.randomUUID(),
        role: "agent",
        text: `Recibido: "${text}"`,
      };
      setMessages((m) => [...m, reply]);
      setPending(false);
    }, 400);
  }

  return (
    <div className="app">
      <header className="app__header">
        <h1>Agente Total</h1>
      </header>

      <div className="chat" ref={listRef}>
        {messages.map((m) => (
          <div key={m.id} className={`bubble bubble--${m.role}`}>
            {m.text}
          </div>
        ))}
        {pending && <div className="bubble bubble--agent bubble--typing">…</div>}
      </div>

      <form className="composer" onSubmit={handleSubmit}>
        <input
          className="composer__input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe un mensaje"
          autoFocus
        />
        <button
          className="composer__send"
          type="submit"
          disabled={pending || !input.trim()}
        >
          Enviar
        </button>
      </form>
    </div>
  );
}
