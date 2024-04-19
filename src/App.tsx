import { useState } from "react"
import HashiBoardInput from "./HashiBoardInput";
import { Board, Bridge } from "./types";
import solve from "./solve";
import HashiBoardOutput from "./HashiBoardOutput";

export default function App() {
    const [width, setWidth] = useState(8);
    const [height, setHeight] = useState(8);

    const [board, setBoard] = useState<Board>([])

    const [solution, setSolution] = useState<null | {board: Board, bridges: Bridge[]}>(null)

    return (<main>
        <table><tbody>
            <tr>
                <td><label htmlFor="width">Width</label></td>
                <td><input type="number" name="width" min={1} value={width} onChange={(e) => setWidth(parseInt(e.target.value) || 8)} /></td>
            </tr>
            <tr>
                <td><label htmlFor="height">Height</label></td>
                <td><input type="number" name="height" min={1} value={height} onChange={(e) => setHeight(parseInt(e.target.value) || 8)} /></td>
            </tr>
        </tbody></table>


        <HashiBoardInput width={width} height={height} onChange={setBoard} />

        <button onClick={() => {
            const bridges = solve(board);
            setSolution(bridges === null ? null : {board, bridges})
        }}>Solve</button>
        <br />
        {solution === null ? <p>No Solution</p> : <HashiBoardOutput board={solution.board} bridges={solution.bridges} />}
    </main>)
}
