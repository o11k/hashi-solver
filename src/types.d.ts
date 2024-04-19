export type Board = (1|2|3|4|5|6|7|8|null)[][]

export type Bridge = {
    src: {row: number, col: number},
    dst: {row: number, col: number},
    weight: 1 | 2
}
