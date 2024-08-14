import {Button} from "@radix-ui/themes";
import {ReactNode} from "react";
import {useFormStatus} from 'react-dom';

export default function SubmitButton({
  children,
  size="3"
}:{
  children:ReactNode;
  size?:"4"|"3"|"2"
}) {
  const status = useFormStatus();
  return (
    <>
      <Button
        type="submit"
        loading={status.pending}
        disabled={status.pending}
        size={size}
      >
        {children}
      </Button>
    </>
  );
}