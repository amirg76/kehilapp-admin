const useButtonDisabled = (setIsButtonDisabled, error) => {
  setIsButtonDisabled(
    Object.values(error).some((value) => value?.length > 0 || value === null)
  );
};
export default useButtonDisabled;
