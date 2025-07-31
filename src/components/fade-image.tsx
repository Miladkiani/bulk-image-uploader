import { memo, useState } from "react";
import type { Thumb } from "../types";

export interface FadeImageProps extends Thumb {
  alt?: string;
}

export const FadeImage = memo(({ url, alt, name, tag }: FadeImageProps) => {
  const [visible, setVisible] = useState(false);
  return (
    <div className="biu-thumb-outer">
      <img
        src={url}
        alt={alt || name}
        loading="lazy"
        className={`biu-thumb-img${visible ? " biu-thumb-visible" : ""}`}
        onLoad={() => setVisible(true)}
        width={100}
        height={100}
      />
      {tag && <div className="biu-tag-overlay">{tag}</div>}
      <div className="biu-thumb-label" title={name}>
        {name.length > 16 ? name.slice(0, 14) + "…" : name}
      </div>
    </div>
  );
});
