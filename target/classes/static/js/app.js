// Global State Variables
let currentCatPage = 0;
let currentProdPage = 0;

const DEFAULT_SVG_PLACEHOLDER = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'><rect width='60' height='60' fill='%23e9ecef' rx='8'/><path d='M15 42 L25 27 L33 36 L38 30 L45 42 Z' fill='%23adb5bd'/><circle cx='22' cy='23' r='4' fill='%23adb5bd'/></svg>";

// Document Ready Setup
$(document).ready(function () {
    // Initial data load via GraphQL
    loadHomeProductsSortedByPrice();
    loadCategoryDropdowns();
    loadCategoryData(0);
    loadProductData(0);

    // Tab Event Listeners
    $('#home-tab').on('shown.bs.tab', function () {
        loadHomeProductsSortedByPrice();
        loadCategoryDropdowns();
    });

    $('#product-tab').on('shown.bs.tab', function () {
        loadCategoryDropdowns();
    });

    // Form submit handlers
    $('#categoryForm').on('submit', function (e) {
        e.preventDefault();
        saveCategory();
    });

    $('#productForm').on('submit', function (e) {
        e.preventDefault();
        saveProduct();
    });
});

/* ==========================================================================
   HELPER UTILITIES & GRAPHQL FETCH FUNCTION
   ========================================================================== */

function executeGraphQL(query, variables = {}) {
    return $.ajax({
        url: '/graphql',
        type: 'POST',
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify({
            query: query,
            variables: variables
        })
    });
}

function uploadImageFile(fileInputId) {
    const fileInput = document.getElementById(fileInputId);
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
        return Promise.resolve(null);
    }
    const formData = new FormData();
    formData.append("file", fileInput.files[0]);

    return $.ajax({
        url: '/api/images/upload',
        type: 'POST',
        data: formData,
        contentType: false,
        processData: false,
        dataType: 'json'
    }).then(res => {
        if (res.status && res.body) {
            return res.body;
        }
        return null;
    }).catch(err => {
        console.error("Lỗi upload file:", err);
        return null;
    });
}

