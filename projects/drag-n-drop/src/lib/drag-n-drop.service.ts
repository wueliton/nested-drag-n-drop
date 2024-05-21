import { Injectable, signal } from '@angular/core';
import { DragNDropDirective, DropListDirective } from '../public-api';

export type LibDragDrop<T = any> = {
  previousIndex: number;
  currentIndex: number;
  item: DragNDropDirective;
  container: DropListDirective<T>;
  previousContainer: DropListDirective<T>;
};

export type DragItem<T = any> = {
  dragNDropDirective: DragNDropDirective;
  index: number;
};

@Injectable({
  providedIn: 'root',
})
export class DragNDropService {
  #activeItem = signal<DragItem | null>(null);
  #hoveredDropList = signal<DropListDirective | null>(null);
  #clonedItem = signal<Node | HTMLElement | null>(null);
  #animatedItems = signal<HTMLElement[]>([]);
  #dropItemIndex = signal<number | null>(null);

  activeItem = this.#activeItem.asReadonly();
  hoveredDropList = this.#hoveredDropList.asReadonly();
  clonedItem = this.#clonedItem.asReadonly();
  animatedItems = this.#animatedItems.asReadonly();
  dropItemIndex = this.#dropItemIndex.asReadonly();

  setActiveItem(item: DragItem | null) {
    this.#activeItem.set(item);
  }

  setHoveredDropList(item: DropListDirective | null) {
    this.#hoveredDropList.set(item);
  }

  setClonedItem(item: Node | HTMLElement | null) {
    this.#clonedItem.set(item);
  }

  addAnimatedItem(item: HTMLElement) {
    this.#animatedItems.update((prev) => [...prev, item]);
  }

  removeAnimatedItem(item: HTMLElement) {
    this.#animatedItems.update((prev) => prev.filter((el) => el !== item));
  }

  cleanAnimatedItems() {
    this.#animatedItems.set([]);
  }

  setDropItemIndex(index: number | null) {
    this.#dropItemIndex.set(index);
  }

  reset() {
    this.#activeItem.set(null);
    this.#hoveredDropList.set(null);
    this.#clonedItem.set(null);
    this.#animatedItems.set([]);
    this.#dropItemIndex.set(null);
  }
}
