import { useTranslation } from "react-i18next";
import { svgs } from "../../assets/svgs";

type ImageErrorType = "generation" | "load";

interface ImageErrorDisplayProps {
  errorType: ImageErrorType;
  isCreator?: boolean;
}

export const ImageErrorDisplay = ({ 
  errorType, 
  isCreator = false 
}: ImageErrorDisplayProps) => {
  const { t } = useTranslation();
  
  // Determine which message to show based on error type and context
  const getErrorMessage = () => {
    if (errorType === "generation") {
      return t("imageGenerationError");
    }
    // errorType === "load"
    return isCreator 
      ? t("imageLoadErrorCreator") 
      : t("imageLoadErrorStudent");
  };
  
  return (
    <div className="flex flex-col items-center gap-2 p-4">
      <div className="image-error-container">
        {svgs.imageError}
      </div>
      <p className="text-center text-gray-500 dark:text-gray-400 m-0 text-sm">
        {getErrorMessage()}
      </p>
    </div>
  );
};

