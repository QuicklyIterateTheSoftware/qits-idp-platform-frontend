import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Empty } from '../ui/empty';

/**
 * The people with an account here — of whom there are, at the time of writing, none anywhere in
 * this service.
 *
 * **This page is a slot, and it is deliberately claimed early.** There is no user record, no users
 * table and no endpoint to read one: the identity provider authenticates machines today, and the
 * human half is a later phase. Taking the URL now costs a chunk nobody downloads and settles where
 * the feature lands, so that "where do users go?" is not re-argued alongside the work of building
 * them.
 *
 * Nothing is invented in the meantime — no invented columns, no seeded example row, no invite
 * button. When the service grows users this page grows a read; until then it says the true thing.
 */
@Component({
  selector: 'app-users-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Empty],
  styleUrls: ['../ui/page.css'],
  template: `
    <header class="head">
      <h1>Users</h1>
      <p class="lede">The people who will hold an account with this identity provider.</p>
    </header>

    <app-empty
      message="There are no users. This service keeps none yet — it authenticates services, and the human accounts land here when it learns to hold them."
    />

    <p class="note">
      Until then a person reaches the platform through the gateway's own session, which this service
      does not issue.
    </p>
  `,
})
export class UsersPage {}
