package vn.iotstar.controller.api;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.iotstar.service.IStorageService;

import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api/images")
public class ImageController {

    @Autowired
    private IStorageService storageService;

    @GetMapping("/{filename:.+}")
    public ResponseEntity<Resource> getImage(@PathVariable String filename) {
        try {
            Resource file = storageService.loadAsResource(filename);
            String contentType = "image/jpeg";
            if (filename.toLowerCase().endsWith(".png")) {
                contentType = "image/png";
            } else if (filename.toLowerCase().endsWith(".gif")) {
                contentType = "image/gif";
            } else if (filename.toLowerCase().endsWith(".webp")) {
                contentType = "image/webp";
            } else if (filename.toLowerCase().endsWith(".svg")) {
                contentType = "image/svg+xml";
            }

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + file.getFilename() + "\"")
                    .body(file);
        } catch (Exception e) {
            // Return default SVG placeholder if image file does not exist in uploads directory
            String label = filename.length() > 10 ? filename.substring(0, 10) : filename;
            String svg = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"80\" height=\"80\" viewBox=\"0 0 80 80\">" +
                    "<rect width=\"80\" height=\"80\" fill=\"#e9ecef\" rx=\"8\"/>" +
                    "<path d=\"M25 55 L38 35 L48 47 L55 38 L65 55 Z\" fill=\"#adb5bd\"/>" +
                    "<circle cx=\"32\" cy=\"30\" r=\"5\" fill=\"#adb5bd\"/>" +
                    "<text x=\"40\" y=\"72\" font-family=\"sans-serif\" font-size=\"9\" fill=\"#6c757d\" text-anchor=\"middle\">" + label + "</text>" +
                    "</svg>";
            ByteArrayResource resource = new ByteArrayResource(svg.getBytes(StandardCharsets.UTF_8));
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType("image/svg+xml"))
                    .body(resource);
        }
    }

    @org.springframework.web.bind.annotation.PostMapping("/upload")
    public ResponseEntity<vn.iotstar.model.Response> uploadImage(@org.springframework.web.bind.annotation.RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body(new vn.iotstar.model.Response(false, "File rỗng", null));
        }
        String uuid = java.util.UUID.randomUUID().toString();
        String storeFilename = storageService.getStorageFilename(file, uuid);
        storageService.store(file, storeFilename);
        return ResponseEntity.ok(new vn.iotstar.model.Response(true, "Tải ảnh thành công", storeFilename));
    }
}
