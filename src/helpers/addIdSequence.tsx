export const addIdSequence = (data: any[]) => {
  return data.map((item, index) => ({ ...item, id: index + 1 }));
};
