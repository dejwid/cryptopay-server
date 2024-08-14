'use client';
import UploaderRow from "@/app/components/UploaderRow";
import {nameFromPath} from "@/libs/files";
import {Button, Progress} from "@radix-ui/themes";
import axios from "axios";
import {UploadIcon} from "lucide-react";
import {ChangeEvent, useEffect, useRef, useState} from "react";
import {ReactSortable} from "react-sortablejs";

const chunkSize = 1024 * 1024 * 5;

export default function Uploader({uploads:defaultUploads}:{uploads?:string[]|undefined}) {
  const [uploads,setUploads] = useState((defaultUploads||[]).map((l,i) => ({link:l,id:i.toString()})));
  console.log({defaultUploads,uploads});
  const [files, setFiles] = useState<File[]>([]);
  const [lastIndex, setLastIndex] = useState<number>(-1);
  const [activeFileIndex, setActiveFileIndex] = useState<number|null>(null);
  const [currentChunkIndex, setCurrentChunkIndex] = useState<number|null>(null);
  const [urls, setUrls] = useState<string[]>([]);
  const [key, setKey] = useState<string>('');
  const [uploadId, setUploadId] = useState<string>('');
  const [locations, setLocations] = useState<string[]>([]);
  const [fetchingUrls, setFetchingUrls] = useState<boolean>(false);
  const [ids, setIds] = useState<string[]>([]);
  const working = fetchingUrls || currentChunkIndex;

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const hasStuffToUpload = files.length >= lastIndex && files.length > 0;
    if (hasStuffToUpload && !activeFileIndex && !working) {
      setActiveFileIndex(lastIndex + 1);
    }
  }, [files]);

  useEffect(() => {
    if (urls.length > 0) {
      console.log('starting with chunk 0');
      setCurrentChunkIndex(0);
    }
  }, [urls]);

  useEffect(() => {
    if (activeFileIndex===null) return;
    setUrls([]);
    setFetchingUrls(true);
    const file = files[activeFileIndex];
    console.log('fetching pre-signed urls');
      axios
      .post('/api/upload/init', {filename: file.name, size: file.size})
      .then(response => {
        setUrls(response.data.urls as string[]);
        setKey(response.data.Key);
        setUploadId(response.data.UploadId);
        setCurrentChunkIndex(0);
        setFetchingUrls(false);
      });
  }, [activeFileIndex]);

  useEffect(() => {
    console.log('chunk changed to '+currentChunkIndex);
    if (currentChunkIndex !== null && activeFileIndex !== null) {
      const file = files[activeFileIndex];
      const totalChunks = Math.ceil(file.size / chunkSize);
      console.log(`uploading file: ${activeFileIndex}; chunk:${currentChunkIndex+1}/${totalChunks}`);
      const from = currentChunkIndex * chunkSize;
      const to = from + chunkSize;
      const blob = file.slice(from, to);
      const reader = new FileReader();
      reader.onload = () => {
        console.log('reading complete');
        if (reader.result) {
          uploadChunk(reader.result, totalChunks);
        }
      };
      // @ts-ignore
      reader.readAsArrayBuffer(blob);
    }
  }, [currentChunkIndex]);

  function uploadChunk(data: string|ArrayBuffer, totalChunks:number) {
    if (currentChunkIndex===null || activeFileIndex===null) {
      return;
    }
    const url = urls[currentChunkIndex];
    console.log('sending chunk to '+url);
    fetch(url, {
      method: 'PUT',
      body: data,
    }).then(response => {
      const isLastChunk = currentChunkIndex === totalChunks - 1;
      if (isLastChunk) {
        console.log('Finalizing');
        axios.post('/api/upload/complete', {
          key, uploadId,
        }).then(response => {
          setLocations(locations => [...locations, response.data.Location]);
          setIds(ids => [...ids, response.data.id]);
          // add to uploads
          setUploads(uploads => [...(uploads||[]),{link:response.data.Location,id:Date.now().toString()}]);
          const isLastFile = activeFileIndex === files.length - 1;
          if (isLastFile) {
            setActiveFileIndex(null);
            setCurrentChunkIndex(null);
          } else {
            console.log('ready for next file');
            setActiveFileIndex(activeFileIndex + 1);
            setCurrentChunkIndex(null);
          }
          setLastIndex(activeFileIndex);
        });
      } else {
        setCurrentChunkIndex(currentChunkIndex + 1);
      }
    });
  }

  function handleFileChange(ev: ChangeEvent<HTMLInputElement>) {
    const files = ev.target.files;
    console.log('change event', files);
    if (files && files.length > 0) {
      const newFiles = Array.from(files);
      setFiles(oldFiles => [...oldFiles, ...newFiles]);
    }
  }
  return (
    <>
      <div>
        <label htmlFor="fileIn">
          <Button type="button" asChild variant="surface">
            <div>
              <UploadIcon className="h-4 w-4" />
              <span>Upload files</span>
            </div>
          </Button>
        </label>
        <input id="fileIn" multiple className="hidden" type="file" ref={inputRef} onChange={handleFileChange}/>
        <div className="mt-2">
          <ReactSortable
            handle=".grip"
            list={uploads}
            setList={(uploads) => {
              const us = uploads.filter(u => u);
              console.log({us,uploads});
              setUploads(us);
            }}
            className="flex flex-col gap-1"
          >{uploads.map(file => {
            return (
              <UploaderRow
                key={file.id}
                name={nameFromPath(file.link)}
                progress={null}
                location={file.link}
                onDelete={() => {setUploads(prevUploads => (prevUploads || []).filter(u => u!==file)) }}
              />
            );
          })}</ReactSortable>
          <div className="flex flex-col gap-1 mt-1">
            {files.length > 0 && files.map((file, index) => {
              const progress = index === activeFileIndex && currentChunkIndex !== null ? (currentChunkIndex || 0) / Math.ceil(file.size / chunkSize) * 100 : null;
              if (locations[index]) return;
              return (
                <UploaderRow
                  key={file.name}
                  name={file.name}
                  onDelete={() => {}}
                  progress={progress}
                  location={locations[index]}
                />
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}