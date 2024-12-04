import { GridColDef } from "@mui/x-data-grid";
import "./add.scss";
import { useFormValidation, VALIDATION_RULES } from "@/validation/index";
import { useAddUser } from "@/helpers/UserHelpers/sentNewUser";
import Notification from "@/components/notifications/NotificationComponent";
import { useCustomNotification } from "../notifications/useCustomNotification";

type Props = {
  slug: string;
  columns: GridColDef[];
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const Add = (props: Props) => {
  const {
    notification,
    handleNotification,
    closeNotification,
    showNotification,
  } = useCustomNotification({
    closeModalCallback: () => props.setOpen(false),
  });

  const addUser = useAddUser();

  // Create custom validation rules based on column types
  const validationRules: { [key: string]: any[] } = {};
  for (const column of props.columns) {
    if (column.field === "id" || column.field === "img") continue;
    // Add validation rule for required fields
    const fieldRules = [VALIDATION_RULES.required()];
    if (column.type === "number") {
      fieldRules.push(VALIDATION_RULES.number());
    }
    if (column.type === "email") {
      fieldRules.push(VALIDATION_RULES.email());
    }
    if (column.type === "phone") {
      fieldRules.push(VALIDATION_RULES.phone());
    }
    // Add validation rule for specific fields
    validationRules[column.field] = fieldRules;
  }

  // Create initial form data object
  const initialValues: { [key: string]: any } = {};
  for (const column of props.columns) {
    if (column.field !== "id" && column.field !== "img") {
      initialValues[column.field] = "";
    }
  }
  // Create form validation
  const { formData, errors, isSubmitting, handleChange, handleSubmit } =
    useFormValidation(initialValues, validationRules);

  const onSubmit = async () => {
    try {
      const response = await addUser.mutateAsync(formData);
      handleNotification(
        response,
        `New ${props.slug} has been successfully added`
      );
    } catch (err) {
      showNotification(
        "error",
        "Error",
        "An unexpected error occurred, please try again"
      );
    }
  };

  return (
    <>
      <Notification {...notification} onClose={closeNotification} />
      <div className="add">
        <div className="modal">
          <span className="close" onClick={() => props.setOpen(false)}>
            X
          </span>
          <h1>Add new {props.slug}</h1>
          <form
            onSubmit={(e: React.FormEvent) => {
              e.preventDefault();
              handleSubmit(e, onSubmit);
            }}
          >
            {props.columns
              .filter((item) => item.field !== "id" && item.field !== "img")
              .map((column) => (
                <div className="item" key={column.field}>
                  <label>{column.headerName}</label>
                  <input
                    type={column.type === "number" ? "number" : "text"}
                    placeholder={column.field}
                    name={column.field}
                    value={formData[column.field] || ""}
                    onChange={handleChange}
                  />
                  {errors[column.field] && (
                    <span className="error">{errors[column.field]}</span>
                  )}
                </div>
              ))}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`submit-button ${isSubmitting ? "disabled" : ""}`}
            >
              {isSubmitting ? "Sending..." : "Send"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default Add;
