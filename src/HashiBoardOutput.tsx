import { useMemo } from "react";
import { Board, Bridge } from "./types";
import { create2DArray } from "./utils";

type Props = {
    board: Board
    bridges: Bridge[]
}


function bridgeToChar(bridge: Bridge): string {
    switch (bridge.weight) {
        case 1: return bridge.isVertical ? '│' : '─'
        case 2: return bridge.isVertical ? '║' : '═'
        default: throw new Error('unreachable ' + JSON.stringify(bridge))
    }
}


export default function HashiBoardOutput({ board, bridges }: Props) {

    const solutionStr = useMemo(() => {
        const [height, width] = [board.length, (board.length === 0) ? 0 : board[0].length]
        const result = create2DArray(height, width, (row, col) => {
            const cell = board[row][col]
            return (cell === null) ? '.' : cell.toString()
        })
        for (const bridge of bridges) {

            const char = bridgeToChar(bridge)

            for (let row=bridge.src.row; row<=bridge.dst.row; row++) {
                for (let col=bridge.src.col; col<=bridge.dst.col; col++) {row
                    if (result[row][col] === '.') {
                        result[row][col] = char
                    }
                }
            }
        }

        return result.map(line => line.join('')).join('\n')
    }, [board, bridges])

    return <pre>{solutionStr}</pre>
}
