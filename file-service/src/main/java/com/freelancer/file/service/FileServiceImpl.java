package com.freelancer.file.service;

import com.freelancer.file.dto.response.DownloadUrlResponse;
import com.freelancer.file.dto.response.FileUploadResponse;
import com.freelancer.file.entity.FileMetadata;
import com.freelancer.file.enums.FileType;
import com.freelancer.file.exception.FileException;
import com.freelancer.file.exception.ResourceNotFoundException;
import com.freelancer.file.repository.FileMetadataRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class FileServiceImpl implements FileService {

    private final FileMetadataRepository fileMetadataRepository;
    private final MinioService           minioService;
    private final AccessControlService   accessControlService;

    @Value("${buckets.resumes}")
    private String resumesBucket;

    @Value("${buckets.project-docs}")
    private String projectDocsBucket;

    @Value("${buckets.progress-attachments}")
    private String progressBucket;

    @Value("${buckets.portfolios}")
    private String portfoliosBucket;

    @Value("${minio.presigned-url-expiry}")
    private int presignedExpiry;

    // ── Upload resume ─────────────────────────────────────────────
    @Override
    @Transactional
    public FileUploadResponse uploadResume(UUID userId,
                                            String userName,
                                            MultipartFile file) {
        validateFileType(file, "pdf,doc,docx");

        // userId/filename — each user has own folder
        String objectKey = userId + "/"
                + sanitize(file.getOriginalFilename());

        minioService.uploadFile(resumesBucket, objectKey, file);

        FileMetadata meta = FileMetadata.builder()
                .ownerId(userId)
                .ownerName(userName)
                .fileType(FileType.RESUME)
                .originalName(file.getOriginalFilename())
                .bucket(resumesBucket)
                .objectKey(objectKey)
                .mimeType(file.getContentType())
                .sizeBytes(file.getSize())
                .build();

        fileMetadataRepository.save(meta);
        log.info("Resume uploaded — userId: {}", userId);
        return mapToResponse(meta, null);
    }

    // ── Upload project document ───────────────────────────────────
    @Override
    @Transactional
    public FileUploadResponse uploadProjectDoc(UUID clientId,
                                                String clientName,
                                                UUID contractId,
                                                MultipartFile file) {
        validateFileType(file, "pdf,doc,docx,zip,rar,txt");

        String objectKey = contractId + "/"
                + sanitize(file.getOriginalFilename());

        minioService.uploadFile(projectDocsBucket, objectKey, file);

        FileMetadata meta = FileMetadata.builder()
                .ownerId(clientId)
                .ownerName(clientName)
                .contractId(contractId)
                .fileType(FileType.PROJECT_DOC)
                .originalName(file.getOriginalFilename())
                .bucket(projectDocsBucket)
                .objectKey(objectKey)
                .mimeType(file.getContentType())
                .sizeBytes(file.getSize())
                .build();

        fileMetadataRepository.save(meta);
        log.info("Project doc uploaded — contractId: {}", contractId);
        return mapToResponse(meta, null);
    }

    // ── Upload progress attachment ────────────────────────────────
    @Override
    @Transactional
    public FileUploadResponse uploadProgressAttachment(
            UUID freelancerId,
            String freelancerName,
            UUID contractId,
            UUID milestoneId,
            MultipartFile file) {

        validateFileType(file,
                "pdf,doc,docx,zip,png,jpg,jpeg,gif,mp4");

        String objectKey = contractId + "/" + milestoneId + "/"
                + sanitize(file.getOriginalFilename());

        minioService.uploadFile(progressBucket, objectKey, file);

        FileMetadata meta = FileMetadata.builder()
                .ownerId(freelancerId)
                .ownerName(freelancerName)
                .contractId(contractId)
                .milestoneId(milestoneId)
                .fileType(FileType.PROGRESS_ATTACHMENT)
                .originalName(file.getOriginalFilename())
                .bucket(progressBucket)
                .objectKey(objectKey)
                .mimeType(file.getContentType())
                .sizeBytes(file.getSize())
                .build();

        fileMetadataRepository.save(meta);
        log.info("Progress attachment uploaded — milestoneId: {}",
                milestoneId);
        return mapToResponse(meta, null);
    }

    // ── Upload portfolio ──────────────────────────────────────────
    @Override
    @Transactional
    public FileUploadResponse uploadPortfolio(UUID userId,
                                               String userName,
                                               MultipartFile file) {
        validateFileType(file, "png,jpg,jpeg,gif,pdf,mp4");

        String objectKey = userId + "/"
                + sanitize(file.getOriginalFilename());

        minioService.uploadFile(portfoliosBucket, objectKey, file);

        FileMetadata meta = FileMetadata.builder()
                .ownerId(userId)
                .ownerName(userName)
                .fileType(FileType.PORTFOLIO)
                .originalName(file.getOriginalFilename())
                .bucket(portfoliosBucket)
                .objectKey(objectKey)
                .mimeType(file.getContentType())
                .sizeBytes(file.getSize())
                .build();

        fileMetadataRepository.save(meta);

        // Generate URL for portfolio — long lived (7 days)
        String publicUrl = minioService.generatePortfolioUrl(
                portfoliosBucket, objectKey);

        log.info("Portfolio uploaded — userId: {}", userId);
        return mapToResponse(meta, publicUrl);
    }

    // ── Get download URL ──────────────────────────────────────────
    @Override
    public DownloadUrlResponse getDownloadUrl(UUID fileId,
                                               UUID requesterId,
                                               String requesterRole) {
        FileMetadata file = fileMetadataRepository
                .findById(fileId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "File not found: " + fileId));

        // Check access — throws FileException if not allowed
        accessControlService.checkDownloadPermission(
                file, requesterId, requesterRole);

        String url = minioService.generatePresignedUrl(
                file.getBucket(), file.getObjectKey());

        log.info("Download URL generated — fileId: {} by: {}",
                fileId, requesterId);

        return DownloadUrlResponse.builder()
                .downloadUrl(url)
                .expiresAt(LocalDateTime.now()
                        .plusMinutes(presignedExpiry))
                .fileName(file.getOriginalName())
                .sizeBytes(file.getSizeBytes())
                .mimeType(file.getMimeType())
                .build();
    }

    // ── Get all files for a contract ──────────────────────────────
    @Override
    public List<FileUploadResponse> getFilesForContract(
            UUID contractId) {
        return fileMetadataRepository
                .findByContractId(contractId)
                .stream()
                .map(f -> mapToResponse(f, null))
                .collect(Collectors.toList());
    }

    // ── Get portfolio files — public ──────────────────────────────
    @Override
    public List<FileUploadResponse> getPortfolioFiles(UUID userId) {
        return fileMetadataRepository
                .findByOwnerIdAndFileType(userId, FileType.PORTFOLIO)
                .stream()
                .map(f -> {
                    String url = minioService.generatePortfolioUrl(
                            f.getBucket(), f.getObjectKey());
                    return mapToResponse(f, url);
                })
                .collect(Collectors.toList());
    }

    // ── Delete file ───────────────────────────────────────────────
    @Override
    @Transactional
    public void deleteFile(UUID fileId, UUID requesterId) {
        FileMetadata file = fileMetadataRepository
                .findById(fileId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "File not found: " + fileId));

        if (!file.getOwnerId().equals(requesterId)) {
            throw new FileException(
                    "You can only delete your own files");
        }

        minioService.deleteFile(file.getBucket(), file.getObjectKey());
        fileMetadataRepository.delete(file);
        log.info("File deleted — fileId: {}", fileId);
    }

    // ─────────────────────────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────────────────────────

    private void validateFileType(MultipartFile file,
                                   String allowed) {
        if (file == null || file.isEmpty()) {
            throw new FileException("File is empty");
        }
        String name = file.getOriginalFilename();
        if (name == null || !name.contains(".")) {
            throw new FileException("Invalid file name");
        }
        String ext = name.substring(name.lastIndexOf('.') + 1)
                         .toLowerCase();
        if (!Arrays.asList(allowed.split(",")).contains(ext)) {
            throw new FileException(
                    "File type ." + ext
                    + " not allowed. Allowed: " + allowed);
        }
    }

    private String sanitize(String filename) {
        if (filename == null) {
            return UUID.randomUUID().toString();
        }
        return filename.replaceAll("[^a-zA-Z0-9._-]", "_");
    }

    private FileUploadResponse mapToResponse(FileMetadata f,
                                              String publicUrl) {
        return FileUploadResponse.builder()
                .id(f.getId())
                .originalName(f.getOriginalName())
                .fileType(f.getFileType())
                .mimeType(f.getMimeType())
                .sizeBytes(f.getSizeBytes())
                .uploadedAt(f.getUploadedAt())
                .publicUrl(publicUrl)
                .build();
    }
}