import { memo, type CSSProperties, type JSX } from 'react';
import type { RegisteredRepo } from '@kampanela/shared';

type Props = {
  repos: RegisteredRepo[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
};

const EMPTY_STYLE: CSSProperties = { color: '#888', padding: 16 };
const LIST_STYLE: CSSProperties = { listStyle: 'none', padding: 0, margin: 0 };
const ITEM_BASE: CSSProperties = {
  display: 'flex',
  gap: 8,
  alignItems: 'center',
  padding: 8,
  borderBottom: '1px solid #1f2230',
  cursor: 'pointer',
};
const SUB_TEXT: CSSProperties = { fontSize: 11, color: '#888' };

export const RepoList = memo(function RepoList({
  repos,
  selectedId,
  onSelect,
  onRemove,
}: Props): JSX.Element {
  if (repos.length === 0) {
    return <div style={EMPTY_STYLE}>등록된 레포가 없습니다.</div>;
  }
  return (
    <ul style={LIST_STYLE}>
      {repos.map((repo) => {
        const selected = repo.id === selectedId;
        return (
          <li
            key={repo.id}
            style={{
              ...ITEM_BASE,
              background: selected ? '#212838' : 'transparent',
            }}
            onClick={() => onSelect(repo.id)}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: selected ? 600 : 400 }}>{repo.name}</div>
              <div style={SUB_TEXT}>{repo.path}</div>
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
});
