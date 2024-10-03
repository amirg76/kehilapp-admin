import { GridColDef } from "@mui/x-data-grid";
import DataTable from "../../components/dataTable/DataTable";
import "./Users.scss";
import { useState } from "react";
import Add from "../../components/add/Add";
import { userRows } from "../../data";
import { uploadExcelFile } from "@/features/authentication/helpers/uploadExcelFile";
import { sentFileSuccess } from "@/features/authentication/helpers/sentFileSuccess";

const columns: GridColDef[] = [
  { field: "id", headerName: "ID", width: 90 },
  {
    field: "img",
    headerName: "Avatar",
    width: 100,
    renderCell: (params) => {
      return <img src={params.row.img || "/noavatar.png"} alt="" />;
    },
  },
  {
    field: "firstName",
    type: "string",
    headerName: "First name",
    width: 150,
  },
  {
    field: "lastName",
    type: "string",
    headerName: "Last name",
    width: 150,
  },
  {
    field: "email",
    type: "string",
    headerName: "Email",
    width: 200,
  },
  {
    field: "phone",
    type: "string",
    headerName: "Phone",
    width: 200,
  },
  {
    field: "createdAt",
    headerName: "Created At",
    width: 200,
    type: "string",
  },
  {
    field: "verified",
    headerName: "Verified",
    width: 150,
    type: "boolean",
  },
];

const Users = () => {
  const [open, setOpen] = useState(false);
  const [fileError, setFileError] = useState("");
  // TEST THE API

  // const { isLoading, data } = useQuery({
  //   queryKey: ["allusers"],
  //   queryFn: () =>
  //     fetch("http://localhost:8800/api/users").then(
  //       (res) => res.json()
  //     ),
  // });
  const { handleSentFile } = sentFileSuccess();
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      uploadExcelFile(file);

      setFileError("");

      // Prepare formData for file upload

      const formData = new FormData();
      formData.append("file", file as Blob);

      handleSentFile(formData);
      // Trigger mutation to post file
      // const handleSuccessCallback = useSuccessCallback(
      //   setFileError,
      //   dispatch,
      //   navigate,
      //   url
      // );

      // .then((data) => console.log("File upload successful", data))
      // .catch((error) => setFileError(error.message));
    } catch (error: any) {
      console.log(error);

      setFileError(error.message);
    }
  };
  return (
    <div className="users">
      <div className="info">
        <h1>Users</h1>
        <button onClick={() => setOpen(true)}>Add New User</button>
        <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} />
        {fileError && <p style={{ color: "red" }}>{fileError}</p>}
      </div>
      <DataTable slug="users" columns={columns} rows={userRows} />
      {/* TEST THE API */}

      {/* {isLoading ? (
        "Loading..."
      ) : (
        <DataTable slug="users" columns={columns} rows={data} />
      )} */}
      {open && <Add slug="user" columns={columns} setOpen={setOpen} />}
    </div>
  );
};

export default Users;
