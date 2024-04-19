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

    // Bridges don't overlap
    for (const [bridgeStr, bridge] of Object.entries(parsedBoard.bridges)) {
        const thisTerm = Logic.not(Encode.str.weightTerm(bridgeStr, 0))
        const overlappingTerms = bridge.excludesBridges.map(b => Logic.not(Encode.str.weightTerm(b, 0)))
        const someOverlapping = Logic.or(overlappingTerms)
        solver.require(Logic.atMostOne(someOverlapping, thisTerm))
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

    // All islands are connected
    // These contraints don't completely guarantee it, but they allow us to check it more easily

    // All bridges have a "direction"
    for (const bridge in parsedBoard.bridges) {
        const noBridge = Encode.str.weightTerm(bridge, 0)
        const dir1 = Encode.str.directionTerm(bridge, false)
        const dir2 = Encode.str.directionTerm(bridge, true)
        solver.require(Logic.exactlyOne(noBridge, dir1, dir2))
    }
    // All islands but one must have at least one bridge "pointing into" them
    for (const [islandStr, island] of Object.entries(parsedBoard.islands).slice(1)) {
        const bridgesPointingIn = island.bridges.map(bridge => Encode.str.directionTerm(bridge, islandStr, true))
        solver.require(Logic.or(bridgesPointingIn))
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
    str: class str {
        static island(row: number, col: number) {
            return `${row}-${col}`
        }
        static bridge(islandStr1: string, islandStr2: string) {
            const [island1, island2] = [Encode.obj.island(islandStr1), Encode.obj.island(islandStr2)]
            const flipped = island1.row >= island2.row && island1.col >= island2.col
            const [lower, higher] = flipped ? [islandStr2, islandStr1] : [islandStr1, islandStr2]
            return `${lower},${higher}`
        }
        static weightTerm(bridgeStr: string, weight: number) {
            return `weight;${bridgeStr};${weight}`
        }

        static directionTerm(bridgeStr: string, pointingToDst: boolean): string
        static directionTerm(bridgeStr: string, islandStr: string, pointingIn: boolean): string
        static directionTerm(bridgeStr: string, islandStrOrPointingToDst: string | boolean, pointingIn?: boolean): string {
            let pointingToDst: boolean
            if (typeof islandStrOrPointingToDst === 'boolean') {
                pointingToDst = islandStrOrPointingToDst
            } else {
                const isSrc = bridgeStr.startsWith(islandStrOrPointingToDst + ',')
                pointingToDst = isSrc !== pointingIn
            }
            const pointingDir = pointingToDst ? 0 : 1
            return `dir;${bridgeStr};${pointingDir}`
        }
    },
    obj: class obj {
        static island(islandStr: string) {
            const [row, col] = islandStr.split('-')
            return {row: parseInt(row), col: parseInt(col)}
        }
        static bridge(bridgeStr: string): PossibleBridge {
            const [srcStr, dstStr] = bridgeStr.split(',')
            const [src, dst] = [Encode.obj.island(srcStr), Encode.obj.island(dstStr)]
            return {src, dst, isVertical: src.col === dst.col}
        }
        static weightTerm(term: string): PossibleBridge | null {
            const [tag, bridge, weight] = term.split(';')
            if (tag !== 'weight') {
                return null
            }
            return {...Encode.obj.bridge(bridge), weight: parseInt(weight) as 0|1|2}
        }
        static directionTerm(term: string): {bridge: PossibleBridge, pointingToDst: boolean} | null {
            const [tag, bridge, direction] = term.split(';')
            if (tag !== 'dir') {
                return null
            }
            return {bridge: Encode.obj.bridge(bridge), pointingToDst: parseInt(direction) === 0}
        }
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
