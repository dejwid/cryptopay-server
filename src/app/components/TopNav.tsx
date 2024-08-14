'use client';
import {TabNav} from "@radix-ui/themes";
import {HomeIcon, Notebook, PackageIcon, ReceiptIcon} from "lucide-react";
import {usePathname} from "next/navigation";

export default function TopNav() {
  const path = usePathname();
  return (
    <>
      <div className="flex mb-4">
        <div className="grow">
          <TabNav.Root>
            <TabNav.Link active={path === '/'} href="/">
              <HomeIcon className="mr-1 h-6" />
              Home
            </TabNav.Link>
            <TabNav.Link active={path.includes('/products')} href="/products">
              <PackageIcon className="mr-1 h-6" />
              Products
            </TabNav.Link>
            <TabNav.Link active={path.includes('/invoices')} href="/invoices">
              <ReceiptIcon className="mr-1 h-6" />
              Invoices
            </TabNav.Link>
            <TabNav.Link active={path === '/addresses'} href="/addresses">
              <Notebook className="mr-1 h-6" />
              Addresses
            </TabNav.Link>
            <TabNav.Link active={path === '/automations'} href="/automations">Automations</TabNav.Link>
          </TabNav.Root>
        </div>
      </div>
    </>
  );
}