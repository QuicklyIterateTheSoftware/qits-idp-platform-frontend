# QitsPlatformSpaIdp

The identity provider's frontend: the two pages a person arrives at, and the two an operator
administers. Served by qits-platform-idp itself at `/idp/` through Quinoa. Four routes, and they
split down the middle.

- **`/idp/login`** — where a person will sign in. No platform chrome.
- **`/idp/register`** — where a person will make an account. No platform chrome.
- **`/idp/clients`** — the clients this provider issues tokens to, inside the chrome.
- **`/idp/users`** — the people who will hold an account, inside the chrome.

**Two of these render no chrome, and that is the shape rather than an omission.** A sidebar full of
links to services the visitor has not been admitted to is an invitation to click something that
will refuse them, and a top bar naming the signed-in user is a lie on the page where nobody is. So
`login` and `register` are top-level routes, siblings of `QitsMainLayout` instead of children of
it. The two administrative pages sit inside it like every other explorer's pages do.

**Every page loads lazily, and this is the platform's first SPA to do that.** The split above is
the reason. Someone at `/idp/login` is by definition not yet allowed to see a client roster, so
shipping the admin pages in the bundle that draws the sign-in form makes the most public page on
the platform pay for code it can never use — and the reverse, an operator downloading a sign-in
form to reach `/idp/clients`, is no better. `QitsMainLayout` stays an eager import: it is the frame
the pages arrive in, not a page, and a frame in its own chunk would show a blank application while
it loaded.

**All four pages are placeholders, deliberately.** This service authenticates _machines_ today: it
issues tokens against a client id and secret, and has no user, no password and no session. So there
is no sign-in form, no invite box and no seeded example row anywhere in this tree — a form whose
backend does not exist is worse than a stated gap, because someone will type a real credential into
it. What exists is the route table, the chromeless frame and the four slots, which are the parts
that are expensive to retrofit.

**The client roster is blocked on authentication, not on effort.** `GET /idp/api/clients` takes a
client's own id and secret over HTTP Basic and answers with that caller's own commissions. A
browser has no such pair until the login flow beside it is real, and a page asking a person to paste
a client secret would teach exactly the habit an identity provider exists to end. So the page reads
nothing rather than reading it badly.

**Bare `/idp/` redirects to `/idp/clients`, and that line is provisional.** The front door should
land on whatever the visitor is — a sign-in form when nobody is, an administrative home when
someone is — and neither answer can be given until there is a session to ask about. Expect
`app.routes.ts` to change when the login flow lands.

Note what is _not_ under this SPA even though it shares the segment: this service's protocol surface
sits at `/idp/token`, `/idp/jwks` and `/idp/.well-known/openid-configuration`, beside these pages
rather than under an `/api` of its own. Those are answered by the service and never reach this
application.

## How it is served

qits-platform-idp carries this repository as a git submodule at `service/src/main/webui` — Quinoa's
`web-ui-dir` — and builds it during `mvn package`, serving the bundle at `/idp/`. The segment is
spelled here as `baseHref` in `angular.json` and there as `quarkus.quinoa.ui-root-path`; the two
move together. This repository ships no container image of its own.

That mount is the arrangement this repo is built for, and it does not exist yet: the service
declares no Quinoa and carries no webui submodule at the time of writing. Nothing here waits on it —
this tree builds, lints and tests on its own.

Note the known wart, which is every client's alike: bare `/idp` (no trailing slash) is a 404.
`/idp/` works.

## Development server

```bash
ng serve
```

Then open `http://localhost:4200/`. `proxy.conf.json` forwards this service's whole surface —
`/idp/api`, `/idp/token`, `/idp/jwks`, `/idp/.well-known` and `/idp/q` — to a gateway on
`localhost:8080`, because `ng serve` puts no gateway in front. In a deployment every call is a
same-origin path behind the real gateway. No page makes one of those calls yet.

The platform chrome asks the gateway for `/main-navigation`, which `ng serve` does not proxy — so
the sidebar renders "Navigation unavailable" on the two administrative pages. That is the intended
degraded state, not a fault. The two auth pages mount no chrome and are unaffected.

## Running the checks

```bash
npm run lint && npm test && npm run build
```

The same three, in the same order, are what `.config/qits/ci-post-receive.yml` runs on every push.
Note what that pipeline installs from: the npm proxy behind it is qits-platform-mirror, and the
`@qits` scope comes from qits-artifacts — so a run here cannot be green while either service is
down. Their deploys are taken alone, with the CI queue empty.

Installing on a developer machine needs a credential, and it is not in this repository. Every read
through the edge authenticates, so both registries answer 401 without one; `.npmrc` here carries the
routing only, and the `_auth` line comes from your own `~/.npmrc`, minted for your commissioned
workstation client. CI takes both the addresses and the credential from the step environment.

## Building

```bash
ng build
```

The bundle lands in `dist/qits-platform-spa-idp/browser`, which is the path
`quarkus.quinoa.build-dir` names on the service side. Four lazy chunks come out beside the initial
one, one per page — that is the routing above, visible in the output.

## Running unit tests

```bash
ng test
```

Vitest on jsdom — no browser, which is what lets CI run them.
