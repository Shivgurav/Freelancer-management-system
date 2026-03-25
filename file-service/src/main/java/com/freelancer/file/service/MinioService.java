package com.freelancer.file.service;

import io.minio.*;
import io.minio.http.Method;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class MinioService {

    private final MinioClient minioClient;

    @Value("${minio.presigned-url-expiry}")
    private int presignedUrlExpiry;

    // ── Ensure bucket exists ──────────────────────────────────────
    public void createBucketIfNotExists(String bucketName) {
        try {
            boolean exists = minioClient.bucketExists(
                    BucketExistsArgs.builder()
                            .bucket(bucketName)
                            .build());
            if (!exists) {
                minioClient.makeBucket(
                        MakeBucketArgs.builder()
                                .bucket(bucketName)
                                .build());
                log.info("Bucket created: {}", bucketName);
            }
        } catch (Exception e) {
            throw new RuntimeException(
                    "Could not create bucket: " + e.getMessage());
        }
    }

    // ── Upload file ───────────────────────────────────────────────
    public void uploadFile(String bucketName,
                            String objectKey,
                            MultipartFile file) {
        try {
            createBucketIfNotExists(bucketName);

            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectKey)
                            .stream(file.getInputStream(),
                                    file.getSize(), -1)
                            .contentType(file.getContentType())
                            .build());

            log.info("Uploaded: {}/{}", bucketName, objectKey);
        } catch (Exception e) {
            log.error("Upload failed: {}/{} — {}",
                    bucketName, objectKey, e.getMessage());
            throw new RuntimeException(
                    "File upload failed: " + e.getMessage());
        }
    }

    // ── Generate presigned download URL (expires in 15 min) ───────
    public String generatePresignedUrl(String bucketName,
                                        String objectKey) {
        try {
            return minioClient.getPresignedObjectUrl(
                    GetPresignedObjectUrlArgs.builder()
                            .method(Method.GET)
                            .bucket(bucketName)
                            .object(objectKey)
                            .expiry(presignedUrlExpiry,
                                    TimeUnit.MINUTES)
                            .build());
        } catch (Exception e) {
            log.error("Presigned URL failed: {}/{} — {}",
                    bucketName, objectKey, e.getMessage());
            throw new RuntimeException(
                    "Could not generate download URL: "
                    + e.getMessage());
        }
    }

    // ── Generate long-lived URL for portfolio (7 days) ────────────
    public String generatePortfolioUrl(String bucketName,
                                        String objectKey) {
        try {
            return minioClient.getPresignedObjectUrl(
                    GetPresignedObjectUrlArgs.builder()
                            .method(Method.GET)
                            .bucket(bucketName)
                            .object(objectKey)
                            .expiry(7, TimeUnit.DAYS)
                            .build());
        } catch (Exception e) {
            throw new RuntimeException(
                    "Could not generate portfolio URL: "
                    + e.getMessage());
        }
    }

    // ── Delete file ───────────────────────────────────────────────
    public void deleteFile(String bucketName, String objectKey) {
        try {
            minioClient.removeObject(
                    RemoveObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectKey)
                            .build());
            log.info("Deleted: {}/{}", bucketName, objectKey);
        } catch (Exception e) {
            throw new RuntimeException(
                    "File deletion failed: " + e.getMessage());
        }
    }
}