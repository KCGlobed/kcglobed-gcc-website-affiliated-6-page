// var BASE_URL = "https://gcc-website-prod-932479078084.europe-west1.run.app";
var BASE_URL = "https://kcglobed-gcc-website-932479078084.asia-south1.run.app";
// var mode = "production";
// var GCC_BACKEND_URL = "https://gccwebsite-admin-prod-backend-738131651355.asia-south1.run.app"
var GCC_BACKEND_URL = "https://gccwebsite-admin-backend-738131651355.asia-south1.run.app"
var mode = "sandbox"
var FORM_TYPE = 1

var finalFormSubmitFired = false;

// Registration Modal Logic
function openForm() {
  const modal = document.getElementById('registrationModal');
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}
function closeForm() {
  const modal = document.getElementById('registrationModal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// Connect all "open-popup" buttons (using event delegation for robustness)
document.addEventListener("click", function (e) {
  const btn = e.target.closest('.open-popup');
  if (btn) {
    console.log("Open-popup button clicked");
    e.preventDefault();
    openForm();
  }
});


window.addEventListener("scroll", function () {
  var scrollBottom = window.scrollY + window.innerHeight;
  var docHeight = document.documentElement.scrollHeight;
  if (scrollBottom > docHeight * 0.75) {
    var dc = document.getElementById("dualCta");
    if (dc && !dc.classList.contains("visible")) {
      dc.classList.add("visible");
    }
  }
});

const faqButtons = document.querySelectorAll(".faq-q");

faqButtons.forEach((btn) => {
  btn.addEventListener("click", () => {

    const answer = btn.nextElementSibling;
    const icon = btn.querySelector(".faq-ico");

    btn.classList.toggle("active");

    if (answer.style.maxHeight) {
      answer.style.maxHeight = null;
      icon.textContent = "+";
    } else {
      answer.style.maxHeight = answer.scrollHeight + "px";
      icon.textContent = "×";
    }

  });
});


function handlePayClick() {
  const fields = ["gcc_name", "gcc_email", "gcc_phone", "gcc_state", "gcc_city", "gcc_degree", "gcc_commerce_graduate"];

  // Reset all errors
  fields.forEach(f => {
    const errEl = document.getElementById("err_" + f);
    const inputEl = document.getElementById(f === "gcc_degree" ? "gcc_degree_search" : f);
    if (errEl) errEl.style.display = "none";
    if (inputEl) inputEl.classList.remove("invalid");
  });
  const mainErrEl = document.getElementById("gccFormError");
  if (mainErrEl) mainErrEl.style.display = "none";

  const name = document.getElementById("gcc_name").value.trim();
  const email = document.getElementById("gcc_email").value.trim();
  const phone = document.getElementById("gcc_phone").value.trim();
  const city = document.getElementById("gcc_city").value.trim();
  const state = document.getElementById("gcc_state").value.trim();
  const degree = document.getElementById("gcc_degree").value.trim();
  const commerceChecked = document.getElementById("gcc_commerce_graduate").checked;

  let hasError = false;

  if (!name) { setFieldError("gcc_name", "Full name is required"); hasError = true; }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setFieldError("gcc_email", "Valid email is required"); hasError = true; }
  if (!phone || !/^[6-9]\d{9}$/.test(phone)) { setFieldError("gcc_phone", "10-digit mobile number is required"); hasError = true; }
  if (!state) { setFieldError("gcc_state", "State selection is required"); hasError = true; }
  if (!city) { setFieldError("gcc_city", "City selection is required"); hasError = true; }
  if (!degree) { setFieldError("gcc_degree", "University selection is required"); hasError = true; }
  if (!commerceChecked) { setFieldError("gcc_commerce_graduate", "This confirmation is required"); hasError = true; }

  if (hasError) {
    // Scroll to first error
    const firstErr = document.querySelector(".field-error[style*='display: block']");
    if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  showLoadingModal("Initializing secure checkout...");
  startPayment(name, email, phone, city, state, degree);
}

function setFieldError(fieldId, msg) {
  const errEl = document.getElementById("err_" + fieldId);
  const inputEl = document.getElementById(fieldId === "gcc_degree" ? "gcc_degree_search" : fieldId);
  if (errEl) {
    errEl.textContent = msg;
    errEl.style.display = "block";
  }
  if (inputEl) {
    inputEl.classList.add("invalid");
  }
}

async function startPayment(name, email, mobile, city, state, degree) {
  console.log("Starting payment initialization...", { name, email, mobile, city, state, degree });

  const urlParams = new URLSearchParams(window.location.search);
  const utm_campaign = urlParams.get("utm_campaign") || "";
  const utm_medium = urlParams.get("utm_medium") || "";
  const utm_source = urlParams.get("utm_source") || "";

  try {
    const formRes = await fetch(GCC_BACKEND_URL + "/api/career/createdossierform", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: name,
        email,
        phone: mobile,
        city,
        state,
        university: degree,
        utm_campaign,
        utm_medium,
        utm_source,
        source: 14,
      }),
    });

    const formData = await formRes.json();
    console.log("createvslfinalform response:", formData);

    const latest_form_id = formData?.data?.id;
    console.log(latest_form_id, '--------')

    if (!latest_form_id) {
      throw new Error("Form ID not received");
    }

    try {
      const leadRes = await fetch(BASE_URL + "/api/save-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          mobile,
          city,
          state,
          form_type: 1,
          form_id: latest_form_id,
          source: 6,
          action: "pay_now",
          commingAmount: 249
        }),
      });

      const leadData = await leadRes.json();
      console.log("save-lead response:", leadData);

    } catch (leadErr) {
      console.error("Error in save-lead:", leadErr);
      // optional: continue flow
    }

    // ✅ Step 3: Start Payment
    const paymentRes = await fetch(BASE_URL + "/api/start-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        mobile,
        city,
        state,
        form_type: 2,
        form_id: latest_form_id,
        source: 6,
        commingAmount: 249
      }),
    });

    const paymentData = await paymentRes.json();
    console.log("start-payment response:", paymentData);

    if (!paymentData.success) {
      showStatusModal(false, paymentData.message || "Could not initiate payment. Please try again.", null);
      return;
    }

    // GTM Lead Tracking: Fire only on successful form submission before moving to payment
    if (!finalFormSubmitFired) {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: "final_form_submit"
      });
      finalFormSubmitFired = true;
    }

    // ✅ Step 4: Launch Payment Gateway
    if (paymentData.gateway === "cashfree") {
      console.log("Launching Cashfree modal...");

      setTimeout(function () {
        closeStatusModal();
        launchCashfree(paymentData, { name, email, mobile, city, state, latest_form_id });
      }, 2000);

    } else {
      showStatusModal(false, "Unexpected gateway response. Please contact support.", null);
    }

  } catch (err) {
    console.error("Critical error in startPayment:", err);
    showStatusModal(false, "Something went wrong. Please try again.", null);
  }
}


