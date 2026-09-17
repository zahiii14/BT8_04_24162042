package vn.iotstar.service.impl;

import org.apache.commons.io.FilenameUtils;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import vn.iotstar.config.StorageProperties;
import vn.iotstar.exception.StorageException;
import vn.iotstar.exception.StorageFileNotFoundException;
import vn.iotstar.service.IStorageService;

import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

@Service
public class FileSystemStorageServiceImpl implements IStorageService {

    private final Path rootLocation;

    public FileSystemStorageServiceImpl(StorageProperties properties) {
        if (properties.getLocation() == null || properties.getLocation().trim().isEmpty()) {
            this.rootLocation = Paths.get("uploads");
        } else {
            this.rootLocation = Paths.get(properties.getLocation());
        }
    }

    @Override
    public String getStorageFilename(MultipartFile file, String id) {
        String ext = FilenameUtils.getExtension(file.getOriginalFilename());
        if (ext == null || ext.isEmpty()) {
            ext = "png";
        }
        return "p" + id + "." + ext;
    }

    @Override
    public void store(MultipartFile file, String storeFilename) {
        try {
            if (file.isEmpty()) {
                throw new StorageException("Failed to store empty file");
            }
            Path destinationFile = this.rootLocation.resolve(Paths.get(storeFilename))
                    .normalize().toAbsolutePath();
            if (!destinationFile.getParent().equals(this.rootLocation.toAbsolutePath())) {
                throw new StorageException("Cannot store file outside current directory");
            }
            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, destinationFile, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (Exception e) {
            throw new StorageException("Failed to store file: " + storeFilename, e);
        }
    }

    @Override
    public Resource loadAsResource(String filename) {
        try {
            Path file = load(filename);
            Resource resource = new UrlResource(file.toUri());
            if (resource.exists() || resource.isReadable()) {
                return resource;
            }
            throw new StorageFileNotFoundException("Cannot read file: " + filename);
        } catch (Exception e) {
            throw new StorageFileNotFoundException("Could not read file: " + filename, e);
        }
    }

    @Override
    public Path load(String filename) {
        return rootLocation.resolve(filename);
    }

    @Override
    public void delete(String storeFilename) throws Exception {
        Path destinationFile = rootLocation.resolve(Paths.get(storeFilename)).normalize().toAbsolutePath();
        Files.deleteIfExists(destinationFile);
    }

    @Override
    public void init() {
        try {
            Files.createDirectories(rootLocation);
        } catch (Exception e) {
            throw new StorageException("Could not initialize storage directory", e);
        }
    }
}
