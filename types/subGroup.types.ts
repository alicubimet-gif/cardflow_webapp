export interface SubGroup {
  id: string;
  name: string;
  code?: string | null;
  status: "active" | "inactive";
  group: string;
  recordCount: number;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateSubGroupPayload {
  name: string;
  code?: string | null;
  status: "active" | "inactive";
  group: string;
}

export interface UpdateSubGroupPayload {
  name: string;
  code?: string | null;
  status: "active" | "inactive";
  group?: string;
}
