import { useRef, useState } from 'react';
import classes from './PlotTitle.module.css';
import { DataGridPlot } from '../../types';

interface PlotTitleProps {
  itemDataGrid: DataGridPlot;
  title: string;
  setTitle: React.Dispatch<React.SetStateAction<string>>;
}

export const PlotTitle = ({
  itemDataGrid,
  title,
  setTitle,
}: PlotTitleProps) => {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const handleBlurTitle = () => {
    if (titleRef.current) {
      setTitle(titleRef.current.innerText || 'Untitled');
    }
    setIsEditingTitle(false);
  };

  const handleKeyDownTitle = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (titleRef.current) {
        itemDataGrid.isTitleOverwritten = true;
        setTitle(titleRef.current.innerText || 'Untitled');
      }
      setIsEditingTitle(false);
    }
  };

  return (
    <div className={classes.editableTitle}>
      <span
        ref={titleRef}
        className={itemDataGrid.isEditing ? classes.isEditing : undefined}
        contentEditable={isEditingTitle && itemDataGrid.isEditing}
        suppressContentEditableWarning
        onClick={() => setIsEditingTitle(true)}
        onBlur={handleBlurTitle}
        onKeyDown={handleKeyDownTitle}
      >
        {title}
      </span>
    </div>
  );
};
