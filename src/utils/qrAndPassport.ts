import { ElderGuardrails, QlooEntitySubtype } from '../../shared/types';

// Reuse our verified ISO/IEC 18004 Scannable QR Code Matrix Generator (Byte mode, ECC Level L, Versions 1–14)
interface VersionSpec {
  version: number;
  ecCodewordsPerBlock: number;
  group1Blocks: number;
  group1DataCw: number;
  group2Blocks: number;
  group2DataCw: number;
  alignCenters: number[];
  versionInfoBits?: number;
}

const VERSION_SPECS: VersionSpec[] = [
  { version: 1, ecCodewordsPerBlock: 7, group1Blocks: 1, group1DataCw: 19, group2Blocks: 0, group2DataCw: 0, alignCenters: [] },
  { version: 2, ecCodewordsPerBlock: 10, group1Blocks: 1, group1DataCw: 34, group2Blocks: 0, group2DataCw: 0, alignCenters: [6, 18] },
  { version: 3, ecCodewordsPerBlock: 15, group1Blocks: 1, group1DataCw: 55, group2Blocks: 0, group2DataCw: 0, alignCenters: [6, 22] },
  { version: 4, ecCodewordsPerBlock: 20, group1Blocks: 1, group1DataCw: 80, group2Blocks: 0, group2DataCw: 0, alignCenters: [6, 26] },
  { version: 5, ecCodewordsPerBlock: 26, group1Blocks: 1, group1DataCw: 108, group2Blocks: 0, group2DataCw: 0, alignCenters: [6, 30] },
  { version: 6, ecCodewordsPerBlock: 18, group1Blocks: 2, group1DataCw: 68, group2Blocks: 0, group2DataCw: 0, alignCenters: [6, 34] },
  { version: 7, ecCodewordsPerBlock: 20, group1Blocks: 2, group1DataCw: 78, group2Blocks: 0, group2DataCw: 0, alignCenters: [6, 22, 38], versionInfoBits: 0x07c94 },
  { version: 8, ecCodewordsPerBlock: 24, group1Blocks: 2, group1DataCw: 97, group2Blocks: 0, group2DataCw: 0, alignCenters: [6, 24, 42], versionInfoBits: 0x085bc },
  { version: 9, ecCodewordsPerBlock: 30, group1Blocks: 2, group1DataCw: 116, group2Blocks: 0, group2DataCw: 0, alignCenters: [6, 26, 46], versionInfoBits: 0x09a99 },
  { version: 10, ecCodewordsPerBlock: 18, group1Blocks: 2, group1DataCw: 68, group2Blocks: 2, group2DataCw: 69, alignCenters: [6, 28, 50], versionInfoBits: 0x0a4d3 },
  { version: 11, ecCodewordsPerBlock: 20, group1Blocks: 4, group1DataCw: 81, group2Blocks: 0, group2DataCw: 0, alignCenters: [6, 30, 54], versionInfoBits: 0x0bbf6 },
  { version: 12, ecCodewordsPerBlock: 24, group1Blocks: 2, group1DataCw: 92, group2Blocks: 2, group2DataCw: 93, alignCenters: [6, 32, 58], versionInfoBits: 0x0c762 },
  { version: 13, ecCodewordsPerBlock: 26, group1Blocks: 4, group1DataCw: 107, group2Blocks: 0, group2DataCw: 0, alignCenters: [6, 34, 62], versionInfoBits: 0x0d847 },
  { version: 14, ecCodewordsPerBlock: 30, group1Blocks: 3, group1DataCw: 115, group2Blocks: 1, group2DataCw: 116, alignCenters: [6, 26, 46, 66], versionInfoBits: 0x0e60d },
];

function gfMul(x: number, y: number): number {
  let z = 0;
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d);
    z ^= ((y >>> i) & 1) * x;
  }
  return z;
}

function rsDivisor(degree: number): number[] {
  const result = new Array<number>(degree).fill(0);
  result[degree - 1] = 1;
  let root = 1;
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < degree; j++) {
      result[j] = gfMul(result[j], root);
      if (j + 1 < degree) result[j] ^= result[j + 1];
    }
    root = gfMul(root, 0x02);
  }
  return result;
}

function rsRemainder(data: number[], divisor: number[]): number[] {
  const result = new Array<number>(divisor.length).fill(0);
  for (const b of data) {
    const factor = b ^ result.shift()!;
    result.push(0);
    divisor.forEach((coef, idx) => {
      result[idx] ^= gfMul(coef, factor);
    });
  }
  return result;
}

