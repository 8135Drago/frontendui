import React, { useEffect, useState, useRef } from "react";

export default function TerminalPage({ authHeaders }) {

  const [projects, setProjects] = useState([]);
  const [envs, setEnvs] = useState([]);
  const [servers, setServers] = useState([]);

  const [project, setProject] = useState("");
  const [env, setEnv] = useState("");
  const [server, setServer] = useState(null);

  const [command, setCommand] = useState("");
  const [output, setOutput] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);

  const historyIndex = useRef(-1);
  const containerRef = useRef();

  useEffect(() => {
    fetch("/api/servers/projects", { headers: authHeaders })
      .then(res => res.json())
      .then(setProjects);
  }, []);

  useEffect(() => {
    if (!project) return;
    fetch(`/api/servers/envs?project=${project}`, { headers: authHeaders })
      .then(res => res.json())
      .then(setEnvs);
    setEnv("");
    setServer(null);
  }, [project]);

  useEffect(() => {
    if (!project || !env) return;
    fetch(`/api/servers?project=${project}&env=${env}`, { headers: authHeaders })
      .then(res => res.json())
      .then(setServers);
    setServer(null);
  }, [env]);

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
        setOutput([`Connected to ${server.ip}:${server.port}`]);
      }, 800);
    }
  }, [server]);

  const execute = async () => {
    if (!command.trim() || !server) return;

    setOutput(prev => [...prev, `> ${command}`]);
    setHistory(prev => [...prev.slice(-9), command]);
    historyIndex.current = -1;
    setCommand("");
    setLoading(true);

    const res = await fetch("/api/terminal/execute", {
      method: "POST",
      headers: { ...authHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({
        server: server.ip,
        port: server.port,
        command
      })
    });

    const data = await res.json();
    setOutput(prev => [...prev, data.log || ""]);
    setLoading(false);

    containerRef.current.scrollTop = containerRef.current.scrollHeight;
  };

  const handleKey = (e) => {
    if (e.key === "Enter") execute();
    if (e.key === "ArrowUp") {
      if (!history.length) return;
      historyIndex.current = Math.min(historyIndex.current + 1, history.length - 1);
      setCommand(history[history.length - 1 - historyIndex.current]);
    }
  };

  return (
    <div style={{
      height: "80vh",
      width: "80vw",
      margin: "auto",
      background: "#000",
      color: "#0f0",
      fontFamily: "monospace",
      padding: 20,
      display: "flex",
      flexDirection: "column"
    }}>

      <div style={{ display: "flex", gap: 10, marginBottom: 15 }}>
        <select value={project} onChange={e => setProject(e.target.value)}>
          <option value="">Select Project</option>
          {projects.map(p => <option key={p}>{p}</option>)}
        </select>

        <select value={env} onChange={e => setEnv(e.target.value)} disabled={!project}>
          <option value="">Select Env</option>
          {envs.map(e => <option key={e}>{e}</option>)}
        </select>

        <select value={server?.id || ""} onChange={e => {
          const s = servers.find(x => x.id == e.target.value);
          setServer(s);
        }} disabled={!env}>
          <option value="">Select Server</option>
          {servers.map(s => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.ip})
            </option>
          ))}
        </select>
      </div>

      <div ref={containerRef} style={{ flex: 1, overflow: "auto" }}>
        {output.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
        {loading && <div>Processing...</div>}
      </div>

      {connected && (
        <div style={{ display: "flex" }}>
          <span>{server.user}@{server.ip}$ </span>
          <input
            value={command}
            onChange={e => setCommand(e.target.value)}
            onKeyDown={handleKey}
            style={{
              flex: 1,
              background: "black",
              color: "#0f0",
              border: "none",
              outline: "none"
            }}
            autoFocus
          />
        </div>
      )}
    </div>
  );
}
