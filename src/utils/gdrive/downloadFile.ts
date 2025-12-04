import { execa } from "execa";
import type { Result } from "../../types/index.js";

export const downloadFile = async (
  id: string,
  _name?: string,
): Promise<Result<void>> => {
  try {
    await execa("gdrive", ["files", "download", id]);
    return { success: true, data: undefined };
  } catch (err: any) {
    return {
      success: false,
      error: {
        type: "GDRIVE_DOWNLOAD_ERROR",
        message: err?.stderr ?? err?.message,
        err,
      },
    };
  }
};
