import { svgs } from "../../resources/svgs";
import useStore from "../../utils/store";
import SimpleButton from "./Button";

interface IExerciseList {
    closeSidebar: () => void;
}

export default function ExercisesList({closeSidebar}:IExerciseList) {
    const { exercises } = useStore();
    
    return (
        <ul className="exercise-list">
            {exercises.map((item, index) => <ExerciseCard key={index} name={item.title} position={item.position} done={item.done} closeSidebar={closeSidebar} />)}
        </ul>

    )
}

interface IExerciseProps {
    name: string;
    done: boolean;
    position: number;
    closeSidebar: () => void;
}

function ExerciseCard({ name, position, closeSidebar, done }: IExerciseProps) {
    const { setPosition, fetchReadme } = useStore();

    const getNameWithoutNumber = (str:string) => {
        let arr = str.split('-');
        arr.shift();
        return arr.join(' ');
    }

    return (
        <li className="exercise-card" onClick={
            () => {
                setPosition(position);
                fetchReadme();
                closeSidebar()

            }
        }>
            <div>
                <button className="blue-circle ">
                    <span>{name.split("-")[0]}</span>
                </button>
                <span>
                    {getNameWithoutNumber(name)}
                </span>
            </div>
            <div>
                <SimpleButton svg={done ? svgs.checkIcon : svgs.blankCircle} text="" />
            </div>
        </li>
    )
}