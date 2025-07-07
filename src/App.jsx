import React, { useState, useEffect, useRef } from "react";

// Inline Tailwind CSS for animations
const styles = `
@tailwind base;
@tailwind components;
@tailwind utilities;

@keyframes reveal {
  from { transform: scale(0.95); opacity: 0.2; }
  to { transform: scale(1); opacity: 1; }
}
.animate-reveal {
  animation: reveal 0.25s ease-out;
}
@keyframes pulseBubble {
  0%, 100% { transform: scale(1); opacity: 0.4; }
  50% { transform: scale(0.95); opacity: 1; }
}
.animate-pulseBubble {
  animation: pulseBubble 1.2s infinite;
}
`;

// Inject the styles into the DOM
const StyleInjector = () => {
  useEffect(() => {
    const styleTag = document.createElement("style");
    styleTag.innerHTML = styles;
    document.head.appendChild(styleTag);
    return () => document.head.removeChild(styleTag);
  }, []);
  return null;
};

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const chatBoxRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem("atupeleMessages");
    if (saved) setMessages(JSON.parse(saved));
    else {
      setMessages([
        {
          role: "assistant",
          content: "Hello! Welcome to AtupeleGPT. How can I assist you today?",
        },
      ]);
    }

    if ("webkitSpeechRecognition" in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.lang = "en-US";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("atupeleMessages", JSON.stringify(messages));
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages, typing]);

  async function sendMessage() {
    if (!input.trim()) return;
    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    setTyping(true);

    const lowered = input.toLowerCase().trim();
    const identityQuestions = [
      "wewe ni nani", "jina lako", "unaitwaje",
      "who are you", "what is your name", "what's your name",
      "qui es-tu", "comment tu t'appelles",
      "wer bist du", "wie heißt du",
      "¿quién eres?", "cómo te llamas"
    ];

    if (identityQuestions.some((q) => lowered.includes(q))) {
      let reply = "Mimi ni AtupeleGPT, msaidizi wako wa kidijitali.";

      if (lowered.includes("who are you") || lowered.includes("what is your name") || lowered.includes("what's your name")) {
        reply = "I'm AtupeleGPT, your digital assistant.";
      } else if (lowered.includes("qui es-tu") || lowered.includes("comment tu t'appelles")) {
        reply = "Je suis AtupeleGPT, votre assistant numérique.";
      } else if (lowered.includes("wer bist du") || lowered.includes("wie heißt du")) {
        reply = "Ich bin AtupeleGPT, dein digitaler Assistent.";
      } else if (lowered.includes("¿quién eres?") || lowered.includes("cómo te llamas")) {
        reply = "Soy AtupeleGPT, tu asistente digital.";
      }

      setMessages([...newMessages, { role: "assistant", content: reply }]);
      setTyping(false);
      return;
    }

    try {
      const response = await fetch("https://open-ai21.p.rapidapi.com/conversationllama", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-RapidAPI-Key": "d25c229bffmshc2183a9b6d9a102p11ec19jsn54b61c753edf",
          "X-RapidAPI-Host": "open-ai21.p.rapidapi.com",
        },
        body: JSON.stringify({
          messages: newMessages,
          web_access: false,
        }),
      });

      const data = await response.json();
      const reply = data?.result || "No response.";
      setMessages([...newMessages, { role: "assistant", content: reply }]);
    } catch (error) {
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: "An error occurred while contacting the model.",
        },
      ]);
    } finally {
      setTyping(false);
    }
  }

  return (
    <div className="bg-[#f7f7f8] min-h-screen font-sans">
      <StyleInjector />
      <div className="max-w-2xl mx-auto flex flex-col h-screen">
        {/* 🔖 Header */}
        <div className="bg-white p-4 text-center font-semibold text-lg border-b shadow-sm sticky top-0 z-10 flex justify-center items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="black" className="w-6 h-6">
            <circle cx="256" cy="256" r="100" />
          </svg>
          AtupeleGPT
        </div>

        {/* 💬 Chat Messages */}
        <div ref={chatBoxRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`max-w-[80%] px-4 py-3 rounded-2xl whitespace-pre-wrap shadow-md ${
                msg.role === "user"
                  ? "bg-green-100 text-black self-end"
                  : "bg-black text-white self-start animate-reveal"
              }`}
            >
              {msg.content}
            </div>
          ))}
          {typing && (
            <div className="max-w-[80%] px-4 py-3 rounded-2xl bg-black text-white self-start animate-pulseBubble">
              &nbsp;
            </div>
          )}
        </div>

        {/* 🧾 Input & 🎙 Button */}
        <div className="p-4 bg-white sticky bottom-0 border-t flex gap-2 items-center">
          <input
            type="text"
            placeholder="Type your message..."
            className="flex-1 border px-4 py-3 rounded text-sm focus:outline-none"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") sendMessage();
            }}
          />
          <button
            onClick={() => recognitionRef.current && recognitionRef.current.start()}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-800 text-white shadow hover:bg-gray-900 transition"
            title="Use voice"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 14a3 3 0 003-3V5a3 3 0 10-6 0v6a3 3 0 003 3z" />
              <path d="M19 11a1 1 0 10-2 0 5 5 0 01-10 0 1 1 0 10-2 0 7 7 0 0014 0z" />
              <path d="M12 17v4m-4 0h8" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            onClick={sendMessage}
            className="bg-black text-white px-4 py-2 rounded shadow hover:bg-gray-900"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