export function generatePassportQrMatrix(text: string): boolean[][] {
  const utf8 = Array.from(new TextEncoder().encode(text));
  let spec = VERSION_SPECS[VERSION_SPECS.length - 1];
  for (const candidate of VERSION_SPECS) {
    const cap = candidate.group1Blocks * candidate.group1DataCw + candidate.group2Blocks * candidate.group2DataCw;
    const countBits = candidate.version <= 9 ? 8 : 16;
    if (4 + countBits + utf8.length * 8 <= cap * 8) {
      spec = candidate;
      break;
    }
  }

  const cap = spec.group1Blocks * spec.group1DataCw + spec.group2Blocks * spec.group2DataCw;
  const bits: number[] = [];
  const pushBits = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1);
  };
  pushBits(0b0100, 4);
  pushBits(utf8.length, spec.version <= 9 ? 8 : 16);
  for (const byte of utf8) pushBits(byte, 8);
  pushBits(0, Math.min(4, cap * 8 - bits.length));
  while (bits.length % 8 !== 0) bits.push(0);

  const dataBytes: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let b = 0;
    for (let j = 0; j < 8; j++) b = (b << 1) | bits[i + j];
    dataBytes.push(b);
  }
  let pad = 0;
  while (dataBytes.length < cap) {
    dataBytes.push(pad % 2 === 0 ? 0xec : 0x11);
    pad++;
  }

  const divisor = rsDivisor(spec.ecCodewordsPerBlock);
  const dataBlocks: number[][] = [];
  const ecBlocks: number[][] = [];
  let offset = 0;
  for (let i = 0; i < spec.group1Blocks; i++) {
    const blk = dataBytes.slice(offset, offset + spec.group1DataCw);
    offset += spec.group1DataCw;
    dataBlocks.push(blk);
    ecBlocks.push(rsRemainder(blk, divisor));
  }
  for (let i = 0; i < spec.group2Blocks; i++) {
    const blk = dataBytes.slice(offset, offset + spec.group2DataCw);
    offset += spec.group2DataCw;
    dataBlocks.push(blk);
    ecBlocks.push(rsRemainder(blk, divisor));
  }

  const allCw: number[] = [];
  const maxData = Math.max(spec.group1DataCw, spec.group2DataCw);
  for (let c = 0; c < maxData; c++) {
    for (const blk of dataBlocks) if (c < blk.length) allCw.push(blk[c]);
  }
  for (let c = 0; c < spec.ecCodewordsPerBlock; c++) {
    for (const blk of ecBlocks) allCw.push(blk[c]);
  }

  const size = spec.version * 4 + 17;
  const modules: boolean[][] = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
  const isFunc: boolean[][] = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
  const setFn = (x: number, y: number, dark: boolean) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    modules[y][x] = dark;
    isFunc[y][x] = true;
  };

  const drawFinder = (cx: number, cy: number) => {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const dist = Math.max(Math.abs(dx), Math.abs(dy));
        setFn(cx + dx, cy + dy, dist !== 2 && dist !== 4);
      }
    }
  };
  drawFinder(3, 3);
  drawFinder(size - 4, 3);
  drawFinder(3, size - 4);

  for (let i = 0; i < size; i++) {
    if (!isFunc[6][i]) setFn(i, 6, i % 2 === 0);
    if (!isFunc[i][6]) setFn(6, i, i % 2 === 0);
  }

  const centers = spec.alignCenters;
  for (let i = 0; i < centers.length; i++) {
    for (let j = 0; j < centers.length; j++) {
      if ((i === 0 && j === 0) || (i === 0 && j === centers.length - 1) || (i === centers.length - 1 && j === 0)) continue;
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          setFn(centers[j] + dx, centers[i] + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
        }
      }
    }
  }

  for (let i = 0; i <= 8; i++) {
    if (i !== 6) {
      setFn(8, i, false);
      setFn(i, 8, false);
    }
  }
  for (let i = 0; i < 8; i++) {
    setFn(size - 1 - i, 8, false);
    setFn(8, size - 1 - i, false);
  }
  setFn(8, size - 8, true);

  if (spec.version >= 7 && spec.versionInfoBits !== undefined) {
    for (let i = 0; i < 18; i++) {
      const bit = ((spec.versionInfoBits >>> i) & 1) !== 0;
      const a = size - 11 + (i % 3);
      const b = Math.floor(i / 3);
      setFn(a, b, bit);
      setFn(b, a, bit);
    }
  }

  let bitIdx = 0;
  const totalBits = allCw.length * 8;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++) {
      for (let j = 0; j < 2; j++) {
        const x = right - j;
        const upward = ((right + 1) & 2) === 0;
        const y = upward ? size - 1 - vert : vert;
        if (!isFunc[y][x] && bitIdx < totalBits) {
          modules[y][x] = ((allCw[bitIdx >>> 3] >>> (7 - (bitIdx & 7))) & 1) !== 0;
          bitIdx++;
        }
      }
    }
  }

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!isFunc[y][x] && (x + y) % 2 === 0) modules[y][x] = !modules[y][x];
    }
  }

  const fmt = 0x77c4;
  const bitAt = (idx: number) => ((fmt >>> idx) & 1) !== 0;
  for (let i = 0; i <= 5; i++) setFn(8, i, bitAt(i));
  setFn(8, 7, bitAt(6));
  setFn(8, 8, bitAt(7));
  setFn(7, 8, bitAt(8));
  for (let i = 9; i < 15; i++) setFn(14 - i, 8, bitAt(i));
  for (let i = 0; i < 8; i++) setFn(size - 1 - i, 8, bitAt(i));
  for (let i = 8; i < 15; i++) setFn(8, size - 15 + i, bitAt(i));

  return modules;
}

