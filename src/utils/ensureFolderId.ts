import { getInfo } from "./getInfo";

export const ensureFolderId = async (maybeFolderId: any) => {
  if (typeof maybeFolderId === "string") {
    const { name } = await getInfo(maybeFolderId);
    return {
      id: maybeFolderId,
      name,
    };
  }
  throw new Error("A valid folder ID must be provided.");
};
