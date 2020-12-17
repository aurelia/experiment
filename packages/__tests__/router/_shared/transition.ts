import { SwapStrategy } from './create-fixture';
import { Component, TransitionComponent } from './component';

export class Transition {
  public from: Component;
  public to: Component;
  public viewport: string;

  public constructor(transition: { from: string | TransitionComponent | Component; to: string | TransitionComponent | Component, viewport: string}) {
    this.viewport = transition.viewport;
    this.from = new Component(transition.from, this.viewport);
    this.to = new Component(transition.to, this.viewport);
  }
}
