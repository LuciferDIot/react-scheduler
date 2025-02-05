import { motion } from "framer-motion";
import React, { useCallback, useMemo } from "react";
import { TaskColors } from "../../../data";
import { ProductionTask } from "../../../types";
import { ExtendedTaskSection, TaskContent } from "../../molecules";

interface TaskProps {
  task: ProductionTask;
  span: number;
  rowIndex: number;
  cellWidthPX: number;
  percentage?: number;
  taskbgColorFormat?: { [key: string]: string };
  lockOperations: boolean;
  borderColor: string;
  textStickyLeftPX?: number;

  setrightClickUI: React.Dispatch<React.SetStateAction<ProductionTask | null>>;
  setTooltipVisible: React.Dispatch<React.SetStateAction<React.ReactNode>>;
  setSchedulerTasks: React.Dispatch<React.SetStateAction<ProductionTask[]>>;
  onTaskClick?: (task: ProductionTask) => void;
  onRowExpand?: (
    departmentName: string,
    departmentId: string,
    task: ProductionTask
  ) => Promise<void>;
  onRowShrink?: (
    departmentName: string,
    departmentId: string,
    task: ProductionTask
  ) => Promise<void>;
  tooltipComponent?: (task: ProductionTask) => React.ReactNode;
}

export const Task: React.FC<TaskProps> = React.memo(
  ({
    task,
    span,
    rowIndex,
    percentage = 0,
    cellWidthPX,
    taskbgColorFormat,
    lockOperations,
    borderColor,
    textStickyLeftPX,

    setrightClickUI,
    setTooltipVisible,
    setSchedulerTasks,
    onRowExpand,
    onRowShrink,
    onTaskClick,
    tooltipComponent,
  }) => {
    const taskWidth = useMemo(() => cellWidthPX * span, [cellWidthPX, span]);

    const taskBackgroundColor = useMemo(() => {
      return taskbgColorFormat &&
        task.bgColorKey &&
        taskbgColorFormat[task.bgColorKey]
        ? taskbgColorFormat[task.bgColorKey]
        : rowIndex % 2 === 0
        ? TaskColors.TASK_EVEN
        : TaskColors.TASK_ODD;
    }, [taskbgColorFormat, task.bgColorKey, rowIndex]);

    const extendedStyles = useMemo(() => {
      return {
        borderColor: task.extendedStyles?.borderColor
          ? task.extendedStyles.borderColor
          : TaskColors.REMOVED_TASK,
        backgroundColor: task.extendedStyles?.backgroundColor
          ? task.extendedStyles.backgroundColor
          : `${TaskColors.REMOVED_TASK}20`,
      };
    }, [task.extendedStyles]);

    const handleExpand = useCallback(() => {
      setSchedulerTasks((prev) =>
        prev.map((t) => {
          if (t.id === task.id) {
            const newEndDate = new Date(
              t.endDate.getTime() + 24 * 60 * 60 * 1000
            ); // Add one day
            const updatedTask = {
              ...t,
              prevEndDate: t.prevEndDate ? t.prevEndDate : t.endDate,
              endDate: newEndDate,
            };

            onRowExpand?.(task.departmentName, task.departmentId, updatedTask);
            return updatedTask;
          }
          return t;
        })
      );
    }, [task, onRowExpand]);

    const handleShrink = useCallback(() => {
      setSchedulerTasks((prev) =>
        prev.map((t) => {
          if (t.id === task.id) {
            const newEndDate = new Date(
              t.endDate.getTime() - 24 * 60 * 60 * 1000
            ); // Subtract one day
            const updatedTask = {
              ...t,
              prevEndDate: t.prevEndDate ? t.prevEndDate : t.endDate,
              endDate: newEndDate,
            };

            onRowShrink?.(task.departmentName, task.departmentId, updatedTask);
            return updatedTask;
          }
          return t;
        })
      );
    }, [task, onRowShrink]);

    const handleVisibleTooltip = (task: ProductionTask) => {
      setTooltipVisible(
        task.tooltipComponent
          ? task.tooltipComponent(task)
          : tooltipComponent?.(task)
      );
    };

    const handleRightClick = (task: ProductionTask, e: React.MouseEvent) => {
      e.preventDefault(); // Prevent the default context menu from appearing
      setrightClickUI(task); // Call the right-click handler
    };

    return (
      <motion.div
        key={`${task.id}-${taskWidth}-${task.startDate}-${task.endDate}`}
        className={`z-0 min-h-10 h-full p-0.5 border text-center text-nowrap ${borderColor} ${
          lockOperations ? "cursor-default" : "cursor-pointer hover:opacity-80"
        }`}
        style={{
          width: `${taskWidth}px`,
          backgroundColor:
            rowIndex % 2 === 0 ? TaskColors.ROW_EVEN : TaskColors.ROW_ODD,
        }}
        onClick={() => onTaskClick?.(task)} // Left-click handler
        onContextMenu={(e) => handleRightClick(task, e)} // Left-click handler
        layout
        transition={{ duration: 0.5, ease: "easeInOut" }}
        onMouseEnter={() => handleVisibleTooltip(task)}
        onMouseLeave={() => setTooltipVisible(null)}
      >
        <div className="group flex h-full w-full">
          <TaskContent
            task={task}
            percentage={percentage}
            taskBackgroundColor={taskBackgroundColor || ""}
            lockOperations={lockOperations}
            cellWidthPX={cellWidthPX}
            textStickyLeftPX={textStickyLeftPX}
            handleVisibleTooltip={handleVisibleTooltip}
            handleExpand={handleExpand}
            handleShrink={handleShrink}
            setTooltipVisible={setTooltipVisible}
          />
          {percentage !== 100 && (
            <ExtendedTaskSection
              percentage={percentage}
              extendedStyles={extendedStyles}
            />
          )}
        </div>
      </motion.div>
    );
  }
);
