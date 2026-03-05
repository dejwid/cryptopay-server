import {Button} from "@radix-ui/themes";
import {ReactNode} from "react";
import {useFormStatus} from 'react-dom';

export default function SubmitButton({children, size, className}:{children:ReactNode, size?:"2"|"3"|"4", className?:string}) {
  const status = useFormStatus();
  return (
    <>
      <Button
        type="submit"
        loading={status.pending}
        disabled={status.pending}
        size={size}
        className={className}
      >
        {children}
      </Button>
    </>
  );
}
