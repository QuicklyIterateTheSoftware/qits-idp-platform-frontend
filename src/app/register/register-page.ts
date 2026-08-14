import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Where a person will make an account. Today it says so, and does nothing.
 *
 * Same restraint as the sign-in page beside it, and for the same reason: there is no user record in
 * this service to create, so every field a form put on this page would be a field with nowhere to
 * go. Nothing speculative is drawn here — not the name of an identity provider it might federate
 * with, not an invite-code box, not a password rule.
 *
 * **Registration is its own page rather than a tab on the sign-in one**, and that is a decision
 * worth keeping: the two flows diverge as soon as either is real — one refuses on a wrong secret,
 * the other on a taken name — and each is a URL someone is sent to directly.
 *
 * **No chrome around it**, by the route table. See app.routes.ts.
 */
@Component({
  selector: 'app-register-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['../ui/auth.css'],
  template: `
    <div class="card">
      <h1>Create an account</h1>
      <p>
        Registration is not open. This identity provider keeps no users yet, so there is no account
        for this page to create.
      </p>
    </div>
  `,
})
export class RegisterPage {}
