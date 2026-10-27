import { generateReactHelpers } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

// Only the hook is generated — the prebuilt <UploadButton /> / <UploadDropzone />
// ship their own styles, which would sit outside this app's design system.
export const { useUploadThing } = generateReactHelpers<OurFileRouter>();
