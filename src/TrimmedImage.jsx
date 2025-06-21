import { useEffect, useRef, useState } from 'react';

function TrimmedImage({ src, alt = '', style = {}, ...props }) {
  const [trimmedSrc, setTrimmedSrc] = useState(null);
  const imgRef = useRef();

  useEffect(() => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.src = src;
    img.onload = () => {
      const w = img.width;
      const h = img.height;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, w, h);
      let minX = w, minY = h, maxX = 0, maxY = 0;
      let found = false;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4;
          if (data.data[i + 3] !== 0) {
            found = true;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }
      if (!found) {
        setTrimmedSrc(src);
        return;
      }
      const tw = maxX - minX + 1;
      const th = maxY - minY + 1;
      const trimmedCanvas = document.createElement('canvas');
      trimmedCanvas.width = tw;
      trimmedCanvas.height = th;
      const trimmedCtx = trimmedCanvas.getContext('2d');
      trimmedCtx.drawImage(canvas, minX, minY, tw, th, 0, 0, tw, th);
      setTrimmedSrc(trimmedCanvas.toDataURL());
    };
  }, [src]);

  return trimmedSrc ? (
    <img ref={imgRef} src={trimmedSrc} alt={alt} style={style} className="gsap-rebus-img" {...props} />
  ) : null;
}

export default TrimmedImage; 