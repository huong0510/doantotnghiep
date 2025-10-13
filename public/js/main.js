// =====================
// Utility functions
// =====================
function showLoading() {
    const spinner = document.createElement('div');
    spinner.className = 'spinner';
    spinner.innerHTML = `<div class="spinner-border text-primary" role="status"></div>`;
    spinner.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 2000;
    `;
    document.body.appendChild(spinner);
}

function hideLoading() {
    const spinner = document.querySelector('.spinner');
    if (spinner) spinner.remove();
}

function showAlert(message, type = 'success') {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    const container = document.querySelector('.container-xl');
    if (container) container.insertBefore(alert, container.firstChild);
    setTimeout(() => alert.remove(), 5000);
}

// =====================
// AJAX setup
// =====================
$.ajaxSetup({
    beforeSend: function () {
        showLoading();
    },
    complete: function () {
        hideLoading();
    },
    error: function (xhr) {
        const error = xhr.responseJSON?.error || 'Có lỗi xảy ra';
        showAlert(error, 'danger');
    }
});

// =====================
// Form validation
// =====================
function validateForm(form) {
    let isValid = true;
    const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
    inputs.forEach(input => {
        if (!input.value.trim()) {
            isValid = false;
            input.classList.add('is-invalid');
        } else {
            input.classList.remove('is-invalid');
        }
    });
    return isValid;
}

// =====================
// Bootstrap tooltips
// =====================
document.addEventListener('DOMContentLoaded', function () {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(el => new bootstrap.Tooltip(el));
});

// =====================
// Handle form submissions
// =====================
document.addEventListener('submit', function (e) {
    if (e.target.matches('form')) {
        if (!validateForm(e.target)) {
            e.preventDefault();
            showAlert('Vui lòng điền đầy đủ thông tin', 'danger');
        }
    }
});

// =====================
// Handle input validation
// =====================
document.addEventListener('input', function (e) {
    if (e.target.matches('input[required], select[required], textarea[required]')) {
        e.target.classList.toggle('is-invalid', !e.target.value.trim());
    }
});

// =====================
// Handle modal reset
// =====================
document.addEventListener('show.bs.modal', function (e) {
    const form = e.target.querySelector('form');
    if (form) {
        form.reset();
        form.querySelectorAll('.is-invalid').forEach(input => input.classList.remove('is-invalid'));
    }
});

// =====================
// Handle tab scroll
// =====================
document.addEventListener('shown.bs.tab', function (e) {
    const target = e.target.getAttribute('data-bs-target');
    const tabContent = document.querySelector(target);
    if (tabContent) {
        tabContent.scrollIntoView({ behavior: 'smooth' });
    }
});

// =====================
// Responsive navigation
// =====================
document.addEventListener('click', function (e) {
    if (e.target.matches('.navbar-toggler')) {
        document.querySelector('.navbar-collapse')?.classList.toggle('show');
    }
});

// =====================
// Scroll to top button
// =====================
const scrollToTop = document.createElement('button');
scrollToTop.innerHTML = '↑';
scrollToTop.className = 'scroll-to-top';
scrollToTop.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: var(--primary-color, #007bff);
    color: white;
    border: none;
    cursor: pointer;
    display: none;
    z-index: 1000;
`;
document.body.appendChild(scrollToTop);

window.addEventListener('scroll', function () {
    scrollToTop.style.display = window.pageYOffset > 100 ? 'block' : 'none';
});
scrollToTop.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// =====================
// AI Chatbox Integration (Thay cho askAI)
// =====================
document.addEventListener("DOMContentLoaded", () => {
    const chatForm = document.getElementById("chatForm");
    const chatInput = document.getElementById("chatInput");
    const chatBox = document.getElementById("chatBox");

    if (!chatForm || !chatInput || !chatBox) return;

    chatForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const message = chatInput.value.trim();
        if (!message) return;

        appendMessage("Bạn", message);
        chatInput.value = "";

        showLoading();
        try {
            console.log("📤 Gửi tin nhắn:", message);
            const res = await fetch("/api/chat-ai", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message })
            });

            if (!res.ok) throw new Error("Lỗi API: " + res.status);
            const data = await res.json();
            console.log("📥 Trả về từ backend:", data);

            appendMessage("AI", data?.reply || "Không có phản hồi.");
            chatBox.scrollTop = chatBox.scrollHeight;
        } catch (error) {
            console.error("❌ Lỗi khi gọi AI API:", error);
            appendMessage("Hệ thống", "⚠️ Lỗi khi gọi AI API: " + error.message);
        } finally {
            hideLoading();
        }
    });

    function appendMessage(sender, text) {
        const msg = document.createElement("div");
        msg.className = sender === "AI" ? "ai-message" : "user-message";
        msg.textContent = `${sender}: ${text}`;
        chatBox.appendChild(msg);
    }
});
