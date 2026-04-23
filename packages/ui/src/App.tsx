import { useState, type JSX } from 'react';
import { useRepos } from './hooks/useRepos.ts';
import { RegisterForm } from './components/RegisterForm.tsx';
import { RepoList } from './components/RepoList.tsx';
import { RepoLogView } from './components/RepoLogView.tsx';

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
        gridTemplateColumns: '320px 1fr',
        minHeight: '100vh',
      }}
    >
      <aside style={{ borderRight: '1px solid #ddd', display: 'grid', gridTemplateRows: 'auto 1fr' }}>
        <div style={{ padding: 16, borderBottom: '1px solid #eee' }}>
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
      <main>
        {selected ? (
          <RepoLogView repoId={selected.id} repoName={selected.name} />
        ) : (
          <div style={{ padding: 24, color: '#888' }}>
            좌측에서 레포를 선택하거나 새로 등록하세요.
          </div>
        )}
      </main>
    </div>
  );
}
