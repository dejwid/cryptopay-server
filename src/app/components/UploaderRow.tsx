import {Button, Progress, Spinner} from "@radix-ui/themes";
import {GripVerticalIcon, TrashIcon} from "lucide-react";

export default function UploaderRow({
  name,
  progress = null,
  location,
  onDelete,
}:{
  name:string;
  progress:null|number; // 1-100
  location:string;
  onDelete: () => void,
}) {
  return (
    <>
      <input type="hidden" name="uploads" value={location}/>
      <div className="flex items-center gap-2 border border-blue-200 bg-blue-50 p-2 rounded-md">
        <div>
          {location && (
            <button className="grip cursor-pointer p-2">
              <GripVerticalIcon className="text-gray-500"/>
            </button>
          )}
        </div>
        {location ? (
          <div className="grow">
            <div className="flex gap-2 items-center">
              <div className="grow overflow-x-auto">
                <div>{name}</div>
                <div className="text-xs text-black/70">
                  {location}
                </div>
              </div>
              <div className="pr-2 pl-4 border-l border-blue-200">
                <Button onClick={onDelete} type="button" variant="ghost" color="red">
                  <TrashIcon className="w-6 h-6"/>
                  Delete
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex grow">
            <div className="flex-grow">{name}</div>
            <div className="flex items-center">
              {progress !== null && (
                <div className="w-48">
                  {progress === 0 ? (
                    <Spinner/>
                  ) : (
                    <Progress size="3" value={progress}/>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}