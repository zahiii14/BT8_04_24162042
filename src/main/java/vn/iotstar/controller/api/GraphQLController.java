package vn.iotstar.controller.api;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.graphql.data.method.annotation.SchemaMapping;
import org.springframework.stereotype.Controller;
import vn.iotstar.entity.Category;
import vn.iotstar.entity.Product;
import vn.iotstar.service.ICategoryService;
import vn.iotstar.service.IProductService;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.Optional;

import org.springframework.web.bind.annotation.CrossOrigin;

@Controller
@CrossOrigin(origins = "*")
public class GraphQLController {

    @Autowired
    private ICategoryService categoryService;

    @Autowired
    private IProductService productService;

    // DTO records for GraphQL inputs
    public record CategoryInput(Long categoryId, String categoryName, String icon) {}

    public record ProductInput(
            Long productId,
            String productName,
            Integer quantity,
            Double unitPrice,
            String images,
            String description,
            Double discount,
            Integer status,
            Long categoryId
    ) {}

    // ------------------- QUERIES -------------------

    // 1. Hiển thị tất cả product có price từ thấp đến cao
    @QueryMapping
    public List<Product> productsSortedByPriceAsc() {
        return productService.findByOrderByUnitPriceAsc();
    }

    // 2. Lấy tất cả product của 01 category
    @QueryMapping
    public List<Product> productsByCategory(@Argument Long categoryId) {
        return productService.findByCategoryId(categoryId);
    }

    // 3. Search & Pagination for Categories
    @QueryMapping
    public Page<Category> searchCategories(
            @Argument String name,
            @Argument Integer page,
            @Argument Integer size,
            @Argument String sort) {

        int pageNum = (page != null && page >= 0) ? page : 0;
        int pageSize = (size != null && size > 0) ? size : 5;
        String sortStr = (sort != null && !sort.isBlank()) ? sort : "categoryId,desc";

        String[] sortParams = sortStr.split(",");
        Sort.Direction direction = (sortParams.length > 1 && sortParams[1].equalsIgnoreCase("asc"))
                ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(pageNum, pageSize, Sort.by(direction, sortParams[0]));

        if (name != null && !name.isBlank()) {
            return categoryService.findByCategoryNameContaining(name.trim(), pageable);
        }
        return categoryService.findAll(pageable);
    }

    @QueryMapping
    public Category categoryById(@Argument Long id) {
        return categoryService.findById(id).orElse(null);
    }

    @QueryMapping
    public List<Category> allCategories() {
        return categoryService.findAll();
    }

    // 3. Search & Pagination for Products
    @QueryMapping
    public Page<Product> searchProducts(
            @Argument String name,
            @Argument Long categoryId,
            @Argument Integer page,
            @Argument Integer size,
            @Argument String sort) {

        int pageNum = (page != null && page >= 0) ? page : 0;
        int pageSize = (size != null && size > 0) ? size : 5;
        String sortStr = (sort != null && !sort.isBlank()) ? sort : "productId,desc";

        String[] sortParams = sortStr.split(",");
        Sort.Direction direction = (sortParams.length > 1 && sortParams[1].equalsIgnoreCase("asc"))
                ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(pageNum, pageSize, Sort.by(direction, sortParams[0]));

        return productService.searchProducts(name, categoryId, pageable);
    }

    @QueryMapping
    public Product productById(@Argument Long id) {
        return productService.findById(id).orElse(null);
    }

    // Custom resolver to format Date for Product.createDate
    @SchemaMapping(typeName = "Product", field = "createDate")
    public String createDate(Product product) {
        if (product.getCreateDate() == null) {
            return null;
        }
        SimpleDateFormat formatter = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
        return formatter.format(product.getCreateDate());
    }

    // ------------------- MUTATIONS -------------------

    // Category Mutations
    @MutationMapping
    public Category createCategory(@Argument CategoryInput input) {
        Category category = new Category();
        category.setCategoryName(input.categoryName().trim());
        category.setIcon(input.icon());
        return categoryService.save(category);
    }

    @MutationMapping
    public Category updateCategory(@Argument CategoryInput input) {
        Optional<Category> opt = categoryService.findById(input.categoryId());
        if (opt.isEmpty()) {
            throw new RuntimeException("Category not found with ID: " + input.categoryId());
        }
        Category category = opt.get();
        category.setCategoryName(input.categoryName().trim());
        if (input.icon() != null) {
            category.setIcon(input.icon());
        }
        return categoryService.save(category);
    }

    @MutationMapping
    public Boolean deleteCategory(@Argument Long id) {
        Optional<Category> opt = categoryService.findById(id);
        if (opt.isEmpty()) {
            throw new RuntimeException("Category not found with ID: " + id);
        }
        categoryService.deleteById(id);
        return true;
    }

    // Product Mutations
    @MutationMapping
    public Product createProduct(@Argument ProductInput input) {
        Optional<Category> optCategory = categoryService.findById(input.categoryId());
        if (optCategory.isEmpty()) {
            throw new RuntimeException("Category not found with ID: " + input.categoryId());
        }

        Product product = new Product();
        product.setProductName(input.productName().trim());
        product.setQuantity(input.quantity() != null ? input.quantity() : 0);
        product.setUnitPrice(input.unitPrice() != null ? input.unitPrice() : 0.0);
        product.setImages(input.images());
        product.setDescription(input.description());
        product.setDiscount(input.discount() != null ? input.discount() : 0.0);
        product.setStatus(input.status() != null ? input.status().shortValue() : (short) 1);
        product.setCreateDate(new Date());
        product.setCategory(optCategory.get());

        return productService.save(product);
    }

    @MutationMapping
    public Product updateProduct(@Argument ProductInput input) {
        Optional<Product> optProduct = productService.findById(input.productId());
        if (optProduct.isEmpty()) {
            throw new RuntimeException("Product not found with ID: " + input.productId());
        }
        Optional<Category> optCategory = categoryService.findById(input.categoryId());
        if (optCategory.isEmpty()) {
            throw new RuntimeException("Category not found with ID: " + input.categoryId());
        }

        Product product = optProduct.get();
        product.setProductName(input.productName().trim());
        if (input.quantity() != null) product.setQuantity(input.quantity());
        if (input.unitPrice() != null) product.setUnitPrice(input.unitPrice());
        if (input.images() != null && !input.images().isBlank()) product.setImages(input.images());
        if (input.description() != null) product.setDescription(input.description());
        if (input.discount() != null) product.setDiscount(input.discount());
        if (input.status() != null) product.setStatus(input.status().shortValue());
        product.setCategory(optCategory.get());

        return productService.save(product);
    }

    @MutationMapping
    public Boolean deleteProduct(@Argument Long id) {
        Optional<Product> optProduct = productService.findById(id);
        if (optProduct.isEmpty()) {
            throw new RuntimeException("Product not found with ID: " + id);
        }
        productService.deleteById(id);
        return true;
    }
}
