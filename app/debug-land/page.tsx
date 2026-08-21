'use client';
import { useEffect, useState } from 'react';

/** Temporary: verifies the land raster pipeline in a real browser. */
export default function LandProbe() {
  const [info, setInfo] = useState<string>('working…');
  useEffect(() => {
    (async () => {
      try {
        const { getLandTexture } = await import('@/lib/geo/landTexture');
        const { canvas, width, height } = await getLandTexture(1024);
        const ctx = canvas.getContext('2d')!;
        const d = ctx.getImageData(0, 0, width, height).data;
        let land = 0, inland = 0, coast = 0;
        for (let i = 0; i < width * height; i++) {
          if (d[i * 4]! > 128) land++;
          if (d[i * 4 + 1]! > 40) inland++;
          if (d[i * 4 + 2]! > 40) coast++;
        }
        const total = width * height;
        // Sample a few known points: lon/lat -> px
        const at = (lon: number, lat: number) => {
          const x = Math.round(((lon + 180) / 360) * width);
          const y = Math.round(((90 - lat) / 180) * height);
          const j = (y * width + x) * 4;
          return `${d[j]},${d[j + 1]},${d[j + 2]}`;
        };
        setInfo(
          JSON.stringify({
            size: `${width}x${height}`,
            landFrac: +(land / total).toFixed(4),
            inlandFrac: +(inland / total).toFixed(4),
            coastFrac: +(coast / total).toFixed(4),
            sahara: at(10, 22),
            amazon: at(-60, -5),
            pacific: at(-140, 0),
            atlantic: at(-30, 20),
            beirut: at(35.5, 33.9),
            siberia: at(100, 62),
          }),
        );
        document.body.appendChild(canvas);
        canvas.style.cssText = 'width:900px;image-rendering:pixelated;display:block';
      } catch (e) {
        setInfo(`ERROR: ${(e as Error).message}\n${(e as Error).stack}`);
      }
    })();
  }, []);
  return <pre id="probe" style={{ color: '#0f0', background: '#000', padding: 12, fontSize: 12 }}>{info}</pre>;
}
