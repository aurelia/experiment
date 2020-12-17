import { INavigatorState, NavigatorViewerState } from './navigator.js';

export class NavigatorStateChangeEvent extends NavigatorViewerState {
  public static eventName = 'au:router:navigation-state-change';

  public event!: PopStateEvent;
  public state?: INavigatorState;
}

