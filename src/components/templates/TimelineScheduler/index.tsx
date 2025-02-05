import { AnimatePresence } from "framer-motion";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { TaskColors } from "../../../data";
import {
  Coordination,
  ProductionTask,
  TimelineSchedulerProps,
} from "../../../types";
import { generateGroupedTasks } from "../../../util/common.util";
import { ContextMenu, ErrorBoundary, Tooltip } from "../../atoms";
import { RightClickUI } from "../../molecules";
import { Header } from "../../organisms/Header";
import { Row } from "../../organisms/Row";

const defaultStyles = {
  customCellHeightPX: 40,
  customCellWidthPX: 100,
  taskbgColorFormat: TaskColors,
  daybgColorHighlight: undefined,
};

const borderColor = "border-gray-200";
const additionalStickyLeft = 10;

export const TimelineScheduler: React.FC<TimelineSchedulerProps> = React.memo(
  ({
    config: {
      topic,
      startOffsetDays = 0,
      endOffsetDays = 0,
      data = [],
      styles = defaultStyles,
      rowCategories,
    },
    scrollIntoToday,
    tooltipComponent,
    onRowExpand,
    onRowShrink,
    onTaskClick,
    onRowLabelClick,
    loading, // New loading prop
  }) => {
    const mergedStyles = useMemo(
      () => ({ ...defaultStyles, ...styles }),
      [styles]
    );

    const containerRef = useRef<HTMLDivElement>(null);

    const [schedulerTasks, setSchedulerTasks] = useState<ProductionTask[]>([]);
    const [error, setError] = useState<string | undefined>();
    const [lockOperations, setLockOperations] = useState<boolean>(true);
    const [mousePosition, setMousePosition] = useState<Coordination>({
      x: 0,
      y: 0,
    });
    const [tooltipVisible, setTooltipVisible] =
      useState<React.ReactNode | null>(null);

    const [rightClickUI, setrightClickUI] = useState<ProductionTask | null>(
      null
    );
    const [labelMaxWidth, setLabelMaxWidth] = useState<number>(0);

    useEffect(() => {
      if (data !== schedulerTasks) {
        setSchedulerTasks(data);
      }
    }, [data]);

    const handleMouseMove = (e: React.MouseEvent) => {
      if (tooltipVisible) {
        setMousePosition({ x: e.clientX, y: e.clientY });
      }
    };

    useEffect(() => {
      setError(undefined);
      schedulerTasks.forEach((task) => {
        if (!(task.startDate instanceof Date)) {
          console.error(`Invalid startDate in task ${task.id}`, task.startDate);
          setError(`Invalid startDate in task ${task.id}`);
        }
        if (!(task.endDate instanceof Date)) {
          console.error(`Invalid endDate in task ${task.id}`, task.endDate);
          setError(`Invalid endDate in task ${task.id}`);
        }
        if (task.startDate > task.endDate) {
          setError(`Task ${task.id} has an invalid date range`);
        } else if (task.prevEndDate && task.startDate > task.prevEndDate) {
          setError(`Task ${task.id} has an invalid date range`);
        }
      });
    }, [schedulerTasks]);

    const mandatoryFieldsAvailable = useMemo(() => {
      return schedulerTasks.every(
        (task) =>
          task.startDate instanceof Date &&
          task.endDate instanceof Date &&
          task.startDate <= task.endDate
      );
    }, [schedulerTasks]);

    try {
      const { start: tableStartDate, end: tableEndDate } = useMemo(() => {
        if (schedulerTasks.length === 0) {
          const startOffSetDay = new Date();
          startOffSetDay.setDate(startOffSetDay.getDate() + startOffsetDays);

          const endOffsetDay = new Date();
          endOffsetDay.setDate(endOffsetDay.getDate() + endOffsetDays);

          return { start: startOffSetDay, end: endOffsetDay };
        }

        const taskStartDates = new Date(
          Math.min(...schedulerTasks.map((task) => task.startDate.getTime())) -
            2 * 86400000
        );
        const taskEndDates = new Date(
          Math.max(...schedulerTasks.map((task) => task.endDate.getTime())) +
            2 * 86400000
        );

        return { start: taskStartDates, end: taskEndDates };
      }, [schedulerTasks, startOffsetDays, endOffsetDays]);

      const groupedTasks = useMemo(() => {
        try {
          const grouped = generateGroupedTasks(schedulerTasks);
          rowCategories?.forEach(
            (category) => !grouped[category] && (grouped[category] = [[]])
          );
          return grouped;
        } catch (err) {
          console.error("Error while grouping tasks:", err);
          setError("Failed to group tasks. Check data format.");
          return {};
        }
      }, [schedulerTasks, rowCategories]);

      const days = useMemo(
        () =>
          Math.ceil(
            (tableEndDate.getTime() - tableStartDate.getTime()) / 86400000
          ) + 1,
        [tableStartDate, tableEndDate]
      );
      const dates = useMemo(
        () =>
          Array.from({ length: days }).map((_, index) => {
            const date = new Date(tableStartDate);
            date.setDate(tableStartDate.getDate() + index);
            return date.toISOString().split("T")[0];
          }),
        [days, tableStartDate]
      ).filter((date): date is string => date !== undefined);

      if (!dates) return;

      return (
        <ErrorBoundary>
          <AnimatePresence mode="sync" presenceAffectsLayout>
            {loading || !mandatoryFieldsAvailable ? (
              <div className="w-full h-full flex justify-center items-center p-4">
                {loading
                  ? "Loading..."
                  : "Error: Mandatory fields are missing."}
              </div>
            ) : error ? (
              <div className="w-full h-full flex justify-center items-center p-4">
                {error}
              </div>
            ) : (
              <>
                <div
                  ref={containerRef}
                  className="relative max-w-[90vw] max-h-[75vh] w-fit h-fit
          scrollbar-track-white dark:scrollbar-track-black scrollbar-thumb-black/20
          scrollbar-thin overflow-x-scroll horizontal-scroll"
                  onMouseMove={handleMouseMove}
                >
                  <div className="w-fit text-sm">
                    <Header
                      lockOperations={lockOperations}
                      dates={dates}
                      topic={topic}
                      daybgColorHighlight={styles.daybgColorHighlight}
                      containerRef={containerRef}
                      cellWidthPX={mergedStyles.customCellWidthPX}
                      scrollIntoToday={scrollIntoToday}
                      borderColor={borderColor}
                      labelConfig={{
                        additionalStickyLeft,
                        labelMaxWidth,
                        setLabelMaxWidth,
                      }}
                      setTooltipVisible={setTooltipVisible}
                      lockChange={() => setLockOperations(!lockOperations)}
                    />
                    {Object.keys(groupedTasks || [])
                      .sort((a, b) => a.localeCompare(b))
                      .map((line) => (
                        <div className="pb-2 bg-white" key={line}>
                          {groupedTasks[line]?.map((row, taskRowIndex) => (
                            <Row
                              key={`${line}-${taskRowIndex}`}
                              lockOperations={lockOperations}
                              cellWidthPX={mergedStyles.customCellWidthPX}
                              cellHeightPX={mergedStyles.customCellHeightPX}
                              departmentName={line}
                              row={row}
                              rowEndDate={tableEndDate}
                              dates={dates}
                              rowIndex={Object.keys(groupedTasks)
                                .sort((a, b) => a.localeCompare(b))
                                .flatMap(
                                  (department) => groupedTasks[department]
                                )
                                .findIndex((r) => r === row)}
                              groupedTasks={groupedTasks}
                              taskRowIndex={taskRowIndex}
                              taskbgColorFormat={mergedStyles.taskbgColorFormat}
                              borderColor={borderColor}
                              labelConfig={{
                                additionalStickyLeft,
                                labelMaxWidth,
                                setLabelMaxWidth,
                              }}
                              setrightClickUI={setrightClickUI}
                              setTooltipVisible={setTooltipVisible}
                              tooltipComponent={tooltipComponent}
                              onRowExpand={onRowExpand}
                              onRowShrink={onRowShrink}
                              onTaskClick={onTaskClick}
                              onRowLabelClick={onRowLabelClick}
                              setSchedulerTasks={setSchedulerTasks}
                            />
                          ))}
                        </div>
                      ))}
                  </div>
                </div>
                {tooltipVisible && !rightClickUI && (
                  <Tooltip mousePosition={mousePosition}>
                    {tooltipVisible}
                  </Tooltip>
                )}
                {rightClickUI && (
                  <ContextMenu
                    mousePosition={mousePosition}
                    onClose={() => setrightClickUI(null)}
                  >
                    <RightClickUI
                      task={rightClickUI}
                      setSchedulerTasks={setSchedulerTasks}
                    />
                  </ContextMenu>
                )}
              </>
            )}
          </AnimatePresence>
        </ErrorBoundary>
      );
    } catch (error) {
      console.error("Error in TimelineScheduler:", error);
      return (
        <div className="w-full h-full flex justify-center items-center p-4">
          {error instanceof Error
            ? error.message
            : "An unexpected error occurred."}
        </div>
      );
    }
  }
);
