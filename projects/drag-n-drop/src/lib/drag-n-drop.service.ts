import { Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';

export type LibDragDrop<T = any> = {
  [k in 'previousContainer' | 'container']: DragItem<T>;
};

export type DragItem<T = any> = {
  data: T;
  el?: HTMLElement;
  dropEl?: HTMLElement;
};

@Injectable({
  providedIn: 'root',
})
export class DragNDropService {
  #activeItem = signal<DragItem | null>(null);
  #hoveredItem = signal<DragItem | null>(null);

  activeItem = this.#activeItem.asReadonly();
  activeItem$ = toObservable(this.activeItem);
  hoveredItem = this.#hoveredItem.asReadonly();

  setActiveItem(item: DragItem | null) {
    this.#activeItem.set(item);
  }

  setHoveredItem(item: DragItem | null) {
    this.#hoveredItem.set(item);
  }
}
