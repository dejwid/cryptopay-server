import DashboardNav from "@/app/components/DashboardNav";
import Login from "@/app/components/Login";
import ThemeToggle from "@/app/components/ThemeToggle";
import {auth, signOut} from "@/auth";
import {Theme} from "@radix-ui/themes";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./dashboard.css";
import '@radix-ui/themes/styles.css';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CryptoPay Server",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const userAllowed = session && session.user && session.user.email === 'dawid.paszko@gmail.com';
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Theme accentColor="blue" hasBackground={false}>
          <div className="min-h-screen bg-white dark:bg-gray-950 transition-colors">
            {session && userAllowed && (
              <main className="pb-20">
                {children}
              </main>
            )}
            {(session && !userAllowed) && (
              <main className="max-w-2xl mx-auto px-4 py-8">
                <h1 className="text-2xl mb-4 dark:text-white">Hey there! 🎉</h1>
                <p className="mb-2 dark:text-gray-300">Thanks for trying to log in!<br/>However, it looks like this app was set up for a specific Google
                  account.</p>
                <p className="dark:text-gray-300">If you think you should have access or have any questions,<br/>feel free to reach out to me!
                  <a
                    href="mailto:dawid.paszko@gmail.com?subject=Regarding cryptopay server"
                    className="text-blue-600 dark:text-blue-400 ml-1 border-b border-blue-600/40 dark:border-blue-400/40">dawid.paszko@gmail.com</a>
                </p>
                <div className="border-t dark:border-gray-700 mt-4 pt-4">
                  <form action={async () => {
                    'use server';
                    await signOut();
                  }}>
                    <button className="bg-gray-200 dark:bg-gray-700 dark:text-white px-4 py-2 rounded-md cursor-pointer">
                      Logout
                    </button>
                  </form>
                </div>
              </main>
            )}
            {!session && (
              <main className="max-w-md mx-auto px-4 py-8">
                <Login/>
              </main>
            )}
            {/* Bottom Navigation */}
            {session && userAllowed && <DashboardNav />}
          </div>
        </Theme>
      </body>
    </html>
  );
}
