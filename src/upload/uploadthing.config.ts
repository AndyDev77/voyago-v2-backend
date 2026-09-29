import { createUploadthing, type FileRouter } from 'uploadthing/express';

const f = createUploadthing();

export const uploadRouter = {
  profilePicture: f({
    image: {
      maxFileSize: '4MB',
      maxFileCount: 1,
    },
  })
    .middleware(async ({ req }) => {
      const authHeader = req.headers['authorization'];
      const sessionToken =
        typeof authHeader === 'string'
          ? authHeader.replace(/^Bearer\s+/i, '')
          : null;
      const tenantId =
        (req.headers['x-tenant-id'] as string) ||
        (req.headers['x-user-id'] as string) ||
        null;
      return { sessionToken, tenantId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return {
        uploadedBy: metadata.tenantId,
        fileUrl: file.ufsUrl || file.url,
        fileKey: file.key,
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof uploadRouter;
