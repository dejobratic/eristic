import { Routes } from '@angular/router';

import { Home } from '@eristic/pages/home/home';
import { TopicDetails } from '@eristic/pages/topic-details/topic-details';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'topic/:topic', component: TopicDetails }
];
