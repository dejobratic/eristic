import { Routes } from '@angular/router';

import { Home } from '@eristic/app/pages/home/home';
import { Debaters } from '@eristic/app/pages/debaters/debaters';
import { DebateSetup } from '@eristic/app/pages/debate-setup/debate-setup';
import { DebatePage } from '@eristic/app/pages/debate/debate';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'debaters', component: Debaters },
  { path: 'debate-setup/:topic', component: DebateSetup },
  { path: 'debate/:debateId', component: DebatePage },
  // TODO: Add remaining routes
  // { path: 'settings', component: Settings }
];
