import { Routes } from '@angular/router';

import { Home } from '@eristic/app/pages/home/home';
import { TopicDetails } from '@eristic/app/pages/topic-details/topic-details';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'topic/:topic', component: TopicDetails }
];
