package vn.iotstar;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import vn.iotstar.config.StorageProperties;
import vn.iotstar.entity.Category;
import vn.iotstar.entity.Product;
import vn.iotstar.service.ICategoryService;
import vn.iotstar.service.IProductService;
import vn.iotstar.service.IStorageService;

import java.util.Date;

@SpringBootApplication
@EnableConfigurationProperties(StorageProperties.class)
public class Application {

    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }

    @Bean
    CommandLineRunner init(IStorageService storageService,
                          ICategoryService categoryService,
                          IProductService productService) {
        return (args -> {
            // Initialize storage directory
            storageService.init();

            // Populate initial sample data if DB is empty
            if (categoryService.count() == 0) {
                Category cat1 = new Category();
                cat1.setCategoryName("Điện thoại & Máy tính bảng");
                cat1.setIcon("phone.png");
                cat1 = categoryService.save(cat1);

                Category cat2 = new Category();
                cat2.setCategoryName("Laptop & Linh kiện");
                cat2.setIcon("laptop.png");
                cat2 = categoryService.save(cat2);

                Category cat3 = new Category();
                cat3.setCategoryName("Thời trang Nam / Nữ");
                cat3.setIcon("fashion.png");
                cat3 = categoryService.save(cat3);

                Category cat4 = new Category();
                cat4.setCategoryName("Gia dụng & Đời sống");
                cat4.setIcon("home.png");
                cat4 = categoryService.save(cat4);

                // Add sample products
                Product p1 = new Product();
                p1.setProductName("iPhone 15 Pro Max 256GB");
                p1.setQuantity(25);
                p1.setUnitPrice(32990000.0);
                p1.setDescription("Flagship mới nhất của Apple trang bị chip A17 Pro siêu mạnh mẽ.");
                p1.setDiscount(5.0);
                p1.setStatus((short) 1);
                p1.setCreateDate(new Date());
                p1.setCategory(cat1);
                productService.save(p1);

                Product p2 = new Product();
                p2.setProductName("Samsung Galaxy S24 Ultra");
                p2.setQuantity(30);
                p2.setUnitPrice(29990000.0);
                p2.setDescription("Điện thoại thông minh hỗ trợ Galaxy AI đỉnh cao.");
                p2.setDiscount(10.0);
                p2.setStatus((short) 1);
                p2.setCreateDate(new Date());
                p2.setCategory(cat1);
                productService.save(p2);

                Product p3 = new Product();
                p3.setProductName("MacBook Pro 14 M3 Chip");
                p3.setQuantity(15);
                p3.setUnitPrice(39990000.0);
                p3.setDescription("Máy tính xách tay cao cấp dành cho công việc sáng tạo.");
                p3.setDiscount(8.0);
                p3.setStatus((short) 1);
                p3.setCreateDate(new Date());
                p3.setCategory(cat2);
                productService.save(p3);

                Product p4 = new Product();
                p4.setProductName("Asus ROG Strix G16");
                p4.setQuantity(12);
                p4.setUnitPrice(35490000.0);
                p4.setDescription("Laptop Gaming trang bị Intel Core i9 và RTX 4070.");
                p4.setDiscount(7.0);
                p4.setStatus((short) 1);
                p4.setCreateDate(new Date());
                p4.setCategory(cat2);
                productService.save(p4);

                Product p5 = new Product();
                p5.setProductName("Áo Khoác Nam Bomber Style");
                p5.setQuantity(100);
                p5.setUnitPrice(450000.0);
                p5.setDescription("Áo khoác gió phong cách thể thao năng động.");
                p5.setDiscount(15.0);
                p5.setStatus((short) 1);
                p5.setCreateDate(new Date());
                p5.setCategory(cat3);
                productService.save(p5);

                Product p6 = new Product();
                p6.setProductName("Nồi Chiên Không Dầu Philips 6.2L");
                p6.setQuantity(40);
                p6.setUnitPrice(2690000.0);
                p6.setDescription("Thiết bị gia dụng đa năng công nghệ Rapid Air.");
                p6.setDiscount(20.0);
                p6.setStatus((short) 1);
                p6.setCreateDate(new Date());
                p6.setCategory(cat4);
                productService.save(p6);
            }
        });
    }
}
