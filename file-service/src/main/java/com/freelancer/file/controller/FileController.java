package com.freelancer.file.controller;

import com.freelancer.file.dto.response.DownloadUrlResponse;
import com.freelancer.file.dto.response.FileUploadResponse;
import com.freelancer.file.security.UserPrincipal;
import com.freelancer.file.service.FileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileController {

    private final FileService fileService;

    // ── Upload endpoints ──────────────────────────────────────────

    /**
     * POST /api/files/resume
     * Freelancer uploads their CV
     * multipart/form-data, field name = "file"
     */
    @PostMapping(value = "/resume",
                 consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('FREELANCER')")
    public ResponseEntity<FileUploadResponse> uploadResume(
            @RequestParam("file") MultipartFile file) {

        UUID   userId   = UserPrincipal.getCurrentUserId();
        String userName = UserPrincipal.getCurrentUserName();

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(fileService.uploadResume(
                        userId, userName, file));
    }

    /**
     * POST /api/files/project-doc/{contractId}
     * Client uploads project brief for a contract
     */
    @PostMapping(value = "/project-doc/{contractId}",
                 consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<FileUploadResponse> uploadProjectDoc(
            @PathVariable UUID contractId,
            @RequestParam("file") MultipartFile file) {

        UUID   clientId   = UserPrincipal.getCurrentUserId();
        String clientName = UserPrincipal.getCurrentUserName();

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(fileService.uploadProjectDoc(
                        clientId, clientName, contractId, file));
    }

    /**
     * POST /api/files/progress/{contractId}/{milestoneId}
     * Freelancer uploads attachment for a progress report
     */
    @PostMapping(
        value = "/progress/{contractId}/{milestoneId}",
        consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('FREELANCER')")
    public ResponseEntity<FileUploadResponse> uploadProgressAttachment(
            @PathVariable UUID contractId,
            @PathVariable UUID milestoneId,
            @RequestParam("file") MultipartFile file) {

        UUID   freelancerId   = UserPrincipal.getCurrentUserId();
        String freelancerName = UserPrincipal.getCurrentUserName();

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(fileService.uploadProgressAttachment(
                        freelancerId, freelancerName,
                        contractId, milestoneId, file));
    }

    /**
     * POST /api/files/portfolio
     * Freelancer uploads portfolio work sample
     * Visible publicly on their profile
     */
    @PostMapping(value = "/portfolio",
                 consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('FREELANCER')")
    public ResponseEntity<FileUploadResponse> uploadPortfolio(
            @RequestParam("file") MultipartFile file) {

        UUID   userId   = UserPrincipal.getCurrentUserId();
        String userName = UserPrincipal.getCurrentUserName();

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(fileService.uploadPortfolio(
                        userId, userName, file));
    }

    // ── Download endpoint ─────────────────────────────────────────

    /**
     * GET /api/files/{fileId}/download
     * Returns a presigned URL that expires in 15 minutes.
     * Access is checked before the URL is generated.
     * Frontend opens this URL directly — no bytes pass through our server.
     */
    @GetMapping("/{fileId}/download")
    @PreAuthorize("hasRole('CLIENT') or " +
                  "hasRole('FREELANCER') or " +
                  "hasRole('ADMIN')")
    public ResponseEntity<DownloadUrlResponse> getDownloadUrl(
            @PathVariable UUID fileId) {

        UUID   requesterId   = UserPrincipal.getCurrentUserId();
        String requesterRole = UserPrincipal.getCurrentUserRole();

        return ResponseEntity.ok(
                fileService.getDownloadUrl(
                        fileId, requesterId, requesterRole));
    }

    // ── List endpoints ────────────────────────────────────────────

    /**
     * GET /api/files/contract/{contractId}
     * All files for a contract (metadata only, no download URLs)
     * Used to show file list in contract detail page
     */
    @GetMapping("/contract/{contractId}")
    @PreAuthorize("hasRole('CLIENT') or hasRole('FREELANCER')")
    public ResponseEntity<List<FileUploadResponse>>
            getFilesForContract(@PathVariable UUID contractId) {
        return ResponseEntity.ok(
                fileService.getFilesForContract(contractId));
    }

    /**
     * GET /api/files/portfolio/{userId}
     * All portfolio files for a freelancer — PUBLIC
     * No auth needed — shown on their public profile
     */
    @GetMapping("/portfolio/{userId}")
    public ResponseEntity<List<FileUploadResponse>>
            getPortfolioFiles(@PathVariable UUID userId) {
        return ResponseEntity.ok(
                fileService.getPortfolioFiles(userId));
    }

    /**
     * DELETE /api/files/{fileId}
     * Only file owner can delete their own file
     */
    @DeleteMapping("/{fileId}")
    @PreAuthorize("hasRole('CLIENT') or hasRole('FREELANCER')")
    public ResponseEntity<Void> deleteFile(
            @PathVariable UUID fileId) {
        UUID requesterId = UserPrincipal.getCurrentUserId();
        fileService.deleteFile(fileId, requesterId);
        return ResponseEntity.noContent().build();
    }
}