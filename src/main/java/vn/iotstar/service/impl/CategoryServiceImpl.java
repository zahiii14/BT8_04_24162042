package vn.iotstar.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import vn.iotstar.entity.Category;
import vn.iotstar.repository.CategoryRepository;
import vn.iotstar.service.ICategoryService;

import java.util.List;
import java.util.Optional;

@Service
public class CategoryServiceImpl implements ICategoryService {

    @Autowired
    private CategoryRepository categoryRepository;

    @Override
    public Category save(Category entity) {
        if (entity.getCategoryId() == null) {
            return categoryRepository.save(entity);
        } else {
            Optional<Category> opt = findById(entity.getCategoryId());
            if (opt.isPresent()) {
                if (!StringUtils.hasText(entity.getIcon())) {
                    entity.setIcon(opt.get().getIcon());
                }
            }
            return categoryRepository.save(entity);
        }
    }

    @Override
    public List<Category> findAll() {
        return categoryRepository.findAll();
    }

    @Override
    public List<Category> findAll(Sort sort) {
        return categoryRepository.findAll(sort);
    }

    @Override
    public Page<Category> findAll(Pageable pageable) {
        return categoryRepository.findAll(pageable);
    }

    @Override
    public Optional<Category> findById(Long id) {
        return categoryRepository.findById(id);
    }

    @Override
    public Optional<Category> findByCategoryName(String name) {
        return categoryRepository.findByCategoryName(name);
    }

    @Override
    public List<Category> findByCategoryNameContaining(String name) {
        return categoryRepository.findByCategoryNameContaining(name);
    }

    @Override
    public Page<Category> findByCategoryNameContaining(String name, Pageable pageable) {
        return categoryRepository.findByCategoryNameContaining(name, pageable);
    }

    @Override
    public void deleteById(Long id) {
        categoryRepository.deleteById(id);
    }

    @Override
    public void delete(Category entity) {
        categoryRepository.delete(entity);
    }

    @Override
    public long count() {
        return categoryRepository.count();
    }
}
