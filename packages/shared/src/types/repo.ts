export type RegisteredRepo = {
  id: string;
  name: string;
  path: string;
  role?: string;
  addedAt: string;
};

export type RegistryFile = {
  version: 1;
  repos: RegisteredRepo[];
};
