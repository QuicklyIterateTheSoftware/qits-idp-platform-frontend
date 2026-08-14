import type {
  AssertionJson,
  AttestationJson,
  CreationOptionsJson,
  CredentialDescriptorJson,
  RequestOptionsJson,
} from '../api/dto';
import { fromBase64Url, toBase64Url } from './base64url';

/**
 * The translation layer between the server's JSON and `navigator.credentials`, both ways.
 *
 * **It is written by hand, and the browser's own `parseCreationOptionsFromJSON` / `toJSON` are
 * deliberately not used — not even as the fast path.** Those methods exist to do exactly this, and
 * where they exist they do it better. But they arrived late, they are absent on older Safari and on
 * every WebView this platform might be opened from, and a fallback is needed regardless. Keeping
 * both means the flow that runs on the developer's machine is not the flow that runs on someone
 * else's, and the untested one is always the one that breaks. Thirty lines of conversion is a
 * smaller thing to own than two code paths through a security ceremony, so this is the only path
 * and every browser exercises it.
 *
 * **The casts to the browser's string unions are not laziness.** `lib.dom` types
 * `userVerification` as `UserVerificationRequirement` and the wire types it as `string`, because
 * the server is free to send a value this browser has never heard of. A cast is the honest
 * spelling: validating the value here would mean this page refusing an option the *authenticator*
 * would have accepted, and the browser rejects what it truly cannot use anyway.
 *
 * **The serialized credential is a subset, and the subset is the contract.** Only the fields
 * webauthn4j reads are sent. `clientExtensionResults` is not among them — nothing on either side
 * asks for an extension today, and a field sent without a reader is a field nobody notices going
 * wrong.
 */

/** Descriptors as `navigator.credentials` wants them: ids decoded, strings narrowed. */
function toDescriptors(
  descriptors: readonly CredentialDescriptorJson[] | undefined,
): PublicKeyCredentialDescriptor[] {
  return (descriptors ?? []).map((descriptor) => ({
    type: descriptor.type as PublicKeyCredentialType,
    id: fromBase64Url(descriptor.id),
    ...(descriptor.transports
      ? { transports: descriptor.transports as AuthenticatorTransport[] }
      : {}),
  }));
}

/** Server creation options → what `navigator.credentials.create` takes. */
export function toCreationOptions(json: CreationOptionsJson): PublicKeyCredentialCreationOptions {
  return {
    rp: json.rp,
    user: {
      id: fromBase64Url(json.user.id),
      name: json.user.name,
      displayName: json.user.displayName,
    },
    challenge: fromBase64Url(json.challenge),
    pubKeyCredParams: json.pubKeyCredParams.map((parameter) => ({
      type: parameter.type as PublicKeyCredentialType,
      alg: parameter.alg,
    })),
    ...(json.timeout === undefined ? {} : { timeout: json.timeout }),
    excludeCredentials: toDescriptors(json.excludeCredentials),
    ...(json.authenticatorSelection
      ? {
          authenticatorSelection: {
            ...json.authenticatorSelection,
            residentKey: json.authenticatorSelection.residentKey as
              | ResidentKeyRequirement
              | undefined,
            userVerification: json.authenticatorSelection.userVerification as
              | UserVerificationRequirement
              | undefined,
            authenticatorAttachment: json.authenticatorSelection.authenticatorAttachment as
              | AuthenticatorAttachment
              | undefined,
          },
        }
      : {}),
    ...(json.attestation ? { attestation: json.attestation as AttestationConveyancePreference } : {}),
    ...(json.extensions ? { extensions: json.extensions as AuthenticationExtensionsClientInputs } : {}),
  };
}

/** Server assertion options → what `navigator.credentials.get` takes. */
export function toRequestOptions(json: RequestOptionsJson): PublicKeyCredentialRequestOptions {
  return {
    challenge: fromBase64Url(json.challenge),
    ...(json.timeout === undefined ? {} : { timeout: json.timeout }),
    ...(json.rpId ? { rpId: json.rpId } : {}),
    allowCredentials: toDescriptors(json.allowCredentials),
    ...(json.userVerification
      ? { userVerification: json.userVerification as UserVerificationRequirement }
      : {}),
  };
}

/**
 * What a `PublicKeyCredential` looks like to this file.
 *
 * Structural, and read through a cast rather than an `instanceof PublicKeyCredential`: jsdom has no
 * such class, so an `instanceof` guard here would make every fake credential in the suite fail a
 * check no real browser applies. The browser has already decided what it handed back; this only
 * decides which of its fields go on the wire.
 */
interface RawCredential {
  readonly id: string;
  readonly rawId: ArrayBuffer;
  readonly type: string;
  readonly response: {
    readonly clientDataJSON: ArrayBuffer;
    readonly attestationObject?: ArrayBuffer;
    readonly authenticatorData?: ArrayBuffer;
    readonly signature?: ArrayBuffer;
    readonly userHandle?: ArrayBuffer | null;
    getTransports?: () => string[];
  };
}

/**
 * `navigator.credentials` resolves with `null` when it has nothing to give, which is a refusal
 * dressed as a value. Turning it into a thrown error here means the pages have exactly one failure
 * shape to handle instead of a null check beside every `catch`.
 */
function raw(credential: Credential | null): RawCredential {
  if (!credential) throw new Error('The authenticator returned no credential.');
  return credential as unknown as RawCredential;
}

/** A freshly created credential, serialized for `POST /idp/api/auth/register`. */
export function asAttestation(credential: Credential | null): AttestationJson {
  const created = raw(credential);
  const transports = created.response.getTransports?.() ?? [];
  return {
    id: created.id,
    rawId: toBase64Url(created.rawId),
    type: created.type,
    response: {
      clientDataJSON: toBase64Url(created.response.clientDataJSON),
      attestationObject: toBase64Url(created.response.attestationObject ?? new ArrayBuffer(0)),
      ...(transports.length > 0 ? { transports } : {}),
    },
  };
}

/** A signature from an existing credential, serialized for `POST /idp/api/auth/login`. */
export function asAssertion(credential: Credential | null): AssertionJson {
  const signed = raw(credential);
  const handle = signed.response.userHandle;
  return {
    id: signed.id,
    rawId: toBase64Url(signed.rawId),
    type: signed.type,
    response: {
      clientDataJSON: toBase64Url(signed.response.clientDataJSON),
      authenticatorData: toBase64Url(signed.response.authenticatorData ?? new ArrayBuffer(0)),
      signature: toBase64Url(signed.response.signature ?? new ArrayBuffer(0)),
      userHandle: handle ? toBase64Url(handle) : null,
    },
  };
}
