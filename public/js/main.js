// Main client-side interactivity
document.addEventListener('DOMContentLoaded', () => {
  // Mobile navigation drawer toggle
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');

  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });
  }

  // Auto-dismiss alert notifications after 5 seconds
  const alertBanners = document.querySelectorAll('.alert-banner');
  alertBanners.forEach((alert) => {
    const closeBtn = alert.querySelector('.alert-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        alert.remove();
      });
    }
    setTimeout(() => {
      alert.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
      alert.style.opacity = '0';
      alert.style.transform = 'translateY(-10px)';
      setTimeout(() => alert.remove(), 400);
    }, 5000);
  });

  // CSRF token retrieval helper
  const getCsrfToken = () => {
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    if (metaTag) return metaTag.getAttribute('content');
    const inputTag = document.querySelector('input[name="_csrf"]');
    return inputTag ? inputTag.value : '';
  };

  // AJAX Like / Unlike handling
  document.addEventListener('submit', async (e) => {
    const likeForm = e.target.closest('.like-form');
    if (!likeForm) return;

    e.preventDefault();
    const actionUrl = likeForm.getAttribute('action');
    const likeBtn = likeForm.querySelector('.like-btn');
    const likeCountSpan = likeForm.querySelector('.like-count');
    const heartIcon = likeForm.querySelector('.heart-icon');
    const csrfToken = getCsrfToken();

    try {
      const response = await fetch(actionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();

      if (data.success) {
        // Update like counter
        if (likeCountSpan) {
          likeCountSpan.textContent = data.likeCount;
        }

        // Toggle state and action URL
        const postId = likeForm.dataset.postId;
        if (data.isLiked) {
          likeForm.setAttribute('action', `/posts/${postId}/unlike`);
          likeBtn.classList.remove('text-slate-500', 'hover:text-rose-600', 'hover:bg-rose-50');
          likeBtn.classList.add('text-rose-600', 'bg-rose-50');
          if (heartIcon) {
            heartIcon.setAttribute('fill', 'currentColor');
          }
        } else {
          likeForm.setAttribute('action', `/posts/${postId}/like`);
          likeBtn.classList.remove('text-rose-600', 'bg-rose-50');
          likeBtn.classList.add('text-slate-500', 'hover:text-rose-600', 'hover:bg-rose-50');
          if (heartIcon) {
            heartIcon.setAttribute('fill', 'none');
          }
        }
      }
    } catch (err) {
      console.error('Like toggle error:', err);
      // Fallback: submit standard form if AJAX fails
      likeForm.submit();
    }
  });

  // AJAX Follow / Unfollow handling
  document.addEventListener('submit', async (e) => {
    const followForm = e.target.closest('.follow-form');
    if (!followForm) return;

    e.preventDefault();
    const actionUrl = followForm.getAttribute('action');
    const followBtn = followForm.querySelector('.follow-btn');
    const csrfToken = getCsrfToken();
    const userId = followForm.dataset.userId;

    try {
      const response = await fetch(actionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
      });

      if (!response.ok) {
        throw new Error('Follow action failed');
      }

      const data = await response.json();

      if (data.success) {
        const followersCountElement = document.getElementById(`followers-count-${userId}`);
        if (followersCountElement) {
          followersCountElement.textContent = data.followersCount;
        }

        if (data.isFollowing) {
          followForm.setAttribute('action', `/users/${userId}/unfollow`);
          followBtn.textContent = 'Following';
          followBtn.classList.remove('bg-indigo-600', 'text-white', 'hover:bg-indigo-700');
          followBtn.classList.add('bg-slate-100', 'text-slate-700', 'hover:bg-rose-50', 'hover:text-rose-600', 'border', 'border-slate-300');
        } else {
          followForm.setAttribute('action', `/users/${userId}/follow`);
          followBtn.textContent = 'Follow';
          followBtn.classList.remove('bg-slate-100', 'text-slate-700', 'hover:bg-rose-50', 'hover:text-rose-600', 'border', 'border-slate-300');
          followBtn.classList.add('bg-indigo-600', 'text-white', 'hover:bg-indigo-700');
        }
      }
    } catch (err) {
      console.error('Follow action error:', err);
      followForm.submit();
    }
  });

  // Native confirmation dialogs for destructive actions
  const confirmForms = document.querySelectorAll('.confirm-action');
  confirmForms.forEach((form) => {
    form.addEventListener('submit', (e) => {
      const message = form.dataset.confirmMessage || 'Are you sure you want to proceed?';
      if (!confirm(message)) {
        e.preventDefault();
      }
    });
  });
});

