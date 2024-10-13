import DataTable from "../../components/dataTable/DataTable";
import "./Users.scss";
import { useEffect, useMemo, useState } from "react";
import Add from "../../components/add/Add";
import { columns } from "../../data";
import { uploadExcelFile } from "@/features/authentication/helpers/uploadExcelFile";
import { sentFileSuccess } from "@/features/authentication/helpers/sentFileSuccess";
import { getUsersFromDb } from "@/features/authentication/helpers/getUsersFromDb";
import { addIdSequence } from "@/helpers/addIdSequence";
import { useSelector } from "react-redux";
import { RootState } from "@/store/index";

const Users = () => {
  const usersData = useSelector((state: RootState) => state.users.usersData);
  const [open, setOpen] = useState(false);
  const [fileError, setFileError] = useState("");
  const usersWithIds = useMemo(() => addIdSequence(usersData), [usersData]);
  // const { handleGetUsers, users } = getUsersFromDb();
  const { handleGetUsers } = getUsersFromDb();
  const { handleSentFile } = sentFileSuccess();

  useEffect(() => {
    handleGetUsers();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      uploadExcelFile(file);

      setFileError("");

      // Prepare formData for file upload

      const formData = new FormData();
      formData.append("file", file as Blob);

      handleSentFile(formData);
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

      {usersWithIds.length > 0 && (
        <DataTable slug="users" columns={columns} rows={usersWithIds} />
      )}
      {/* TEST THE API */}

      {/* {isLoading ? (
        "Loading..."
      ) : (
        <DataTable slug="users" columns={columns} rows={data} />
      )} */}
      {open && (
        <Add
          slug="user"
          columns={columns.filter((column) => column.field !== "createdAt")}
          setOpen={setOpen}
        />
      )}
    </div>
  );
};

export default Users;
