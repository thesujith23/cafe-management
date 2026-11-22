/**
 * One definition of "free" for the whole app. The landing page, the 3D café and the
 * staff console all read the same floor, so they must all count it the same way:
 * a table is free only when its status is exactly `available`. A reserved table is
 * held for a booking and a maintenance table is out of service — neither is free.
 */
export const summariseTables = (tables = []) => {
  const list = Array.isArray(tables) ? tables : [];
  const counts = {
    total: list.length,
    available: 0,
    occupied: 0,
    reserved: 0,
    maintenance: 0,
  };

  list.forEach((table) => {
    const status = table?.status;
    if (Object.prototype.hasOwnProperty.call(counts, status)) counts[status] += 1;
  });

  return {
    ...counts,
    free: counts.available,
    taken: counts.total - counts.available,
  };
};

export default summariseTables;