function formatCurrency(amount) {
    if (!amount) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

function showToast(message, type = 'success') {
    const icon = type === 'success' ? 'success' : 'error';
    const title = type === 'success' ? 'Thành công!' : 'Thất bại!';
    Swal.fire({
        toast: true,
        position: 'top-end',
        icon: icon,
        title: title,
        text: message,
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
    });
}

function getImageUrl(filename) {
    if (!filename || filename === 'null' || filename === '') {
        return DEFAULT_SVG_PLACEHOLDER;
    }
    if (filename.startsWith('http://') || filename.startsWith('https://') || filename.startsWith('data:')) {
        return filename;
    }
    return '/api/images/' + filename;
}


/* ==========================================================================
   TRANG CHỦ (HOME PAGE) GRAPHQL PRODUCT VIEWS
   ========================================================================== */

// 1. Hiển thị tất cả product có price từ thấp đến cao
function loadHomeProductsSortedByPrice() {
    $('#homePriceSortedContainer').html(`
        <div class="col-12 text-center py-4 text-muted">
            <div class="spinner-border spinner-border-sm text-primary me-2"></div> Đang tải danh sách sản phẩm giá tăng dần (GraphQL)...
        </div>
    `);

    const query = `
        query {
            productsSortedByPriceAsc {
                productId
                productName
                unitPrice
                quantity
                discount
                images
                description
                status
                category {
                    categoryId
                    categoryName
                }
            }
        }
    `;

    executeGraphQL(query).done(function (res) {
        if (res.data && res.data.productsSortedByPriceAsc) {
            renderHomeProductGrid('#homePriceSortedContainer', res.data.productsSortedByPriceAsc);
        } else {
            $('#homePriceSortedContainer').html('<div class="col-12 text-center text-muted py-4">Không có dữ liệu sản phẩm</div>');
        }
    }).fail(function (err) {
        console.error(err);
        $('#homePriceSortedContainer').html('<div class="col-12 text-center text-danger py-4">Lỗi kết nối GraphQL API!</div>');
    });
}

// 2. Lấy tất cả product của 01 category
function onHomeCategoryChanged() {
    const categoryId = $('#homeCategorySelect').val();
    if (!categoryId) {
        $('#homeCategoryProductsContainer').html(`
            <div class="col-12 text-center py-4 text-muted">
                <i class="fa-solid fa-hand-pointer me-2"></i> Vui lòng chọn 1 danh mục ở trên để hiển thị sản phẩm.
            </div>
        `);
        return;
    }

    $('#homeCategoryProductsContainer').html(`
        <div class="col-12 text-center py-4 text-muted">
            <div class="spinner-border spinner-border-sm text-success me-2"></div> Đang tải sản phẩm của danh mục (GraphQL)...
        </div>
    `);

    const query = `
        query GetProductsByCategory($catId: ID!) {
            productsByCategory(categoryId: $catId) {
                productId
                productName
                unitPrice
                quantity
                discount
                images
                description
                status
                category {
                    categoryId
                    categoryName
                }
            }
        }
    `;

    executeGraphQL(query, { catId: categoryId }).done(function (res) {
        if (res.data && res.data.productsByCategory) {
            renderHomeProductGrid('#homeCategoryProductsContainer', res.data.productsByCategory);
        } else {
            $('#homeCategoryProductsContainer').html('<div class="col-12 text-center text-muted py-4">Không có sản phẩm nào thuộc danh mục này</div>');
        }
    }).fail(function (err) {
        console.error(err);
        $('#homeCategoryProductsContainer').html('<div class="col-12 text-center text-danger py-4">Lỗi kết nối GraphQL API!</div>');
    });
}

function renderHomeProductGrid(containerId, products) {
    if (!products || products.length === 0) {
        $(containerId).html('<div class="col-12 text-center text-muted py-4"><i class="fa-solid fa-box-open me-2"></i>Không tìm thấy sản phẩm nào</div>');
        return;
    }

    let html = '';
    products.forEach(p => {
        const imgSrc = getImageUrl(p.images);
        const catName = p.category ? p.category.categoryName : 'Khác';
        const discountBadge = p.discount > 0 ? `<span class="badge bg-danger position-absolute top-0 start-0 m-2">-${p.discount}%</span>` : '';

        html += `
            <div class="col">
                <div class="card h-100 shadow-sm border-0 position-relative">
                    ${discountBadge}
                    <div class="text-center p-3 bg-light rounded-top">
                        <img src="${imgSrc}" class="card-img-top" alt="${p.productName}" style="max-height: 140px; object-fit: contain;" onError="this.src='${DEFAULT_SVG_PLACEHOLDER}'">
                    </div>
                    <div class="card-body d-flex flex-column">
                        <span class="badge bg-info text-dark w-auto align-self-start mb-2">${catName}</span>
                        <h6 class="card-title fw-bold text-dark mb-1 text-truncate" title="${p.productName}">${p.productName}</h6>
                        <p class="card-text small text-muted text-truncate mb-2" style="max-height: 40px;">${p.description || ''}</p>
                        <div class="mt-auto d-flex align-items-center justify-content-between">
                            <span class="fw-bold text-success fs-6">${formatCurrency(p.unitPrice)}</span>
                            <span class="small text-muted">Kho: ${p.quantity}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    $(containerId).html(html);
}


/* ==========================================================================
   CATEGORY GRAPHQL CRUD & PAGINATION
   ========================================================================== */

function loadCategoryDropdowns() {
    const query = `
        query {
            allCategories {
                categoryId
                categoryName
            }
        }
    `;

    executeGraphQL(query).done(function (res) {
        if (res.data && res.data.allCategories) {
            let filterOptions = '<option value="">-- Tất cả Danh mục --</option>';
            let selectOptions = '<option value="">-- Chọn Danh Mục --</option>';

            res.data.allCategories.forEach(cat => {
                filterOptions += `<option value="${cat.categoryId}">${cat.categoryName}</option>`;
                selectOptions += `<option value="${cat.categoryId}">${cat.categoryName}</option>`;
            });

            const currentHomeFilter = $('#homeCategorySelect').val();
            const currentProdFilter = $('#prodFilterCategory').val();

            $('#homeCategorySelect').html(selectOptions).val(currentHomeFilter);
            $('#prodFilterCategory').html(filterOptions).val(currentProdFilter);
            $('#prodCategorySelect').html(selectOptions);
        }
    });
}

function loadCategoryData(page = 0) {
    currentCatPage = page;
    const searchName = $('#catSearchName').val().trim();
    const pageSize = parseInt($('#catPageSize').val(), 10);

    $('#categoryTableBody').html(`
        <tr>
            <td colspan="4" class="text-center py-4 text-muted">
                <div class="spinner-border spinner-border-sm text-primary me-2"></div> Đang tải dữ liệu danh mục (GraphQL)...
            </td>
        </tr>
    `);

    const query = `
        query SearchCategories($name: String, $page: Int, $size: Int) {
            searchCategories(name: $name, page: $page, size: $size) {
                content {
                    categoryId
                    categoryName
                    icon
                }
                totalPages
                totalElements
                number
                size
                first
                last
            }
        }
    `;

    executeGraphQL(query, { name: searchName, page: page, size: pageSize }).done(function (res) {
        if (res.data && res.data.searchCategories) {
            renderCategoryTable(res.data.searchCategories);
            renderCategoryPagination(res.data.searchCategories);
        } else {
            $('#categoryTableBody').html('<tr><td colspan="4" class="text-center text-muted py-4">Không tìm thấy dữ liệu!</td></tr>');
        }
    }).fail(function (err) {
        console.error(err);
        $('#categoryTableBody').html('<tr><td colspan="4" class="text-center text-danger py-4">Lỗi tải dữ liệu từ GraphQL!</td></tr>');
    });
}

function renderCategoryTable(pageData) {
    const categories = pageData.content;
    if (!categories || categories.length === 0) {
        $('#categoryTableBody').html('<tr><td colspan="4" class="text-center text-muted py-4"><i class="fa-solid fa-folder-open me-2"></i>Không tìm thấy danh mục nào</td></tr>');
        return;
    }

    let html = '';
    categories.forEach(cat => {
        const iconSrc = getImageUrl(cat.icon);
        html += `
            <tr>
                <td class="text-center fw-bold">${cat.categoryId}</td>
                <td class="text-center">
                    <img src="${iconSrc}" class="img-thumbnail-custom" alt="${cat.categoryName}" onError="this.src='${DEFAULT_SVG_PLACEHOLDER}'">
                </td>
                <td class="fw-semibold text-primary">${cat.categoryName}</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-warning me-1" title="Chỉnh sửa" onclick="editCategory(${cat.categoryId})">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" title="Xóa" onclick="deleteCategory(${cat.categoryId}, '${cat.categoryName.replace(/'/g, "\\'")}')">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    $('#categoryTableBody').html(html);
}

function renderCategoryPagination(pageData) {
    const totalPages = pageData.totalPages;
    const currentPage = pageData.number;
    const totalElements = pageData.totalElements;
    const pageSize = pageData.size;

    const startItem = totalElements === 0 ? 0 : currentPage * pageSize + 1;
    const endItem = Math.min((currentPage + 1) * pageSize, totalElements);
    $('#catPaginationInfo').text(`Hiển thị ${startItem} - ${endItem} của ${totalElements} danh mục`);

    let navHtml = '';

    navHtml += `
        <li class="page-item ${currentPage === 0 ? 'disabled' : ''}">
            <a class="page-link" href="javascript:void(0)" onclick="loadCategoryData(0)">&laquo; Đầu</a>
        </li>
        <li class="page-item ${currentPage === 0 ? 'disabled' : ''}">
            <a class="page-link" href="javascript:void(0)" onclick="loadCategoryData(${currentPage - 1})">Trước</a>
        </li>
    `;

    const maxVisiblePages = 5;
    let startPage = Math.max(0, currentPage - 2);
    let endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 1);
    if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(0, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        navHtml += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link" href="javascript:void(0)" onclick="loadCategoryData(${i})">${i + 1}</a>
            </li>
        `;
    }

    navHtml += `
        <li class="page-item ${currentPage >= totalPages - 1 || totalPages === 0 ? 'disabled' : ''}">
            <a class="page-link" href="javascript:void(0)" onclick="loadCategoryData(${currentPage + 1})">Sau</a>
        </li>
        <li class="page-item ${currentPage >= totalPages - 1 || totalPages === 0 ? 'disabled' : ''}">
            <a class="page-link" href="javascript:void(0)" onclick="loadCategoryData(${totalPages - 1})">Cuối &raquo;</a>
        </li>
    `;

    $('#catPaginationNav').html(navHtml);
}

function onCategorySearchKeyUp(e) {
    if (e.key === 'Enter') {
        loadCategoryData(0);
    }
}

function clearCategorySearch() {
    $('#catSearchName').val('');
    loadCategoryData(0);
}

function openAddCategoryModal() {
    $('#categoryForm')[0].reset();
    $('#catId').val('');
    $('#catIconCurrentContainer').addClass('d-none');
    $('#categoryModalLabel').text('Thêm Mới Danh Mục');
    $('#categoryModal').modal('show');
}

function editCategory(id) {
    const query = `
        query GetCategory($id: ID!) {
            categoryById(id: $id) {
                categoryId
                categoryName
                icon
            }
        }
    `;

    executeGraphQL(query, { id: id }).done(function (res) {
        if (res.data && res.data.categoryById) {
            const cat = res.data.categoryById;
            $('#catId').val(cat.categoryId);
            $('#catNameInput').val(cat.categoryName);
            
            if (cat.icon) {
                $('#catIconPreview').attr('src', getImageUrl(cat.icon));
                $('#catIconCurrentContainer').removeClass('d-none');
            } else {
                $('#catIconCurrentContainer').addClass('d-none');
            }

            $('#categoryModalLabel').text('Chỉnh Sửa Danh Mục: ' + cat.categoryName);
            $('#categoryModal').modal('show');
        } else {
            showToast('Không tìm thấy danh mục!', 'error');
        }
    }).fail(function () {
        showToast('Lỗi GraphQL khi lấy thông tin danh mục!', 'error');
    });
}

function previewCatIcon(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            $('#catIconPreview').attr('src', e.target.result);
            $('#catIconCurrentContainer').removeClass('d-none');
        };
        reader.readAsDataURL(input.files[0]);
    }
}

async function saveCategory() {
    const catId = $('#catId').val();
    const catName = $('#catNameInput').val().trim();
    if (!catName) {
        showToast('Tên danh mục không được để trống!', 'error');
        return;
    }

    $('#btnSaveCategory').prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-1"></span> Đang lưu...');

    // Upload icon if file selected
    let uploadedFilename = await uploadImageFile('catIconInput');

    if (catId && catId !== '') {
        // Update mutation
        const mutation = `
            mutation UpdateCategory($input: CategoryInput!) {
                updateCategory(input: $input) {
                    categoryId
                    categoryName
                    icon
                }
            }
        `;
        const variables = {
            input: {
                categoryId: catId,
                categoryName: catName,
                icon: uploadedFilename
            }
        };

        executeGraphQL(mutation, variables).done(function (res) {
            $('#btnSaveCategory').prop('disabled', false).html('<i class="fa-solid fa-floppy-disk me-1"></i> Lưu Thông Tin');
            if (res.data && res.data.updateCategory) {
                showToast('Cập nhật danh mục thành công!', 'success');
                $('#categoryModal').modal('hide');
                loadCategoryData(currentCatPage);
                loadCategoryDropdowns();
            } else {
                showToast('Lỗi cập nhật danh mục!', 'error');
            }
        }).fail(function () {
            $('#btnSaveCategory').prop('disabled', false).html('<i class="fa-solid fa-floppy-disk me-1"></i> Lưu Thông Tin');
            showToast('Lỗi GraphQL Mutation!', 'error');
        });
    } else {
        // Create mutation
        const mutation = `
            mutation CreateCategory($input: CategoryInput!) {
                createCategory(input: $input) {
                    categoryId
                    categoryName
                    icon
                }
            }
        `;
        const variables = {
            input: {
                categoryName: catName,
                icon: uploadedFilename
            }
        };

        executeGraphQL(mutation, variables).done(function (res) {
            $('#btnSaveCategory').prop('disabled', false).html('<i class="fa-solid fa-floppy-disk me-1"></i> Lưu Thông Tin');
            if (res.data && res.data.createCategory) {
                showToast('Thêm danh mục thành công!', 'success');
                $('#categoryModal').modal('hide');
                loadCategoryData(currentCatPage);
                loadCategoryDropdowns();
            } else {
                showToast('Lỗi thêm danh mục!', 'error');
            }
        }).fail(function () {
            $('#btnSaveCategory').prop('disabled', false).html('<i class="fa-solid fa-floppy-disk me-1"></i> Lưu Thông Tin');
            showToast('Lỗi GraphQL Mutation!', 'error');
        });
    }
}

function deleteCategory(id, name) {
    Swal.fire({
        title: 'Xác nhận xóa (GraphQL)?',
        text: `Bạn có chắc chắn muốn xóa danh mục "${name}"?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Đồng ý xóa',
        cancelButtonText: 'Hủy bỏ'
    }).then((result) => {
        if (result.isConfirmed) {
            const mutation = `
                mutation DeleteCategory($id: ID!) {
                    deleteCategory(id: $id)
                }
            `;

            executeGraphQL(mutation, { id: id }).done(function (res) {
                if (res.data && res.data.deleteCategory) {
                    showToast('Xóa danh mục thành công!', 'success');
                    loadCategoryData(currentCatPage);
                    loadCategoryDropdowns();
                } else {
                    showToast('Xóa danh mục thất bại!', 'error');
                }
            }).fail(function () {
                showToast('Lỗi hệ thống khi xóa danh mục!', 'error');
            });
        }
    });
}


