'use server';
import {auth, signIn, signOut} from "@/auth";
import {Button} from "@radix-ui/themes";

export default async function Login() {
  const session = await auth();
  return (
    <>
      <div className="flex gap-4">
        {session?.user?.image && (
          <div>
            <img src={session.user.image} alt="" className="h-8 rounded-md"/>
          </div>
        )}
        {session && (
          <form action={async () => {
            'use server';
            await signOut();
          }}>
            <Button>
              Logout
            </Button>
          </form>
        )}
        {!session && (
          <form action={async () => {
            'use server';
            await signIn('google');
          }}>
            <Button>
              Sign in with Google
            </Button>
          </form>
        )}
      </div>
    </>
  );
}