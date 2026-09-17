package vn.iotstar.controller.api;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import vn.iotstar.entity.Category;
import vn.iotstar.model.Response;
import vn.iotstar.service.ICategoryService;
import vn.iotstar.service.IStorageService;

import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/category")
public class CategoryApiController {

    @Autowired
    private ICategoryService categoryService;

    @Autowired
    private IStorageService storageService;

    // Get all categories (without pagination)
    @GetMapping("/all")
    public ResponseEntity<Response> getAllCategory() {
        return ResponseEntity.ok(new Response(true, "Thành công", categoryService.findAll()));
    }

    // Paginated search endpoint for Category
    @GetMapping("/search")
    public ResponseEntity<Response> searchCategories(
            @RequestParam(name = "name", defaultValue = "") String name,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "5") int size,
            @RequestParam(name = "sort", defaultValue = "categoryId,asc") String sort) {

        String[] sortParams = sort.split(",");
        Sort.Direction direction = sortParams.length > 1 && sortParams[1].equalsIgnoreCase("desc")
                ? Sort.Direction.DESC : Sort.Direction.ASC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortParams[0]));

        Page<Category> categoryPage;
        if (StringUtils.hasText(name)) {
            categoryPage = categoryService.findByCategoryNameContaining(name.trim(), pageable);
        } else {
            categoryPage = categoryService.findAll(pageable);
        }

        return ResponseEntity.ok(new Response(true, "Thành công", categoryPage));
    }

    // Get category by ID
    @GetMapping("/{id}")
    public ResponseEntity<Response> getCategoryById(@PathVariable("id") Long id) {
        Optional<Category> category = categoryService.findById(id);
        if (category.isPresent()) {
            return ResponseEntity.ok(new Response(true, "Thành công", category.get()));
        } else {
            return new ResponseEntity<>(new Response(false, "Không tìm thấy danh mục", null), HttpStatus.NOT_FOUND);
        }
    }

    // Add category with optional file upload
    @PostMapping("/addCategory")
    public ResponseEntity<Response> addCategory(
            @Validated @RequestParam("categoryName") String categoryName,
            @RequestParam(value = "icon", required = false) MultipartFile icon) {

        Optional<Category> optCategory = categoryService.findByCategoryName(categoryName.trim());
        if (optCategory.isPresent()) {
            return new ResponseEntity<>(new Response(false, "Category đã tồn tại trong hệ thống", null), HttpStatus.BAD_REQUEST);
        }

        Category category = new Category();
        category.setCategoryName(categoryName.trim());

        if (icon != null && !icon.isEmpty()) {
            String uuid = UUID.randomUUID().toString();
            String storeFilename = storageService.getStorageFilename(icon, uuid);
            storageService.store(icon, storeFilename);
            category.setIcon(storeFilename);
        }

        Category savedCategory = categoryService.save(category);
        return ResponseEntity.ok(new Response(true, "Thêm thành công", savedCategory));
    }

    // Update category with optional file upload
    @PutMapping("/updateCategory")
    public ResponseEntity<Response> updateCategory(
            @Validated @RequestParam("categoryId") Long categoryId,
            @Validated @RequestParam("categoryName") String categoryName,
            @RequestParam(value = "icon", required = false) MultipartFile icon) {

        Optional<Category> optCategory = categoryService.findById(categoryId);
        if (optCategory.isEmpty()) {
            return new ResponseEntity<>(new Response(false, "Không tìm thấy Category", null), HttpStatus.NOT_FOUND);
        }

        Category category = optCategory.get();
        category.setCategoryName(categoryName.trim());

        if (icon != null && !icon.isEmpty()) {
            String uuid = UUID.randomUUID().toString();
            String storeFilename = storageService.getStorageFilename(icon, uuid);
            storageService.store(icon, storeFilename);
            category.setIcon(storeFilename);
        }

        Category updatedCategory = categoryService.save(category);
        return ResponseEntity.ok(new Response(true, "Cập nhật thành công", updatedCategory));
    }

    // Delete category
    @DeleteMapping("/deleteCategory/{id}")
    public ResponseEntity<Response> deleteCategory(@PathVariable("id") Long categoryId) {
        Optional<Category> optCategory = categoryService.findById(categoryId);
        if (optCategory.isEmpty()) {
            return new ResponseEntity<>(new Response(false, "Không tìm thấy Category", null), HttpStatus.NOT_FOUND);
        }
        categoryService.delete(optCategory.get());
        return ResponseEntity.ok(new Response(true, "Xóa thành công", optCategory.get()));
    }
}
