import type { Routes } from '@angular/router';
import { QitsMainLayout } from '@qits/ui-components';
import { NotFound } from './not-found/not-found';

/**
 * Six doors: three outside the platform chrome, three inside it.
 *
 * **`login`, `register` and `connect/cli` sit outside the layout, and that is the shape rather than
 * an oversight.**
 * An auth page renders no platform chrome: a sidebar full of links to services the visitor has not
 * been admitted to is an invitation to click something that will refuse them, and a top bar that
 * says who is signed in is a lie on the page where nobody is. So the two of them are top-level
 * routes, siblings of the layout and not children of it.
 *
 * **`QitsMainLayout` is the root route component** for everything else — the platform's convention,
 * stated in the component's own docs. Mounted this way the bar and the navigation mount once and
 * survive every navigation beneath them; wrapping each page in a tag would rebuild the whole
 * skeleton on every hop. It is an eager import for that reason: it is not a page, it is the frame
 * the pages arrive in, and a frame that loads in its own chunk would show the user a blank
 * application while it did.
 *
 * **Every page loads lazily, and this repository is the platform's first SPA to do it.** The reason
 * is the split above. A visitor at `/idp/login` is, by definition, not yet allowed to see a client
 * roster — shipping the admin pages in the bundle that draws the sign-in form would make the
 * slowest, most public page on the platform pay for code that page can never legally use. The
 * reverse holds just as well: an operator who is already signed in and going to `/idp/clients`
 * should not download a sign-in form to get there. `loadComponent` per page is what makes each of
 * those four URLs cost only itself, and it is cheap here because these pages share no state and
 * almost no code. Where a sibling explorer's two views sit on one stack of shared table components
 * — spa-mirror says so in its own routes, and loads both eagerly — these do not.
 *
 * **The `'' → clients` redirect is still provisional.** Bare `/idp/` should land on whatever the
 * visitor is: a sign-in form when nobody is, an administrative home when someone is. Sessions exist
 * now, so the question can be asked — but it is not this table's to answer. The edge is what refuses
 * an anonymous navigation, and it does so by sending the browser to `/idp/login?redirect=…` before
 * this route table is consulted at all. A guard here would be a second, weaker copy of that
 * decision. Change this line when the edge's gate is proven, not before.
 *
 * The `**` route sits inside the layout: `/idp/` is a segment this application owns outright, so an
 * unknown URL under it is an ordinary 404 and is drawn with the chrome around it.
 */
export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./login/login-page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    loadComponent: () => import('./register/register-page').then((m) => m.RegisterPage),
  },
  {
    path: 'connect/cli',
    loadComponent: () => import('./connect/cli-page').then((m) => m.CliPage),
  },
  {
    path: '',
    component: QitsMainLayout,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'clients' },
      {
        path: 'clients',
        loadComponent: () => import('./clients/clients-page').then((m) => m.ClientsPage),
      },
      {
        path: 'users',
        loadComponent: () => import('./users/users-page').then((m) => m.UsersPage),
      },
      {
        path: 'devices',
        loadComponent: () => import('./devices/devices-page').then((m) => m.DevicesPage),
      },
      { path: '**', component: NotFound },
    ],
  },
];
