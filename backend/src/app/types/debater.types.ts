export interface Debater {
  id: string;
  name: string;
  description: string;
  model: string;
  systemPrompt: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}