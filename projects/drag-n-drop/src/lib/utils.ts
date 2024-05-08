export type GenericNested<T> =
  | {
      [k in string]: GenericNested<T>;
    }[]
  | T[];

/**
 * Removes the first occurrence of a specified item from a nested array or object structure.
 *
 * This function iterates recursively over the nested structure and removes the first occurrence
 * of the specified item. It stops searching as soon as the item is found and removed.
 *
 * @param arr - The nested array from which to remove the item.
 * @param item - The item to be removed.
 * @returns Returns `true` if the item was found and removed, otherwise `false`.
 */
export const removeNestedItem = <T>(arr: GenericNested<T>, item: T) => {
  let found = false;
  arr.forEach((el, index) => {
    if (found) return;
    if (el === item) {
      arr.splice(index, 1);
      found = true;
      return;
    }
    found = removeNestedItem(
      Array.isArray(el) ? el : Object.values(el as Object),
      item
    );
  });

  return found;
};

/**
 * Return child index at parent
 *
 * @param children All children in parent element
 * @param child Element child of parent to find index
 * @returns Return `number` of child index, otherwise `-1`
 *
 * @example
 * getChildNodeIndex(this.elRef.nativeElement.children, event.target);
 */
export const getChildNodeIndex = (
  children: HTMLCollection,
  child: HTMLElement | Node | EventTarget | null
) => Array.prototype.indexOf.call(children, child);
