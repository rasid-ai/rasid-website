import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Auto-generated 1200×630 social share image (Open Graph). Next.js turns this
 * file convention into og:image + og:image:width/height/type/alt automatically —
 * no static asset and no `openGraph.images` entry needed. twitter-image.tsx
 * re-exports this so both cards share one design.
 *
 * Rendered by Satori (flexbox + a CSS subset only) at build time and cached.
 */
export const alt = 'RASID — GoPilot, the AI geospatial agent for Earth observation';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  const logo = await readFile(join(process.cwd(), 'public/logo/apple-touch-icon.png'));
  const logoSrc = `data:image/png;base64,${logo.toString('base64')}`;

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          background: 'linear-gradient(135deg, #060C0A 0%, #0c1a15 55%, #08120f 100%)',
          color: '#EAF2EE',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} width={60} height={60} alt="" />
          <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: 10 }}>RASID</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 82, fontWeight: 700, lineHeight: 1.05 }}>Seeing Earth, Smarter.</div>
          <div style={{ fontSize: 32, color: '#7FB8A6', marginTop: 28, maxWidth: 980, lineHeight: 1.3 }}>
            GoPilot — the AI geospatial agent. Ask in plain language; get the data, the models, and the answer.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 22, color: '#88a79b' }}>
          <span>rasid.ai</span>
          <span style={{ color: '#2f6b57' }}>|</span>
          <span>Earth observation · GeoAI</span>
        </div>
      </div>
    ),
    size,
  );
}
