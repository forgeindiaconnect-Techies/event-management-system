package com.fic.event_management_system.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Collections;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/upload")
@CrossOrigin(origins = "*") // Adjust based on your security configuration
public class FileUploadController {

    private final String UPLOAD_DIR = "uploads/";

    public FileUploadController() {
        try {
            Files.createDirectories(Paths.get(UPLOAD_DIR));
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize folder for upload!");
        }
    }

    @PostMapping
    public ResponseEntity<Map<String, String>> uploadFile(@RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Collections.singletonMap("error", "Please select a file to upload."));
            }

            String originalFilename = StringUtils.cleanPath(file.getOriginalFilename());
            String fileExtension = "";
            
            if (originalFilename.contains(".")) {
                fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            
            String generatedFilename = UUID.randomUUID().toString() + fileExtension;
            Path targetLocation = Paths.get(UPLOAD_DIR).resolve(generatedFilename);

            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            String fileDownloadUri = ServletUriComponentsBuilder.fromCurrentContextPath()
                    .path("/uploads/")
                    .path(generatedFilename)
                    .toUriString();

            return ResponseEntity.ok(Collections.singletonMap("url", fileDownloadUri));

        } catch (IOException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("error", "Could not store file. Please try again!"));
        }
    }
}
