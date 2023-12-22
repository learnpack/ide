import { svgs } from "../../../assets/svgs";
import useStore from "../../../utils/store";
import SimpleButton from "../../mockups/Button";

interface IExerciseList {
    closeSidebar: () => void;
}

export default function ExercisesList({ closeSidebar }: IExerciseList) {
    const { exercises } = useStore(state => ({
        exercises: state.exercises
    }));
    
    return (
        <ul className="exercise-list">
            {exercises.map((item, index) => <ExerciseCard key={index} {...item} closeSidebar={closeSidebar} />)}
        </ul>

    )
}


interface IExerciseProps {
    position: number;
    title: string;
    done: boolean;
    graded: boolean;

    closeSidebar: () => void;
}

function ExerciseCard({ title, position, closeSidebar, graded, done }: IExerciseProps) {
    const { handlePositionChange } = useStore(state => ({
        handlePositionChange: state.handlePositionChange
    }));

    const titlefy = (str: string) => {
        let arr = str.split('-');
        arr.shift();
        let result = arr.join(' ');
        result = result.charAt(0).toUpperCase() + result.slice(1);
        return result;
    }

    const getNameWithoutNumber = (str: string) => {
        return titlefy(str);
    }

    return (
        <li className="exercise-card" onClick={
            () => {
                handlePositionChange(position);
                closeSidebar();
            }
        }>
            <div>
                <button className="blue-circle ">
                    <span>{title.split("-")[0]}</span>
                </button>
                <span>
                    {getNameWithoutNumber(title)}
                </span>
            </div>
            <div>
                {
                    graded && <SimpleButton svg={done ? svgs.checkIcon : svgs.blankCircle} text="" />
                }
            </div>
        </li>
    )
}