export function encodeKinshipPassportLink(params: {
  guardrails: ElderGuardrails;
  elderClues: Array<{ name: string; subtype: QlooEntitySubtype }>;
  grandchildSeeds: Array<{ name: string; subtype: QlooEntitySubtype }>;
}): { hash: string; url: string; bytes: number } {
  const compact = {
    v: 1,
    y: params.guardrails.birthYear,
    g: params.guardrails.youthGeography,
    s: params.guardrails.dementiaStage,
    e: params.elderClues.slice(0, 2).map((c) => c.name.split('(')[0].trim().slice(0, 48)),
    k: params.grandchildSeeds.slice(0, 2).map((c) => c.name.split('(')[0].trim().slice(0, 48)),
  };
  const json = JSON.stringify(compact);
  const bytesArr = new TextEncoder().encode(json);
  let bin = '';
  for (const b of bytesArr) bin += String.fromCharCode(b);
  const b64 = btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const hash = `#kinship=${b64}`;
  const hasRealOrigin =
    typeof window !== 'undefined' &&
    window.location.protocol.startsWith('http') &&
    Boolean(window.location.origin) &&
    window.location.origin !== 'null';
  // Outside a real http origin (a file:// preview, an opaque sandbox iframe) the
  // copied link used to point at a domain that does not exist, so "Copy link"
  // produced something that could not be opened. It now falls back to the actual
  // public deployment.
  const origin = hasRealOrigin
    ? `${window.location.origin}${window.location.pathname}`
    : 'https://kinship-app-phi.vercel.app/';
  return { hash, url: `${origin}${hash}`, bytes: bytesArr.length };
}

export function safeCopyText(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      return navigator.clipboard
        .writeText(text)
        .then(() => true)
        .catch(() => fallbackExecCopy(text));
    }
  } catch {
    // ignore sandbox clipboard errors
  }
  return Promise.resolve(fallbackExecCopy(text));
}

function fallbackExecCopy(text: string): boolean {
  try {
    if (typeof document === 'undefined') return false;
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', 'true');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export function decodeKinshipPassportHash(hash: string): {
  birthYear: number;
  youthGeography: ElderGuardrails['youthGeography'];
  dementiaStage: ElderGuardrails['dementiaStage'];
  elderNames: string[];
  grandchildNames: string[];
} | null {
  if (!hash || !hash.includes('kinship=')) return null;
  try {
    const tok = hash.slice(hash.indexOf('kinship=') + 8).split('&')[0];
    const b64 = tok.replace(/-/g, '+').replace(/_/g, '/');
    const pad = b64 + '==='.slice((b64.length + 3) % 4);
    const bin = atob(pad);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    const d = JSON.parse(new TextDecoder().decode(arr));
    if (!d || d.v !== 1) return null;
    return {
      birthYear: d.y,
      youthGeography: d.g,
      dementiaStage: d.s,
      elderNames: d.e || [],
      grandchildNames: d.k || [],
    };
  } catch {
    return null;
  }
}
