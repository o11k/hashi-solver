export type Board = (1|2|3|4|5|6|7|8|null)[][]

export interface PossibleBridge {
    src: {row: number, col: number},
    dst: {row: number, col: number},
    isVertical: boolean,
    weight?: 0 | 1 | 2
}

export interface Bridge extends PossibleBridge {
    weight: 1 | 2,
}
