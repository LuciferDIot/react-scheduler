// Organisms/Header.tsx
import { motion, useInView } from "framer-motion";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { TaskColors } from "../../../data";
import { getMonthName } from "../../../util/date.util";
import { IconButton } from "../../atoms";
import { DateCell, MonthHeader } from "../../molecules";

interface HeaderProps {
  dates: string[];
  topic: string;
  cellWidthPX: number;
  lockOperations: boolean;
  scrollIntoToday?: boolean;
  containerRef: React.RefObject<HTMLDivElement>;
  borderColor: string;
  labelConfig: {
    additionalStickyLeft: number;
    labelMaxWidth: number;
    setLabelMaxWidth: React.Dispatch<React.SetStateAction<number>>;
  };
  daybgColorHighlight?: {
    [key: string]: Date[];
  };
  setTooltipVisible: React.Dispatch<React.SetStateAction<React.ReactNode>>;
  lockChange: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  dates,
  topic,
  cellWidthPX,
  lockOperations,
  scrollIntoToday,
  containerRef,
  borderColor,
  labelConfig: { additionalStickyLeft, labelMaxWidth, setLabelMaxWidth },
  daybgColorHighlight,
  setTooltipVisible,
  lockChange,
}) => {
  const { height } = containerRef.current
    ? containerRef.current.getBoundingClientRect()
    : { height: 0 };
  const groupedDates = useMemo(
    () =>
      dates.reduce<Record<string, string[]>>((acc, date) => {
        const month = getMonthName(new Date(date));
        (acc[month] = acc[month] || []).push(date);
        return acc;
      }, {}),
    [dates]
  );

  const labelRef = useRef<HTMLDivElement>(null);
  const currentDateRef = useRef<HTMLDivElement | null>(null);
  const isCurrentDateInView = useInView(currentDateRef, { amount: "all" });

  useEffect(() => {
    if (labelRef.current) {
      const width = labelRef.current.getBoundingClientRect().width;
      setLabelMaxWidth((prev) => Math.max(prev, width));
    }
  }, [dates]);

  useEffect(() => {
    if (currentDateRef.current) {
      currentDateRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, []);

  const currentDate: string = new Date().toISOString().split("T")[0] || "";

  const handleScrollToCurrentDate = () => {
    if (currentDateRef.current) {
      currentDateRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  };

  const cellCount = scrollIntoToday ? 2 : 1;
  const [linePosition, setLinePosition] = useState(0);

  const daybgColor = useMemo(() => {
    if (!daybgColorHighlight) return undefined;

    return {
      daysHighlight: Object.values(daybgColorHighlight)
        .flat()
        .map((date) => new Date(date as string | number | Date))
        .filter((date) => !isNaN(date.getTime())), // Filter out invalid dates
      daybgColorHighlight: Object.keys(daybgColorHighlight).reduce(
        (acc, color) => {
          daybgColorHighlight?.[color]?.forEach((date) => {
            const parsedDate = new Date(date);
            if (!isNaN(parsedDate.getTime())) {
              // Only process valid dates
              const dateKey = parsedDate.toISOString().split("T")[0];
              if (dateKey) {
                acc[dateKey] = color;
              }
            }
          });
          return acc;
        },
        {} as { [key: string]: string }
      ),
    };
  }, [daybgColorHighlight]);

  useEffect(() => {
    const updateLinePosition = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const totalMinutes = hours * 60 + minutes;
      const totalMinutesInDay = 24 * 60;
      const position = (totalMinutes / totalMinutesInDay) * cellWidthPX;
      setLinePosition(position);
    };

    updateLinePosition();
    const interval = setInterval(updateLinePosition, 60000);

    return () => clearInterval(interval);
  }, [cellWidthPX]);

  const isCurrentDateInDates = dates.includes(currentDate);

  return (
    <div className="z-[3] sticky top-0 left-0 flex flex-col w-fit h-fit backdrop-blur-3xl bg-white mb-2">
      <div className="flex w-full h-fit gap-2">
        <motion.div
          ref={labelRef}
          className={`z-[4] sticky left-0 top-0 min-w-48 text-sm
          font-medium text-left border border-b-0 p-2 ${borderColor}`}
          style={{ backgroundColor: TaskColors.ROW_ODD }}
          initial={{ width: 0 }}
          animate={{ width: labelMaxWidth }}
          exit={{ width: 0 }}
        >
          {topic}
        </motion.div>
        <div className="flex">
          {Object.entries(groupedDates).map(([month, monthDates], index) => {
            const monthCellWidth =
              cellWidthPX *
              (monthDates.length -
                (index === Object.keys(groupedDates).length - 1
                  ? cellCount
                  : 0));

            return (
              monthCellWidth > 0 && (
                <MonthHeader
                  key={month}
                  borderColor={borderColor}
                  month={month}
                  monthCellWidth={monthCellWidth}
                  textStickyLeftPX={labelMaxWidth + additionalStickyLeft}
                />
              )
            );
          })}

          {/* lock icons */}
          <div
            className="sticky top-0 right-0 flex justify-center items-center 
            text-left text-xs"
            style={{ width: `${cellCount * cellWidthPX}px` }}
          >
            {scrollIntoToday && isCurrentDateInDates && (
              <IconButton
                onClick={handleScrollToCurrentDate}
                isActive={!isCurrentDateInView}
                borderColor={borderColor}
                iconType="location"
                tooltipText="Go to Today"
                setTooltipVisible={setTooltipVisible}
              />
            )}
            <IconButton
              onClick={lockChange}
              isActive={lockOperations}
              borderColor={borderColor}
              iconType="lock"
              tooltipText={`${lockOperations ? "Unlock" : "Lock"} Operations`}
              setTooltipVisible={setTooltipVisible}
            />
          </div>
        </div>
      </div>

      {/* dates */}
      <div className="flex gap-2">
        <motion.div
          className={`z-[4] sticky left-0 min-w-48 text-sm font-medium 
          text-left border border-t-0 p-2 ${borderColor}`}
          style={{ backgroundColor: TaskColors.ROW_ODD }}
          initial={{ width: 0 }}
          animate={{ width: labelMaxWidth }}
          exit={{ width: 0 }}
        />
        <div className="flex">
          {dates.map((date) => {
            const bgColor = daybgColor?.daybgColorHighlight[date];
            return (
              <DateCell
                key={date}
                date={date}
                borderColor={borderColor}
                isCurrentDate={date === currentDate}
                cellWidthPX={cellWidthPX}
                height={height}
                linePosition={linePosition}
                bgColor={bgColor}
                currentDateRef={currentDateRef}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
