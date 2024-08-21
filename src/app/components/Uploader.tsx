'use client';
import UploaderRow from "@/app/components/UploaderRow";
import {nameFromPath} from "@/libs/files";
import {Button} from "@radix-ui/themes";
import axios from "axios";
import {max} from "lodash";
import {UploadIcon} from "lucide-react";
import {ChangeEvent, useEffect, useRef, useState} from "react";
import {ReactSortable} from "react-sortablejs";

const chunkSize = 1024 * 1024 * 5;
const concurrentChunksUpload = 5;

export default function Uploader({uploads:defaultUploads}:{uploads?:string[]|undefined}) {
  const [uploads,setUploads] = useState((defaultUploads||[]).map((l,i) => ({link:l,id:i.toString()})));
  const [files, setFiles] = useState<File[]>([]);
  const [lastIndex, setLastIndex] = useState<number>(-1);
  const [activeFileIndex, setActiveFileIndex] = useState<number|null>(null);
  const [activeChunkIndexes, setActiveChunkIndexes] = useState<number[]>([]);
  const [completedChunkIndexes, setCompletedChunksIndexes] = useState<number[]>([]);
  const [urls, setUrls] = useState<string[]>([]);
  const [key, setKey] = useState<string>('');
  const [uploadId, setUploadId] = useState<string>('');
  const [locations, setLocations] = useState<string[]>([]);
  const [fetchingUrls, setFetchingUrls] = useState<boolean>(false);
  const [ids, setIds] = useState<string[]>([]);
  const working = fetchingUrls || activeChunkIndexes.length;

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const hasFileToUpload = files.length >= lastIndex && files.length > 0;
    if (hasFileToUpload && !activeFileIndex && !working) {
      setActiveFileIndex(lastIndex + 1);
    }
  }, [files]);

  useEffect(() => {
    if (activeFileIndex===null) return;
    setUrls([]);
    setCompletedChunksIndexes([]);
    setActiveChunkIndexes([]);
    setFetchingUrls(true);
    const file = files[activeFileIndex];
    console.log('fetching pre-signed urls');
    axios
    .post('/api/upload/init', {filename: file.name, size: file.size})
    .then(response => {
      setUrls(response.data.urls as string[]);
      setKey(response.data.Key);
      setUploadId(response.data.UploadId);
      setFetchingUrls(false);
    });
  }, [activeFileIndex]);

  function totalChunks() {
    if (activeFileIndex===null) return 0;
    const file = files[activeFileIndex];
    if (!file) return 0;
    return Math.ceil(file.size / chunkSize);
  }

  function range(from:number,toIncluding:number) {
    const indexes = [];
    for (let i = from; i<=toIncluding; i++) {
      indexes.push(i);
    }
    return indexes;
  }

  function getNextChunkIndexes() {
    const lastCompletedIndex = max(completedChunkIndexes);
    const fromIndex = lastCompletedIndex!==undefined ? lastCompletedIndex+1 : 0;
    const toIndex = Math.min(fromIndex+concurrentChunksUpload-1, totalChunks()-1);
    console.log({fromIndex, toIndex, total:totalChunks(), lastCompletedIndex});
    if (fromIndex > totalChunks()-1) {
      return [];
    }
    return range(fromIndex, toIndex);
  }

  useEffect(() => {
    if (urls.length > 0 && activeFileIndex!==null) {
      console.log('we have urls',{urls});
      setActiveChunkIndexes(getNextChunkIndexes());
    }
  }, [urls]);

  useEffect(() => {
    if (urls.length === 0) {
      return;
    }
    if (activeChunkIndexes.length === 0 && completedChunkIndexes.length < totalChunks()) {
      const nextChunks = getNextChunkIndexes();
      if (nextChunks.length) {
        setActiveChunkIndexes(nextChunks);
      }
      return;
    }
    console.log('activeChunkIndexes:'+activeChunkIndexes.join(','));
    const uploadPromises:Promise<number>[] = [];
    activeChunkIndexes.map(i => {
      uploadPromises.push(
        new Promise((resolve, reject) => {
          readChunk(i)?.then(({index,result}) => {
            uploadChunk(index, result).then(uploadedChunkIndex => {
              resolve(uploadedChunkIndex);
            });
          });
        })
      );
    });

    if (uploadPromises.length > 0) {
      Promise.all(uploadPromises).then(chunkIndexes => {
        setActiveChunkIndexes(prev => prev.filter(i => !chunkIndexes.includes(i)));
        setCompletedChunksIndexes(prev => [...prev, ...chunkIndexes]);
      });
    }
  }, [activeChunkIndexes]);

  useEffect(() => {
    if (files.length === 0) return;
    const totalChunks = Math.ceil(files[activeFileIndex || 0].size / chunkSize);
    if (completedChunkIndexes.length === totalChunks) {
      finalizeAndUpdateState();
    }
  }, [completedChunkIndexes]);

  function finalizeAndUpdateState() {
    finalizeFile().then(({id, link}) => {
      setLocations(locations => [...locations, link]);
      setIds(ids => [...ids, id]);
      setUploads(uploads => [...(uploads || []), {link, id: Date.now().toString()}]);
      const isLastFile = activeFileIndex === files.length - 1;
      if (isLastFile) {
        setActiveFileIndex(null);
      } else {
        console.log('next file');
        setActiveFileIndex((activeFileIndex||0) + 1);
      }
      setLastIndex(activeFileIndex||0);
    });
  }

  function finalizeFile(): Promise<{ link:string;id:string; }> {
    return new Promise((resolve, reject) => {
      axios.post('/api/upload/complete', {
        key, uploadId,
      }).then(response => {
        resolve({
          link: response.data.Location,
          id: response.data.id,
        });
      });
    });

  }

  function readChunk(index:number):Promise<{index:number;result:string|ArrayBuffer;}> {
    return new Promise((resolve, reject) => {
      const file = files[activeFileIndex || 0];
      const from = index * chunkSize;
      const to = from + chunkSize;
      const blob = file.slice(from, to);
      const reader = new FileReader();
      reader.onload = () => {
        // console.log('reading complete');
        if (reader.result) {
          resolve({index, result:reader.result});
        }
      };
      // @ts-ignore
      reader.readAsArrayBuffer(blob);
    });
  }

  async function uploadChunk(chunkIndex: number, data:string|ArrayBuffer) {
    console.log('uploading chunk', {chunkIndex, urls});
    const url = urls[chunkIndex]+'&i='+chunkIndex;
    console.log({chunkIndex});
    await fetch(url, {
      method: 'PUT',
      body: data,
    });
    return chunkIndex;
  }

  function _uploadChunk(chunkIndex: number, data: string|ArrayBuffer, totalChunks:number) {

    if (activeFileIndex===null) {
      return;
    }

    const url = urls[chunkIndex]+'&i='+chunkIndex;
    console.log(`uploading chunk: ${chunkIndex}`);
    fetch(url, {
      method: 'PUT',
      body: data,
    }).then(() => {
      const isLastChunk = chunkIndex === totalChunks - 1;
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
          } else {
            console.log('ready for next file');
            setActiveFileIndex(chunkIndex + 1);
          }
          setLastIndex(activeFileIndex);
        });
      }
      // else if (chunkIndex === currentChunkIndex + concurrentChunksUpload -1 || chunkIndex === totalChunks - 1) {
      //   setCurrentChunkIndex(currentChunkIndex + concurrentChunksUpload);
      // }
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
              // console.log({us,uploads});
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
              const completed = (completedChunkIndexes?.length) || 0;
              const totalChunks = Math.ceil(file.size / chunkSize);
              // console.log({completed,totalChunks,s:file.size/1024/1024});
              const progress = index === activeFileIndex ? completed / totalChunks * 100 : null;
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