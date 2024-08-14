'use client';
import {archiveProductAction} from "@/app/actions/actions";
import {AlertDialog, Button, Flex} from "@radix-ui/themes";
import {useRouter} from "next/navigation";

export default function ArchiveProductButton({productId}:{productId:string}) {
  const router = useRouter();
  return (
    <>
      <AlertDialog.Root>
        <AlertDialog.Trigger>
          <Button variant="surface" color="red">
            Archive
          </Button>
        </AlertDialog.Trigger>
        <AlertDialog.Content maxWidth="450px">
          <AlertDialog.Title>Archive</AlertDialog.Title>
          <AlertDialog.Description size="2">
            Product will not available to purchase but still accessible for exising customers.
            Are you sure you want to do this?
          </AlertDialog.Description>
          <Flex gap="3" mt="4" justify="end">
            <AlertDialog.Cancel>
              <Button variant="soft" color="gray">
                Cancel
              </Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action>
              <form action={async () => {
                await archiveProductAction(productId);
                router.refresh();
              }}>
                <Button variant="solid" color="red">
                  Archive
                </Button>
              </form>
            </AlertDialog.Action>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>
    </>
  );
}