/* ==========================================================================
   PRODUCT GRAPHQL CRUD & PAGINATION
   ========================================================================== */

function loadProductData(page = 0) {
    currentProdPage = page;
    const searchName = $('#prodSearchName').val().trim();
    const categoryId = $('#prodFilterCategory').val();
    const pageSize = parseInt($('#prodPageSize').val(), 10);

    $('#productTableBody').html(`
        <tr>
            <td colspan="9" class="text-center py-4 text-muted">
                <div class="spinner-border spinner-border-sm text-primary me-2"></div> Đang tải dữ liệu sản phẩm (GraphQL)...
            </td>
        </tr>
    `);

    const query = `
        query SearchProducts($name: String, $categoryId: ID, $page: Int, $size: Int) {
            searchProducts(name: $name, categoryId: $categoryId, page: $page, size: $size) {
                content {
                    productId
                    productName
                    quantity
                    unitPrice
                    images
                    description
                    discount
                    status
                    category {
                        categoryId
                        categoryName
                    }
                }
                totalPages
                totalElements
                number
                size
                first
                last
            }
        }
    `;

    const variables = {
        name: searchName,
        categoryId: categoryId ? categoryId : null,
        page: page,
        size: pageSize
    };

    executeGraphQL(query, variables).done(function (res) {
        if (res.data && res.data.searchProducts) {
            renderProductTable(res.data.searchProducts);
            renderProductPagination(res.data.searchProducts);
        } else {
            $('#productTableBody').html('<tr><td colspan="9" class="text-center text-muted py-4">Không tìm thấy dữ liệu!</td></tr>');
        }
    }).fail(function (err) {
        console.error(err);
        $('#productTableBody').html('<tr><td colspan="9" class="text-center text-danger py-4">Lỗi tải dữ liệu từ GraphQL!</td></tr>');
    });
}

