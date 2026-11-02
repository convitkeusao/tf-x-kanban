import {
  CalendarDays,
  Eye,
  KeyRound,
  ListTodo,
  LogOut,
  Mail,
  Plus,
  Search,
  Trash2,
  UserRound,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';

type IconName = 'tasks' | 'user' | 'plus' | 'search' | 'calendar' | 'team' | 'logout' | 'key' | 'invite' | 'trash' | 'eye';

const icons: Record<IconName, LucideIcon> = {
  tasks: ListTodo,
  user: UserRound,
  plus: Plus,
  search: Search,
  calendar: CalendarDays,
  team: UsersRound,
  logout: LogOut,
  key: KeyRound,
  invite: Mail,
  trash: Trash2,
  eye: Eye,
};

export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const IconComponent = icons[name];
  return <IconComponent aria-hidden="true" size={size} strokeWidth={1.8} />;
}
