import SimpleButton from "../../mockups/Button"
import ModalTemplate from "./ModalTemplate"

export default function SocketDisconnectionModal() {

    return <ModalTemplate htmlId="socket-disconnected" header={<Header />} footer="" content={<Content />} />
}

const Header = () => <div>
    Socket disconnected!
</div>


const WindowReloader = () => {
    const reload = () => {
        window.location.reload();
    }

    return <SimpleButton extraClass="bg-blue pill" action={reload} text="Reload" />
}

const steps = [
    {
        title: "Step 1",
        instructions: <>
            <p>Check that Learnpack is running in your terminal.</p>
            <p>Run: <code>learnpack start</code></p>
        </>
    },
    {
        title: "Step 2",
        instructions: <>
            <p>Is Learnpack is running but you still see this model, reload the window:</p>
            <WindowReloader />
        </>
    },
]

const Content = () => {
    return <div>
        <p>Sorry, this error can happen for certain reasons.</p>
        <p>The basic steps to troubleshoot this error are the following:</p>

        {steps.map((step, index) => <Step key={index} title={step.title} instructions={step.instructions} />)}
    </div>
}

type TStep = {
    title: string
    instructions: React.ReactNode
}

const Step = (props: TStep) => {
    return <div>
        <h3>{props.title}</h3>
        {props.instructions}
    </div>
}