function launchCashfree(data, form) {
  console.log("Initializing Cashfree checkout (v3)...");
  if (typeof Cashfree === "undefined") {
    showStatusModal(false, "Payment gateway could not be loaded. Please refresh the page.", data.cf_order_id);
    return;
  }
  const cashfree = Cashfree({ mode: mode });

  cashfree.checkout({
    paymentSessionId: data.payment_session_id,
    redirectTarget: "_modal",
  }).then((result) => {
    console.log("Cashfree checkout result object:", result);
    if (result.error) {
      console.warn("Cashfree checkout returned an error:", result.error);
      reportFailure(data.cf_order_id, null, result.error.message, result.error.code);
      showStatusModal(false, result.error.message, data.cf_order_id);
    } else if (result.paymentDetails) {
      console.log("Cashfree checkout success (via result object):", result.paymentDetails);
      completePayment(data.cf_order_id, form);
    } else if (result.redirect) {
      console.log("Cashfree checkout redirecting...");
    } else {
      console.log("Cashfree checkout finished without specific result. Verifying order status...");
      completePayment(data.cf_order_id, form);
    }
  });

  // Note: Older callbacks like onSuccess/onFailure are ignored in V3 checkout() options
  // but onClose might still be useful for manual closure detection if supported.
}


async function completePayment(cf_order_id, form) {
  console.log("Triggering /api/complete-payment for cf_order_id:", cf_order_id);
  showLoadingModal("Verifying your payment...");

  try {
    await new Promise(resolve => setTimeout(resolve, 2000));
    const paymentRes = await fetch(BASE_URL + "/api/complete-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cf_order_id: cf_order_id,
        re_attempt_status: false,
        source: 1, // Updated source to 1
      }),
    });

    const paymentData = await paymentRes.json();
    console.log("complete-payment response:", paymentData);

    if (paymentData.success) {
      console.log("Payment successful according to backend.");
      try {
        const studentRes = await fetch(GCC_BACKEND_URL + "/api/users/create_student/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            full_name: form.name,
            email: form.email,
            city: form.city,
            state: form.state,
            country: "India",
            phone1: form.mobile,
          }),
        });

        const studentData = await studentRes.json();
        console.log("Student created:", studentData);

      } catch (studentErr) {
        console.error("Student creation failed:", studentErr);
      }
      window.location.href = "/thank-you.html?cf_order_id=" + cf_order_id;

    } else {
      console.warn("Payment verification failed.", paymentData.message || "Unknown error");
      showStatusModal(false, paymentData.message || "Payment verification failed.", cf_order_id);
    }

  } catch (err) {
    console.error("complete-payment error:", err);
    showStatusModal(false, "Network error during verification.", cf_order_id);
  }
}
function showStatusModal(isSuccess, message, orderId) {
  var overlay = document.getElementById("statusModalOverlay");
  if (!overlay) return;

  var iconWrap = document.getElementById("statusIconWrap");
  var title = document.getElementById("statusTitle");
  var desc = document.getElementById("statusDesc");
  var badge = document.getElementById("statusBadge");
  var footer = document.querySelector(".status-footer");
  var pid = document.getElementById("statusPaymentId");
  var retryBtn = document.getElementById("statusRetryBtn");
  var closeBtn = document.querySelector(".status-close-btn");

  overlay.classList.add("active");
  if (closeBtn) closeBtn.style.display = "flex";

  if (isSuccess) {
    iconWrap.className = "status-icon-wrap";
    iconWrap.style.background = "#F0FDF4";
    iconWrap.style.color = "#22C55E";
    iconWrap.innerHTML = '<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>';
    badge.className = "status-badge";
    badge.style.background = "#DCFCE7";
    badge.style.color = "#15803D";
    badge.textContent = "✦ CONFIRMED";
    title.innerHTML = 'Thank <span>You!</span>';
    desc.innerHTML = message || 'Our team will reach out to you within 2 hours.';
    if (footer) footer.innerHTML = 'Secure Connection';
    retryBtn.style.display = "none";
  } else {
    iconWrap.className = "status-icon-wrap failed";
    iconWrap.style.background = "#FEF2F2";
    iconWrap.style.color = "#EF4444";
    iconWrap.innerHTML = '<svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
    badge.className = "status-badge failed";
    badge.style.background = "#FEE2E2";
    badge.style.color = "#B91C1C";
    badge.textContent = "✦ FAILED";
    title.innerHTML = 'Payment <span>Failed</span>';
    desc.innerHTML = message || "Your payment could not be processed.";
    if (footer) footer.innerHTML = 'System Error';
    retryBtn.style.display = "block";
  }

  if (orderId) {
    pid.style.display = "block";
    pid.textContent = "Payment ID: " + orderId;
  } else {
    pid.style.display = "none";
  }
}

