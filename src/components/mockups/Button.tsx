interface ButtonProps {
    text?: JSX.Element | string;
    svg?: any;
    extraClass?: string;
    action?: ((e:any) => void) |(() => void);
    disabled?: boolean;
}

export default function SimpleButton({text, action, svg, extraClass, disabled}: ButtonProps) {
    return <button disabled={Boolean(disabled)} className={`simple-button-svg ${extraClass}`} onClick={action}>
        {svg}
        {text}
    </button>
}