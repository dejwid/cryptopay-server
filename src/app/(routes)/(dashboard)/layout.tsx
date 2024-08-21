import DashboardNav from "@/app/components/DashboardNav";
import Login from "@/app/components/Login";
import {auth} from "@/auth";
import {Theme} from "@radix-ui/themes";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./dashboard.css";
import '@radix-ui/themes/styles.css';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CryptoPay Server",
  // description: "Generated by create next app",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  return (
    <html lang="en">
      <body className={inter.className}>
        <Theme accentColor="blue">
          <div className="container grid grid-cols-12 gap-8 py-8">
            {session && (
              <div className="col-span-3">
                <DashboardNav/>
              </div>
            )}
            {session ? (
              <div className="col-span-9 p-6 border shadow rounded-lg">
                {children}
              </div>
            ) : (
              <div className="col-span-12">
                <Login />
              </div>
            )}
          </div>
        </Theme>
      </body>
    </html>
  );
}
