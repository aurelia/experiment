/**
 *
 * NOTE: This file is still WIP and will go through at least one more iteration of refactoring, commenting and clean up!
 *       In its current state, it is NOT a good source for learning about the inner workings and design of the router.
 *
 */
import { bindable, customElement } from '@aurelia/runtime-html';
import { NavRoute } from '../nav-route.js';
import { IRouter } from '../router.js';

export interface INavClasses {
  nav?: string;
  ul?: string;
  li?: string;
  a?: string;
  span?: string;

  ulActive?: string;
  liActive?: string;
  aActive?: string;
}

@customElement({
  name: 'au-nav', template:
    `<template>
  <nav if.bind="name" class="\${name} \${navClasses.nav}">
    <au-nav routes.bind="navRoutes" classes.bind="navClasses" containerless></au-nav>
  </nav>
  <ul if.bind="routes" class="nav-level-\${level} \${classes.ul}">
    <li repeat.for="route of routes" if.bind="route.visible" class="\${route.active ? classes.liActive : ''} \${route.hasChildren} \${classes.li}">
      <a if.bind="route.link && route.link.length" load="\${route.link}" class="\${route.active ? classes.aActive : ''} \${classes.a}" innerhtml.bind="route.title"></a>
      <a if.bind="route.execute" click.trigger="route.executeAction($event)" href="" class="\${route.active ? classes.aActive : ''} \${classes.a}" innerhtml.bind="route.title"></a>
      <span if.bind="(!route.link || !route.link.length) && !route.execute && !route.children" class="\${route.active ? classes.aActive : ''} \${classes.span} nav-separator" innerhtml.bind="route.title"></span>
      <a if.bind="(!route.link || !route.link.length) && !route.execute && route.children" click.delegate="route.toggleActive()" href="" class="\${route.active ? classes.aActive : ''} \${classes.a}" innerhtml.bind="route.title"></a>
      <au-nav if.bind="route.children" routes.bind="route.children" level.bind="level + 1" classes.bind="classes" containerless></au-nav>
    </li>
  </ul>
</template>` })
export class NavCustomElement {
  @bindable public name: string | null = null;
  @bindable public routes: NavRoute[] | null = null;
  @bindable public level: number = 0;
  @bindable public classes: INavClasses = {};

  public constructor(@IRouter private readonly router: IRouter) { }

  public get navRoutes(): NavRoute[] {
    const nav = this.router.navs[this.name as string];
    return (nav !== void 0 && nav !== null ? nav.routes : []);
  }

  public get navClasses(): INavClasses {
    const nav = this.router.navs[this.name as string];
    const navClasses = (nav !== void 0 && nav !== null ? nav.classes : {});
    return {
      ... {
        nav: '',
        ul: '',
        li: '',
        a: '',

        ulActive: '',
        liActive: 'nav-active',
        aActive: '',
      }, ...navClasses
    };
  }

  public active(route: NavRoute): string {
    return 'Active';
  }
}
