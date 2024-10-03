function UploadObject({url}:{url:string}) {
  if (url.endsWith('.jpg') || url.endsWith('.png')) {
    return <img src={url} className="h-full rounded-md" alt=""/>
  }
  if (url.endsWith('.mp4')) {
    return <video src={url} className="rounded-md" controls preload="metadata" />
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