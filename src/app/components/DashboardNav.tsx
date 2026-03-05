'use client';

import {Button} from "@radix-ui/themes";
import {HomeIcon, Notebook, PackageIcon, ReceiptIcon, MoreHorizontal, KeyIcon} from "lucide-react";
import Link from "next/link";
import {usePathname} from "next/navigation";

export default function DashboardNav(){
  const path = usePathname();
  
  const links = [
    {href: '/', label: 'Home', icon: <HomeIcon className="h-5 w-5"/>},
    {href: '/products', label: 'Products', icon:<PackageIcon className="h-5 w-5"/>},
    {href: '/invoices', label: 'Invoices', icon:<ReceiptIcon className="h-5 w-5"/>},
    {href: '/addresses', label: 'Wallets', icon: <Notebook className="h-5 w-5"/>},
    {href: '/access-codes', label: 'Codes', icon: <KeyIcon className="h-5 w-5"/>},
    {href: '/other', label: 'Other', icon: <MoreHorizontal className="h-5 w-5"/>},
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-50 transition-colors">
      <div className="flex overflow-x-auto scrollbar-hide">
        {links.map(l => {
          const active = l.href==='/' ? path === '/' || path === '/dashboard' : path.includes(l.href);
          return (
            <Link
              href={l.href}
              key={l.label}
              className={`flex flex-col items-center justify-center px-4 py-2 min-w-[72px] flex-shrink-0 transition-colors ${
                active 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {l.icon}
              <span className="text-[10px] mt-1 font-medium">{l.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
