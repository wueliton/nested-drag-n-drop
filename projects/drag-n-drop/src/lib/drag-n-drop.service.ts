import { Injectable, signal } from '@angular/core';

export type LibDragDrop<T = any> = {
  [k in 'previousContainer' | 'container']: DragItem<T>;
};

export type DragItem<T = any> = {
  data: T;
  el?: HTMLElement;
  dropEl?: HTMLElement;
  index: number;
};

@Injectable({
  providedIn: 'root',
})
export class DragNDropService {
  #activeItem = signal<DragItem | null>(null);
  #hoveredDropList = signal<HTMLElement | null>(null);
  #clonedItem = signal<Node | HTMLElement | null>(null);

  activeItem = this.#activeItem.asReadonly();
  hoveredDropList = this.#hoveredDropList.asReadonly();
  clonedItem = this.#clonedItem.asReadonly();

  setActiveItem(item: DragItem | null) {
    this.#activeItem.set(item);
  }

  setHoveredDropList(item: HTMLElement | null) {
    this.#hoveredDropList.set(item);
  }

  setClonedItem(item: Node | HTMLElement | null) {
    this.#clonedItem.set(item);
  }
}
