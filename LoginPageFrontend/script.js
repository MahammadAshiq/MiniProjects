/* ============ Storage (demo only — replace with real backend) ============ */
function getAccounts() {
  return JSON.parse(localStorage.getItem('agrilearn_accounts') || '{}');
}
function saveAccounts(accounts) {
  localStorage.setItem('agrilearn_accounts', JSON.stringify(accounts));
}

/* ============ Navigation ============ */
let pendingRegistration = null; // { role: 'farmer'|'student', data: {...}, isNewAccount: bool }
let currentSession = null;

function goTo(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo(0,0);
}
function goToPendingForm() {
  if (pendingRegistration) goTo('screen-' + pendingRegistration.role + '-register');
  else goTo('screen-landing');
}

/* ============ Gender picker ============ */
function pickGender(el, rowId) {
  document.querySelectorAll('#' + rowId + ' .gender-btn').forEach(b => b.classList.remove('selected'));
  el.classList.add('selected');
  document.getElementById(rowId).dataset.selected = el.dataset.val;
}

/* ============ Password strength ============ */
function checkPwStrength(inputId, fillId) {
  const val = document.getElementById(inputId).value;
  const fill = document.getElementById(fillId);
  let score = 0;
  if (val.length >= 6) score += 33;
  if (val.length >= 10) score += 33;
  if (/[0-9]/.test(val) && /[a-zA-Z]/.test(val)) score += 34;
  fill.style.width = score + '%';
  fill.style.background = score < 40 ? '#B3402F' : score < 80 ? '#D9A441' : '#3F6B4A';
}

/* ============ Captcha ============ */
const captchaValues = {};
function newCaptcha(elId) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  captchaValues[elId] = code;
  document.getElementById(elId).textContent = code;
}
function validateCaptcha(textId, inputId, fieldWrapper) {
  const input = document.getElementById(inputId).value.trim().toUpperCase();
  const valid = input === captchaValues[textId];
  toggleFieldError(fieldWrapper, !valid);
  return valid;
}

