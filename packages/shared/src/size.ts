export function byteLengthUtf8(input: string): number {
  return new TextEncoder().encode(input).length;
}

export function kb(nBytes: number): number {
  return nBytes / 1024;
}


