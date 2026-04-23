export type AgentStatus =
  | 'idle'
  | 'thinking'
  | 'tool_running'
  | 'waiting_user'
  | 'error'
  | 'stopped';

export type AgentState = {
  repoId: string;
  repoPath: string;
  status: AgentStatus;
  currentTask?: string;
  lastEventAt: string;
  pid?: number;
  sessionId?: string;
};
