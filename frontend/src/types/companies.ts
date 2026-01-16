import { LucideIcon } from 'lucide-react';

export interface MenuItem {
  label: string;
  icon: LucideIcon;
  href: string;
  external?: boolean; // For admin links or external django views if needed
}

export interface Company {
  id: string;
  name: string;
  description: string;
  logo: string;
  menuItems: MenuItem[];
}