function renderProductTable(pageData) {
    const products = pageData.content;
    if (!products || products.length === 0) {
        $('#productTableBody').html('<tr><td colspan="9" class="text-center text-muted py-4"><i class="fa-solid fa-box-open me-2"></i>Không tìm thấy sản phẩm nào</td></tr>');
        return;
    }

    let html = '';
    products.forEach(p => {
        const imgSrc = getImageUrl(p.images);
        const catName = p.category ? p.category.categoryName : '<span class="text-muted">Chưa phân loại</span>';
        const statusBadge = p.status === 1 
            ? '<span class="badge bg-success badge-status">Đang bán</span>'
            : '<span class="badge bg-secondary badge-status">Ngừng bán</span>';

        const discountBadge = p.discount > 0 
            ? `<span class="badge bg-danger">-${p.discount}%</span>`
            : '<span class="text-muted">-</span>';

        html += `
            <tr>
                <td class="text-center fw-bold">${p.productId}</td>
                <td class="text-center">
                    <img src="${imgSrc}" class="img-thumbnail-custom" alt="${p.productName}" onError="this.src='${DEFAULT_SVG_PLACEHOLDER}'">
                </td>
                <td>
                    <div class="fw-bold text-dark">${p.productName}</div>
                    <div class="small text-muted text-truncate" style="max-width: 250px;">${p.description || ''}</div>
                </td>
                <td class="text-end fw-bold text-success">${formatCurrency(p.unitPrice)}</td>
                <td class="text-center">${discountBadge}</td>
                <td class="text-center fw-semibold">${p.quantity}</td>
                <td><span class="badge bg-info text-dark">${catName}</span></td>
                <td class="text-center">${statusBadge}</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-warning me-1" title="Chỉnh sửa" onclick="editProduct(${p.productId})">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" title="Xóa" onclick="deleteProduct(${p.productId}, '${p.productName.replace(/'/g, "\\'")}')">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    $('#productTableBody').html(html);
}

function renderProductPagination(pageData) {
    const totalPages = pageData.totalPages;
    const currentPage = pageData.number;
    const totalElements = pageData.totalElements;
    const pageSize = pageData.size;

    const startItem = totalElements === 0 ? 0 : currentPage * pageSize + 1;
    const endItem = Math.min((currentPage + 1) * pageSize, totalElements);
    $('#prodPaginationInfo').text(`Hiển thị ${startItem} - ${endItem} của ${totalElements} sản phẩm`);

    let navHtml = '';

    navHtml += `
        <li class="page-item ${currentPage === 0 ? 'disabled' : ''}">
            <a class="page-link" href="javascript:void(0)" onclick="loadProductData(0)">&laquo; Đầu</a>
        </li>
        <li class="page-item ${currentPage === 0 ? 'disabled' : ''}">
            <a class="page-link" href="javascript:void(0)" onclick="loadProductData(${currentPage - 1})">Trước</a>
        </li>
    `;

    const maxVisiblePages = 5;
    let startPage = Math.max(0, currentPage - 2);
    let endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 1);
    if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(0, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        navHtml += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link" href="javascript:void(0)" onclick="loadProductData(${i})">${i + 1}</a>
            </li>
        `;
    }

    navHtml += `
        <li class="page-item ${currentPage >= totalPages - 1 || totalPages === 0 ? 'disabled' : ''}">
            <a class="page-link" href="javascript:void(0)" onclick="loadProductData(${currentPage + 1})">Sau</a>
        </li>
        <li class="page-item ${currentPage >= totalPages - 1 || totalPages === 0 ? 'disabled' : ''}">
            <a class="page-link" href="javascript:void(0)" onclick="loadProductData(${totalPages - 1})">Cuối &raquo;</a>
        </li>
    `;

    $('#prodPaginationNav').html(navHtml);
}

function onProductSearchKeyUp(e) {
    if (e.key === 'Enter') {
        loadProductData(0);
    }
}

function clearProductSearch() {
    $('#prodSearchName').val('');
    $('#prodFilterCategory').val('');
    loadProductData(0);
}

function openAddProductModal() {
    $('#productForm')[0].reset();
    $('#prodId').val('');
    $('#prodImageCurrentContainer').addClass('d-none');
    $('#productModalLabel').text('Thêm Mới Sản Phẩm');
    $('#productModal').modal('show');
}

function editProduct(id) {
    const query = `
        query GetProduct($id: ID!) {
            productById(id: $id) {
                productId
                productName
                quantity
                unitPrice
                images
                description
                discount
                status
                category {
                    categoryId
                }
            }
        }
    `;

    executeGraphQL(query, { id: id }).done(function (res) {
        if (res.data && res.data.productById) {
            const p = res.data.productById;
            $('#prodId').val(p.productId);
            $('#prodNameInput').val(p.productName);
            $('#prodUnitPriceInput').val(p.unitPrice);
            $('#prodDiscountInput').val(p.discount);
            $('#prodQuantityInput').val(p.quantity);
            $('#prodStatusSelect').val(p.status);
            $('#prodDescInput').val(p.description);

            if (p.category) {
                $('#prodCategorySelect').val(p.category.categoryId);
            }

            if (p.images) {
                $('#prodImagePreview').attr('src', getImageUrl(p.images));
                $('#prodImageCurrentContainer').removeClass('d-none');
            } else {
                $('#prodImageCurrentContainer').addClass('d-none');
            }

            $('#productModalLabel').text('Chỉnh Sửa Sản Phẩm: ' + p.productName);
            $('#productModal').modal('show');
        } else {
            showToast('Không tìm thấy thông tin sản phẩm!', 'error');
        }
    }).fail(function () {
        showToast('Lỗi GraphQL khi lấy sản phẩm!', 'error');
    });
}

function previewProdImage(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            $('#prodImagePreview').attr('src', e.target.result);
            $('#prodImageCurrentContainer').removeClass('d-none');
        };
        reader.readAsDataURL(input.files[0]);
    }
}

