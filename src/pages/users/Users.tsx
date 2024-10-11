import DataTable from "../../components/dataTable/DataTable";
import "./Users.scss";
import { useEffect, useState } from "react";
import Add from "../../components/add/Add";
import { columns } from "../../data";
import { uploadExcelFile } from "@/features/authentication/helpers/uploadExcelFile";
import { sentFileSuccess } from "@/features/authentication/helpers/sentFileSuccess";
import { getUsersFromDb } from "@/features/authentication/helpers/getUsersFromDb";
import { addIdSequence } from "@/helpers/addIdSequence";

const Users = () => {
  const [open, setOpen] = useState(false);
  const [fileError, setFileError] = useState("");
  // const [users, setUsers] = useState<any[]>([]); // Adjust the type as needed
  const [usersWithIds, setUsersWithIds] = useState<any[]>([]);
  const { handleGetUsers, users } = getUsersFromDb();
  useEffect(() => {
    handleGetUsers();
  }, []);
  useEffect(() => {
    setUsersWithIds(addIdSequence(users));
  }, [users]);

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

      <DataTable slug="users" columns={columns} rows={usersWithIds} />
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
