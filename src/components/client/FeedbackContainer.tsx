import { svgs } from "../../resources/svgs";
import useStore from "../../utils/store"
import SimpleButton from "./Button";

export default function FeedbackContainer() {
    const { feedback, showFeedback, toggleFeedback } = useStore();

    return <>
        {
            showFeedback && <div className="feedback-container">
                <div className="feedback-component">
                    <div className="-header">
                        <button>{svgs.brainIcon}AI Feedback</button>
                        <button onClick={toggleFeedback}>{svgs.closeIcon}</button>
                    </div>
                    Based on what you sent us, we have this recomendation for you:
                    <div dangerouslySetInnerHTML={{ __html: feedback }} className="-content"></div>

                    <div className="-footer">
                        <div>
                            <SimpleButton svg={svgs.upFingerIcon} action={toggleFeedback} />
                            <SimpleButton svg={svgs.downFingerIcon}  action={toggleFeedback}/>
                        </div>
                        <p>Did you find this feedback useful?</p>
                    </div>
                </div>

            </div>
        }
    </>
}