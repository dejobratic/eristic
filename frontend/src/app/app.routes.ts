import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { TopicDetails } from './pages/topic-details/topic-details';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'topic/:topic', component: TopicDetails }
];
