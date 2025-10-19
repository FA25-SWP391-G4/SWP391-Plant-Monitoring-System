import {
  LayoutDashboard,
  Bot,
  ShoppingCart,
  Calendar,
  UserCircle,
  CheckSquare,
  FileText,
  Table,
  FileStack,
  MessageSquare,
  Headphones,
  Mail,
} from "lucide-react";

export type SubmenuItem = {
  id: string;
  label: string;
  href?: string;
};

export type MenuItem = {
  id: string;
  label: string;
  icon: React.ElementType;
  hasSubmenu: boolean;
  href?: string;
  badge?: string;
  submenu?: SubmenuItem[];
};

export type MenuSection = {
  section: string;
  items: MenuItem[];
};

export const menuStructure: MenuSection[] = [
  {
    section: "MENU",
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
        hasSubmenu: false,
        href: "/admin",
      },
      {
        id: "ai-assistant",
        label: "AI Assistant",
        icon: Bot,
        badge: "NEW",
        hasSubmenu: false,
      },
      {
        id: "e-commerce",
        label: "E-commerce",
        icon: ShoppingCart,
        badge: "NEW",
        hasSubmenu: true,
        submenu: [
          { id: "products", label: "Products" },
          { id: "invoices", label: "Invoices", href: "/admin/invoices" },
        ],
      },
      {
        id: "calendar",
        label: "Calendar",
        icon: Calendar,
        hasSubmenu: false,
      },
      {
        id: "user-profile",
        label: "User Profile",
        icon: UserCircle,
        hasSubmenu: false,
        href: "/admin/profile",
      },
      {
        id: "task",
        label: "Task",
        icon: CheckSquare,
        hasSubmenu: true,
        submenu: [
          { id: "task-list", label: "List", href: "/admin/tasks/list" },
          { id: "task-kanban", label: "Kanban", href: "/admin/tasks/kanban" },
        ],
      },
      {
        id: "forms",
        label: "Forms",
        icon: FileText,
        hasSubmenu: true,
        submenu: [
          { id: "form-elements", label: "Form Elements" },
          { id: "form-layout", label: "Form Layout" },
        ],
      },
      {
        id: "tables",
        label: "Tables",
        icon: Table,
        hasSubmenu: true,
        submenu: [
          { id: "basic-table", label: "Basic Table" },
          { id: "data-table", label: "Data Table" },
        ],
      },
      {
        id: "pages",
        label: "Pages",
        icon: FileStack,
        hasSubmenu: true,
        submenu: [
          { id: "file-manager", label: "File Manager", href: "/admin/file-manager" },
          { id: "pricing", label: "Pricing Tables", href: "/admin/pricing" },
        ],
      },
    ],
  },
  {
    section: "SUPPORT",
    items: [
      {
        id: "chat",
        label: "Chat",
        icon: MessageSquare,
        hasSubmenu: false,
      },
      {
        id: "support-ticket",
        label: "Support Ticket",
        icon: Headphones,
        badge: "NEW",
        hasSubmenu: false,
      },
      {
        id: "email",
        label: "Email",
        icon: Mail,
        hasSubmenu: true,
        submenu: [
          { id: "inbox", label: "Inbox" },
          { id: "compose", label: "Compose" },
        ],
      },
    ],
  },
]
