import React, { useEffect, useRef, useState } from "react";
import "./bulk-image-uploader.css";
import type { TagOption, Thumb } from "../types";
import { FadeImage } from "./fade-image";

const TAGS: TagOption[] = [
  { value: "nature", label: "Nature" },
  { value: "city", label: "City" },
  { value: "space", label: "Space" },
];

const defaultTag = TAGS[0];

function* chunkGenerator<T>(array: T[], chunkSize: number = 5): Generator<T[]> {
  for (let i = 0; i < array.length; i += chunkSize) {
    yield array.slice(i, i + chunkSize);
  }
}

export const BulkImageUploaderChunkingWithWorker: React.FC = () => {
  const [thumbs, setThumbs] = useState<Thumb[]>([]);
  const [selectedTag, setSelectedTag] = useState<string>(defaultTag.value);
  const [processedCount, setProcessedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const workerRef = useRef<Worker | null>(null);
  const hasFirstThumbRendered = useRef(false);

  const initWorker = () => {
    if (!workerRef.current) {
      workerRef.current = new Worker(
        new URL("../worker/image-uploader-worker.js", import.meta.url)
      );
    }
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (!files.length) return;

    setThumbs([]);
    setProcessedCount(0);
    setTotalCount(files.length);
    hasFirstThumbRendered.current = false;

    performance.mark("start-upload");

    initWorker();
    const chunkSize = 5;
    const chunks = chunkGenerator(files, chunkSize);

    for (const chunk of chunks) {
      await new Promise<void>((resolve) => {
        const handleMessage = (event: MessageEvent) => {
          const data = event.data;
          if (!data || !Array.isArray(data.thumbs)) {
            console.warn("Worker returned unexpected data:", data);
            resolve();
            return;
          }

          setThumbs((prev) => [...prev, ...data.thumbs]);
          setProcessedCount((prev) => prev + data.thumbs.length);

          workerRef.current?.removeEventListener("message", handleMessage);
          resolve();
        };

        workerRef.current?.addEventListener("message", handleMessage);
        workerRef.current?.postMessage({ files: chunk });
      });
    }
  };

  useEffect(() => {
    if (thumbs.length > 0 && !hasFirstThumbRendered.current) {
      hasFirstThumbRendered.current = true;

      performance.mark("first-thumb");
      performance.measure(
        "Time to first thumbnail (Chunking+Web Worker)",
        "start-upload",
        "first-thumb"
      );

      const measure = performance.getEntriesByName(
        "Time to first thumbnail (Chunking+Web Worker)"
      )[0];
      console.log(
        `🕒 First thumbnail appeared in ${Math.round(measure.duration)} ms`
      );
    }
  }, [thumbs]);

  const renderStatus = () => {
    if (totalCount === 0) return "📂 No images selected.";
    if (processedCount < totalCount)
      return `🟢 Processing... (${processedCount} of ${totalCount})`;
    return "✅ All images processed.";
  };

  return (
    <div className="biu-container">
      <label className="biu-label">
        Upload Images
        <input type="file" accept="image/*" multiple onChange={handleChange} />
      </label>

      <label className="biu-label">
        Tag All Images:
        <select
          className="biu-tag-select"
          disabled={totalCount === 0}
          value={selectedTag}
          onChange={(e) => setSelectedTag(e.target.value)}
        >
          {TAGS.map((tag) => (
            <option key={tag.value} value={tag.value}>
              {tag.label}
            </option>
          ))}
        </select>
      </label>

      <p className="biu-processing">{renderStatus()}</p>

      <div className="biu-thumb-list">
        {thumbs.map((thumb) => (
          <FadeImage key={thumb.id} {...thumb} tag={selectedTag} />
        ))}
      </div>
    </div>
  );
};
