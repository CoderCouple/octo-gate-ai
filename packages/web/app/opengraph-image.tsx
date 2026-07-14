import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'OctoGateAI — The CAPTCHA AI Can’t Read';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Renders a static 1200×630 PNG at request time. Terminal-green-on-black
// matches the dark-theme brand. Kept intentionally minimal — no external
// fonts, no images — because ImageResponse budgets bandwidth aggressively.
export default async function OGImage() {
  const dots: React.ReactElement[] = [];
  // Sparse dot backdrop — echoes the challenge aesthetic without being
  // heavy enough to blow the render budget.
  for (let i = 0; i < 260; i++) {
    const x = Math.round(Math.random() * 1200);
    const y = Math.round(Math.random() * 630);
    dots.push(
      <div
        key={i}
        style={{
          position: 'absolute',
          left: x,
          top: y,
          width: 3,
          height: 3,
          background: '#00ff41',
          opacity: 0.55,
        }}
      />,
    );
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#000000',
          color: '#00ff41',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          fontFamily: 'ui-monospace, Menlo, Consolas, monospace',
        }}
      >
        {dots}

        {/* Portal glyph — matches the site favicon */}
        <div
          style={{
            position: 'absolute',
            top: 56,
            left: 60,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              border: '3px solid #00ff41',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: 3,
              padding: 6,
            }}
          >
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                style={{ width: 4, height: 4, borderRadius: 2, background: '#00ff41' }}
              />
            ))}
          </div>
          <div
            style={{
              fontSize: 26,
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              fontWeight: 700,
            }}
          >
            OctoGateAI
          </div>
        </div>

        {/* Headline */}
        <div
          style={{
            position: 'absolute',
            left: 60,
            top: 200,
            right: 60,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          <div
            style={{
              fontSize: 120,
              lineHeight: 1,
              fontWeight: 900,
              letterSpacing: '-0.02em',
              color: '#ffffff',
            }}
          >
            The CAPTCHA
          </div>
          <div
            style={{
              fontSize: 120,
              lineHeight: 1,
              fontWeight: 900,
              letterSpacing: '-0.02em',
              color: '#00ff41',
            }}
          >
            AI can’t read.
          </div>
          <div
            style={{
              marginTop: 32,
              fontSize: 26,
              lineHeight: 1.4,
              color: '#c7ffce',
              maxWidth: 900,
            }}
          >
            Humans read the moving word in ~1s. Frontier models miss on
            screenshots, frames, and video.
          </div>
        </div>

        {/* Footer strip */}
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            left: 60,
            right: 60,
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 18,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: '#c7ffce',
          }}
        >
          <span>Motion-based CAPTCHA · v0</span>
          <span>octogate.dev</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
