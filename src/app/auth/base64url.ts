/**
 * base64url, both directions, in twenty lines and with no dependency.
 *
 * **WebAuthn's JSON shape and its JavaScript API disagree about what a byte string is.** The
 * options the server sends carry the challenge, the user handle and every credential id as
 * base64url text; `navigator.credentials` takes and returns `ArrayBuffer`. Something has to sit
 * between them, and this is it — the whole of what the two auth pages need from an encoding
 * library, which is why no library is installed for it.
 *
 * **The server's output is unpadded and this decoder accepts padding anyway.** A decoder that
 * insisted on one form would be a trap for the first hand-written test fixture and for any future
 * server that pads; accepting both costs one line. The encoder emits the unpadded form, because
 * that is what every WebAuthn JSON document uses and what the server compares against.
 *
 * The standard alphabet's `+` and `/` are translated on the way in as well. A caller that pastes a
 * plain base64 value in — a curl transcript, a debugger — gets the bytes it meant rather than a
 * silent mangling; base64url and base64 differ only in those two characters, so the tolerance is
 * free and cannot mistake one valid input for another.
 */

/** Bytes to unpadded base64url text. */
export function toBase64Url(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = '';
  for (const byte of view) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** base64url (or plain base64, padded or not) to bytes. */
export function fromBase64Url(text: string): ArrayBuffer {
  const standard = text.replace(/-/g, '+').replace(/_/g, '/');
  const padded = standard.padEnd(standard.length + ((4 - (standard.length % 4)) % 4), '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}
