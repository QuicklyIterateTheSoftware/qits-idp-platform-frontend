import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { QITS_API_BASE } from './api-base';
import type { Device } from './dto';

/**
 * The two calls behind the signed-in devices page: read this account's credential families, and
 * revoke one.
 *
 * **Both authenticate with the session cookie and nothing else.** Same-origin requests carry it by
 * default, which is why there is no `credentials` option here — the only value worth setting would
 * be the default and the only value worth fearing would break the page silently. The service scopes
 * every answer to the session's own user, so there is no user id to pass and no way to ask for
 * somebody else's.
 *
 * **Promises, not `httpResource`.** The list is a read and could be one, but the revoke beside it is
 * a command whose whole point is that the list changes afterwards — and a resource re-fetching on a
 * signal the page did not set would make "did my revoke land?" ambiguous. One shape for both, the
 * page re-reads explicitly.
 */
@Injectable({ providedIn: 'root' })
export class DevicesApi {
  private readonly http = inject(HttpClient);
  private readonly base = inject(QITS_API_BASE);

  /** Every credential family of the signed-in account, newest first. */
  list(): Promise<Device[]> {
    return firstValueFrom(this.http.get<Device[]>(`${this.base}/idp/api/devices`));
  }

  /** Revoke one family. A foreign id answers 404, which is deliberately the same as "no such". */
  revoke(id: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.base}/idp/api/devices/${id}`));
  }
}
