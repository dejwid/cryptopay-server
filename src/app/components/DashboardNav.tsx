'use client';

import {Button} from "@radix-ui/themes";
import {HomeIcon, Notebook, PackageIcon, ReceiptIcon, Workflow, Menu, X, MailIcon} from "lucide-react";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {useState, useEffect} from "react";

export default function DashboardNav(){
  const path = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  
  const links = [
    {href: '/', label: 'Home', icon: <HomeIcon className="h-4 w-4"/>},
    {href: '/products', label: 'Products', icon:<PackageIcon className="h-4 w-4"/>},
    {href: '/invoices', label: 'Invoices', icon:<ReceiptIcon className="h-4 w-4"/>},
    {href: '/addresses', label: 'Wallets', icon: <Notebook className="h-4 w-4"/>},
    {href: '/automations', label: 'Automations', icon: <Workflow className="h-4 w-4"/>},
    {href: '/email-logs', label: 'Email Logs', icon: <MailIcon className="h-4 w-4"/>},
  ];

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [path]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (isOpen && !target.closest('.mobile-nav-container')) {
        setIsOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen]);

  return (
    <nav className="bg-white border-b relative">
      {/* Desktop Navigation */}
      <div className="hidden md:flex gap-1 px-2 py-3">
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
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden mobile-nav-container">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="font-semibold text-lg">CryptoPay</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 bg-white border-b shadow-lg z-50">
            <div className="flex flex-col py-2">
              {links.map(l => {
                const active = l.href=='/' ? path === '/' : path.includes(l.href);
                return (
                  <Link
                    href={l.href}
                    key={l.label}
                    className={"flex gap-3 items-center px-6 py-3 hover:bg-blue-50 transition-colors"}
                    style={active?{backgroundColor:'var(--accent-9)',color:'white'}:{}}
                    onClick={() => setIsOpen(false)}
                  >
                    {l.icon}
                    <span>{l.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
