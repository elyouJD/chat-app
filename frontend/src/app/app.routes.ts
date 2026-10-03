import { Routes } from '@angular/router';

import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { Home } from './pages/home/home';
import { Chat } from './pages/chat/chat';
import { Profile } from './pages/profile/profile';

export const routes: Routes = [
  {
    path: 'login',
    component: Login,
  },
  {
    path: 'register',
    component: Register,
  },
  {
    path: 'home',
    component: Home,
  },
  {
    path: 'chat/:id',
    component: Chat,
  },
  {
    path: 'profile',
    component: Profile,
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
];