function showLoadingModal(message) {
  var overlay = document.getElementById("statusModalOverlay");
  if (!overlay) return;

  var iconWrap = document.getElementById("statusIconWrap");
  var title = document.getElementById("statusTitle");
  var desc = document.getElementById("statusDesc");
  var badge = document.getElementById("statusBadge");
  var footer = document.querySelector(".status-footer");
  var retryBtn = document.getElementById("statusRetryBtn");
  var closeBtn = document.querySelector(".status-close-btn");

  overlay.classList.add("active");
  if (closeBtn) closeBtn.style.display = "none";

  iconWrap.className = "status-icon-wrap loading";
  iconWrap.innerHTML = '<div class="spinner-ring"></div>';

  badge.className = "status-badge loading";
  badge.textContent = "✦ PROCESSING";

  title.innerHTML = 'Please <span>Wait</span>';
  desc.innerHTML = message || 'Initializing payment...';

  if (footer) {
    footer.innerHTML = 'Do not refresh or close this window.';
  }

  retryBtn.style.display = "none";
}

function closeStatusModal() {
  var overlay = document.getElementById("statusModalOverlay");
  if (overlay) overlay.classList.remove("active");
}

function reportFailure(cf_order_id, payment_id, description, code) {
  console.log("Reporting payment failure to backend...", { cf_order_id, payment_id, description, code });
  fetch(BASE_URL + "/api/report-payment-failure", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      cf_order_id: cf_order_id,
      cf_payment_id: payment_id || "",
      re_attempt_status: false,
      error_code: code || "",
      error_description: description || "",
      commingAmount: 249
    }),
  }).then(res => res.json()).then(data => {
    console.log("report-payment-failure response:", data);
  }).catch(function (e) {
    console.error("report-failure network error:", e);
  });
}


