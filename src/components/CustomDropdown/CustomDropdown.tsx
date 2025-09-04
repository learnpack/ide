import { useState, useRef, useEffect, FC, ReactNode } from "react";
import styles from "./CustomDropdown.module.css";
import { createPortal } from "react-dom";

interface CustomDropdownProps {
  /** The trigger button content */
  trigger: ReactNode;
  /** The content to display inside the dropdown */
  children: ReactNode;
  /** Additional CSS class for the dropdown container */
  className?: string;
  /** Additional CSS class for the dropdown menu */
  menuClassName?: string;
  /** Position of the dropdown relative to the trigger */
  position?: "left" | "right" | "center";
  /** Whether the dropdown should close when clicking outside */
  closeOnOutsideClick?: boolean;
  /** Callback when dropdown opens */
  onOpen?: () => void;
  /** Callback when dropdown closes */
  onClose?: () => void;
  /** Whether the dropdown is controlled externally */
  isOpen?: boolean;
  /** Callback when dropdown state changes (for controlled mode) */
  onToggle?: (isOpen: boolean) => void;
}

const CustomDropdown: FC<CustomDropdownProps> = ({
  trigger,
  children,
  className = "",
  menuClassName = "",
  position = "bottom",
  closeOnOutsideClick = true,
  onOpen,
  onClose,
  isOpen: controlledIsOpen,
  onToggle,
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Use controlled state if provided, otherwise use internal state
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const calculatePosition = () => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

    let top = rect.bottom + scrollTop + 4; // 4px margin
    let left = rect.left + scrollLeft;

    // Adjust horizontal position based on position prop
    switch (position) {
      case "left":
        left = rect.left + scrollLeft;
        break;
      case "center":
        left = rect.left + scrollLeft + (rect.width / 2);
        break;
      case "right":
      default:
        left = rect.right + scrollLeft;
        break;
    }

    // Check if dropdown would go off-screen and adjust if necessary
    const dropdownWidth = 240; // Approximate dropdown width (15rem = 240px)
    const viewportWidth = window.innerWidth;
    
    if (left + dropdownWidth > viewportWidth) {
      left = viewportWidth - dropdownWidth - 10; // 10px margin from edge
    }
    
    if (left < 10) {
      left = 10; // 10px margin from left edge
    }

    setDropdownPosition({ top, left });
  };

  const handleToggle = () => {
    const newIsOpen = !isOpen;

    if (newIsOpen) {
      calculatePosition();
    }

    if (controlledIsOpen === undefined) {
      setInternalIsOpen(newIsOpen);
    }

    onToggle?.(newIsOpen);

    if (newIsOpen) {
      onOpen?.();
    } else {
      onClose?.();
    }
  };

  const handleClose = () => {
    if (controlledIsOpen === undefined) {
      setInternalIsOpen(false);
    }

    onToggle?.(false);
    onClose?.();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!closeOnOutsideClick || !isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        handleClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, closeOnOutsideClick]);

  // Recalculate position on scroll and resize
  useEffect(() => {
    if (!isOpen) return;

    const handleScroll = () => {
      calculatePosition();
    };

    const handleResize = () => {
      calculatePosition();
    };

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [isOpen, position]);

  // Get position classes
  const getPositionClass = () => {
    switch (position) {
      case "left":
        return styles.dropdownLeft;
      case "center":
        return styles.dropdownCenter;
      case "right":
      default:
        return styles.dropdownRight;
    }
  };

  return (
    <div ref={containerRef} className={`${styles.customDropdown} pos-relative z-index-2 ${className}`}>
      <div onClick={handleToggle} className={styles.dropdownTrigger}>
        {trigger}
      </div>

      {isOpen && (
        createPortal(
          <div ref={dropdownRef}
            className={`${styles.dropdownMenu} ${getPositionClass()} ${menuClassName}` }
            style={{
              position: 'absolute',
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
            }}
          >
            {children}
          </div>,
          document.body
        )
      )}
    </div>
  );
};

export default CustomDropdown;
