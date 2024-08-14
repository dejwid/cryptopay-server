'use client';
import {IconButton} from "@radix-ui/themes";
import {CopyIcon} from "lucide-react";
import toast from "react-hot-toast";

export default function CopyButton({text,size='md'}:{text:string,size?:'lg'|'md'|'sm'}) {
  return (
    <>
      <IconButton
        onClick={async () => {
          const input = document.createElement("input");
          input.style.display = 'none';
          input.value = text;
          document.body.appendChild(input);
          input.select();
          input.setSelectionRange(0, 99999);
          await navigator.clipboard.writeText(input.value);
          document.body.removeChild(input);
          toast.success('Copied to clipboard!');
        }}
        radius="full"
        size={size==='lg'?"3":(size==='md'?"2":(size==='sm')?'1':'1')}
        variant="outline">
        <CopyIcon className={size==='lg'?"h-6":(size==='md'?"h-4":(size==='sm')?'h-4':'h-4')} />
      </IconButton>
    </>
  );
}