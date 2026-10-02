import { TUser } from "../../../utils/storeTypes";

/**
 * The full content view is only for logged-in learners: the PDF carries their
 * name and email as a watermark, so it can't be printed without them
 */
export const canOpenFullContent = (token: string, user?: TUser | null) =>
  Boolean(token && user?.email);
