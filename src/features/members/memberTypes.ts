export type TeamMember = {
  id: string;
  name: string;
  role: string;
  color: string;
  email?: string;
  isManager?: boolean;
  joinedAt?: string;
};
