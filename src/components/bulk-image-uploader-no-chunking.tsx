import React, { useEffect, useState } from "react";
import type { TagOption, Thumb } from "../types";
import { resizeImage } from "../utils/resize-image";
import "./bulk-image-uploader.css";
import { FadeImage } from "./fade-image";

const TAGS: TagOption[] = [
  { value: "nature", label: "Nature" },
  { value: "city", label: "City" },
  { value: "space", label: "Space" },
];

export const BulkImageUploaderNoChunking = () => {
  const [thumbs, setThumbs] = useState<Thumb[]>([]);
  const [selectedTag, setSelectedTag] = useState(TAGS[0].value);
  const [processedCount, setProcessedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    performance.mark("RenderingFirstThumb-start");
    setThumbs([]);
    setProcessedCount(0);
    setTotalCount(files.length);

    const resizedResults: Thumb[] = [];

    for (const file of Array.from(files)) {
      const resized = await resizeImage(file);

      resizedResults.push(resized);
      setProcessedCount((prev) => prev + 1);
    }

    setThumbs(resizedResults);
  };

  useEffect(() => {
    if (thumbs.length > 0) {
      requestAnimationFrame(() => {
        performance.mark("RenderingFirstThumb-set");
        performance.measure(
          "RenderingFirstThumb",
          "RenderingFirstThumb-start",
          "RenderingFirstThumb-set"
        );
        const entry = performance.getEntriesByName("RenderingFirstThumb")[0];
        console.log(
          "⏱️ All thumbnails appeared (no-chunking):",
          entry.duration.toFixed(2),
          "ms"
        );
      });
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
