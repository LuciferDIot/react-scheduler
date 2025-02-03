import { AnimatePresence } from "framer-motion";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { TaskColors } from "../../../data";
import {
  Coordination,
  ProductionTask,
  TimelineSchedulerProps,
} from "../../../types";
import { generateGroupedTasks } from "../../../util/common.util";
import { ContextMenu, Tooltip } from "../../atoms";
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
      rowCategories = [1, 2, 3, 4, 5, 6, 7, 8, 9],
    },
    scrollIntoToday,
    tooltipComponent,
    onRowExpand,
    onRowShrink,
    onTaskClick,
    onRowLabelClick,
  }) => {
    const mergedStyles = useMemo(
      () => ({ ...defaultStyles, ...styles }),
      [styles]
    );

    const containerRef = useRef<HTMLDivElement>(null);

    const [schedulerTasks, setSchedulerTasks] =
      useState<ProductionTask[]>(data);
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

    const daybgColor = useMemo(() => {
      if (!styles.daybgColorHighlight) return undefined;

      return {
        daysHighlight: Object.values(styles.daybgColorHighlight).flat(),
        daybgColorHighlight: Object.keys(styles.daybgColorHighlight).reduce(
          (acc, color) => {
            styles.daybgColorHighlight?.[color]?.forEach((date) => {
              acc[date.toISOString().split("T")[0]] = color;
            });
            return acc;
          },
          {} as { [key: string]: string }
        ),
      };
    }, [styles.daybgColorHighlight]);

    useEffect(() => {
      if (data !== schedulerTasks) {
        setSchedulerTasks(data);
      }
    }, [data]);

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
    );

    const groupedTasks = useMemo(() => {
      const grouped = generateGroupedTasks(schedulerTasks);

      rowCategories.forEach(
        (category) => !grouped[category] && (grouped[category] = [[]])
      );
      return grouped;
    }, [schedulerTasks, rowCategories]);

    const handleMouseMove = (e: React.MouseEvent) => {
      if (tooltipVisible) {
        setMousePosition({ x: e.clientX, y: e.clientY });
      }
    };

    useEffect(() => {
      setError(undefined);
      schedulerTasks.forEach((task) => {
        if (task.startDate > task.endDate) {
          setError(`Task ${task.id} has an invalid date range`);
        } else if (task.prevEndDate && task.startDate > task.prevEndDate) {
          setError(`Task ${task.id} has an invalid date range`);
        }
      });
    }, [schedulerTasks]);

    return (
      <AnimatePresence mode="sync" presenceAffectsLayout>
        {error ? (
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
                  daybgColor={daybgColor}
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
                {Object.keys(groupedTasks)
                  .sort((a, b) => a.localeCompare(b))
                  .map((line) => (
                    <div className="pb-2 bg-white" key={line}>
                      {groupedTasks[line].map((row, taskRowIndex) => (
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
                            .flatMap((department) => groupedTasks[department])
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
              <Tooltip mousePosition={mousePosition}>{tooltipVisible}</Tooltip>
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
    );
  }
);
