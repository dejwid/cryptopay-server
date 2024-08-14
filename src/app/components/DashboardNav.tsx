'use client';

import Login from "@/app/components/Login";
import {Button} from "@radix-ui/themes";
import {HomeIcon, Notebook, PackageIcon, ReceiptIcon, Workflow} from "lucide-react";
import Link from "next/link";
import {usePathname} from "next/navigation";

export default function DashboardNav(){
  const path = usePathname();
  const links = [
    {href: '/', label: 'Home', icon: <HomeIcon className="mr-1 h-6"/>},
    {href: '/products', label: 'Products', icon:<PackageIcon className="mr-1 h-6"/>},
    {href: '/invoices', label: 'Invoices', icon:<ReceiptIcon className="mr-1 h-6"/>},
    {href: '/addresses', label: 'Wallets', icon: <Notebook className="mr-1 h-6"/>},
    {href: '/automations', label: 'Automations', icon: <Workflow className="mr-1 h-6"/>},
  ];
  return (
    <aside className="bg-white p-4 border shadow rounded-lg top-8 sticky">
      <nav className="flex flex-col">
        {links.map(l => {
          const active = l.href=='/' ? path === '/' : path.includes(l.href);
          return (
            <Link
              href={l.href}
              key={l.label}
              className={"w-full flex gap-2 items-center p-4 rounded-lg hover:bg-blue-50"}
              style={active?{backgroundColor:'var(--accent-9)',color:'white'}:{}}
            >
                {l.icon}
                {l.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}