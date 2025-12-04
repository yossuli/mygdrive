import { getInfo } from "./gdrive/index.js";

export const ensureFolderId = async (maybeFolderId: any) => {
  if (typeof maybeFolderId === "string") {
    const result = await getInfo(maybeFolderId);
    if (!result.success) {
      throw new Error(result.error.message, {
        cause: result.error.err,
      });
    }
    return {
      id: maybeFolderId,
      name: result.data.name,
    };
  }
  throw new Error("A valid folder ID must be provided.");
};
