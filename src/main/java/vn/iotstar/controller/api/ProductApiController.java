package vn.iotstar.controller.api;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import vn.iotstar.entity.Category;
import vn.iotstar.entity.Product;
import vn.iotstar.model.Response;
import vn.iotstar.service.ICategoryService;
import vn.iotstar.service.IProductService;
import vn.iotstar.service.IStorageService;

import java.util.Date;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/product")
public class ProductApiController {

    @Autowired
    private IProductService productService;

    @Autowired
    private ICategoryService categoryService;

    @Autowired
    private IStorageService storageService;

    // Paginated search endpoint for Product with optional category filter
    @GetMapping("/search")
    public ResponseEntity<Response> searchProducts(
            @RequestParam(name = "name", defaultValue = "") String name,
            @RequestParam(name = "categoryId", required = false) Long categoryId,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "5") int size,
            @RequestParam(name = "sort", defaultValue = "productId,desc") String sort) {

        String[] sortParams = sort.split(",");
        Sort.Direction direction = sortParams.length > 1 && sortParams[1].equalsIgnoreCase("asc")
                ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortParams[0]));

        Page<Product> productPage = productService.searchProducts(name, categoryId, pageable);
        return ResponseEntity.ok(new Response(true, "Thành công", productPage));
    }

    // Get product by ID
    @GetMapping("/{id}")
    public ResponseEntity<Response> getProductById(@PathVariable("id") Long id) {
        Optional<Product> product = productService.findById(id);
        if (product.isPresent()) {
            return ResponseEntity.ok(new Response(true, "Thành công", product.get()));
        } else {
            return new ResponseEntity<>(new Response(false, "Không tìm thấy sản phẩm", null), HttpStatus.NOT_FOUND);
        }
    }

    // Add product
    @PostMapping("/addProduct")
    public ResponseEntity<Response> addProduct(
            @Validated @RequestParam("productName") String productName,
            @RequestParam("quantity") int quantity,
            @RequestParam("unitPrice") double unitPrice,
            @RequestParam(value = "description", defaultValue = "") String description,
            @RequestParam(value = "discount", defaultValue = "0") double discount,
            @RequestParam(value = "status", defaultValue = "1") short status,
            @RequestParam("categoryId") Long categoryId,
            @RequestParam(value = "imageFile", required = false) MultipartFile imageFile) {

        Optional<Category> optCategory = categoryService.findById(categoryId);
        if (optCategory.isEmpty()) {
            return new ResponseEntity<>(new Response(false, "Danh mục không tồn tại", null), HttpStatus.BAD_REQUEST);
        }

        Product product = new Product();
        product.setProductName(productName.trim());
        product.setQuantity(quantity);
        product.setUnitPrice(unitPrice);
        product.setDescription(description);
        product.setDiscount(discount);
        product.setStatus(status);
        product.setCreateDate(new Date());
        product.setCategory(optCategory.get());

        if (imageFile != null && !imageFile.isEmpty()) {
            String uuid = UUID.randomUUID().toString();
            String storeFilename = storageService.getStorageFilename(imageFile, uuid);
            storageService.store(imageFile, storeFilename);
            product.setImages(storeFilename);
        }

        Product savedProduct = productService.save(product);
        return ResponseEntity.ok(new Response(true, "Thêm sản phẩm thành công", savedProduct));
    }

    // Update product
    @PutMapping("/updateProduct")
    public ResponseEntity<Response> updateProduct(
            @Validated @RequestParam("productId") Long productId,
            @Validated @RequestParam("productName") String productName,
            @RequestParam("quantity") int quantity,
            @RequestParam("unitPrice") double unitPrice,
            @RequestParam(value = "description", defaultValue = "") String description,
            @RequestParam(value = "discount", defaultValue = "0") double discount,
            @RequestParam(value = "status", defaultValue = "1") short status,
            @RequestParam("categoryId") Long categoryId,
            @RequestParam(value = "imageFile", required = false) MultipartFile imageFile) {

        Optional<Product> optProduct = productService.findById(productId);
        if (optProduct.isEmpty()) {
            return new ResponseEntity<>(new Response(false, "Sản phẩm không tồn tại", null), HttpStatus.NOT_FOUND);
        }

        Optional<Category> optCategory = categoryService.findById(categoryId);
        if (optCategory.isEmpty()) {
            return new ResponseEntity<>(new Response(false, "Danh mục không tồn tại", null), HttpStatus.BAD_REQUEST);
        }

        Product product = optProduct.get();
        product.setProductName(productName.trim());
        product.setQuantity(quantity);
        product.setUnitPrice(unitPrice);
        product.setDescription(description);
        product.setDiscount(discount);
        product.setStatus(status);
        product.setCategory(optCategory.get());

        if (imageFile != null && !imageFile.isEmpty()) {
            String uuid = UUID.randomUUID().toString();
            String storeFilename = storageService.getStorageFilename(imageFile, uuid);
            storageService.store(imageFile, storeFilename);
            product.setImages(storeFilename);
        }

        Product updatedProduct = productService.save(product);
        return ResponseEntity.ok(new Response(true, "Cập nhật sản phẩm thành công", updatedProduct));
    }

    // Delete product
    @DeleteMapping("/deleteProduct/{id}")
    public ResponseEntity<Response> deleteProduct(@PathVariable("id") Long productId) {
        Optional<Product> optProduct = productService.findById(productId);
        if (optProduct.isEmpty()) {
            return new ResponseEntity<>(new Response(false, "Sản phẩm không tồn tại", null), HttpStatus.NOT_FOUND);
        }
        productService.delete(optProduct.get());
        return ResponseEntity.ok(new Response(true, "Xóa sản phẩm thành công", optProduct.get()));
    }
}
