import pkg from "enquirer";
const { Confirm } = pkg;
export const confirm = async <T>(
  confirmOptions: { name: string; message: string },
  confirmedFn: () => T | Promise<T>,
  notConfirmedFn?: () => T | Promise<T>,
) => {
  const prompt = new Confirm(confirmOptions);
  const confirmed = await prompt.run();
  if (confirmed) {
    return await confirmedFn();
  }
  if (notConfirmedFn) {
    return await notConfirmedFn();
  }
};
