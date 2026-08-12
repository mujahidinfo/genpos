import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { getSession } from "@/lib/auth";

const f = createUploadthing();

/**
 * UploadThing file routes.
 *
 * The middleware runs on the server before a presigned URL is handed out, so it
 * is the only thing standing between the public upload endpoint and anonymous
 * writes to the account's storage. Auth is enforced here, not in the client.
 */
export const ourFileRouter = {
  productImage: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
  })
    .middleware(async () => {
      const user = await getSession();
      if (!user) throw new UploadThingError("You must be signed in to upload.");
      // Same roles that can reach /inventory.
      if (user.role !== "ADMIN" && user.role !== "INVENTORY_MANAGER") {
        throw new UploadThingError("You do not have permission to upload images.");
      }
      // Returned value is passed to onUploadComplete as `metadata`.
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // Whatever is returned here is sent to the client's onClientUploadComplete.
      return { url: file.ufsUrl, uploadedBy: metadata.userId };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
