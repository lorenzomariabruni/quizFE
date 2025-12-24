import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { HostComponent } from './components/host/host.component';
import { PlayerComponent } from './components/player/player.component';
import { CreateQuizComponent } from './components/create-quiz/create-quiz.component';
import { SelectQuizComponent } from './components/select-quiz/select-quiz.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'host', component: SelectQuizComponent },
  { path: 'host/:quizName', component: HostComponent },
  { path: 'play/:sessionId', component: PlayerComponent },
  { path: 'create-quiz', component: CreateQuizComponent },
  { path: '**', redirectTo: '' }
];