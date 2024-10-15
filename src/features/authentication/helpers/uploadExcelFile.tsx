export const uploadExcelFile = (file: File | undefined) => {
  if (!file) {
    throw new Error("Please select a file.");
  }
  const allowedExtensions = ["xlsx", "xls"];
  const fileExtension: any = file.name.split(".").pop();
  if (!allowedExtensions.includes(fileExtension)) {
    throw new Error("Please upload a valid Excel file.");
  }

  return true;
};
