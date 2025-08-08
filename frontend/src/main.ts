import { bootstrapApplication } from '@angular/platform-browser';

import { App } from '@eristic/app/app';
import { appConfig } from '@eristic/app/app.config';

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
