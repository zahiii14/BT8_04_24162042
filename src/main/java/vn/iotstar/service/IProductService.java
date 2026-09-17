package vn.iotstar.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import vn.iotstar.entity.Product;

import java.util.Date;
import java.util.List;
import java.util.Optional;

public interface IProductService {
    Product save(Product entity);

    List<Product> findAll();

    List<Product> findAll(Sort sort);

    Page<Product> findAll(Pageable pageable);

    Optional<Product> findById(Long id);

    Optional<Product> findByProductName(String name);

    Optional<Product> findByCreateDate(Date createDate);

    List<Product> findByProductNameContaining(String name);

    Page<Product> findByProductNameContaining(String name, Pageable pageable);

    Page<Product> searchProducts(String name, Long categoryId, Pageable pageable);

    void deleteById(Long id);

    void delete(Product entity);

    long count();
}
