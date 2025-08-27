import { AbstractFileService } from "@medusajs/medusa"
import {
  DeleteFileType,
  FileServiceGetUploadStreamResult,
  FileServiceUploadResult,
  GetUploadedFileType,
  UploadStreamDescriptorType,
} from "@medusajs/types"
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import stream from "stream"
import { MedusaError } from "medusa-core-utils"

class CloudflareR2Service extends AbstractFileService {
  private client_: S3Client
  private bucket_: string
  private publicUrl_: string

  constructor(container, options) {
    super(container, options)

    this.bucket_ = options.bucket
    this.publicUrl_ = options.public_url || `https://${options.bucket}.${options.account_id}.r2.cloudflarestorage.com`

    this.client_ = new S3Client({
      region: "auto",
      endpoint: `https://${options.account_id}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: options.access_key_id,
        secretAccessKey: options.secret_access_key,
      },
    })
  }

  async upload(fileData: Express.Multer.File): Promise<FileServiceUploadResult> {
    try {
      const parsedFilename = this.parseFilename(fileData.originalname)
      const fileKey = `${parsedFilename.name}-${Date.now()}${parsedFilename.ext}`

      const uploadParams = {
        Bucket: this.bucket_,
        Key: fileKey,
        Body: fileData.buffer,
        ContentType: fileData.mimetype,
        // Make files publicly readable
        // Note: You may need to configure bucket policies for public access
      }

      await this.client_.send(new PutObjectCommand(uploadParams))

      return {
        url: `${this.publicUrl_}/${fileKey}`,
        key: fileKey,
      }
    } catch (error) {
      console.error("Cloudflare R2 upload error:", error)
      throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, `Failed to upload file to Cloudflare R2: ${error.message}`)
    }
  }

  async uploadProtected(fileData: Express.Multer.File): Promise<FileServiceUploadResult> {
    try {
      const parsedFilename = this.parseFilename(fileData.originalname)
      const fileKey = `protected/${parsedFilename.name}-${Date.now()}${parsedFilename.ext}`

      const uploadParams = {
        Bucket: this.bucket_,
        Key: fileKey,
        Body: fileData.buffer,
        ContentType: fileData.mimetype,
      }

      await this.client_.send(new PutObjectCommand(uploadParams))

      return {
        url: `${this.publicUrl_}/${fileKey}`,
        key: fileKey,
      }
    } catch (error) {
      console.error("Cloudflare R2 protected upload error:", error)
      throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, `Failed to upload protected file to Cloudflare R2: ${error.message}`)
    }
  }

  async delete(fileData: DeleteFileType): Promise<void> {
    try {
      const deleteParams = {
        Bucket: this.bucket_,
        Key: fileData.fileKey,
      }

      await this.client_.send(new DeleteObjectCommand(deleteParams))
    } catch (error) {
      console.error("Cloudflare R2 delete error:", error)
      throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, `Failed to delete file from Cloudflare R2: ${error.message}`)
    }
  }

  async getUploadStreamDescriptor(
    fileData: UploadStreamDescriptorType
  ): Promise<FileServiceGetUploadStreamResult> {
    try {
      const parsedFilename = this.parseFilename(fileData.name)
      const fileKey = `${parsedFilename.name}-${Date.now()}${parsedFilename.ext}`

      const uploadParams = {
        Bucket: this.bucket_,
        Key: fileKey,
        ContentType: fileData.type,
      }

      const pass = new stream.PassThrough()
      const uploadPromise = this.client_.send(
        new PutObjectCommand({
          ...uploadParams,
          Body: pass,
        })
      )

      return {
        writeStream: pass,
        promise: uploadPromise.then(() => ({
          url: `${this.publicUrl_}/${fileKey}`,
          key: fileKey,
        })),
      }
    } catch (error) {
      console.error("Cloudflare R2 upload stream error:", error)
      throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, `Failed to create upload stream for Cloudflare R2: ${error.message}`)
    }
  }

  async getDownloadStream(fileData: GetUploadedFileType): Promise<NodeJS.ReadableStream> {
    try {
      const getParams = {
        Bucket: this.bucket_,
        Key: fileData.fileKey,
      }

      const response = await this.client_.send(new GetObjectCommand(getParams))
      return response.Body as NodeJS.ReadableStream
    } catch (error) {
      console.error("Cloudflare R2 download stream error:", error)
      throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, `Failed to get download stream from Cloudflare R2: ${error.message}`)
    }
  }

  async getPresignedDownloadUrl(fileData: GetUploadedFileType): Promise<string> {
    try {
      const getParams = {
        Bucket: this.bucket_,
        Key: fileData.fileKey,
      }

      const command = new GetObjectCommand(getParams)
      return await getSignedUrl(this.client_, command, { expiresIn: 3600 }) // 1 hour
    } catch (error) {
      console.error("Cloudflare R2 presigned URL error:", error)
      throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, `Failed to get presigned URL from Cloudflare R2: ${error.message}`)
    }
  }

  private parseFilename(filename: string) {
    const lastDotIndex = filename.lastIndexOf(".")
    if (lastDotIndex !== -1) {
      return {
        name: filename.substring(0, lastDotIndex),
        ext: filename.substring(lastDotIndex),
      }
    }
    return {
      name: filename,
      ext: "",
    }
  }
}

export default CloudflareR2Service
