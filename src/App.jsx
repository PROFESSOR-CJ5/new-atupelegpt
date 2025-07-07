import React, { useState, useEffect, useRef } from "react";

const themes = {
  "dark-red": {
    html: "bg-gray-900 text-white",
    body: "bg-gray-900",
    userMsg: "bg-green-100 p-3 rounded-lg w-fit ml-auto text-black",
    botMsg: "bg-gray-700 p-3 rounded-lg w-fit text-white",
    tailUser:
      "after:absolute after:bottom-0 after:right-[-8px] after:border-t-8 after:border-l-8 after:border-transparent after:border-l-green-100",
    tailBot:
      "after:absolute after:bottom-0 after:left-[-8px] after:border-t-8 after:border-r-8 after:border-transparent after:border-r-gray-700",
  },
  "white-red": {
    html: "bg-white text-red-700",
    body: "bg-white",
    userMsg: "bg-green-100 p-3 rounded-lg w-fit ml-auto text-black",
    botMsg: "bg-gray-200 p-3 rounded-lg w-fit text-black",
    tailUser:
      "after:absolute after:bottom-0 after:right-[-8px] after:border-t-8 after:border-l-8 after:border-transparent after:border-l-green-100",
    tailBot:
      "after:absolute after:bottom-0 after:left-[-8px] after:border-t-8 after:border-r-8 after:border-transparent after:border-r-gray-200",
  },
  "black-red": {
    html: "bg-black text-red-500",
    body: "bg-black",
    userMsg: "bg-green-100 p-3 rounded-lg w-fit ml-auto text-black",
    botMsg: "bg-gray-800 p-3 rounded-lg w-fit text-white",
    tailUser:
      "after:absolute after:bottom-0 after:right-[-8px] after:border-t-8 after:border-l-8 after:border-transparent after:border-l-green-100",
    tailBot:
      "after:absolute after:bottom-0 after:left-[-8px] after:border-t-8 after:border-r-8 after:border-transparent after:border-r-gray-800",
  },
};

export default function App() {
  const [theme, setTheme] = useState("white-red");
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
          content: "Hello! Welcome to AtupeleGPT. How can I assist you today? 😊",
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
    <div className={`${themes[theme].html} min-h-screen`}>
      <div className="flex flex-wrap justify-center gap-4 p-4 bg-white shadow sticky top-0 z-10">
        <button onClick={() => setTheme("dark-red")} className="px-4 py-2 bg-red-800 text-white rounded">Dark Red</button>
        <button onClick={() => setTheme("white-red")} className="px-4 py-2 bg-white text-red-700 border border-red-700 rounded">White Red</button>
        <button onClick={() => setTheme("black-red")} className="px-4 py-2 bg-black text-red-500 rounded">Black Red</button>
      </div>

      <div className={`${themes[theme].body} flex justify-center`}>
        <div className="w-full max-w-3xl flex flex-col h-[calc(100vh-120px)]">
          <div
            ref={chatBoxRef}
            className="w-full px-2 sm:px-6 py-4 space-y-4 overflow-y-auto flex-1"
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`relative ${
                  msg.role === "user"
                    ? `${themes[theme].userMsg} ${themes[theme].tailUser}`
                    : `${themes[theme].botMsg} ${themes[theme].tailBot}`
                }`}
              >
                {msg.content}
              </div>
            ))}

            {typing && (
              <div className={`relative ${themes[theme].botMsg} ${themes[theme].tailBot}`}>
                <span className="animate-pulse flex gap-1">
                  <span className="w-2 h-2 bg-white rounded-full"></span>
                  <span className="w-2 h-2 bg-white rounded-full"></span>
                  <span className="w-2 h-2 bg-white rounded-full"></span>
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 p-4 bg-white shadow-md sticky bottom-0">
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
              onClick={() =>
                recognitionRef.current && recognitionRef.current.start()
              }
              className="bg-gray-300 text-black px-3 py-2 rounded"
              title="Use voice"
            >
              🎤
            </button>
            <button
              onClick={sendMessage}
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
