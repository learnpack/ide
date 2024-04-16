interface ButtonProps {
    id?: string;
    text?: JSX.Element | string;
    svg?: any;
    extraClass?: string;
    action?: ((e:any) => void) |(() => void);
    disabled?: boolean;
}

export default function SimpleButton({text, action, svg, extraClass, disabled, id}: ButtonProps) {
    return <button id={id} disabled={Boolean(disabled)} className={`simple-button-svg ${extraClass}`} onClick={action}>
        {svg}
        <span>{text}</span>
    </button>
}