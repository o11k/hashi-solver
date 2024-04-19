import Logic from 'logic-solver'
import { Board, Bridge, PossibleBridge } from './types'
import { create2DArray } from './utils'



export default function solve(board: Board): null | Bridge[] {
    const parsedBoard = parseBoard(board)

    const solver = new Logic.Solver()

    // Each bridge has 0, 1, or 2 connections
    for (const bridgeStr in parsedBoard.bridges) {
        const options = [0, 1, 2].map(n => Encode.str.weightTerm(bridgeStr, n))
        solver.require(Logic.exactlyOne(options))
    }

    // Each island has the right number of bridges coming out of it
    for (const island of Object.values(parsedBoard.islands)) {
        const numBridges = island.bridges.length

        if ((numBridges === 0)
            || !(island.value in BRIDGE_OPTIONS)
            || !(numBridges in BRIDGE_OPTIONS[island.value])) {
            return null
        }

        const options = BRIDGE_OPTIONS[island.value][numBridges]

        if (options.length === 0) {
            return null
        }

        const optionFormulas = options.map(option => Logic.and(
            option.map((weight, i) => Encode.str.weightTerm(island.bridges[i], weight))
        ))
        solver.require(Logic.exactlyOne(optionFormulas))
    }

    const solution = solver.solve()
    if (solution === null) {
        return null
    }

    return solution.getTrueVars()
        .map(Encode.obj.weightTerm)
        .filter(b => b !== null && b.weight !== 0) as Bridge[]
}


type ParsedBoard = {
    islands: {
        [key: string]: {
            value: 1|2|3|4|5|6|7|8
            bridges: string[]
        }
    }
    bridges: {
        [key: string]: {
            islands: [string, string]
            excludesBridges: string[]
        }
    }
}

const Encode = {
    str: {
        island: (row: number, col: number) => `${row}-${col}`,
        bridge: (islandStr1: string, islandStr2: string) => {
            const [lower, higher] = [islandStr1, islandStr2].sort()
            return `${lower},${higher}`
        },
        weightTerm: (bridgeStr: string, weight: number) => `weight;${bridgeStr};${weight}`,
    },
    obj: {
        island: (islandStr: string) => {
            const [row, col] = islandStr.split('-')
            return {row: parseInt(row), col: parseInt(col)}
        },
        bridge: (bridgeStr: string): PossibleBridge => {
            const [srcStr, dstStr] = bridgeStr.split(',')
            const [src, dst] = [Encode.obj.island(srcStr), Encode.obj.island(dstStr)]
            return {src, dst, isVertical: src.col === dst.col}
        },
        weightTerm: (term: string): PossibleBridge | null => {
            const [tag, bridge, weight] = term.split(';')
            if (tag !== 'weight') {
                return null
            }
            return {...Encode.obj.bridge(bridge), weight: parseInt(weight) as 0|1|2}
        },
    },
}


function parseBoard(board: Board): ParsedBoard {
    const result: ParsedBoard = {
        islands: {},
        bridges: {},
    }

    const height = board.length
    const width = (board.length === 0) ? 0 : board[0].length


    function addBridge(parsedBoard: ParsedBoard, row1: number, col1: number, row2: number, col2: number): string {
        const islandStr1 = Encode.str.island(row1, col1)
        const islandStr2 = Encode.str.island(row2, col2)
        const bridgeStr = Encode.str.bridge(islandStr1, islandStr2)

        parsedBoard.islands[islandStr1].bridges.push(bridgeStr)
        parsedBoard.islands[islandStr2].bridges.push(bridgeStr)

        parsedBoard.bridges[bridgeStr] = {
            islands: [islandStr1, islandStr2],
            excludesBridges: []
        }

        return bridgeStr
    }

    // Add islands
    for (let row=0; row<height; row++) {
        for (let col=0; col<width; col++) {
            const value = board[row][col]
            if (value !== null) {
                result.islands[Encode.str.island(row, col)] = {value: value, bridges: []}
            }
        }
    }

    const cellsWithBridges: (string | null)[][] = create2DArray(height, width, null)

    // Add horizontal bridges
    for (let row=0; row<height; row++) {
        let prevIslandCol: number | null = null;
        for (let col=0; col<width; col++) {
            if (board[row][col] !== null) {
                if (prevIslandCol !== null) {
                    const bridgeStr = addBridge(result, row, prevIslandCol, row, col)

                    // Find cells that this bridge overlapps
                    for (let bridgeCol=prevIslandCol+1; bridgeCol<col; bridgeCol++) {
                        cellsWithBridges[row][bridgeCol] = bridgeStr
                    }
                }
                prevIslandCol = col
            }
        }
    }

    // Add vertical bridges bridges
    for (let col=0; col<width; col++) {
        let prevIslandRow: number | null = null;
        for (let row=0; row<height; row++) {
            if (board[row][col] !== null) {
                if (prevIslandRow !== null) {
                    const bridgeStr = addBridge(result, prevIslandRow, col, row, col)

                    // Find horizontal bridges this bridge overlapps
                    for (let bridgeRow=prevIslandRow+1; bridgeRow<row; bridgeRow++) {
                        const otherBridgeStr = cellsWithBridges[bridgeRow][col]
                        if (otherBridgeStr !== null) {
                            result.bridges[bridgeStr].excludesBridges.push(otherBridgeStr)
                            result.bridges[otherBridgeStr].excludesBridges.push(bridgeStr)
                        }
                    }
                }
                prevIslandRow = row
            }
        }
    }

    return result
}



