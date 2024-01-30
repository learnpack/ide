interface IconProps {
    svg: React.ReactNode;
}

export const Icon = ({svg}:IconProps) => {
    return <span className="icon-component">
        {svg}
    </span>
}