import type { JSX } from 'react';
import type { RegisteredRepo } from '@kampanela/shared';

type Props = {
  repos: RegisteredRepo[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
};

export function RepoList({ repos, selectedId, onSelect, onRemove }: Props): JSX.Element {
  if (repos.length === 0) {
    return <div style={{ color: '#888', padding: 16 }}>등록된 레포가 없습니다.</div>;
  }
  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {repos.map((repo) => {
        const selected = repo.id === selectedId;
        return (
          <li
            key={repo.id}
            style={{
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              padding: 8,
              borderBottom: '1px solid #eee',
              background: selected ? '#eef' : 'transparent',
              cursor: 'pointer',
            }}
            onClick={() => onSelect(repo.id)}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: selected ? 600 : 400 }}>{repo.name}</div>
              <div style={{ fontSize: 11, color: '#666' }}>{repo.path}</div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(repo.id);
              }}
            >
              삭제
            </button>
          </li>
        );
      })}
    </ul>
  );
}
