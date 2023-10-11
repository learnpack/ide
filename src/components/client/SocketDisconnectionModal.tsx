import ModalTemplate from "./ModalTemplate"

export default function SocketDisconnectionModal() {

    return <ModalTemplate htmlId="socket-disconnected" header={<Header />} footer="" content={<Content />} />
}

const Header = () => <div>
    Socket disconnected!
</div>

const Content = () => <div>
    <p>Sorry, this error can happen for certain reasons.</p>
    <p>The basic steps to troubleshoot this error are the following</p>

    <details>
        <summary>
            <strong>Check that learnpack-CLI is runnning</strong>
        </summary>
        Go to your terminal and run the following command:
        <code>
            learnpack start
        </code>
    </details>

</div>