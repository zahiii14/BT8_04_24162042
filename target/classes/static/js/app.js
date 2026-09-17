// Global State Variables
let currentCatPage = 0;
let currentProdPage = 0;

const DEFAULT_SVG_PLACEHOLDER = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'><rect width='60' height='60' fill='%23e9ecef' rx='8'/><path d='M15 42 L25 27 L33 36 L38 30 L45 42 Z' fill='%23adb5bd'/><circle cx='22' cy='23' r='4' fill='%23adb5bd'/></svg>";

// Document Ready Setup
$(document).ready(function () {
    // Initial data load
    loadCategoryData(0);
    loadProductData(0);
    loadCategoryDropdowns();

    // Event listener for tab switch to reload dropdowns if categories change
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
   HELPER UTILITIES
   ========================================================================== */

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
   CATEGORY AJAX CRUD & PAGINATION
   ========================================================================== */

function loadCategoryData(page = 0) {
    currentCatPage = page;
    const searchName = $('#catSearchName').val().trim();
    const pageSize = $('#catPageSize').val();

    $('#categoryTableBody').html(`
        <tr>
            <td colspan="4" class="text-center py-4 text-muted">
                <div class="spinner-border spinner-border-sm text-primary me-2"></div> Đang tải dữ liệu danh mục...
            </td>
        </tr>
    `);

    $.ajax({
        url: '/api/category/search',
        type: 'GET',
        data: {
            name: searchName,
            page: page,
            size: pageSize,
            sort: 'categoryId,asc'
        },
        dataType: 'json',
        success: function (res) {
            if (res.status && res.body) {
                renderCategoryTable(res.body);
                renderCategoryPagination(res.body);
            } else {
                $('#categoryTableBody').html('<tr><td colspan="4" class="text-center text-muted py-4">Không tìm thấy dữ liệu!</td></tr>');
            }
        },
        error: function (xhr) {
            console.error(xhr);
            $('#categoryTableBody').html('<tr><td colspan="4" class="text-center text-danger py-4">Lỗi tải dữ liệu từ API!</td></tr>');
        }
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

    // First & Previous Buttons
    navHtml += `
        <li class="page-item ${currentPage === 0 ? 'disabled' : ''}">
            <a class="page-link" href="javascript:void(0)" onclick="loadCategoryData(0)">&laquo; Đầu</a>
        </li>
        <li class="page-item ${currentPage === 0 ? 'disabled' : ''}">
            <a class="page-link" href="javascript:void(0)" onclick="loadCategoryData(${currentPage - 1})">Trước</a>
        </li>
    `;

    // Page Number Buttons
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

    // Next & Last Buttons
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
    $.ajax({
        url: '/api/category/' + id,
        type: 'GET',
        dataType: 'json',
        success: function (res) {
            if (res.status && res.body) {
                const cat = res.body;
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
                showToast(res.message || 'Không tìm thấy dữ liệu', 'error');
            }
        },
        error: function () {
            showToast('Lỗi kết nối khi lấy thông tin danh mục!', 'error');
        }
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

function saveCategory() {
    const formData = new FormData($('#categoryForm')[0]);
    const catId = $('#catId').val();

    let apiUrl = '/api/category/addCategory';
    let httpMethod = 'POST';

    if (catId && catId !== '') {
        apiUrl = '/api/category/updateCategory';
        httpMethod = 'PUT';
    }

    $('#btnSaveCategory').prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-1"></span> Đang lưu...');

    $.ajax({
        url: apiUrl,
        type: httpMethod,
        data: formData,
        contentType: false,
        processData: false,
        dataType: 'json',
        success: function (res) {
            $('#btnSaveCategory').prop('disabled', false).html('<i class="fa-solid fa-floppy-disk me-1"></i> Lưu Thông Tin');
            if (res.status) {
                showToast(res.message || 'Thao tác thành công!', 'success');
                $('#categoryModal').modal('hide');
                loadCategoryData(currentCatPage);
                loadCategoryDropdowns();
            } else {
                showToast(res.message || 'Thao tác thất bại!', 'error');
            }
        },
        error: function (xhr) {
            $('#btnSaveCategory').prop('disabled', false).html('<i class="fa-solid fa-floppy-disk me-1"></i> Lưu Thông Tin');
            let errMsg = 'Có lỗi xảy ra khi lưu danh mục!';
            if (xhr.responseJSON && xhr.responseJSON.message) {
                errMsg = xhr.responseJSON.message;
            }
            showToast(errMsg, 'error');
        }
    });
}

function deleteCategory(id, name) {
    Swal.fire({
        title: 'Xác nhận xóa?',
        text: `Bạn có chắc chắn muốn xóa danh mục "${name}"? Thao tác này sẽ xóa luôn các sản phẩm thuộc danh mục!`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Đồng ý xóa',
        cancelButtonText: 'Hủy bỏ'
    }).then((result) => {
        if (result.isConfirmed) {
            $.ajax({
                url: '/api/category/deleteCategory/' + id,
                type: 'DELETE',
                dataType: 'json',
                success: function (res) {
                    if (res.status) {
                        showToast(res.message || 'Xóa danh mục thành công!', 'success');
                        loadCategoryData(currentCatPage);
                        loadCategoryDropdowns();
                    } else {
                        showToast(res.message || 'Xóa danh mục thất bại!', 'error');
                    }
                },
                error: function () {
                    showToast('Lỗi hệ thống khi xóa danh mục!', 'error');
                }
            });
        }
    });
}


/* ==========================================================================
   PRODUCT AJAX CRUD & PAGINATION
   ========================================================================== */

function loadCategoryDropdowns() {
    $.ajax({
        url: '/api/category/all',
        type: 'GET',
        dataType: 'json',
        success: function (res) {
            if (res.status && res.body) {
                let filterOptions = '<option value="">-- Tất cả Danh mục --</option>';
                let selectOptions = '<option value="">-- Chọn Danh Mục --</option>';

                res.body.forEach(cat => {
                    filterOptions += `<option value="${cat.categoryId}">${cat.categoryName}</option>`;
                    selectOptions += `<option value="${cat.categoryId}">${cat.categoryName}</option>`;
                });

                const currentFilter = $('#prodFilterCategory').val();
                $('#prodFilterCategory').html(filterOptions).val(currentFilter);
                $('#prodCategorySelect').html(selectOptions);
            }
        }
    });
}

function loadProductData(page = 0) {
    currentProdPage = page;
    const searchName = $('#prodSearchName').val().trim();
    const categoryId = $('#prodFilterCategory').val();
    const pageSize = $('#prodPageSize').val();

    $('#productTableBody').html(`
        <tr>
            <td colspan="9" class="text-center py-4 text-muted">
                <div class="spinner-border spinner-border-sm text-primary me-2"></div> Đang tải dữ liệu sản phẩm...
            </td>
        </tr>
    `);

    $.ajax({
        url: '/api/product/search',
        type: 'GET',
        data: {
            name: searchName,
            categoryId: categoryId,
            page: page,
            size: pageSize,
            sort: 'productId,desc'
        },
        dataType: 'json',
        success: function (res) {
            if (res.status && res.body) {
                renderProductTable(res.body);
                renderProductPagination(res.body);
            } else {
                $('#productTableBody').html('<tr><td colspan="9" class="text-center text-muted py-4">Không tìm thấy dữ liệu!</td></tr>');
            }
        },
        error: function (xhr) {
            console.error(xhr);
            $('#productTableBody').html('<tr><td colspan="9" class="text-center text-danger py-4">Lỗi tải dữ liệu sản phẩm!</td></tr>');
        }
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

    // First & Previous Buttons
    navHtml += `
        <li class="page-item ${currentPage === 0 ? 'disabled' : ''}">
            <a class="page-link" href="javascript:void(0)" onclick="loadProductData(0)">&laquo; Đầu</a>
        </li>
        <li class="page-item ${currentPage === 0 ? 'disabled' : ''}">
            <a class="page-link" href="javascript:void(0)" onclick="loadProductData(${currentPage - 1})">Trước</a>
        </li>
    `;

    // Page Numbers
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

    // Next & Last Buttons
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
    $.ajax({
        url: '/api/product/' + id,
        type: 'GET',
        dataType: 'json',
        success: function (res) {
            if (res.status && res.body) {
                const p = res.body;
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
                showToast(res.message || 'Không tìm thấy thông tin sản phẩm', 'error');
            }
        },
        error: function () {
            showToast('Lỗi lấy dữ liệu sản phẩm!', 'error');
        }
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

function saveProduct() {
    const formData = new FormData($('#productForm')[0]);
    const prodId = $('#prodId').val();

    let apiUrl = '/api/product/addProduct';
    let httpMethod = 'POST';

    if (prodId && prodId !== '') {
        apiUrl = '/api/product/updateProduct';
        httpMethod = 'PUT';
    }

    $('#btnSaveProduct').prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-1"></span> Đang lưu...');

    $.ajax({
        url: apiUrl,
        type: httpMethod,
        data: formData,
        contentType: false,
        processData: false,
        dataType: 'json',
        success: function (res) {
            $('#btnSaveProduct').prop('disabled', false).html('<i class="fa-solid fa-floppy-disk me-1"></i> Lưu Sản Phẩm');
            if (res.status) {
                showToast(res.message || 'Thao tác thành công!', 'success');
                $('#productModal').modal('hide');
                loadProductData(currentProdPage);
            } else {
                showToast(res.message || 'Thao tác thất bại!', 'error');
            }
        },
        error: function (xhr) {
            $('#btnSaveProduct').prop('disabled', false).html('<i class="fa-solid fa-floppy-disk me-1"></i> Lưu Sản Phẩm');
            let errMsg = 'Có lỗi xảy ra khi lưu sản phẩm!';
            if (xhr.responseJSON && xhr.responseJSON.message) {
                errMsg = xhr.responseJSON.message;
            }
            showToast(errMsg, 'error');
        }
    });
}

function deleteProduct(id, name) {
    Swal.fire({
        title: 'Xác nhận xóa?',
        text: `Bạn có chắc chắn muốn xóa sản phẩm "${name}"?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Đồng ý xóa',
        cancelButtonText: 'Hủy bỏ'
    }).then((result) => {
        if (result.isConfirmed) {
            $.ajax({
                url: '/api/product/deleteProduct/' + id,
                type: 'DELETE',
                dataType: 'json',
                success: function (res) {
                    if (res.status) {
                        showToast(res.message || 'Xóa sản phẩm thành công!', 'success');
                        loadProductData(currentProdPage);
                    } else {
                        showToast(res.message || 'Xóa sản phẩm thất bại!', 'error');
                    }
                },
                error: function () {
                    showToast('Lỗi hệ thống khi xóa sản phẩm!', 'error');
                }
            });
        }
    });
}