/* ============ Location detect (reverse geocode via BigDataCloud, free/no key) ============ */
function useLocation(inputId, statusId) {
  const statusEl = document.getElementById(statusId);
  if (!navigator.geolocation) {
    statusEl.textContent = 'Location detection is not supported on this device. Please type your area manually.';
    return;
  }
  statusEl.textContent = 'Detecting your location...';
  const timer = setTimeout(() => {
    statusEl.textContent = 'Taking too long — please type your area manually instead.';
  }, 12000);

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      clearTimeout(timer);
      try {
        const { latitude, longitude } = pos.coords;
        const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
        const data = await res.json();
        const label = [data.locality || data.city, data.principalSubdivision, data.countryName].filter(Boolean).join(', ');
        document.getElementById(inputId).value = label || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        statusEl.textContent = '✓ Location detected';
      } catch (e) {
        statusEl.textContent = 'Could not detect area name — please type it manually.';
      }
    },
    () => {
      clearTimeout(timer);
      statusEl.textContent = 'Location permission denied — please type your area manually.';
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

/* ============ Existing account check ============ */
function checkExistingAccount(role) {
  const gmailId = role === 'farmer' ? 'f-gmail' : 's-gmail';
  const gmail = document.getElementById(gmailId).value.trim().toLowerCase();
  const banner = document.getElementById(role + '-account-banner');
  const pwFields = document.getElementById((role === 'farmer' ? 'f' : 's') + '-password-fields');
  const accounts = getAccounts();

  if (gmail && accounts[gmail]) {
    banner.classList.add('show');
    pwFields.style.display = 'none';
  } else {
    banner.classList.remove('show');
    pwFields.style.display = 'block';
  }
}

/* ============ Field error helper ============ */
function toggleFieldError(el, hasError) {
  if (!el) return;
  el.classList.toggle('has-error', hasError);
}

/* ============ Registration submit + validation ============ */
function submitRegistration(role) {
  const p = role === 'farmer' ? 'f' : 's';
  const accounts = getAccounts();
  const gmail = document.getElementById(p + '-gmail').value.trim().toLowerCase();
  const isNewAccount = !(gmail && accounts[gmail]);
  let valid = true;

  function req(id) {
    const el = document.getElementById(id);
    const wrap = el.closest('.field');
    const ok = el.value.trim().length > 0;
    toggleFieldError(wrap, !ok);
    if (!ok) valid = false;
    return ok;
  }

  // Common fields
  const gmailOk = /^[^\s@]+@gmail\.com$/i.test(gmail);
  toggleFieldError(document.getElementById(p + '-gmail').closest('.field'), !gmailOk);
  if (!gmailOk) valid = false;

  req(p + '-name');

  const genderRow = document.getElementById(p + '-gender-row');
  const genderErr = document.getElementById(p + '-gender-err');
  const genderOk = !!genderRow.dataset.selected;
  genderErr.style.display = genderOk ? 'none' : 'block';
  if (!genderOk) valid = false;

  const phoneVal = document.getElementById(p + '-phone').value.trim();
  const phoneOk = /^[0-9]{10}$/.test(phoneVal);
  toggleFieldError(document.getElementById(p + '-phone').closest('.field'), !phoneOk);
  if (!phoneOk) valid = false;

  if (isNewAccount) {
    const useridVal = document.getElementById(p + '-userid').value.trim();
    const useridOk = useridVal.length >= 4;
    toggleFieldError(document.getElementById(p + '-userid').closest('.field'), !useridOk);
    if (!useridOk) valid = false;

    const pw = document.getElementById(p + '-password').value;
    const pwConfirm = document.getElementById(p + '-password-confirm').value;
    const pwOk = pw.length >= 6;
    toggleFieldError(document.getElementById(p + '-password').closest('.field'), !pwOk);
    if (!pwOk) valid = false;

    const pwMatch = pw === pwConfirm && pwConfirm.length > 0;
    toggleFieldError(document.getElementById(p + '-password-confirm').closest('.field'), !pwMatch);
    if (!pwMatch) valid = false;
  }

  // Role-specific fields
  const data = {};
  if (role === 'farmer') {
    req('f-location');
    const captchaOk = validateCaptcha('f-captcha-text', 'f-captcha-input', document.getElementById('f-captcha-input').closest('.field'));
    if (!captchaOk) valid = false;
    data.location = document.getElementById('f-location').value.trim();
  } else {
    req('s-age');
    req('s-dob');
    req('s-college');
    req('s-branch');
    const yearOk = document.getElementById('s-year').value !== '';
    toggleFieldError(document.getElementById('s-year').closest('.field'), !yearOk);
    if (!yearOk) valid = false;
    req('s-present-studies');
    req('s-home-location');
    req('s-college-location');
    const captchaOk = validateCaptcha('s-captcha-text', 's-captcha-input', document.getElementById('s-captcha-input').closest('.field'));
    if (!captchaOk) valid = false;

    data.age = document.getElementById('s-age').value;
    data.dob = document.getElementById('s-dob').value;
    data.college = document.getElementById('s-college').value.trim();
    data.branch = document.getElementById('s-branch').value.trim();
    data.year = document.getElementById('s-year').value;
    data.presentStudies = document.getElementById('s-present-studies').value.trim();
    data.homeLocation = document.getElementById('s-home-location').value.trim();
    data.collegeLocation = document.getElementById('s-college-location').value.trim();
  }

  if (!valid) return;

  data.name = document.getElementById(p + '-name').value.trim();
  data.gender = genderRow.dataset.selected;
  data.phone = phoneVal;
  data.gmail = gmail;
  if (isNewAccount) {
    data.userId = document.getElementById(p + '-userid').value.trim();
    data.password = document.getElementById(p + '-password').value;
  }

  pendingRegistration = { role, data, isNewAccount, gmail };
  startOtpFlow(phoneVal);
}

/* ============ OTP flow ============ */
let currentOtp = '';
let resendTimerInterval = null;

function startOtpFlow(phone) {
  document.getElementById('otp-sub').textContent = `We've sent a code to ${phone ? '••••••' + phone.slice(-4) : 'your phone'}`;
  generateAndShowOtp();
  document.querySelectorAll('.otp-digit').forEach(d => d.value = '');
  document.getElementById('otp-error-msg').style.display = 'none';
  startResendCountdown();
  goTo('screen-otp');
}

function generateAndShowOtp() {
  currentOtp = String(Math.floor(100000 + Math.random() * 900000));
  document.getElementById('otp-demo-code').textContent = currentOtp;
}

function resendOtp() {
  if (document.getElementById('resend-link').classList.contains('disabled')) return;
  generateAndShowOtp();
  startResendCountdown();
}

function startResendCountdown() {
  let seconds = 30;
  const link = document.getElementById('resend-link');
  const timerEl = document.getElementById('resend-timer');
  link.classList.add('disabled');
  clearInterval(resendTimerInterval);
  resendTimerInterval = setInterval(() => {
    seconds--;
    timerEl.textContent = seconds > 0 ? ` (${seconds}s)` : '';
    if (seconds <= 0) {
      clearInterval(resendTimerInterval);
      link.classList.remove('disabled');
    }
  }, 1000);
}

function otpMove(el, index) {
  if (el.value && index < 5) {
    document.querySelectorAll('.otp-digit')[index + 1].focus();
  }
}

function verifyOtp() {
  const digits = Array.from(document.querySelectorAll('.otp-digit')).map(d => d.value).join('');
  const errEl = document.getElementById('otp-error-msg');
  if (digits.length !== 6 || digits !== currentOtp) {
    errEl.style.display = 'block';
    return;
  }
  errEl.style.display = 'none';
  finalizeRegistration();
}

function finalizeRegistration() {
  const { role, data, isNewAccount, gmail } = pendingRegistration;
  const accounts = getAccounts();

  if (isNewAccount) {
    accounts[gmail] = { userId: data.userId, password: data.password, profiles: {} };
  }
  accounts[gmail].profiles[role] = data;
  saveAccounts(accounts);

  currentSession = gmail;
  showSuccessScreen(gmail, role, isNewAccount);
}

function showSuccessScreen(gmail, justAddedRole, isNewAccount) {
  const accounts = getAccounts();
  const account = accounts[gmail];
  const roles = Object.keys(account.profiles);

  document.getElementById('success-title').textContent = isNewAccount ? "You're all set!" : 'Profile added!';
  document.getElementById('success-sub').textContent = isNewAccount
    ? `Welcome, ${account.profiles[justAddedRole].name}. Your User ID is "${account.userId}" — keep it safe.`
    : `Your ${justAddedRole} profile has been linked to your existing account.`;

  const rolesEl = document.getElementById('success-roles');
  rolesEl.innerHTML = roles.map(r =>
    `<span class="role-chip ${r}">${r === 'farmer' ? '🌾 Farmer' : '🎓 Student'} profile active</span>`
  ).join('');

  goTo('screen-success');
}

/* ============ Login ============ */
function doLogin() {
  const userId = document.getElementById('l-userid').value.trim();
  const password = document.getElementById('l-password').value;
  const userIdWrap = document.getElementById('l-userid').closest('.field');
  const pwWrap = document.getElementById('l-password').closest('.field');

  toggleFieldError(userIdWrap, userId.length === 0);
  if (userId.length === 0) return;

  const accounts = getAccounts();
  const match = Object.entries(accounts).find(([g, acc]) => acc.userId === userId && acc.password === password);

  if (!match) {
    toggleFieldError(pwWrap, true);
    return;
  }
  toggleFieldError(pwWrap, false);

  currentSession = match[0];
  const roles = Object.keys(match[1].profiles);
  document.getElementById('success-title').textContent = `Welcome back, ${match[1].profiles[roles[0]].name}!`;
  document.getElementById('success-sub').textContent = 'You are now logged in.';
  document.getElementById('success-roles').innerHTML = roles.map(r =>
    `<span class="role-chip ${r}">${r === 'farmer' ? '🌾 Farmer' : '🎓 Student'} profile active</span>`
  ).join('');
  goTo('screen-success');
}

function logout() {
  currentSession = null;
  goTo('screen-landing');
}

/* ============ Init ============ */
newCaptcha('f-captcha-text');
newCaptcha('s-captcha-text');