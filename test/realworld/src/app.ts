import { inject } from '@aurelia/kernel';
import { INavRoute, IRouter } from '@aurelia/router';
import { customElement, IObserverLocator, IViewModel, LifecycleFlags } from '@aurelia/runtime';

import { Article } from './components/article/article';
import { Auth } from './components/auth/auth';
import { Editor } from './components/editor/editor';
import { Home } from './components/home/home';
import { Profile } from './components/profile/profile';
import { Settings } from './components/settings/settings';
import { FooterLayout } from './shared/layouts/footer-layout';
import { HeaderLayout } from './shared/layouts/header-layout';
import { UserService } from './shared/services/user-service';
import { SharedState } from './shared/state/shared-state';

import template from './app.html';

@inject(IRouter, UserService, SharedState)
@customElement({
  name: 'app',
  dependencies: [
    HeaderLayout,
    FooterLayout,

    Home,
    Editor,
    Settings,
    Auth,
    Profile,
    Article,
  ],
  template,
})
export class App implements IViewModel {
  private readonly message: string;

  public constructor(
    private readonly router: IRouter,
    private readonly userService: UserService,
    private readonly state: SharedState,
  ) {
    this.message = 'Hello World!'; // just for unit testing ;)
  }

  public async beforeBind() {
    // this.router.guardian.addGuard(
    this.router.addHook(
      async () => {
        if (this.state.isAuthenticated) {
          return true;
        }
        this.router.goto(`auth(type=login)`).catch((error: Error) => { throw error; });
        return [];
      },
      {
        include: [
          { component: 'editor' },
          { component: 'settings' },
        ],
      },
    );
    const observerLocator = this.router.container.get(IObserverLocator);
    const observer = observerLocator.getObserver(LifecycleFlags.none, this.state, 'isAuthenticated') as any;
    observer.subscribe(this);

    await this.userService.populate();
  }

  public handleChange(): void {
    this.router.setNav('main',
      this.routes,
      {
        ul: 'nav navbar-nav pull-xs-right',
        li: 'nav-item',
        a: 'nav-link',
        span: 'nav-link',
        aActive: 'active',
      });
    this.router.updateNav();
  }

  public get routes(): INavRoute[] {
    return [
      {
        route: Home,
        title: 'Home',
      },
      {
        condition: () => this.authenticated(),
        route: `editor(type=new)`,
        title: '<i class="ion-compose"></i>&nbsp;New Post',
      },
      {
        condition: () => this.authenticated(),
        route: Settings,
        title: '<i class="ion-gear-a"></i>&nbsp;Settings',
      },
      {
        compareParameters: true,
        condition: () => this.notAuthenticated(),
        route: `auth(type=login)`,
        title: 'Sign in',
      },
      {
        compareParameters: true,
        condition: () => this.notAuthenticated(),
        route: `auth(type=register)`,
        title: 'Sign up',
      },
      {
        compareParameters: true,
        condition: () => this.authenticated(),
        route: `profile(${this.state.currentUser.username})`,
        title: `${this.state.currentUser.username}`,
      },
    ];
  }

  public authenticated(): boolean {
    return this.state?.currentUser && this.state?.isAuthenticated;
  }
  public notAuthenticated(): boolean {
    return !this.authenticated();
  }
}
