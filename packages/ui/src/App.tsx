import { useState, type JSX } from 'react';
import { useRepos } from './hooks/useRepos.ts';
import { RegisterForm } from './components/RegisterForm.tsx';
import { RepoList } from './components/RepoList.tsx';
import { RepoLogView } from './components/RepoLogView.tsx';
import { OfficeCanvas } from './components/OfficeCanvas.tsx';

export function App(): JSX.Element {
  const { repos, loading, error, register, remove } = useRepos();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = repos.find((r) => r.id === selectedId) ?? null;

  return (
    <div
      style={{
        fontFamily:
          "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif",
        display: 'grid',
        gridTemplateColumns: '300px 1fr',
        height: '100vh',
        background: '#0b0d13',
        color: '#e4e4e7',
      }}
    >
      <aside
        style={{
          borderRight: '1px solid #1f2230',
          display: 'grid',
          gridTemplateRows: 'auto 1fr',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: 16, borderBottom: '1px solid #1f2230' }}>
          <h2 style={{ margin: '0 0 8px' }}>kampanela</h2>
          <RegisterForm
            onSubmit={async (input) => {
              const repo = await register(input);
              setSelectedId(repo.id);
            }}
          />
        </div>
        <div style={{ overflow: 'auto' }}>
          {loading ? (
            <div style={{ padding: 16, color: '#888' }}>Loading...</div>
          ) : (
            <RepoList
              repos={repos}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onRemove={async (id) => {
                await remove(id);
                if (selectedId === id) setSelectedId(null);
              }}
            />
          )}
          {error && <div style={{ padding: 16, color: 'crimson' }}>{error}</div>}
        </div>
      </aside>
      <main
        style={{
          display: 'grid',
          gridTemplateRows: '1fr auto',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: 12, overflow: 'auto' }}>
          <OfficeCanvas repos={repos} selectedId={selectedId} onSelect={setSelectedId} />
        </div>
        <div
          style={{
            borderTop: '1px solid #1f2230',
            maxHeight: '40vh',
            overflow: 'hidden',
          }}
        >
          {selected ? (
            <RepoLogView repoId={selected.id} repoName={selected.name} />
          ) : (
            <div style={{ padding: 16, color: '#666', fontSize: 13 }}>
              상단 오피스에서 에이전트를 클릭하거나 좌측에서 레포를 선택하면 로그가 여기 뜹니다.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
