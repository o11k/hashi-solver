export function create2DArray<T>(height: number, width: number, value: T | ((row: number, col: number) => T)): T[][] {
    if (typeof value !== 'function') {
        return Array.from({length: height}, () => new Array(width).fill(value))
    }
    
    const func = <(row: number, col: number) => T> value;

    return Array.from({length: height}, (_, row) => {
        return Array.from({length: width}, (_, col) => func(row, col))
    })
}
