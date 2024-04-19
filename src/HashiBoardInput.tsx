import { RefObject, createRef, useEffect, useRef, useState } from "react"
import { Board } from "./types"
import './HashiBoardInput.css'
import { create2DArray } from "./utils"


type Props = {
    width: number,
    height: number,
    onChange?: (board: Board) => unknown | undefined,
}

export default function HashiBoardInput({width, height, onChange}: Props) {
    const [board, setBoard] = useState<Board>([])
    const cellRefs = useRef<RefObject<HTMLInputElement>[][]>([])

    const [focusRow, setFocusRow] = useState<null | number>(null)
    const [focusCol, setFocusCol] = useState<null | number>(null)

    // Re-create board when dimentions change
    useEffect(() => {
        setBoard(create2DArray(height, width, null))
        cellRefs.current = create2DArray(height, width, () => createRef())
    }, [width, height])

    // Focus on cell
    useEffect(() => {
        if (focusRow !== null && focusCol !== null) {
            cellRefs.current[focusRow][focusCol].current?.focus()
        }
    }, [focusRow, focusCol])

    // Send changes to parent
    useEffect(() => {
        if (onChange) {
            onChange(board)
        }
    }, [board, onChange])

    const onCellChange = (rowIndex: number, colIndex: number, newValue: number | null) => {
        if (newValue !== null) {
            newValue = Math.min(8, Math.max(0, newValue % 10))
        }

        const newRow = board[rowIndex].map((value, i) => i === colIndex ? newValue : value)
        const newBoard = board.map((row, i) => i === rowIndex ? newRow : row)
        setBoard(newBoard as Board)
    }

    const onCellKeyDown = (rowIndex: number, colIndex: number, keyCode: string) => {
        switch (keyCode) {
            case 'ArrowUp':
                setFocusRow(Math.max(0, rowIndex-1))
                setFocusCol(colIndex)
                break
            case 'ArrowDown':
                setFocusRow(Math.min(height-1, rowIndex+1))
                setFocusCol(colIndex)
                break
            case 'ArrowLeft':
                setFocusRow(rowIndex)
                setFocusCol(Math.max(0, colIndex-1))
                break
            case 'ArrowRight':
                setFocusRow(rowIndex)
                setFocusCol(Math.min(width-1, colIndex+1))
                break
            default:
                return false
        }

        return true
    }

    return (<table className="hashiBoardInput"><tbody>
        {board.map((row, rowIndex) => <tr key={rowIndex}>
            {row.map((value, colIndex) => <td key={rowIndex + '_' + colIndex}>
                <input
                    type="text"
                    value={value ?? ''}
                    ref={cellRefs.current[rowIndex][colIndex]}
                    className="boardInputCell"
                    onChange={e => onCellChange(rowIndex, colIndex, parseInt(e.target.value) || null)}
                    onKeyDown={e => onCellKeyDown(rowIndex, colIndex, e.code) && e.preventDefault()}
                />
            </td>)}
        </tr>)}
    </tbody></table>)
}