// State and City Dropdown Logic
let stateCityData = null;

function loadStateCityData() {
  fetch("./state-city.json")
    .then(res => res.json())
    .then(data => {
      stateCityData = data;
      const stateSelect = document.getElementById("gcc_state");
      if (stateSelect) {
        // Clear existing states
        while (stateSelect.options.length > 1) {
          stateSelect.remove(1);
        }

        // Add all states
        const states = Object.keys(data).sort();
        states.forEach(state => {
          const option = document.createElement("option");
          option.value = state;
          option.textContent = state;
          stateSelect.appendChild(option);
        });

        stateSelect.addEventListener("change", function () {
          updateCityDropdown(this.value);
        });

        // Just in case prefill has already set a value
        if (stateSelect.value) {
          updateCityDropdown(stateSelect.value);
        }
      }
    })
    .catch(err => console.error("Could not load state-city.json", err));
}

function updateCityDropdown(selectedState) {
  const citySelect = document.getElementById("gcc_city");
  if (!citySelect) return;

  // Reset options
  citySelect.innerHTML = '<option value="">Select city</option>';

  if (selectedState && stateCityData && stateCityData[selectedState]) {
    const cities = stateCityData[selectedState].sort();
    cities.forEach(city => {
      const option = document.createElement("option");
      option.value = city;
      option.textContent = city;
      citySelect.appendChild(option);
    });
  }
}

let universities = [];

function loadUniversityData() {
  if (window.UNIVERSITY_DATA && Array.isArray(window.UNIVERSITY_DATA)) {
    console.log("Loading university data from embedded source");
    universities = window.UNIVERSITY_DATA.sort();
    initSearchableSelect();
    return;
  }

  fetch("./university.json")
    .then(res => res.json())
    .then(data => {
      universities = data.sort();
      initSearchableSelect();
    })
    .catch(err => console.error("Could not load university.json", err));
}

function initSearchableSelect() {
  const searchInput = document.getElementById("gcc_degree_search");
  const hiddenInput = document.getElementById("gcc_degree");
  const optionsContainer = document.getElementById("gcc_degree_options");

  if (!searchInput || !optionsContainer) return;

  const renderOptions = (filter = "") => {
    optionsContainer.innerHTML = "";
    const filtered = universities.filter(uni =>
      uni.toLowerCase().includes(filter.toLowerCase())
    ).slice(0, 100); // Performance: show first 100 matches

    if (filtered.length === 0) {
      optionsContainer.innerHTML = '<div class="cs-opt no-res">No results found</div>';
    } else {
      filtered.forEach(uni => {
        const div = document.createElement("div");
        div.className = "cs-opt";
        div.textContent = uni;
        div.title = uni; // Tooltip for full name
        div.addEventListener("click", () => {
          searchInput.value = uni;
          hiddenInput.value = uni;
          optionsContainer.classList.remove("active");
          // Trigger change event for tracking
          searchInput.dispatchEvent(new Event('change'));
        });
        optionsContainer.appendChild(div);
      });
    }
  };

  searchInput.addEventListener("focus", () => {
    renderOptions(searchInput.value);
    optionsContainer.classList.add("active");
  });

  searchInput.addEventListener("input", () => {
    renderOptions(searchInput.value);
    optionsContainer.classList.add("active");
    // Optionally clear hidden value if input doesn't exactly match
    if (hiddenInput.value !== searchInput.value) {
      hiddenInput.value = "";
    }
  });

  // Close on click outside
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".custom-select-container")) {
      optionsContainer.classList.remove("active");
    }
  });
}

document.addEventListener("DOMContentLoaded", function () {
  try { loadStateCityData(); } catch (e) { console.error(e); }
  try { loadUniversityData(); } catch (e) { console.error(e); }
  try { setupAbandonmentTracking(); } catch (e) { console.error(e); }
  try { initVideoControl(); } catch (e) { console.error(e); }
  console.log("GCC School JS Initialized");
});

