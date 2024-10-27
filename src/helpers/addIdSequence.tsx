import moment from "moment";

export const addIdSequence = (data: any[] | undefined | null) => {
  if (!data) return [];

  return data.map((item, index) => ({
    ...item,
    createdAt: moment(item.createdAt).format("DD.MM.YYYY"),
    id: index + 1,
  }));
};
