import { useState } from "react"
import HashiBoardInput from "./HashiBoardInput";
import { Board } from "./types";

export default function App() {
    const [width, setWidth] = useState(8);
    const [height, setHeight] = useState(8);

    const [board, setBoard] = useState<Board>([])

    
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

        <HashiBoardInput width={width} height={height} onChange={setBoard}></HashiBoardInput>
    </main>)
}
