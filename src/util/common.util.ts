import { ProductionTask } from "../types";

export const generateGroupedTasks = (tasks: ProductionTask[]) => {
  return tasks.reduce<Record<string, ProductionTask[][]>>((acc, task) => {
    const department = task.departmentName || "Unknown";

    if (!acc[department]) acc[department] = [[]];

    const lineRows = acc[department];
    let placed = false;

    if (lineRows) {
      // Type guard
      for (const row of lineRows) {
        const conflict = row.some(
          (t) => t.startDate <= task.endDate && t.endDate >= task.startDate
        );
        if (!conflict) {
          row.push(task);
          placed = true;
          break;
        }
      }

      if (!placed) lineRows.push([task]);
    }
    return acc;
  }, {});
};
