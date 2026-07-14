// Client-side canvas clip recorder. Uses MediaRecorder + canvas.captureStream
// to grab a short clip of whatever is animating on the canvas at the moment.
// Prefers MP4 where the browser supports it; otherwise falls back to WebM.

const CANDIDATES = [
  // MP4 first — Safari and recent Chrome accept these.
  { mime: 'video/mp4;codecs=h264', ext: 'mp4' },
  { mime: 'video/mp4;codecs=avc1', ext: 'mp4' },
  { mime: 'video/mp4', ext: 'mp4' },
  // WebM fallback — universally supported in Chromium & Firefox.
  { mime: 'video/webm;codecs=vp9', ext: 'webm' },
  { mime: 'video/webm;codecs=vp8', ext: 'webm' },
  { mime: 'video/webm', ext: 'webm' },
];

function pickCodec(): { mime: string; ext: string } | null {
  if (typeof MediaRecorder === 'undefined') return null;
  for (const c of CANDIDATES) {
    if (MediaRecorder.isTypeSupported(c.mime)) return c;
  }
  return null;
}

export interface RecordOptions {
  durationMs?: number;
  fps?: number;
  filename?: string; // extension is auto-appended based on codec
}

export function recordCanvasClip(
  canvas: HTMLCanvasElement,
  opts: RecordOptions = {},
): Promise<void> {
  const durationMs = opts.durationMs ?? 5000;
  const fps = opts.fps ?? 30;
  const chosen = pickCodec();
  if (!chosen) {
    return Promise.reject(new Error('MediaRecorder not supported in this browser'));
  }
  const baseName = opts.filename ?? `octogate-clip-${Date.now()}`;
  // captureStream on an animating canvas emits frames at up to `fps`. If the
  // canvas isn't currently redrawing, no frames arrive and the file is empty.
  const stream = canvas.captureStream(fps);
  const recorder = new MediaRecorder(stream, {
    mimeType: chosen.mime,
    videoBitsPerSecond: 4_000_000,
  });
  const chunks: BlobPart[] = [];
  return new Promise((resolve, reject) => {
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };
    recorder.onerror = (e) =>
      reject((e as unknown as { error?: Error }).error ?? new Error('recorder error'));
    recorder.onstop = () => {
      if (chunks.length === 0) {
        reject(new Error('No data captured — canvas may not be animating'));
        return;
      }
      const blob = new Blob(chunks, { type: chosen.mime });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${baseName}.${chosen.ext}`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      resolve();
    };
    // start(timeslice) forces the recorder to emit dataavailable every
    // `timeslice` ms — this both proves frames are flowing AND avoids the
    // "empty file if the recorder is stopped before its first flush" bug.
    recorder.start(500);
    setTimeout(() => {
      try {
        recorder.stop();
      } catch (e) {
        reject(e as Error);
      }
    }, durationMs);
  });
}
