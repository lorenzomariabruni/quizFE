import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { HostComponent } from './components/host/host.component';
import { PlayerComponent } from './components/player/player.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'host', component: HostComponent },
  { path: 'play/:sessionId', component: PlayerComponent },
  { path: '**', redirectTo: '' }
];