import React, { useRef, useState } from "react";
import "./bulk-image-uploader.css";
import { resizeImage } from "../utils/resize-image";
import { FadeImage } from "./fade-image";
import type { TagOption, Thumb } from "../types";

function* chunkArray<T>(array: T[], chunkSize: number): Generator<T[], void> {
  for (let i = 0; i < array.length; i += chunkSize) {
    yield array.slice(i, i + chunkSize);
  }
}

const TAGS: TagOption[] = [
  { value: "nature", label: "Nature" },
  { value: "city", label: "City" },
  { value: "space", label: "Space" },
];

export const BulkImageUploaderChunking = () => {
  const [thumbs, setThumbs] = useState<Thumb[]>([]);
  const [selectedTag, setSelectedTag] = useState(TAGS[0].value);
  const [processedCount, setProcessedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const hasLoggedRef = useRef(false);
  const chunkSize = 5;

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    performance.mark("chunking-start");
    setThumbs([]);
    setProcessedCount(0);
    setTotalCount(files.length);
    hasLoggedRef.current = false;

    const generator = chunkArray(Array.from(files), chunkSize);

    let nextChunk = generator.next();
    while (!nextChunk.done) {
      const chunk = nextChunk.value;

      const processed = await Promise.all(
        chunk.map((file) => resizeImage(file))
      );

      if (!hasLoggedRef.current) {
        performance.mark("chunking-first-thumb");
        performance.measure(
          "FirstThumbChunking",
          "chunking-start",
          "chunking-first-thumb"
        );
        const entry = performance.getEntriesByName("FirstThumbChunking")[0];
        console.log(
          "⏱️ First thumb time (chunking):",
          entry.duration.toFixed(2),
          "ms"
        );
        hasLoggedRef.current = true;
      }

      setThumbs((prev) => [...prev, ...processed]);
      setProcessedCount((prev) => prev + processed.length);

      await new Promise(requestAnimationFrame);

      nextChunk = generator.next();
    }
  };

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
