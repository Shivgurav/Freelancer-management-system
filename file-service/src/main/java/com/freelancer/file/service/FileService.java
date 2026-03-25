package com.freelancer.file.service;

import com.freelancer.file.dto.response.DownloadUrlResponse;
import com.freelancer.file.dto.response.FileUploadResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

public interface FileService {

    FileUploadResponse uploadResume(UUID userId,
                                     String userName,
                                     MultipartFile file);

    FileUploadResponse uploadProjectDoc(UUID clientId,
                                         String clientName,
                                         UUID contractId,
                                         MultipartFile file);

    FileUploadResponse uploadProgressAttachment(UUID freelancerId,
                                                 String freelancerName,
                                                 UUID contractId,
                                                 UUID milestoneId,
                                                 MultipartFile file);

    FileUploadResponse uploadPortfolio(UUID userId,
                                        String userName,
                                        MultipartFile file);

    // Get presigned download URL — access controlled
    DownloadUrlResponse getDownloadUrl(UUID fileId,
                                        UUID requesterId,
                                        String requesterRole);

    List<FileUploadResponse> getFilesForContract(UUID contractId);

    List<FileUploadResponse> getPortfolioFiles(UUID userId);

    void deleteFile(UUID fileId, UUID requesterId);
}