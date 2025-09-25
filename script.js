// ===== MSAL CONFIG =====
const msalConfig = {
  auth: {
    clientId: "a1c3f9fb-01d3-447e-a263-e4c754acc353",   // from App registration Overview
    authority: "https://tshanesimmonsgmailauth.ciamlogin.com/tshanesimmonsgmailauth.onmicrosoft.com/B2C_1_signup_signin/v2.0/",
    redirectUri: "https://tluckpatel.neocities.org/"
  }
};
const msalInstance = new msal.PublicClientApplication(msalConfig);

// ====== NAV / STAGE TOGGLE ======
const body = document.body;
const startBtn = document.getElementById('startBtn');
const homeBtn = document.getElementById('homeBtn');

const signIn = document.getElementById('signIn');
const signUp = document.getElementById('signUp');
const toSignUp = document.getElementById('toSignUp');
const toSignIn = document.getElementById('toSignIn');      // may be absent
const toSignInTop = document.getElementById('toSignInTop'); // header link
const leftText = document.getElementById('leftText');

startBtn?.addEventListener('click', () => { body.classList.add('auth'); show('in'); });
homeBtn?.addEventListener('click', () => { body.classList.remove('auth'); show('in'); window.scrollTo({ top: 0, behavior: 'smooth' }); });

function show(which) {
  if (which === 'up') {
    if (signIn) signIn.hidden = true;
    if (signUp) signUp.hidden = false;
    if (leftText) leftText.textContent = 'Fast, friendly sign up with real-time password checks.';
  } else {
    if (signUp) signUp.hidden = true;
    if (signIn) signIn.hidden = false;
    if (leftText) leftText.textContent = 'Welcome back — sign in to continue.';
  }
}
toSignUp?.addEventListener('click', () => show('up'));
toSignIn?.addEventListener('click', () => show('in'));
toSignInTop?.addEventListener('click', () => show('in'));