function initVideoControl() {
  const video = document.getElementById('heroVideo');
  const playPauseBtn = document.getElementById('playPauseBtn');
  const progressBar = document.getElementById('videoProgressBar');
  const progressFilled = document.getElementById('progressFilled');
  const muteBtn = document.getElementById('muteBtn');
  const volumeSlider = document.getElementById('volumeSlider');
  const currentTimeEl = document.getElementById('currentTime');
  const durationTimeEl = document.getElementById('durationTime');

  if (!video || !playPauseBtn) return;

  // Helper to format time
  function formatTime(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  }

  // Play/Pause toggle
  function togglePlay() {
    if (video.paused) {
      video.play();
      playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
    } else {
      video.pause();
      playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    }
  }

  playPauseBtn.addEventListener('click', togglePlay);
  video.addEventListener('click', togglePlay);

  // Update progress bar & time
  video.addEventListener('timeupdate', () => {
    const percent = (video.currentTime / video.duration) * 100;
    progressBar.value = percent;
    progressFilled.style.width = `${percent}%`;
    currentTimeEl.textContent = formatTime(video.currentTime);
  });

  // Seek video
  progressBar.addEventListener('input', () => {
    const seekTime = (progressBar.value / 100) * video.duration;
    video.currentTime = seekTime;
  });

  // Set duration once metadata is loaded
  video.addEventListener('loadedmetadata', () => {
    durationTimeEl.textContent = formatTime(video.duration);
  });

  // Mute/Unmute toggle
  muteBtn.addEventListener('click', () => {
    video.muted = !video.muted;
    if (video.muted) {
      muteBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
      volumeSlider.value = 0;
    } else {
      muteBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
      volumeSlider.value = video.volume;
    }
  });

  // Volume slider
  volumeSlider.addEventListener('input', () => {
    video.volume = volumeSlider.value;
    video.muted = video.volume === 0;
    if (video.muted) {
      muteBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
    } else if (video.volume < 0.5) {
      muteBtn.innerHTML = '<i class="fas fa-volume-down"></i>';
    } else {
      muteBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
    }
  });

  // Initial volume setup
  if (video.muted) {
    muteBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
    volumeSlider.value = 0;
  }
}

// Abandonment tracking
let abandonmentSentFor = "";

function setupAbandonmentTracking() {
  const nameEl = document.getElementById("gcc_name");
  const emailEl = document.getElementById("gcc_email");
  const phoneEl = document.getElementById("gcc_phone");
  const cityEl = document.getElementById("gcc_city");
  const stateEl = document.getElementById("gcc_state");
  const degreeEl = document.getElementById("gcc_degree");

  const checkAndSend = async () => {
    const name = nameEl ? nameEl.value.trim() : "";
    const email = emailEl ? emailEl.value.trim() : "";
    const phone = phoneEl ? phoneEl.value.trim() : "";
    const city = cityEl ? cityEl.value.trim() : "";
    const state = stateEl ? stateEl.value.trim() : "";
    const degree = degreeEl ? degreeEl.value.trim() : "";

    // Validate fields
    if (!name) return;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    if (!phone || !/^[6-9]\d{9}$/.test(phone)) return;

    const contactKey = email + "|" + phone;
    if (abandonmentSentFor === contactKey) return; // Already sent for this user
    abandonmentSentFor = contactKey;

    const urlParams = new URLSearchParams(window.location.search);
    const utm_campaign = urlParams.get("utm_campaign") || "";
    const utm_medium = urlParams.get("utm_medium") || "";
    const utm_source = urlParams.get("utm_source") || "";

    try {
      await fetch(GCC_BACKEND_URL + "/api/career/createabondantform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: name,
          email: email,
          phone: phone,
          city: city,
          state: state,
          university: degree,
          utm_campaign,
          utm_medium,
          utm_source,
          source: 6
        }),
      });
      console.log("Abandonment form submitted");
    } catch (e) {
      console.error("Error submitting abandonment form", e);
      abandonmentSentFor = "";
    }
  };

  if (nameEl) nameEl.addEventListener("blur", checkAndSend);
  if (emailEl) emailEl.addEventListener("blur", checkAndSend);
  if (phoneEl) phoneEl.addEventListener("blur", checkAndSend);
  if (cityEl) cityEl.addEventListener("change", checkAndSend);
  if (stateEl) stateEl.addEventListener("change", checkAndSend);
  if (degreeEl) degreeEl.addEventListener("change", checkAndSend);
}