async function saveProduct() {
    const prodId = $('#prodId').val();
    const productName = $('#prodNameInput').val().trim();
    const categoryId = $('#prodCategorySelect').val();
    const unitPrice = parseFloat($('#prodUnitPriceInput').val() || 0);
    const quantity = parseInt($('#prodQuantityInput').val() || 0, 10);
    const discount = parseFloat($('#prodDiscountInput').val() || 0);
    const status = parseInt($('#prodStatusSelect').val() || 1, 10);
    const description = $('#prodDescInput').val();

    if (!productName || !categoryId) {
        showToast('Vui lòng nhập tên sản phẩm và chọn danh mục!', 'error');
        return;
    }

    $('#btnSaveProduct').prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-1"></span> Đang lưu...');

    // Upload image if file selected
    let uploadedImage = await uploadImageFile('prodImageFileInput');

    if (prodId && prodId !== '') {
        const mutation = `
            mutation UpdateProduct($input: ProductInput!) {
                updateProduct(input: $input) {
                    productId
                    productName
                    images
                }
            }
        `;
        const variables = {
            input: {
                productId: prodId,
                productName: productName,
                quantity: quantity,
                unitPrice: unitPrice,
                images: uploadedImage,
                description: description,
                discount: discount,
                status: status,
                categoryId: categoryId
            }
        };

        executeGraphQL(mutation, variables).done(function (res) {
            $('#btnSaveProduct').prop('disabled', false).html('<i class="fa-solid fa-floppy-disk me-1"></i> Lưu Sản Phẩm');
            if (res.data && res.data.updateProduct) {
                showToast('Cập nhật sản phẩm thành công!', 'success');
                $('#productModal').modal('hide');
                loadProductData(currentProdPage);
            } else {
                showToast('Lỗi cập nhật sản phẩm!', 'error');
            }
        }).fail(function () {
            $('#btnSaveProduct').prop('disabled', false).html('<i class="fa-solid fa-floppy-disk me-1"></i> Lưu Sản Phẩm');
            showToast('Lỗi GraphQL Mutation!', 'error');
        });
    } else {
        const mutation = `
            mutation CreateProduct($input: ProductInput!) {
                createProduct(input: $input) {
                    productId
                    productName
                    images
                }
            }
        `;
        const variables = {
            input: {
                productName: productName,
                quantity: quantity,
                unitPrice: unitPrice,
                images: uploadedImage,
                description: description,
                discount: discount,
                status: status,
                categoryId: categoryId
            }
        };

        executeGraphQL(mutation, variables).done(function (res) {
            $('#btnSaveProduct').prop('disabled', false).html('<i class="fa-solid fa-floppy-disk me-1"></i> Lưu Sản Phẩm');
            if (res.data && res.data.createProduct) {
                showToast('Thêm sản phẩm thành công!', 'success');
                $('#productModal').modal('hide');
                loadProductData(currentProdPage);
            } else {
                showToast('Lỗi thêm sản phẩm!', 'error');
            }
        }).fail(function () {
            $('#btnSaveProduct').prop('disabled', false).html('<i class="fa-solid fa-floppy-disk me-1"></i> Lưu Sản Phẩm');
            showToast('Lỗi GraphQL Mutation!', 'error');
        });
    }
}

function deleteProduct(id, name) {
    Swal.fire({
        title: 'Xác nhận xóa (GraphQL)?',
        text: `Bạn có chắc chắn muốn xóa sản phẩm "${name}"?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Đồng ý xóa',
        cancelButtonText: 'Hủy bỏ'
    }).then((result) => {
        if (result.isConfirmed) {
            const mutation = `
                mutation DeleteProduct($id: ID!) {
                    deleteProduct(id: $id)
                }
            `;

            executeGraphQL(mutation, { id: id }).done(function (res) {
                if (res.data && res.data.deleteProduct) {
                    showToast('Xóa sản phẩm thành công!', 'success');
                    loadProductData(currentProdPage);
                } else {
                    showToast('Xóa sản phẩm thất bại!', 'error');
                }
            }).fail(function () {
                showToast('Lỗi hệ thống khi xóa sản phẩm!', 'error');
            });
        }
    });
}
