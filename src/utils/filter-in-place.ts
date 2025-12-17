export function filterInPlace<T>(arr: T[], predicate: (value: T, index: number, array: T[]) => boolean): T[] {

    for (let i = arr.length - 1; i >= 0; i--) {
        if (!predicate(arr[i], i, arr)) arr.splice(i, 1)
    }

    return arr
}