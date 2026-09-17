package vn.iotstar.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import vn.iotstar.entity.Category;

import java.util.List;
import java.util.Optional;

public interface ICategoryService {
    Category save(Category entity);

    List<Category> findAll();

    List<Category> findAll(Sort sort);

    Page<Category> findAll(Pageable pageable);

    Optional<Category> findById(Long id);

    Optional<Category> findByCategoryName(String name);

    List<Category> findByCategoryNameContaining(String name);

    Page<Category> findByCategoryNameContaining(String name, Pageable pageable);

    void deleteById(Long id);

    void delete(Category entity);

    long count();
}