// ====== SHARED HELPERS (sanitization & validators) ======
const sanitize = (v) => (v || '').replace(/[<>\u0000-\u001F]/g, '').trim();
const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
const isValidSiPassword = (v) => (v || '').length >= 8;
const isValidName = v => /^[A-Za-z][A-Za-z .'-]{1,49}$/.test(v);
const isValidCompany = v => /^[A-Za-z0-9][A-Za-z0-9 .&'-]{1,99}$/.test(v);
const toDigits = v => (v || '').replace(/\D/g, '');
const isValidPhone = v => /^\d{7,15}$/.test(v);

// ====== SIGN-IN VALIDATION ======
const siEmail = document.getElementById('siEmail');
const siPass = document.getElementById('siPass');
const siEmailErr = document.getElementById('siEmailErr');
const siPassErr = document.getElementById('siPassErr');
const signInBtn = document.getElementById('signInBtn');

function validateSignIn() {
  const e = sanitize(siEmail?.value);
  const p = sanitize(siPass?.value);

  if (siEmail && siEmail.value !== e) siEmail.value = e;
  if (siPass && siPass.value !== p) siPass.value = p;

  const emailOK = isValidEmail(e);
  const passOK = isValidSiPassword(p);

  if (!emailOK && e.length) { siEmail?.classList.add('error'); siEmailErr && (siEmailErr.textContent = 'Please enter a valid email address.'); }
  else { siEmail?.classList.remove('error'); siEmailErr && (siEmailErr.textContent = ''); }

  if (!passOK && p.length) { siPass?.classList.add('error'); siPassErr && (siPassErr.textContent = 'Password must be at least 8 characters.'); }
  else { siPass?.classList.remove('error'); siPassErr && (siPassErr.textContent = ''); }

  const ready = emailOK && passOK;
  if (signInBtn) {
    signInBtn.disabled = !ready;
    signInBtn.classList.toggle('is-disabled', !ready);
  }
}

siEmail?.addEventListener('input', validateSignIn);
siPass?.addEventListener('input', validateSignIn);

signIn?.addEventListener('submit', (e) => {
  validateSignIn();
  if (signInBtn?.disabled) {
    e.preventDefault();
    signInBtn?.classList.add('shake'); setTimeout(() => signInBtn?.classList.remove('shake'), 350);
    return;
  }
  e.preventDefault();
  msalInstance.loginPopup({ scopes: ["openid", "profile", "email"] })
    .then(result => {
      const account = result.account;
      leftText.textContent = `Welcome ${account.username}`;
    })
    .catch(err => console.error(err));
});

// ====== SIGN-UP VALIDATION (password rules + fields) ======
const pw1 = document.getElementById('pw1');
const pw2 = document.getElementById('pw2');
const pw2Error = document.getElementById('pw2Error');
const checklist = document.getElementById('pwChecklist');
const signUpBtn = document.getElementById('signUpBtn');

const fn = document.getElementById('fn');
const ln = document.getElementById('ln');
const company = document.getElementById('company');
const suEmail = document.getElementById('suEmail');
const phone = document.getElementById('phone');

const fnErr = document.getElementById('fnErr');
const lnErr = document.getElementById('lnErr');
const companyErr = document.getElementById('companyErr');
const suEmailErr = document.getElementById('suEmailErr');
const phoneErr = document.getElementById('phoneErr');

const checks = {
  length: v => v.length >= 8,
  upper: v => /[A-Z]/.test(v),
  lower: v => /[a-z]/.test(v),
  digit: v => /\d/.test(v),
  special: v => /[^\w\s]/.test(v),
  match: (a, b) => a && a === b
};

function setRule(rule, ok) {
  const el = checklist?.querySelector(`.rule[data-rule="${rule}"] .icon`);
  if (!el) return;
  el.textContent = ok ? '✓' : '✗';
  el.classList.toggle('good', ok);
  el.classList.toggle('bad', !ok);
}

function validateSignUp() {
  const first = sanitize(fn?.value);
  const last = sanitize(ln?.value);
  const comp = sanitize(company?.value);
  const em = sanitize(suEmail?.value);

  if (fn && fn.value !== first) fn.value = first;
  if (ln && ln.value !== last) ln.value = last;
  if (company && company.value !== comp) company.value = comp;
  if (suEmail && suEmail.value !== em) suEmail.value = em;

  const phRaw = phone?.value || '';
  const ph = toDigits(phRaw);
  if (phone && phRaw !== ph) phone.value = ph;

  const nameOK = isValidName(first);
  const lastOK = isValidName(last);
  const compOK = isValidCompany(comp);
  const emailOK = isValidEmail(em);
  const phoneOK = !ph ? true : isValidPhone(ph);

  fn?.classList.toggle('error', !nameOK && !!first);
  ln?.classList.toggle('error', !lastOK && !!last);
  company?.classList.toggle('error', !compOK && !!comp);
  suEmail?.classList.toggle('error', !emailOK && !!em);
  phone?.classList.toggle('error', !phoneOK && !!ph);

  fnErr && (fnErr.textContent = (!nameOK && first) ? 'Use letters, spaces, . \' - (2–50)' : '');
  lnErr && (lnErr.textContent = (!lastOK && last) ? 'Use letters, spaces, . \' - (2–50)' : '');
  companyErr && (companyErr.textContent = (!compOK && comp) ? 'Letters/numbers, . & \' - (2–100)' : '');
  suEmailErr && (suEmailErr.textContent = (!emailOK && em) ? 'Please enter a valid email address.' : '');
  phoneErr && (phoneErr.textContent = (!phoneOK && ph) ? 'Digits only (7–15).' : '');

  const v1 = pw1?.value || '';
  const v2 = pw2?.value || '';
  const ok = {
    length: checks.length(v1),
    upper: checks.upper(v1),
    lower: checks.lower(v1),
    digit: checks.digit(v1),
    special: checks.special(v1)
  };
  Object.entries(ok).forEach(([k, v]) => setRule(k, v));
  const allPwRules = Object.values(ok).every(Boolean);

  if (checklist) {
    checklist.classList.toggle('valid', allPwRules);
    if (allPwRules) checklist.classList.remove('show');
  }

  const matches = checks.match(v1, v2);
  if (pw2) {
    if (v2 && !matches) { pw2.classList.add('error'); pw2Error && (pw2Error.textContent = 'Password does not match'); }
    else { pw2.classList.remove('error'); pw2Error && (pw2Error.textContent = ''); }
  }

  const allOK = nameOK && lastOK && compOK && emailOK && phoneOK && allPwRules && matches;
  if (signUpBtn) {
    signUpBtn.disabled = !allOK;
    signUpBtn.classList.toggle('is-disabled', !allOK);
  }
}

pw1?.addEventListener('focus', () => checklist?.classList.add('show'));
pw1?.addEventListener('input', () => { checklist?.classList.add('show'); validateSignUp(); });
pw1?.addEventListener('blur', () => { if (!pw1.value) checklist?.classList.remove('show'); });

['input', 'blur'].forEach(evt => {
  fn?.addEventListener(evt, validateSignUp);
  ln?.addEventListener(evt, validateSignUp);
  company?.addEventListener(evt, validateSignUp);
  suEmail?.addEventListener(evt, validateSignUp);
  phone?.addEventListener(evt, validateSignUp);
  pw2?.addEventListener(evt, validateSignUp);
});

validateSignIn();
validateSignUp();

// ====== SIGN-UP SUBMIT ======
signUp?.addEventListener('submit', e => {
  validateSignUp();
  if (signUpBtn?.disabled) { e.preventDefault(); return; }
  e.preventDefault();
  msalInstance.loginPopup({ scopes: ["openid", "profile", "email"] })
    .then(result => {
      const account = result.account;
      leftText.textContent = `Welcome ${account.username}`;
    })
    .catch(err => console.error(err));
});
