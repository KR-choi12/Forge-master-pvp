// 데이터 초기화
let students = JSON.parse(localStorage.getItem("students")) || [
    { num: "1", name: "홍길동", money: 10000 },
    { num: "2", name: "김철수", money: 5000 },
    { num: "3", name: "이영희", money: 8000 }
];

let products = JSON.parse(localStorage.getItem("products")) || [
    { name: "삼각김밥", price: 1500, stock: 10 },
    { name: "콜라", price: 1000, stock: 20 },
    { name: "우유", price: 2000, stock: 15 },
    { name: "과자", price: 800, stock: 25 }
];

let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
let cart = [];
let modalCallback = null;

// 데이터 저장
function save() {
    localStorage.setItem("students", JSON.stringify(students));
    localStorage.setItem("products", JSON.stringify(products));
    localStorage.setItem("transactions", JSON.stringify(transactions));
}

// 탭 전환
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const tabId = this.getAttribute('data-tab');
        openTab(tabId);
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
    });
});

function openTab(id) {
    document.querySelectorAll('section').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');

    if (id === 'student') renderStudents();
    if (id === 'product') renderProducts();
    if (id === 'pos') renderPOS();
    if (id === 'history') renderHistory();
}

// ============ 학생 관리 ============
function renderStudents() {
    const t = document.getElementById('studentTable');
    t.innerHTML = '';

    students.forEach(s => {
        t.innerHTML += `
            <tr>
                <td>${s.num}</td>
                <td>${s.name}</td>
                <td>${s.money.toLocaleString()}원</td>
                <td>
                    <button class="action delete" onclick="deleteStudent('${s.num}')">삭제</button>
                </td>
            </tr>
        `;
    });
}

function searchStudent() {
    const key = document.getElementById('studentSearch').value;
    const t = document.getElementById('studentTable');
    t.innerHTML = '';

    students
        .filter(s => s.name.includes(key) || s.num.includes(key))
        .forEach(s => {
            t.innerHTML += `
                <tr>
                    <td>${s.num}</td>
                    <td>${s.name}</td>
                    <td>${s.money.toLocaleString()}원</td>
                    <td>
                        <button class="action delete" onclick="deleteStudent('${s.num}')">삭제</button>
                    </td>
                </tr>
            `;
        });
}

function addStudent() {
    const num = document.getElementById('sNum').value.trim();
    const name = document.getElementById('sName').value.trim();
    const money = document.getElementById('sMoney').value.trim();

    if (!num || !name || !money) {
        showAlert('모든 필드를 입력해주세요!', 'error');
        return;
    }

    if (isNaN(money) || Number(money) < 0) {
        showAlert('올바른 금액을 입력해주세요!', 'error');
        return;
    }

    if (students.find(s => s.num === num)) {
        showAlert('이미 존재하는 학생 번호입니다!', 'error');
        return;
    }

    students.push({
        num: num,
        name: name,
        money: Number(money)
    });

    save();
    renderStudents();

    document.getElementById('sNum').value = '';
    document.getElementById('sName').value = '';
    document.getElementById('sMoney').value = '';

    showAlert(`${name} 학생이 추가되었습니다!`, 'success');
}

function deleteStudent(num) {
    const student = students.find(s => s.num === num);
    if (!student) return;

    openModal(
        `학생 삭제`,
        `${student.name} 학생을 정말 삭제하시겠습니까?`,
        () => {
            students = students.filter(s => s.num !== num);
            save();
            renderStudents();
            showAlert(`${student.name} 학생이 삭제되었습니다!`, 'success');
        }
    );
}

// ============ 상품 관리 ============
function renderProducts() {
    const t = document.getElementById('productTable');
    t.innerHTML = '';

    products.forEach((p, idx) => {
        t.innerHTML += `
            <tr>
                <td>${p.name}</td>
                <td>${p.price.toLocaleString()}원</td>
                <td>${p.stock}</td>
                <td>
                    <button class="action delete" onclick="deleteProduct(${idx})">삭제</button>
                </td>
            </tr>
        `;
    });
}

function addProduct() {
    const name = document.getElementById('pName').value.trim();
    const price = document.getElementById('pPrice').value.trim();
    const stock = document.getElementById('pStock').value.trim();

    if (!name || !price || !stock) {
        showAlert('모든 필드를 입력해주세요!', 'error');
        return;
    }

    if (isNaN(price) || Number(price) < 0) {
        showAlert('올바른 가격을 입력해주세요!', 'error');
        return;
    }

    if (isNaN(stock) || Number(stock) < 0) {
        showAlert('올바른 재고를 입력해주세요!', 'error');
        return;
    }

    products.push({
        name: name,
        price: Number(price),
        stock: Number(stock)
    });

    save();
    renderProducts();

    document.getElementById('pName').value = '';
    document.getElementById('pPrice').value = '';
    document.getElementById('pStock').value = '';

    showAlert(`${name} 상품이 추가되었습니다!`, 'success');
}

function deleteProduct(idx) {
    const product = products[idx];
    if (!product) return;

    openModal(
        `상품 삭제`,
        `${product.name}을(를) 정말 삭제하시겠습니까?`,
        () => {
            products.splice(idx, 1);
            save();
            renderProducts();
            showAlert(`${product.name}이(가) 삭제되었습니다!`, 'success');
        }
    );
}

// ============ POS 시스템 ============
function renderPOS() {
    renderProductList();
    renderCart();
}

function renderProductList() {
    const list = document.getElementById('productList');
    list.innerHTML = '';

    products.forEach((p, idx) => {
        const inCart = cart.find(item => item.idx === idx);
        list.innerHTML += `
            <div class="product ${inCart ? 'selected' : ''}" onclick="addToCart(${idx})">
                <div class="product-name">${p.name}</div>
                <div class="product-price">${p.price.toLocaleString()}원</div>
                <div class="product-stock">재고: ${p.stock}</div>
            </div>
        `;
    });
}

