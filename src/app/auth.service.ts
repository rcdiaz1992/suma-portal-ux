import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AuthServiceStore {
  constructor() {}

  login() {
    // this.keycloakService.login();
    console.log('LOGIN');
  }

  logout() {
    // this.keycloakService.logout();
    console.log('LOGOUT');
  }

  // Al iniciar sesión, guardar el estado en sessionStorage
  setSession(user:any) {
    localStorage.setItem('user', user);

    // Notificar a otras pestañas de que la sesión ha cambiado
    window.dispatchEvent(new Event('storage'));
  }

  setCurrentUser (user:string) {
    localStorage.setItem('currentUser', user);
  }

  getCurrentUser () {
    let obj = localStorage.getItem('currentUser');
    return obj;
  }
  
  // Recuperar la sesión
  getSession() {
    let obj = localStorage.getItem('user') ;
    return obj;
  }
}
