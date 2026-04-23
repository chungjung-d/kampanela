import { useMemo, useState, type JSX } from 'react';
import type { AgentEvent, SpawnRequest } from '@kampanela/shared';
import { startSpawn, stopSpawn } from '../api/spawn.ts';
import { useRepoLog } from '../hooks/useRepoLog.ts';
import { formatAgentEvent, type FormattedKind } from '../lib/format-event.ts';

type Props = {
  repoId: string;
  repoName: string;
};

const KIND_COLORS: Record<FormattedKind, string> = {
  info: '#8ab4ff',
  status: '#b38cff',
  action: '#ffd479',
  output: '#9be29b',
  result: '#4ade80',
  error: '#ff8080',
};

export function RepoLogView({ repoId, repoName }: Props): JSX.Element {
  const { events, connected } = useRepoLog(repoId);
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState(false);

  const formatted = useMemo(
    () =>
      events.map((e, idx) => ({
        idx,
        raw: e,
        line: formatAgentEvent(e),
      })),
    [events],
  );
  const visible = showRaw ? formatted : formatted.filter((r) => r.line !== null);

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>{repoName}</h3>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <label style={{ fontSize: 12, color: '#666', display: 'flex', gap: 4, alignItems: 'center' }}>
            <input
              type="checkbox"
              checked={showRaw}
              onChange={(e) => setShowRaw(e.target.checked)}
            />
            raw JSON
          </label>
          <span style={{ fontSize: 12, color: connected ? 'green' : '#999' }}>
            {connected ? '● WS connected' : '○ disconnected'}
          </span>
        </div>
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
          maxHeight: 560,
          overflow: 'auto',
          fontSize: 12,
          lineHeight: 1.5,
          borderRadius: 4,
          margin: 0,
        }}
      >
        {visible.length === 0 ? (
          <div style={{ color: '#666' }}>
            {connected ? '대기 중 — Spawn 버튼으로 에이전트를 시작하세요.' : 'WS 연결 대기…'}
          </div>
        ) : (
          visible.map((row) => (
            <LogRow key={row.idx} showRaw={showRaw} raw={row.raw} line={row.line} />
          ))
        )}
      </pre>
    </div>
  );
}

function LogRow({
  showRaw,
  raw,
  line,
}: {
  showRaw: boolean;
  raw: AgentEvent;
  line: ReturnType<typeof formatAgentEvent>;
}): JSX.Element {
  if (showRaw) {
    const color = line ? KIND_COLORS[line.kind] : '#888';
    return (
      <div style={{ color, marginBottom: 2 }}>
        [{raw.type}] {JSON.stringify(raw).slice(0, 400)}
      </div>
    );
  }
  if (!line) return <></>;
  return <div style={{ color: KIND_COLORS[line.kind], marginBottom: 2 }}>{line.text}</div>;
}
