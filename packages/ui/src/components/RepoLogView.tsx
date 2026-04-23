import { useState, type JSX } from 'react';
import type { AgentEvent, SpawnRequest } from '@kampanela/shared';
import { startSpawn, stopSpawn } from '../api/spawn.ts';
import { useRepoLog } from '../hooks/useRepoLog.ts';

type Props = {
  repoId: string;
  repoName: string;
};

export function RepoLogView({ repoId, repoName }: Props): JSX.Element {
  const { events, connected } = useRepoLog(repoId);
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setBusy(true);
    setError(null);
    try {
      const input: SpawnRequest = prompt.trim().length > 0 ? { prompt: prompt.trim() } : {};
      await startSpawn(repoId, input);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const stop = async () => {
    setBusy(true);
    setError(null);
    try {
      await stopSpawn(repoId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: 'grid', gap: 8, padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h3 style={{ margin: 0 }}>{repoName}</h3>
        <span style={{ fontSize: 12, color: connected ? 'green' : '#999' }}>
          {connected ? '● WS connected' : '○ disconnected'}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          style={{ flex: 1 }}
          placeholder="프롬프트 (공란이면 CLI 기본 동작)"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={busy}
        />
        <button onClick={run} disabled={busy}>
          Spawn
        </button>
        <button onClick={stop} disabled={busy}>
          Stop
        </button>
      </div>
      {error && <div style={{ color: 'crimson' }}>{error}</div>}
      <pre
        style={{
          background: '#111',
          color: '#eee',
          padding: 12,
          minHeight: 280,
          maxHeight: 500,
          overflow: 'auto',
          fontSize: 12,
          borderRadius: 4,
        }}
      >
        {events.map((e, i) => (
          <div key={i}>{formatEvent(e)}</div>
        ))}
      </pre>
    </div>
  );
}

function formatEvent(e: AgentEvent): string {
  switch (e.type) {
    case 'stdout':
      return `[out] ${e.text}`;
    case 'stderr':
      return `[err] ${e.text}`;
    case 'status':
      return `[status] ${e.status}`;
    case 'exit':
      return `[exit] code=${e.code ?? 'null'}`;
    case 'claude_event':
      return `[evt] ${JSON.stringify(e.payload).slice(0, 200)}`;
  }
}
