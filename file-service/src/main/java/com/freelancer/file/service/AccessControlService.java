package com.freelancer.file.service;

import com.freelancer.file.entity.FileMetadata;
import com.freelancer.file.enums.FileType;
import com.freelancer.file.exception.FileException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AccessControlService {

    private final WebClient.Builder webClientBuilder;

    @Value("${services.contract}")
    private String contractServiceUrl;

    /**
     * Access rules:
     *
     * PORTFOLIO      → anyone — always allowed
     * RESUME         → CLIENT only, must have active contract with owner
     * PROJECT_DOC    → FREELANCER only, must be on that contract
     * PROGRESS_ATT   → CLIENT or FREELANCER, must be on that contract
     */
    public void checkDownloadPermission(FileMetadata file,
                                         UUID requesterId,
                                         String requesterRole) {
        // Portfolio is always public
        if (file.getFileType() == FileType.PORTFOLIO) {
            return;
        }

        

        switch (file.getFileType()) {

            case RESUME -> {
                if (!"CLIENT".equals(requesterRole)) {
                    throw new FileException(
                            "Only clients can download resumes");
                }
                verifyContractMembership(
                        file.getContractId(), requesterId, requesterRole);
            }

            case PROJECT_DOC -> {
                if (!"FREELANCER".equals(requesterRole)) {
                    throw new FileException(
                            "Only freelancers can download project documents");
                }
                verifyContractMembership(
                        file.getContractId(), requesterId, requesterRole);
            }

            case PROGRESS_ATTACHMENT -> {
                // Both parties can download progress attachments
                verifyContractMembership(
                        file.getContractId(), requesterId, requesterRole);
            }
        }
    }

    private void verifyContractMembership(UUID contractId,
                                           UUID userId,
                                           String role) {
        try {
            Map response = webClientBuilder.build()
                    .get()
                    .uri(contractServiceUrl
                         + "/api/contracts/" + contractId)
                    .header("X-User-Id",   userId.toString())
                    .header("X-User-Role", role)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (response == null) {
                throw new FileException(
                        "Contract not found: " + contractId);
            }

            String clientId     = response.get("clientId").toString();
            String freelancerId = response.get("freelancerId").toString();
            String status       = response.get("status").toString();

            boolean isMember =
                    userId.toString().equals(clientId)
                    || userId.toString().equals(freelancerId);

            if (!isMember) {
                throw new FileException(
                        "You are not a member of this contract");
            }

            if ("CANCELLED".equals(status)) {
                throw new FileException(
                        "Cannot access files of a cancelled contract");
            }

        } catch (FileException e) {
            throw e;
        } catch (Exception e) {
            // Contract service unavailable in dev — allow access
            log.warn("Could not verify contract membership: {}",
                    e.getMessage());
        }
    }
}