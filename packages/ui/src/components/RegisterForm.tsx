import { useState, type DragEvent, type FormEvent, type JSX } from 'react';

type Props = {
  onSubmit: (input: { path: string; name?: string }) => Promise<void>;
};

export function RegisterForm({ onSubmit }: Props): JSX.Element {
  const [path, setPath] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!path.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({ path: path.trim(), ...(name.trim() ? { name: name.trim() } : {}) });
      setPath('');
      setName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLFormElement>) => {
    e.preventDefault();
    const text = e.dataTransfer.getData('text/plain');
    if (text) setPath(text);
  };

  return (
    <form
      onSubmit={handleSubmit}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      style={{ display: 'grid', gap: 8, padding: 16, border: '1px dashed #888' }}
    >
      <div style={{ fontSize: 12, color: '#666' }}>
        절대경로를 입력하거나, 텍스트로 드래그해서 드롭
      </div>
      <input
        placeholder="/Users/.../my-repo"
        value={path}
        onChange={(e) => setPath(e.target.value)}
        disabled={submitting}
      />
      <input
        placeholder="표시 이름 (선택)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={submitting}
      />
      <button type="submit" disabled={submitting || !path.trim()}>
        {submitting ? '등록 중...' : '등록'}
      </button>
      {error && <div style={{ color: 'crimson' }}>{error}</div>}
    </form>
  );
}
