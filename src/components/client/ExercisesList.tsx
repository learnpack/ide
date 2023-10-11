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
            {exercises.map((item, index) => <ExerciseCard key={index} name={item.title} position={item.position} closeSidebar={closeSidebar} />)}
        </ul>

    )
}

interface IExerciseProps {
    name: string;
    position: number;
    closeSidebar: () => void;
}

function ExerciseCard({ name, position, closeSidebar }: IExerciseProps) {
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
                <SimpleButton svg={svgs.checkIcon} text="" />
            </div>
        </li>
    )
}