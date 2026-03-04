'use client';

import {Button} from "@radix-ui/themes";
import {HomeIcon, Notebook, PackageIcon, ReceiptIcon, Workflow} from "lucide-react";
import Link from "next/link";
import {usePathname} from "next/navigation";

export default function DashboardNav(){
  const path = usePathname();
  const links = [
    {href: '/', label: 'Home', icon: <HomeIcon className="h-4 w-4"/>},
    {href: '/products', label: 'Products', icon:<PackageIcon className="h-4 w-4"/>},
    {href: '/invoices', label: 'Invoices', icon:<ReceiptIcon className="h-4 w-4"/>},
    {href: '/addresses', label: 'Wallets', icon: <Notebook className="h-4 w-4"/>},
    {href: '/automations', label: 'Automations', icon: <Workflow className="h-4 w-4"/>},
  ];
  return (
    <nav className="flex gap-1 bg-white px-2 py-3 border-b">
      {links.map(l => {
        const active = l.href=='/' ? path === '/' : path.includes(l.href);
        return (
          <Link
            href={l.href}
            key={l.label}
            className={"flex gap-2 items-center px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors"}
            style={active?{backgroundColor:'var(--accent-9)',color:'white'}:{}}
          >
            {l.icon}
            <span>{l.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
