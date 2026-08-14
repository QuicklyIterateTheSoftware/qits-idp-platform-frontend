import type { CreationOptionsJson, RequestOptionsJson } from '../api/dto';
import { asAssertion, asAttestation, toCreationOptions, toRequestOptions } from './webauthn';

/**
 * The conversion, both directions, field by field. It is asserted at this level rather than only
 * through the pages because a field silently dropped here — `rpId`, an `excludeCredentials` entry —
 * changes what the authenticator is asked to do without changing anything the flow tests observe.
 */
describe('webauthn conversion', () => {
  function read(buffer: ArrayBuffer | ArrayBufferView | undefined | null): number[] {
    if (!buffer) return [];
    const view =
      buffer instanceof ArrayBuffer
        ? new Uint8Array(buffer)
        : new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    return Array.from(view);
  }

  const CREATION: CreationOptionsJson = {
    rp: { id: 'localhost', name: 'qits platform' },
    user: { id: 'AQID', name: 'alice', displayName: 'alice' },
    challenge: 'BAUG',
    pubKeyCredParams: [
      { type: 'public-key', alg: -7 },
      { type: 'public-key', alg: -257 },
    ],
    timeout: 300000,
    excludeCredentials: [{ type: 'public-key', id: 'BwgJ', transports: ['usb'] }],
    authenticatorSelection: {
      requireResidentKey: true,
      residentKey: 'required',
      userVerification: 'required',
    },
    attestation: 'none',
    extensions: {},
  };

  const REQUEST: RequestOptionsJson = {
    challenge: 'BAUG',
    timeout: 300000,
    rpId: 'localhost',
    allowCredentials: [{ type: 'public-key', id: 'BwgJ' }],
    userVerification: 'required',
  };

  describe('toCreationOptions', () => {
    it('decodes the challenge and the user handle into bytes', () => {
      const options = toCreationOptions(CREATION);
      expect(read(options.challenge as ArrayBuffer)).toEqual([4, 5, 6]);
      expect(read(options.user.id as ArrayBuffer)).toEqual([1, 2, 3]);
    });

    it('decodes every excluded credential id and keeps its transports', () => {
      const options = toCreationOptions(CREATION);
      expect(options.excludeCredentials).toHaveLength(1);
      expect(read(options.excludeCredentials?.[0].id as ArrayBuffer)).toEqual([7, 8, 9]);
      expect(options.excludeCredentials?.[0].transports).toEqual(['usb']);
    });

    it('carries the rest of the server’s opinion through untouched', () => {
      const options = toCreationOptions(CREATION);
      expect(options.rp).toEqual({ id: 'localhost', name: 'qits platform' });
      expect(options.user.name).toBe('alice');
      expect(options.pubKeyCredParams.map((parameter) => parameter.alg)).toEqual([-7, -257]);
      expect(options.timeout).toBe(300000);
      expect(options.attestation).toBe('none');
      expect(options.authenticatorSelection?.userVerification).toBe('required');
      expect(options.authenticatorSelection?.residentKey).toBe('required');
    });

    it('makes an absent exclude list an empty one, not an absent field', () => {
      const options = toCreationOptions({ ...CREATION, excludeCredentials: undefined });
      expect(options.excludeCredentials).toEqual([]);
    });
  });

  describe('toRequestOptions', () => {
    it('decodes the challenge and every allowed credential id', () => {
      const options = toRequestOptions(REQUEST);
      expect(read(options.challenge as ArrayBuffer)).toEqual([4, 5, 6]);
      expect(read(options.allowCredentials?.[0].id as ArrayBuffer)).toEqual([7, 8, 9]);
    });

    it('keeps the relying party id, without which the ceremony asks the wrong host', () => {
      expect(toRequestOptions(REQUEST).rpId).toBe('localhost');
      expect(toRequestOptions(REQUEST).userVerification).toBe('required');
    });

    it('handles the empty allow list a resident-key login gets', () => {
      const options = toRequestOptions({ challenge: 'BAUG' });
      expect(options.allowCredentials).toEqual([]);
      expect(options.rpId).toBeUndefined();
    });
  });

  describe('asAttestation', () => {
    /** A `PublicKeyCredential` as the browser hands it back, with nothing but the read fields. */
    function created(transports?: string[]): Credential {
      return {
        id: 'credential-id',
        rawId: new Uint8Array([1, 2, 3]).buffer,
        type: 'public-key',
        response: {
          clientDataJSON: new Uint8Array([4, 5, 6]).buffer,
          attestationObject: new Uint8Array([7, 8, 9]).buffer,
          ...(transports ? { getTransports: () => transports } : {}),
        },
      } as unknown as Credential;
    }

    it('encodes every buffer as unpadded base64url', () => {
      expect(asAttestation(created())).toEqual({
        id: 'credential-id',
        rawId: 'AQID',
        type: 'public-key',
        response: { clientDataJSON: 'BAUG', attestationObject: 'BwgJ' },
      });
    });

    it('reports transports when the authenticator names any', () => {
      expect(asAttestation(created(['internal', 'hybrid'])).response.transports).toEqual([
        'internal',
        'hybrid',
      ]);
    });

    it('omits transports rather than sending an empty list', () => {
      expect(asAttestation(created([])).response.transports).toBeUndefined();
      expect('transports' in asAttestation(created()).response).toBe(false);
    });

    it('turns a null credential into a thrown error, not a body of nulls', () => {
      expect(() => asAttestation(null)).toThrow();
    });
  });

  describe('asAssertion', () => {
    function signed(userHandle: ArrayBuffer | null): Credential {
      return {
        id: 'credential-id',
        rawId: new Uint8Array([1, 2, 3]).buffer,
        type: 'public-key',
        response: {
          clientDataJSON: new Uint8Array([4, 5, 6]).buffer,
          authenticatorData: new Uint8Array([7, 8, 9]).buffer,
          signature: new Uint8Array([10, 11, 12]).buffer,
          userHandle,
        },
      } as unknown as Credential;
    }

    it('encodes the four fields the server verifies', () => {
      expect(asAssertion(signed(new Uint8Array([13, 14, 15]).buffer))).toEqual({
        id: 'credential-id',
        rawId: 'AQID',
        type: 'public-key',
        response: {
          clientDataJSON: 'BAUG',
          authenticatorData: 'BwgJ',
          signature: 'CgsM',
          userHandle: 'DQ4P',
        },
      });
    });

    it('sends a null user handle as null, which is what the absence means', () => {
      expect(asAssertion(signed(null)).response.userHandle).toBeNull();
    });

    it('turns a null credential into a thrown error', () => {
      expect(() => asAssertion(null)).toThrow();
    });
  });
});
