import {DownloadCloud} from "lucide-react";

function UploadObject({url}:{url:string}) {
  if (url.endsWith('.jpg') || url.endsWith('.png')) {
    return <img src={url} className="h-full rounded-md" alt=""/>
  }
  if (url.endsWith('.mp4')) {
    return <video src={url} className="rounded-md" controls preload="metadata" />
  }
  if (url.endsWith('.zip')) {
    return (
      <div className="p-2 border-t border-gray-400">
        <a href={url} target="_blank" className="bg-blue-400 rounded-md px-4 py-2 inline-flex gap-2 items-center text-white">
          Download
          <DownloadCloud />
        </a>
      </div>
    );
  }
  return <span>{url.split('/').pop()}</span>
}

export default function Upload({url}:{url:string}) {
  return (
    <div className="bg-blue-100 rounded-md">
      <UploadObject url={url} />
    </div>
  );
}