import { motion } from "framer-motion";
import React, { useEffect, useMemo, useRef } from "react";
import { TaskColors } from "../../../data";
import { ProductionTask } from "../../../types";
import { calculatePercentage } from "../../../util/date.util";
import EmptyCell from "../../molecules/EmptyCell";
import { Task } from "../Task";

interface RowProps {
  departmentName: string;
  row: ProductionTask[];
  dates: string[];
  rowEndDate: Date;
  rowIndex: number;
  groupedTasks: Record<string, ProductionTask[][]>;
  taskRowIndex: number;
  cellWidthPX: number;
  cellHeightPX: number;
  lockOperations: boolean;
  taskbgColorFormat?: { [key: string]: string };
  labelConfig: {
    additionalStickyLeft: number;
    labelMaxWidth: number;
    setLabelMaxWidth: React.Dispatch<React.SetStateAction<number>>;
  };
  borderColor: string;

  setrightClickUI: React.Dispatch<React.SetStateAction<ProductionTask | null>>;
  setTooltipVisible: React.Dispatch<React.SetStateAction<React.ReactNode>>;
  tooltipComponent?: (task: ProductionTask) => React.ReactNode;
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
  onRowLabelClick?: (line: string) => void;
}

const Row: React.FC<RowProps> = React.memo(
  ({
    departmentName: line,
    row,
    dates,
    rowEndDate,
    rowIndex,
    groupedTasks,
    taskRowIndex,
    borderColor,
    cellWidthPX,
    cellHeightPX,
    taskbgColorFormat,
    lockOperations,
    labelConfig: { additionalStickyLeft, labelMaxWidth, setLabelMaxWidth },

    setrightClickUI,
    setTooltipVisible,
    tooltipComponent,
    setSchedulerTasks,
    onRowExpand,
    onRowShrink,
    onTaskClick,
    onRowLabelClick,
  }) => {
    const labelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (labelRef.current) {
        const width = labelRef.current.getBoundingClientRect().width;
        setLabelMaxWidth((prev) => Math.max(prev, width));
      }
    }, [line]);

    const taskComponents = useMemo(
      () =>
        dates.map((date, index) => {
          const currDate = new Date(date);
          const task = row.find(
            (t) => t.startDate <= currDate && currDate <= t.endDate
          );

          if (!task) {
            return (
              <EmptyCell
                key={`${line}-${date}`}
                borderColor={borderColor}
                cellHeightPX={cellHeightPX}
                cellWidthPX={cellWidthPX}
                rowIndex={rowIndex}
              />
            );
          }

          const taskStartIndex = dates.indexOf(
            task.startDate.toISOString().split("T")[0] || ""
          );
          const taskEndIndex = dates.indexOf(
            task.endDate.toISOString().split("T")[0] || ""
          );
          let span = taskEndIndex - taskStartIndex + 1;

          if (taskEndIndex < taskStartIndex) {
            const endOfRowIndex = dates.indexOf(
              rowEndDate.toISOString().split("T")[0] || ""
            );
            span = endOfRowIndex - taskStartIndex + 1;
          }

          if (index === taskStartIndex) {
            const percentage = calculatePercentage(task);
            return (
              <Task
                key={`${task.id}-${labelMaxWidth}`}
                cellWidthPX={cellWidthPX}
                task={task}
                span={span}
                rowIndex={rowIndex}
                percentage={percentage}
                textStickyLeftPX={labelMaxWidth + additionalStickyLeft}
                taskbgColorFormat={taskbgColorFormat}
                lockOperations={lockOperations}
                borderColor={borderColor}
                setrightClickUI={setrightClickUI}
                setTooltipVisible={setTooltipVisible}
                setSchedulerTasks={setSchedulerTasks}
                onRowExpand={onRowExpand}
                onRowShrink={onRowShrink}
                onTaskClick={onTaskClick}
                tooltipComponent={tooltipComponent}
              />
            );
          }

          return null;
        }),
      [row, lockOperations, labelMaxWidth]
    );

    return (
      <div key={line} className="flex flex-row gap-2">
        <motion.div
          ref={labelRef}
          className={` z-[2] sticky left-0 min-w-48 p-2 border-x-1 ${borderColor} ${
            (groupedTasks[line]?.length ?? 0) > 1
              ? taskRowIndex === 0
                ? "border-t-[0.1px]"
                : taskRowIndex === (groupedTasks[line]?.length ?? 0) - 1
                ? "border-b-[0.1px]"
                : "border-y-0"
              : "border"
          }`}
          style={{ backgroundColor: TaskColors.ROW_ODD }}
          initial={{ width: 0 }}
          animate={{ width: labelMaxWidth }}
          exit={{ width: 0 }}
        >
          {taskRowIndex === 0 && (
            <div
              className="flex items-center justify-between gap-2"
              onClick={(e) => {
                e.stopPropagation();
                if (onRowLabelClick) onRowLabelClick(line);
              }}
            >
              <label className="text-nowrap">{line}</label>
              {/* <motion.button
                className={`w-10 h-5 rounded-sm justify-center items-center backdrop-blur-md flex 
                border border-dashed ${borderColor}`}
                style={{ borderColor: TaskColors.REMOVED_TASK }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Icon name="add" />
              </motion.button> */}
            </div>
          )}
        </motion.div>
        <div key={`${line}-row-${taskRowIndex}`} className="flex">
          {taskComponents}
        </div>
      </div>
    );
  }
);

export { Row };
