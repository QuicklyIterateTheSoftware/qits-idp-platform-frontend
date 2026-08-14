import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Empty } from '../ui/empty';

/**
 * The clients this identity provider issues tokens to — and, today, an empty state explaining why
 * the list is not here yet.
 *
 * **The blocker is authentication, not effort.** `GET /idp/api/clients` authenticates with a
 * client's own id and secret over HTTP Basic — the same `client_secret_basic` pair the token
 * endpoint takes — and it answers with that caller's own commissions, nothing wider. A browser has
 * no such pair: there is no session to derive one from until the login flow beside this page is
 * real, and a page that asked a person to paste a client secret into it would be teaching exactly
 * the habit an identity provider exists to end. So this page reads nothing rather than reading it
 * badly, and no `HttpClient` call is written here to be switched on later under a different
 * credential model.
 *
 * **What it becomes is a roster of the caller's own commissions**, not an administrator's view of
 * every client on the platform — the service has no cross-owner listing to draw one from. Whether
 * it ever should is a question for the service, and it is not answered by a client guessing.
 */
@Component({
  selector: 'app-clients-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Empty],
  styleUrls: ['../ui/page.css'],
  template: `
    <header class="head">
      <h1>Clients</h1>
      <p class="lede">
        The services and workstations this identity provider issues tokens to. Each one holds an id
        and a secret, and asks for a token with them.
      </p>
    </header>

    <app-empty
      message="No client is listed. Reading the roster means presenting a client's own id and secret, which this page cannot do until there is a signed-in session to take one from."
    />

    <p class="note">
      The clients themselves are not affected by any of this: they authenticate directly at
      <code>/idp/token</code> and are unaffected by what this page can or cannot show.
    </p>
  `,
})
export class ClientsPage {}