// Pre-calculated list of all bridge values, given value of island and number of possible bridges
const BRIDGE_OPTIONS: Readonly<{[key: number]: {[key: number]: number[][]}}> = Object.freeze({
    1: {
        1: [[1]],
        2: [[0, 1], [1, 0]],
        3: [[1, 0, 0], [0, 0, 1], [0, 1, 0]],
        4: [[0, 0, 0, 1], [0, 1, 0, 0], [0, 0, 1, 0], [1, 0, 0, 0]]
    },
    2: {
        1: [[2]],
        2: [[1, 1], [0, 2], [2, 0]],
        3: [[0, 2, 0], [0, 0, 2], [2, 0, 0], [1, 0, 1], [1, 1, 0], [0, 1, 1]],
        4: [[0, 0, 0, 2], [0, 0, 2, 0], [0, 2, 0, 0], [2, 0, 0, 0], [0, 1, 0, 1],
            [1, 1, 0, 0], [0, 1, 1, 0], [1, 0, 1, 0], [1, 0, 0, 1], [0, 0, 1, 1]]
    },
    3: {
        1: [],
        2: [[1, 2], [2, 1]],
        3: [[0, 2, 1], [1, 2, 0], [2, 1, 0], [2, 0, 1], [0, 1, 2], [1, 0, 2], [1, 1, 1]],
        4: [[1, 1, 0, 1], [1, 1, 1, 0], [0, 1, 1, 1], [1, 0, 1, 1], [0, 2, 0, 1],
            [0, 0, 2, 1], [1, 0, 0, 2], [2, 0, 0, 1], [0, 0, 1, 2], [0, 1, 2, 0],
            [1, 0, 2, 0], [1, 2, 0, 0], [2, 1, 0, 0], [0, 1, 0, 2], [0, 2, 1, 0], [2, 0, 1, 0]]
    },
    4: {
        1: [],
        2: [[2, 2]],
        3: [[0, 2, 2], [2, 0, 2], [2, 2, 0], [1, 2, 1], [2, 1, 1], [1, 1, 2]],
        4: [[1, 0, 1, 2], [2, 1, 1, 0], [1, 1, 2, 0], [0, 1, 2, 1], [1, 0, 2, 1],
            [1, 2, 0, 1], [2, 1, 0, 1], [2, 0, 1, 1], [1, 1, 0, 2], [1, 2, 1, 0],
            [0, 2, 1, 1], [0, 1, 1, 2], [1, 1, 1, 1], [0, 2, 2, 0], [2, 2, 0, 0],
            [2, 0, 2, 0], [2, 0, 0, 2], [0, 0, 2, 2], [0, 2, 0, 2]]
    },
    5: {
        1: [],
        2: [],
        3: [[1, 2, 2], [2, 1, 2], [2, 2, 1]],
        4: [[0, 1, 2, 2], [2, 2, 0, 1], [1, 0, 2, 2], [2, 1, 0, 2], [1, 2, 2, 0],
            [2, 0, 1, 2], [2, 0, 2, 1], [2, 2, 1, 0], [0, 2, 1, 2], [0, 2, 2, 1],
            [2, 1, 2, 0], [1, 2, 0, 2], [1, 2, 1, 1], [2, 1, 1, 1], [1, 1, 1, 2], [1, 1, 2, 1]]},
    6: {
        1: [],
        2: [],
        3: [[2, 2, 2]],
        4: [[1, 2, 1, 2], [1, 2, 2, 1], [2, 2, 1, 1], [2, 1, 1, 2], [2, 1, 2, 1],
            [1, 1, 2, 2], [0, 2, 2, 2], [2, 2, 0, 2], [2, 0, 2, 2], [2, 2, 2, 0]]},
    7: {
        1: [],
        2: [],
        3: [],
        4: [[2, 2, 2, 1], [2, 1, 2, 2], [1, 2, 2, 2], [2, 2, 1, 2]]},
    8: {
        1: [],
        2: [],
        3: [],
        4: [[2, 2, 2, 2]]
    }
})
