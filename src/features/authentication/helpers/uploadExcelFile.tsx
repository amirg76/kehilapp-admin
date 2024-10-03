import { useMutation } from "react-query";

export const uploadExcelFile = (file) => {
  const allowedExtensions = ["xlsx", "xls"];
  const fileExtension = file.name.split(".").pop();
  if (!allowedExtensions.includes(fileExtension)) {
    throw new Error("Please upload a valid Excel file.");
  }
  // return useMutation(
  //   "uploadExcelFile",
  //   async () => {
  //     const formData = new FormData();
  //     formData.append("file", file);
  //     const response = await fetch("/api/upload-excel", {
  //       method: "POST",
  //       body: formData,
  //     });
  //     return (await response.json()) as { success: boolean };
  //   },
  //   {
  //     onError: (error, variables, context) =>
  //       console.error("Error uploading file:", error),
  //   }
  // );

  return true;
};
