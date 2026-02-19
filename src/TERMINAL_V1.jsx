import React, { useState, useEffect, useRef } from "react";

export default function TerminalPage({ authHeaders }) {
  const [server, setServer] = useState("");
  const [port, setPort] = useState("");
  const [command, setCommand] = useState("");
  const [history, setHistory] = useState([]);
  const [output, setOutput] = useState([]);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const inputRef = useRef();
  const historyIndex = useRef(-1);

  useEffect(() => {
    if (server) {
      setOutput([]);
      setHistory([]);
      historyIndex.current = -1;
      setConnected(false);
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        setConnected(true);
        setOutput(prev => [...prev, `Connected to ${server}`]);
      }, 800);
    }
  }, [server]);

  useEffect(() => {
    const stored = sessionStorage.getItem("terminal_history");
    if (stored) setHistory(JSON.parse(stored));
  }, []);

  useEffect(() => {
    sessionStorage.setItem("terminal_history", JSON.stringify(history.slice(-10)));
  }, [history]);

  const execute = async () => {
    if (!command.trim()) return;
    setLoading(true);
    setOutput(prev => [...prev, `> ${command}`]);
    setHistory(prev => [...prev.slice(-9), command]);
    historyIndex.current = -1;

    const res = await fetch("/api/terminal/execute", {
      method: "POST",
      headers: { ...authHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ server, port, command })
    });

    const data = await res.json();
    setOutput(prev => [...prev, data.log || ""]);
    setCommand("");
    setLoading(false);
  };

  const handleKey = (e) => {
    if (e.key === "Enter") execute();
    if (e.key === "ArrowUp") {
      if (history.length === 0) return;
      historyIndex.current = Math.min(historyIndex.current + 1, history.length - 1);
      setCommand(history[history.length - 1 - historyIndex.current]);
    }
  };

  return (
    <div style={{ height: "80vh", width: "80vw", margin: "auto", background: "black", color: "white", fontFamily: "monospace", padding: 20, overflow: "auto" }}>
      <div style={{ marginBottom: 10 }}>
        <select value={server} onChange={e => setServer(e.target.value)}>
          <option value="">Select Server</option>
          <option value="server1.example.com">server1.example.com</option>
          <option value="server2.example.com">server2.example.com</option>
        </select>
      </div>

      {loading && <div>Connecting...</div>}

      {connected && (
        <>
          <div>
            {output.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>

          <div style={{ display: "flex" }}>
            <span>$ </span>
            <input
              ref={inputRef}
              value={command}
              onChange={e => setCommand(e.target.value)}
              onKeyDown={handleKey}
              style={{ flex: 1, background: "black", color: "white", border: "none", outline: "none" }}
              autoFocus
            />
          </div>
        </>
      )}
    </div>
  );
}
