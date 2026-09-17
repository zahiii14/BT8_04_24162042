package vn.iotstar.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import vn.iotstar.entity.Product;
import vn.iotstar.repository.ProductRepository;
import vn.iotstar.service.IProductService;

import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
public class ProductServiceImpl implements IProductService {

    @Autowired
    private ProductRepository productRepository;

    @Override
    public Product save(Product entity) {
        if (entity.getProductId() == null) {
            if (entity.getCreateDate() == null) {
                entity.setCreateDate(new Date());
            }
            return productRepository.save(entity);
        } else {
            Optional<Product> opt = findById(entity.getProductId());
            if (opt.isPresent()) {
                if (!StringUtils.hasText(entity.getImages())) {
                    entity.setImages(opt.get().getImages());
                }
                if (entity.getCreateDate() == null) {
                    entity.setCreateDate(opt.get().getCreateDate());
                }
            }
            return productRepository.save(entity);
        }
    }

    @Override
    public List<Product> findAll() {
        return productRepository.findAll();
    }

    @Override
    public List<Product> findAll(Sort sort) {
        return productRepository.findAll(sort);
    }

    @Override
    public Page<Product> findAll(Pageable pageable) {
        return productRepository.findAll(pageable);
    }

    @Override
    public Optional<Product> findById(Long id) {
        return productRepository.findById(id);
    }

    @Override
    public Optional<Product> findByProductName(String name) {
        return productRepository.findByProductName(name);
    }

    @Override
    public Optional<Product> findByCreateDate(Date createDate) {
        return productRepository.findByCreateDate(createDate);
    }

    @Override
    public List<Product> findByProductNameContaining(String name) {
        return productRepository.findByProductNameContaining(name);
    }

    @Override
    public Page<Product> findByProductNameContaining(String name, Pageable pageable) {
        return productRepository.findByProductNameContaining(name, pageable);
    }

    @Override
    public Page<Product> searchProducts(String name, Long categoryId, Pageable pageable) {
        boolean hasName = StringUtils.hasText(name);
        boolean hasCategory = (categoryId != null && categoryId > 0);

        if (hasName && hasCategory) {
            return productRepository.findByProductNameContainingAndCategory_CategoryId(name.trim(), categoryId, pageable);
        } else if (hasCategory) {
            return productRepository.findByCategory_CategoryId(categoryId, pageable);
        } else if (hasName) {
            return productRepository.findByProductNameContaining(name.trim(), pageable);
        } else {
            return productRepository.findAll(pageable);
        }
    }

    @Override
    public void deleteById(Long id) {
        productRepository.deleteById(id);
    }

    @Override
    public void delete(Product entity) {
        productRepository.delete(entity);
    }

    @Override
    public long count() {
        return productRepository.count();
    }
}