function openPopup() {
  document.getElementById('brochure-popup').classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closePopup() {
  document.getElementById('brochure-popup').classList.remove('active');
  document.body.style.overflow = '';
}

async function submitBrochure() {
  const n = document.getElementById('pp-name').value.trim();
  const p = document.getElementById('pp-phone').value.trim();
  const em = document.getElementById('pp-email').value.trim();

  if (!n || !p || !em) {
    alert('Please fill in all fields.');
    return;
  }

  // Basic validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) { alert('Please enter a valid email.'); return; }
  if (!/^[6-9]\d{9}$/.test(p)) { alert('Please enter a valid 10-digit mobile number.'); return; }

  const urlParams = new URLSearchParams(window.location.search);
  const utm_campaign = urlParams.get("utm_campaign") || "";
  const utm_medium = urlParams.get("utm_medium") || "";
  const utm_source = urlParams.get("utm_source") || "";

  // Show loading state on button
  const btn = document.querySelector('#brochure-popup .lf-btn');
  const originalText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = 'Processing...';

  try {
    const response = await fetch(GCC_BACKEND_URL + "/api/career/createabondantform", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: n,
        email: em,
        phone: p,
        source: 6,
        source_form: 1,
        utm_source: utm_source,
        utm_medium: utm_medium,
        utm_campaign: utm_campaign
      }),
    });
    const result = await response.json();
    console.log("Brochure lead captured:", result);
  } catch (e) {
    console.error("Error capturing brochure lead:", e);
  }

  btn.innerHTML = originalText;
  btn.disabled = false;

  closePopup();

  // Trigger PDF download
  const pdfUrl = "https://storage.googleapis.com/gcc_prod_static_files_backend/static/files/GCC%20SCHOOL%20Dossier.pdf";
  const a = document.createElement('a');
  a.href = pdfUrl;
  a.download = 'GCC_SCHOOL_Dossier.pdf';
  a.target = "_blank";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ── Reveal on scroll ─────────────────────────────────────────────────────────
const io = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
}, { threshold: 0.07 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// ── Sticky bar ────────────────────────────────────────────────────────────────
const heroEl = document.getElementById('hero');
const sticky = document.getElementById('stickyBar');
if (heroEl && sticky) {
  const stickyObs = new IntersectionObserver(entries => {
    sticky.classList.toggle('show', !entries[0].isIntersecting);
  }, { threshold: 0 });
  stickyObs.observe(heroEl);
}

function scrollToVSL() {
  document.getElementById('vsl').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// ── Toggle Plan B → Plan A ────────────────────────────────────────────────────
let planState = false;
function togglePlan() {
  planState = !planState;
  const card = document.getElementById('flipCard');
  const track = document.getElementById('switchTrack');
  const lblOff = document.getElementById('lbl-off');
  const lblOn = document.getElementById('lbl-on');

  card.classList.toggle('flipped', planState);
  track.classList.toggle('on', planState);
  lblOff.classList.toggle('active', !planState);
  lblOn.classList.toggle('active', planState);
}

// ── Phase tabs ────────────────────────────────────────────────────────────────
function switchPhase(i) {
  document.querySelectorAll('.ptab').forEach((t, j) => t.classList.toggle('on', j === i));
  document.querySelectorAll('.pc').forEach((c, j) => c.classList.toggle('on', j === i));
}

function switchRoadmapPhase(i) {
  document.querySelectorAll('.roadmap-tab').forEach((t, j) => t.classList.toggle('active', j === i));
  document.querySelectorAll('.roadmap-content').forEach((c, j) => c.classList.toggle('active', j === i));
}

// ── Mentor expand/collapse ────────────────────────────────────────────────────
function toggleMentors(btn) {
  const grid = document.querySelector('.mentor-grid');
  const hidden = grid.querySelectorAll('.mentor-card.hidden');
  if (hidden.length > 0) {
    hidden.forEach(c => c.classList.remove('hidden'));
    btn.textContent = 'Show Fewer Mentors';
  } else {
    const cards = grid.querySelectorAll('.mentor-card');
    cards.forEach((c, i) => { if (i >= 6) c.classList.add('hidden'); });
    btn.textContent = 'See All 40+ Mentors';
  }
}

function toggleMentorsGrid(btn) {
  const grid = document.querySelector('.mentor-grid-ui');
  const hiddenImages = grid.querySelectorAll('.hidden-mentor');
  const isExpanded = btn.getAttribute('data-expanded') === 'true';

  if (!isExpanded) {
    hiddenImages.forEach(img => img.style.display = 'block');
    btn.textContent = 'Show Less';
    btn.setAttribute('data-expanded', 'true');
  } else {
    hiddenImages.forEach(img => img.style.display = 'none');
    btn.textContent = 'See All 40+ Mentors';
    btn.setAttribute('data-expanded', 'false');
  }
}
// Initially hide extras (just showing 6 for now, all visible since placeholder)


