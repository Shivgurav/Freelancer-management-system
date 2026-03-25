package com.freelancer.file.repository;

import com.freelancer.file.entity.FileMetadata;
import com.freelancer.file.enums.FileType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FileMetadataRepository
        extends JpaRepository<FileMetadata, UUID> {

    List<FileMetadata> findByOwnerId(UUID ownerId);

    List<FileMetadata> findByContractId(UUID contractId);

    List<FileMetadata> findByOwnerIdAndFileType(
            UUID ownerId, FileType fileType);

    List<FileMetadata> findByContractIdAndFileType(
            UUID contractId, FileType fileType);
}