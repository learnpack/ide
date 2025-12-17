import { Switch } from "radix-ui";

export default function SwitchComponent({
    checked = false,
    onChange,
    label,
    id,
}: {
    checked?: boolean;
    onChange: (checked: boolean) => void;
    label: string;
    id: string;
}) {
    return (
        <div className="flex-x align-center gap-small">
            <label className="Label" htmlFor={id}>
                {label}
            </label>
            <Switch.Root
                checked={checked}
                onCheckedChange={onChange}
                className="SwitchRoot"
                id={id}
            >
                <Switch.Thumb className="SwitchThumb" />
            </Switch.Root>
        </div>
    );
}
