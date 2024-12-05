import DataTable from "../../components/dataTable/DataTable";
import "./Users.scss";
import { useMemo, useState } from "react";
import Add from "../../components/add/Add";
import { columns } from "../../data";
import { uploadExcelFile } from "@/features/authentication/helpers/uploadExcelFile";
import { sentFileSuccess } from "@/features/authentication/helpers/sentFileSuccess";
import { addIdSequence } from "@/helpers/addIdSequence";
import { useUsers } from "@/services/handleGetRequest";

const Users = () => {
  const [open, setOpen] = useState(false);
  const [fileError, setFileError] = useState("");
  const { data: users, isLoading, error } = useUsers();
  const { handleSentFile } = sentFileSuccess();
  const usersWithIds = useMemo(() => addIdSequence(users || []), [users]);

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

  if (isLoading) return <div>Loading users...</div>;
  if (error) return <div>Error loading users: {error.message}</div>;

  return (
    <div className="users">
      <div className="info">
        <h1>Users</h1>
        <button onClick={() => setOpen(true)}>Add New User</button>
        <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} />
        {fileError && <p style={{ color: "red" }}>{fileError}</p>}
      </div>

      {usersWithIds.length > 0 && (
        <DataTable slug="user" columns={columns} rows={usersWithIds} />
      )}

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
