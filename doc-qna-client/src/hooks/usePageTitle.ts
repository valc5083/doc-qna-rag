import { useEffect } from "react";

const usePageTitle = (title: string) => {
  useEffect(() => {
    document.title = `${title} | DocQnA`;
    return () => {
      document.title = "DocQnA";
    };
  }, [title]);
};

export default usePageTitle;