function addToCart(idx) {
    const product = products[idx];

    if (product.stock <= 0) {
        showAlert('재고가 부족합니다!', 'error');
        return;
    }

    const existing = cart.find(item => item.idx === idx);

    if (existing) {
        if (existing.quantity < product.stock) {
            existing.quantity++;
        } else {
            showAlert('재고가 부족합니다!', 'error');
        }
    } else {
        cart.push({
            idx: idx,
            name: product.name,
            price: product.price,
            quantity: 1
        });
    }

    renderCart();
    renderProductList();
}

function renderCart() {
    const cartTable = document.getElementById('cartTable');
    cartTable.innerHTML = '';

    cart.forEach((item, idx) => {
        const total = item.price * item.quantity;
        cartTable.innerHTML += `
            <tr>
                <td>${item.name}</td>
                <td>
                    <div class="quantity-input">
                        <button onclick="decreaseQuantity(${idx})">-</button>
                        <input type="number" value="${item.quantity}" readonly>
                        <button onclick="increaseQuantity(${idx})">+</button>
                    </div>
                </td>
                <td>${item.price.toLocaleString()}원</td>
                <td>${total.toLocaleString()}원</td>
                <td>
                    <button class="action delete" onclick="removeFromCart(${idx})">제거</button>
                </td>
            </tr>
        `;
    });

    updateTotal();
}

function increaseQuantity(idx) {
    if (cart[idx].quantity < products[cart[idx].idx].stock) {
        cart[idx].quantity++;
        renderCart();
    } else {
        showAlert('재고가 부족합니다!', 'error');
    }
}

function decreaseQuantity(idx) {
    if (cart[idx].quantity > 1) {
        cart[idx].quantity--;
    } else {
        cart.splice(idx, 1);
    }
    renderCart();
}

function removeFromCart(idx) {
    cart.splice(idx, 1);
    renderCart();
    renderProductList();
}

function clearCart() {
    cart = [];
    renderCart();
    renderProductList();
    showAlert('장바구니가 비워졌습니다!', 'info');
}

function updateTotal() {
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    document.getElementById('total').textContent = total.toLocaleString();
}

function pay() {
    const buyerNum = document.getElementById('buyer').value.trim();

    if (!buyerNum) {
        showAlert('학생 번호를 입력해주세요!', 'error');
        return;
    }

    if (cart.length === 0) {
        showAlert('장바구니에 상품이 없습니다!', 'error');
        return;
    }

    const student = students.find(s => s.num === buyerNum);

    if (!student) {
        showAlert('존재하지 않는 학생입니다!', 'error');
        return;
    }

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    if (student.money < total) {
        showAlert(`잔액이 부족합니다! (필요: ${total.toLocaleString()}원, 잔액: ${student.money.toLocaleString()}원)`, 'error');
        return;
    }

    // 결제 처리
    student.money -= total;

    // 재고 감소
    cart.forEach(item => {
        products[item.idx].stock -= item.quantity;
    });

    // 거래 기록
    const cartItems = cart.map(item => `${item.name}(${item.quantity}개)`).join(', ');
    transactions.push({
        date: new Date().toLocaleString('ko-KR'),
        studentNum: buyerNum,
        studentName: student.name,
        items: cartItems,
        amount: total,
        balance: student.money
    });

    save();

    showAlert(`결제 완료! ${student.name} 학생의 남은 잔액: ${student.money.toLocaleString()}원`, 'success');

    cart = [];
    document.getElementById('buyer').value = '';
    renderPOS();
}

// ============ 거래 내역 ============
function renderHistory() {
    const historyTable = document.getElementById('historyTable');
    historyTable.innerHTML = '';

    if (transactions.length === 0) {
        historyTable.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #999;">거래 내역이 없습니다.</td></tr>';
        return;
    }

    transactions.forEach(t => {
        historyTable.innerHTML += `
            <tr>
                <td>${t.date}</td>
                <td>${t.studentName} (${t.studentNum})</td>
                <td>${t.items}</td>
                <td>${t.amount.toLocaleString()}원</td>
                <td>${t.balance.toLocaleString()}원</td>
            </tr>
        `;
    });
}

function clearHistory() {
    if (transactions.length === 0) {
        showAlert('삭제할 거래 내역이 없습니다!', 'info');
        return;
    }

    openModal(
        `거래 내역 삭제`,
        `모든 거래 내역을 삭제하시겠습니까? 이 작업은 취소할 수 없습니다.`,
        () => {
            transactions = [];
            save();
            renderHistory();
            showAlert('거래 내역이 삭제되었습니다!', 'success');
        }
    );
}

// ============ 알림 및 모달 ============
function showAlert(message, type = 'info') {
    const container = document.getElementById('alertContainer');
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert ${type}`;
    alertDiv.textContent = message;

    container.appendChild(alertDiv);

    setTimeout(() => {
        alertDiv.remove();
    }, 3000);
}

function openModal(title, message, callback) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalMessage').textContent = message;
    document.getElementById('confirmModal').style.display = 'block';
    modalCallback = callback;
}

function closeModal() {
    document.getElementById('confirmModal').style.display = 'none';
    modalCallback = null;
}

function confirmAction() {
    if (modalCallback) {
        modalCallback();
    }
    closeModal();
}

window.onclick = function(event) {
    const modal = document.getElementById('confirmModal');
    if (event.target === modal) {
        closeModal();
    }
};

// 초기 렌더링
renderStudents();
renderProducts();
